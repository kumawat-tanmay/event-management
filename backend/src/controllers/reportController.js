const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Item = require('../models/Item');

const WarehouseTransfer = require('../models/WarehouseTransfer');
const Dispatch = require('../models/Dispatch');
const Staff = require('../models/Staff');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const SiteVisit = require('../models/SiteVisit');
const AuditLog = require('../models/AuditLog');

// @desc    Generate 16 types of historical/real-time reports
// @route   GET /api/reports/:reportType
// @access  Private
exports.getReport = async (req, res) => {
  try {
    const { reportType } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const hasDateFilter = startDate || endDate;

    let reportData = {};

    switch (reportType) {
      case 'sales': {
        const match = { isDeleted: false };
        if (hasDateFilter) match.eventStartDate = dateFilter;
        
        const bookings = await Booking.find(match).populate('customer', 'name');
        const summary = {
          totalBookings: bookings.length,
          confirmedBookings: bookings.filter(b => b.status === 'Confirmed').length,
          completedBookings: bookings.filter(b => b.status === 'Completed').length,
          cancelledBookings: bookings.filter(b => b.status === 'Cancelled').length,
          totalSalesAmount: bookings.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0),
          totalCollected: bookings.reduce((acc, curr) => acc + (curr.advancePaid || 0), 0)
        };
        reportData = { summary, bookings };
        break;
      }
      
      case 'profit': {
        const match = { isDeleted: false };
        if (hasDateFilter) match.eventStartDate = dateFilter;
        
        const bookings = await Booking.find(match);
        const totalSales = bookings.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0);

        const expMatch = { isDeleted: false };
        if (hasDateFilter) expMatch.date = dateFilter;
        const expenses = await Expense.find(expMatch);
        const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

        reportData = {
          totalRevenue: totalSales,
          totalExpenses,
          netProfit: totalSales - totalExpenses,
          profitMargin: totalSales > 0 ? (((totalSales - totalExpenses) / totalSales) * 100).toFixed(2) : 0
        };
        break;
      }

      case 'inventory': {
        const items = await Item.find({ isDeleted: false });
        reportData = items.map(item => ({
          _id: item._id,
          name: item.name,
          sku: item.sku || item.code || '',

          rentalPrice: item.rentalPrice || 0,
          purchaseCost: item.purchaseCost || 0,
          minStockAlert: item.minStockAlert || 0,
          isActive: item.isActive
        }));
        break;
      }

      case 'damage': {
        // Find damage reports from dispatches/events returns verification
        const match = { isDeleted: false, category: 'Maintenance' };
        if (hasDateFilter) match.date = dateFilter;
        const damageExpenses = await Expense.find(match).populate('referenceId');
        reportData = damageExpenses;
        break;
      }

      case 'transfer': {
        const match = {};
        if (hasDateFilter) match.createdAt = dateFilter;
        const transfers = await WarehouseTransfer.find(match)
          .populate('fromWarehouse', 'name')
          .populate('toWarehouse', 'name')
          .populate('createdBy', 'name');
        reportData = transfers;
        break;
      }

      case 'gst': {
        const match = { isDeleted: false };
        if (hasDateFilter) match.eventStartDate = dateFilter;
        const bookings = await Booking.find(match).populate('customer', 'name');
        reportData = bookings.map(b => ({
          bookingId: b.bookingId,
          customerName: b.customer ? b.customer.name : 'Unknown',
          eventTitle: b.eventTitle,
          subtotal: b.subtotal,
          taxRate: b.taxRate,
          taxAmount: b.taxAmount,
          grandTotal: b.grandTotal,
          date: b.eventStartDate
        }));
        break;
      }

      case 'dispatches': {
        const match = {};
        if (hasDateFilter) match.createdAt = dateFilter;
        const dispatches = await Dispatch.find(match)
          .populate('bookingId', 'bookingId eventTitle')
          .populate('warehouseId', 'name')
          .populate('createdBy', 'name');
        reportData = dispatches;
        break;
      }

      case 'staff-payroll': {
        const staffList = await Staff.find({ isDeleted: false });
        reportData = staffList.map(s => ({
          name: s.name,
          phone: s.phone,
          role: s.role,
          compensationType: s.compensationType,
          basePay: s.basePay,
          pendingDues: s.pendingDues || 0,
          status: s.status
        }));
        break;
      }

      case 'expenses': {
        const match = { isDeleted: false };
        if (hasDateFilter) match.date = dateFilter;
        const expenses = await Expense.find(match).populate('createdBy', 'name');
        const categories = {};
        expenses.forEach(e => {
          categories[e.category] = (categories[e.category] || 0) + e.amount;
        });
        reportData = { total: expenses.reduce((a,c) => a + c.amount, 0), breakdown: categories, list: expenses };
        break;
      }

      case 'cash-ledger': {
        const match = { isDeleted: false, paymentMode: 'Cash' };
        if (hasDateFilter) match.transactionDate = dateFilter;
        const cashPayments = await Payment.find(match);

        const expMatch = { isDeleted: false, paymentMode: 'Cash' };
        if (hasDateFilter) expMatch.date = dateFilter;
        const cashExpenses = await Expense.find(expMatch);

        reportData = {
          payments: cashPayments,
          expenses: cashExpenses,
          totalInflow: cashPayments.reduce((a,c) => a + c.amount, 0),
          totalOutflow: cashExpenses.reduce((a,c) => a + c.amount, 0)
        };
        break;
      }

      case 'bank-ledger': {
        const match = { isDeleted: false, paymentMode: { $ne: 'Cash' } };
        if (hasDateFilter) match.transactionDate = dateFilter;
        const bankPayments = await Payment.find(match);

        const expMatch = { isDeleted: false, paymentMode: { $ne: 'Cash' } };
        if (hasDateFilter) expMatch.date = dateFilter;
        const bankExpenses = await Expense.find(expMatch);

        reportData = {
          payments: bankPayments,
          expenses: bankExpenses,
          totalInflow: bankPayments.reduce((a,c) => a + c.amount, 0),
          totalOutflow: bankExpenses.reduce((a,c) => a + c.amount, 0)
        };
        break;
      }

      case 'vendor': {
        // Payments to vendors
        const payments = await Payment.find({ isDeleted: false, paymentType: 'vendor_payment' });
        reportData = payments;
        break;
      }

      case 'customers': {
        const customers = await Customer.find({ isDeleted: false });
        reportData = customers;
        break;
      }

      case 'leads': {
        const match = { isDeleted: false };
        if (hasDateFilter) match.createdAt = dateFilter;
        const leads = await Lead.find(match);
        const stageCounts = {};
        leads.forEach(l => {
          stageCounts[l.stage] = (stageCounts[l.stage] || 0) + 1;
        });
        reportData = { total: leads.length, stages: stageCounts, list: leads };
        break;
      }

      case 'returns': {
        // Return metrics / lists
        const bookings = await Booking.find({ status: 'Completed', isDeleted: false });
        reportData = bookings;
        break;
      }

      case 'site-visits': {
        const match = {};
        if (hasDateFilter) match.visitDate = dateFilter;
        const visits = await SiteVisit.find(match);
        reportData = visits;
        break;
      }

      default: {
        return res.status(400).json({
          success: false,
          message: 'Invalid report type specified'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while generating report'
    });
  }
};
