const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Dispatch = require('../models/Dispatch');
const Staff = require('../models/Staff');
const Item = require('../models/Item');
const Warehouse = require('../models/Warehouse');
const Reservation = require('../models/Reservation');
const EventExecution = require('../models/EventExecution');

// @desc    Get Owner dashboard summary stats, charts, tables & alerts
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ──────────────────────────────────────────────────────────────
    // 1. KPI Summary (existing)
    // ──────────────────────────────────────────────────────────────
    const [
      todaysEventsCount,
      todaysDispatchesCount,
      totalStaffCount,
      activeBookings,
      allItems,
      allWarehouses
    ] = await Promise.all([
      Booking.countDocuments({
        isDeleted: false,
        eventStartDate: { $gte: today, $lt: tomorrow }
      }),
      Dispatch.countDocuments({
        isDeleted: false,
        $or: [
          { createdAt: { $gte: today, $lt: tomorrow } },
          { dispatchedAt: { $gte: today, $lt: tomorrow } },
          { status: { $in: ['Loading', 'In-Transit'] } }
        ]
      }),
      Staff.countDocuments({ isDeleted: false, status: 'Active' }),
      Booking.find({ isDeleted: false, status: { $ne: 'Cancelled' } }),
      Item.find({ isDeleted: false, isActive: true }),
      Warehouse.find({ isDeleted: false })
    ]);

    const pendingPaymentsTotal = activeBookings.reduce((sum, b) => sum + (b.balanceAmount !== undefined ? b.balanceAmount : (b.balanceDue !== undefined ? b.balanceDue : (b.grandTotal - (b.advancePaid || 0)))), 0);

    // Compute global stock aggregates from Item model
    let totalAvailable = 0;
    let totalDispatched = 0;
    let totalDamaged = 0;
    let totalReserved = 0;

    allItems.forEach(item => {
      totalAvailable += item.availableStock || 0;
      totalDispatched += item.dispatchedStock || 0;
      totalDamaged += item.damagedStock || 0;
    });

    // Count reserved stock from active reservations
    const activeReservations = await Reservation.find({
      isDeleted: false,
      status: { $in: ['Pending', 'Auto-Split', 'Locked'] }
    });
    activeReservations.forEach(r => {
      r.items.forEach(ri => {
        totalReserved += ri.lockedQty || 0;
      });
    });

    // Pending returns: dispatches that are Delivered or In-Transit (need return)
    const pendingReturnDispatches = await Dispatch.find({
      isDeleted: false,
      status: { $in: ['Delivered', 'In-Transit'] }
    }).populate('bookingId', 'eventTitle');
    const todaysReturnsCount = pendingReturnDispatches.length;

    const summary = {
      todaysEvents: todaysEventsCount || 0,
      todaysDispatches: todaysDispatchesCount || 0,
      todaysReturns: todaysReturnsCount || 0,
      pendingPayments: pendingPaymentsTotal || 0,
      availableStock: totalAvailable || 0,
      materialAtSite: totalDispatched || 0,
      staffPresent: totalStaffCount > 0 ? `${totalStaffCount}` : '0'
    };

    // ──────────────────────────────────────────────────────────────
    // 2. Growth Analysis - Revenue vs Expenses (existing, optimized)
    // ──────────────────────────────────────────────────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [payments, expenses] = await Promise.all([
      Payment.find({ isDeleted: false, transactionDate: { $gte: sixMonthsAgo } }),
      Expense.find({ isDeleted: false, date: { $gte: sixMonthsAgo } })
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = {};
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = monthNames[d.getMonth()] + ' ' + d.getFullYear();
      monthlyData[monthKey] = { date: monthKey, revenue: 0, expenses: 0 };
    }

    payments.forEach(p => {
      if (!p.transactionDate) return;
      const d = new Date(p.transactionDate);
      const monthKey = monthNames[d.getMonth()] + ' ' + d.getFullYear();
      if (monthlyData[monthKey]) {
        if (p.paymentType === 'refund') {
          monthlyData[monthKey].revenue -= p.amount;
        } else if (p.paymentType !== 'vendor_payment') {
          monthlyData[monthKey].revenue += p.amount;
        }
      }
    });

    expenses.forEach(e => {
      if (!e.date) return;
      const d = new Date(e.date);
      const monthKey = monthNames[d.getMonth()] + ' ' + d.getFullYear();
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].expenses += e.amount;
      }
    });

    const growthAnalysis = Object.values(monthlyData);

    // ──────────────────────────────────────────────────────────────
    // 3. Category Breakdown for Expenses Donut (existing)
    // ──────────────────────────────────────────────────────────────
    const categoryBreakdown = {
      'Transport': 0,
      'Material Purchase': 0,
      'Maintenance': 0,
      'Staff Salary': 0,
      'Other': 0
    };
    expenses.forEach(e => {
      const cat = e.category || 'Other';
      if (categoryBreakdown[cat] !== undefined) {
        categoryBreakdown[cat] += e.amount;
      } else {
        categoryBreakdown['Other'] += e.amount;
      }
    });

    // ──────────────────────────────────────────────────────────────
    // 4. Recent Bookings (enhanced)
    // ──────────────────────────────────────────────────────────────
    const recentBookings = await Booking.find({ isDeleted: false })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // ──────────────────────────────────────────────────────────────
    // 5. Warehouse Stock Summary (NEW)
    // ──────────────────────────────────────────────────────────────
    const warehouseSummary = allWarehouses.map(wh => {
      let available = 0;
      let reserved = 0;
      let atSite = 0;
      let damaged = 0;

      allItems.forEach(item => {
        if (item.warehouseStock && item.warehouseStock.length > 0) {
          item.warehouseStock.forEach(ws => {
            if (ws.warehouse && ws.warehouse.toString() === wh._id.toString()) {
              available += ws.quantity || 0;
              atSite += ws.dispatched || 0;
              damaged += ws.damaged || 0;
            }
          });
        }
      });

      return {
        _id: wh._id,
        name: wh.name,
        available,
        reserved: 0, // reservations are per-booking, not per-warehouse in current schema
        atSite,
        damaged
      };
    });

    // ──────────────────────────────────────────────────────────────
    // 6. Inventory Status Breakdown (NEW) - for donut chart
    // ──────────────────────────────────────────────────────────────
    const inventoryBreakdown = [
      { label: 'Available', value: totalAvailable, color: '#10b981' },
      { label: 'Reserved', value: totalReserved, color: '#3b82f6' },
      { label: 'Dispatched', value: totalDispatched, color: '#f59e0b' },
      { label: 'Damaged', value: totalDamaged, color: '#ef4444' },
    ];

    // ──────────────────────────────────────────────────────────────
    // 7. Material Movement Flow (NEW)
    // ──────────────────────────────────────────────────────────────
    const loadingCount = await Dispatch.countDocuments({ isDeleted: false, status: 'Loading' });
    const inTransitCount = await Dispatch.countDocuments({ isDeleted: false, status: 'In-Transit' });
    const deliveredCount = await Dispatch.countDocuments({ isDeleted: false, status: 'Delivered' });
    const returnedCount = await EventExecution.countDocuments({ isDeleted: false, type: { $in: ['Return', 'Verification'] } });

    const materialFlow = {
      available: totalAvailable,
      reserved: totalReserved,
      loading: loadingCount,
      dispatched: inTransitCount,
      atSite: deliveredCount,
      returned: returnedCount
    };

    // ──────────────────────────────────────────────────────────────
    // 8. Pending Dispatches (NEW)
    // ──────────────────────────────────────────────────────────────
    const pendingDispatches = await Dispatch.find({
      isDeleted: false,
      status: { $in: ['Loading', 'In-Transit'] }
    })
      .populate('bookingId', 'eventTitle eventStartDate')
      .sort({ createdAt: -1 })
      .limit(5);

    // ──────────────────────────────────────────────────────────────
    // 9. Pending Returns (NEW)
    // ──────────────────────────────────────────────────────────────
    const pendingReturns = pendingReturnDispatches.slice(0, 5);

    // ──────────────────────────────────────────────────────────────
    // 10. Upcoming Calendar Events (NEW) - next 30 days
    // ──────────────────────────────────────────────────────────────
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const upcomingEvents = await Booking.find({
      isDeleted: false,
      status: { $ne: 'Cancelled' },
      eventStartDate: { $gte: today, $lte: thirtyDaysLater }
    })
      .populate('customer', 'name')
      .sort({ eventStartDate: 1 })
      .limit(10);

    // ──────────────────────────────────────────────────────────────
    // 11. Dispatch Timeline - today's stages (NEW)
    // ──────────────────────────────────────────────────────────────
    const [loadedToday, transitToday, deliveredToday] = await Promise.all([
      Dispatch.countDocuments({ isDeleted: false, status: 'Loading', createdAt: { $gte: today, $lt: tomorrow } }),
      Dispatch.countDocuments({ isDeleted: false, status: 'In-Transit', createdAt: { $gte: today, $lt: tomorrow } }),
      Dispatch.countDocuments({ isDeleted: false, status: 'Delivered', deliveredAt: { $gte: today, $lt: tomorrow } }),
    ]);

    const dispatchTimeline = [
      { stage: 'Loaded', count: loadedToday, color: 'emerald' },
      { stage: 'In Transit', count: transitToday, color: 'blue' },
      { stage: 'Delivered', count: deliveredToday, color: 'yellow' },
    ];

    // ──────────────────────────────────────────────────────────────
    // RESPONSE
    // ──────────────────────────────────────────────────────────────
    res.status(200).json({
      success: true,
      data: {
        summary,
        growthAnalysis,
        categoryBreakdown,
        recentBookings: recentBookings.map(b => ({
          _id: b._id,
          bookingId: b.bookingId,
          eventTitle: b.eventTitle,
          eventType: b.eventType || 'Wedding',
          customerName: b.customer ? b.customer.name : 'Walk-in',
          grandTotal: b.grandTotal,
          advancePaid: b.advancePaid || 0,
          balanceAmount: b.balanceAmount,
          status: b.status,
          date: b.eventStartDate,
          venueAddress: b.venueAddress || ''
        })),
        warehouseSummary,
        inventoryBreakdown,
        materialFlow,
        pendingDispatches: pendingDispatches.map(d => ({
          _id: d._id,
          dispatchId: d.dispatchNumber,
          eventTitle: d.bookingId ? d.bookingId.eventTitle : 'N/A',
          date: d.bookingId ? d.bookingId.eventStartDate : d.createdAt,
          status: d.status
        })),
        pendingReturns: pendingReturns.map(d => ({
          _id: d._id,
          dispatchId: d.dispatchNumber,
          eventTitle: d.bookingId ? d.bookingId.eventTitle : 'N/A',
          date: d.deliveredAt || d.createdAt,
          status: 'Pending Return'
        })),
        upcomingEvents: upcomingEvents.map(e => ({
          _id: e._id,
          date: e.eventStartDate,
          endDate: e.eventEndDate,
          title: e.eventTitle,
          venue: e.venueAddress || '',
          type: e.eventType || 'Wedding',
          customerName: e.customer ? e.customer.name : 'Walk-in',
          status: e.status
        })),
        dispatchTimeline
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while loading dashboard statistics'
    });
  }
};
