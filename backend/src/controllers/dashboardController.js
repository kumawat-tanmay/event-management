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
      allWarehouses,
      pendingPaymentsAgg,
      stockAgg,
      warehouseStockAgg,
      reservationAgg
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
      Warehouse.find({ isDeleted: false }).lean(),
      Booking.aggregate([
        { $match: { isDeleted: false, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, totalBalance: { $sum: '$balanceAmount' } } }
      ]),
      Item.aggregate([
        { $match: { isDeleted: false, isActive: true } },
        { $group: {
            _id: null,
            totalAvailable: { $sum: '$availableStock' },
            totalDispatched: { $sum: '$dispatchedStock' },
            totalDamaged: { $sum: '$damagedStock' }
          }
        }
      ]),
      Item.aggregate([
        { $match: { isDeleted: false, isActive: true } },
        { $unwind: '$warehouseStock' },
        { $group: {
            _id: '$warehouseStock.warehouse',
            available: { $sum: '$warehouseStock.quantity' },
            atSite: { $sum: '$warehouseStock.dispatched' },
            damaged: { $sum: '$warehouseStock.damaged' }
          }
        }
      ]),
      Reservation.aggregate([
        { $match: { isDeleted: false, status: { $in: ['Pending', 'Auto-Split', 'Locked'] } } },
        { $unwind: '$items' },
        { $group: { _id: null, totalReserved: { $sum: '$items.lockedQty' } } }
      ])
    ]);

    const pendingPaymentsTotal = pendingPaymentsAgg[0]?.totalBalance || 0;
    const totalAvailable = stockAgg[0]?.totalAvailable || 0;
    const totalDispatched = stockAgg[0]?.totalDispatched || 0;
    const totalDamaged = stockAgg[0]?.totalDamaged || 0;
    const totalReserved = reservationAgg[0]?.totalReserved || 0;

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
    // 2. Growth Analysis - Revenue vs Expenses (Monthly, Weekly, Daily)
    // ──────────────────────────────────────────────────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [payments, expenses] = await Promise.all([
      Payment.find({ isDeleted: false, transactionDate: { $gte: sixMonthsAgo } }).lean(),
      Expense.find({ isDeleted: false, date: { $gte: sixMonthsAgo } }).lean()
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // A. Monthly Buckets (last 6 months)
    const monthlyBuckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      monthlyBuckets.push({
        label: monthNames[monthIdx],
        year,
        monthIdx,
        revenue: 0,
        expenses: 0
      });
    }

    // B. Weekly Buckets (last 6 weeks)
    const now = new Date();
    const weeklyBuckets = [];
    for (let i = 5; i >= 0; i--) {
      const endWin = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7), 23, 59, 59, 999);
      const startWin = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7) - 6, 0, 0, 0, 0);
      weeklyBuckets.push({
        label: `Wk ${6 - i}`,
        startWin,
        endWin,
        revenue: 0,
        expenses: 0
      });
    }

    // C. Daily Buckets (last 7 days with Day Names)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dailyBuckets = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const dayName = dayNames[d.getDay()];
      dailyBuckets.push({
        label: `${dayName} ${String(d.getDate()).padStart(2, '0')}`,
        dayStart,
        dayEnd,
        revenue: 0,
        expenses: 0
      });
    }

    // Aggregate Payments
    payments.forEach(p => {
      if (!p.transactionDate) return;
      const pDate = new Date(p.transactionDate);
      const amt = p.amount || 0;
      if (p.paymentType === 'vendor_payment') return;

      const revChange = p.paymentType === 'refund' ? -amt : amt;

      monthlyBuckets.forEach(mb => {
        if (pDate.getFullYear() === mb.year && pDate.getMonth() === mb.monthIdx) {
          mb.revenue += revChange;
        }
      });

      weeklyBuckets.forEach(wb => {
        if (pDate >= wb.startWin && pDate <= wb.endWin) {
          wb.revenue += revChange;
        }
      });

      dailyBuckets.forEach(db => {
        if (pDate >= db.dayStart && pDate <= db.dayEnd) {
          db.revenue += revChange;
        }
      });
    });

    // Aggregate Expenses
    expenses.forEach(e => {
      if (!e.date) return;
      const eDate = new Date(e.date);
      const amt = e.amount || 0;

      monthlyBuckets.forEach(mb => {
        if (eDate.getFullYear() === mb.year && eDate.getMonth() === mb.monthIdx) {
          mb.expenses += amt;
        }
      });

      weeklyBuckets.forEach(wb => {
        if (eDate >= wb.startWin && eDate <= wb.endWin) {
          wb.expenses += amt;
        }
      });

      dailyBuckets.forEach(db => {
        if (eDate >= db.dayStart && eDate <= db.dayEnd) {
          db.expenses += amt;
        }
      });
    });

    const growthAnalysis = {
      monthly: monthlyBuckets.map(b => ({ date: b.label, revenue: Math.max(0, b.revenue), expenses: b.expenses })),
      weekly: weeklyBuckets.map(b => ({ date: b.label, revenue: Math.max(0, b.revenue), expenses: b.expenses })),
      daily: dailyBuckets.map(b => ({ date: b.label, revenue: Math.max(0, b.revenue), expenses: b.expenses }))
    };

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
      const stockInfo = warehouseStockAgg.find(s => s._id.toString() === wh._id.toString());
      return {
        _id: wh._id,
        name: wh.name,
        available: stockInfo ? (stockInfo.available || 0) : 0,
        reserved: 0, // reservations are per-booking, not per-warehouse in current schema
        atSite: stockInfo ? (stockInfo.atSite || 0) : 0,
        damaged: stockInfo ? (stockInfo.damaged || 0) : 0
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
