const Staff = require('../models/Staff');
const Vehicle = require('../models/Vehicle');
const Counter = require('../models/Counter');
const Expense = require('../models/Expense');

class HRService {
  // ─── Staff Services ──────────────────────────────────────────────────────

  async getStaff({ search, role, status, page = 1, limit = 100 } = {}) {
    // Server-side auto-sync check: Ensure every system User has a corresponding Staff document
    try {
      const User = require('../models/User');
      const allUsers = await User.find({ isDeleted: false }).lean();
      
      for (const u of allUsers) {
        if (!u.email && !u.name) continue;
        const staffExists = await Staff.findOne({ 
          $or: [
            { email: u.email ? u.email.toLowerCase() : 'N/A' },
            { name: u.name }
          ],
          isDeleted: false 
        });

        if (!staffExists) {
          const count = await Staff.countDocuments();
          const staffRole = u.role || 'Admin';

          await Staff.create({
            staffId: `STF-${String(count + 1).padStart(3, '0')}`,
            name: u.name,
            email: u.email ? u.email.toLowerCase() : '',
            phone: u.phone || '+91 98290 12345',
            role: staffRole,
            compensationType: 'monthly',
            basePay: 50000,
            totalPaid: 50000,
            pendingDues: 0,
            status: 'Active'
          });
        } else if (u.role && ['Owner', 'Admin', 'Manager'].includes(u.role) && staffExists.role !== u.role) {
          staffExists.role = u.role;
          await staffExists.save();
        }
      }
    } catch (syncErr) {
      console.error('Error auto-syncing users to staff documents:', syncErr);
    }

    const query = { isDeleted: false };

    if (role && role !== 'ALL STAFF') {
      query.role = { $regex: role, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { staffId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Staff.countDocuments(query);
    const data = await Staff.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  async getStaffById(id) {
    const staff = await Staff.findOne({ _id: id, isDeleted: false })
      .populate('createdBy', 'name email')
      .lean();
    if (!staff) throw new Error('Staff member not found');
    return staff;
  }

  async createStaff(data, userId) {
    const counter = await Counter.findOneAndUpdate(
      { id: 'staffId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const staffId = `STF-${counter.seq}`;

    const newStaff = new Staff({
      ...data,
      staffId,
      createdBy: userId
    });

    return await newStaff.save();
  }

  async updateStaff(id, data) {
    const updatedStaff = await Staff.findOneAndUpdate(
      { _id: id, isDeleted: false },
      data,
      { new: true, runValidators: true }
    );
    if (!updatedStaff) throw new Error('Staff member not found');
    return updatedStaff;
  }

  async deleteStaff(id) {
    const staff = await Staff.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!staff) throw new Error('Staff member not found');
    return staff;
  }

  async logPayment(id, { amount, type = 'Salary', mode = 'Cash', notes = '', newPendingDues }, userId) {
    const staff = await Staff.findOne({ _id: id, isDeleted: false });
    if (!staff) throw new Error('Staff member not found');

    const paymentAmount = Number(amount || 0);
    if (paymentAmount > 0) {
      staff.paymentHistory.push({
        amount: paymentAmount,
        type,
        mode,
        notes,
        recordedBy: userId
      });

      staff.totalPaid += paymentAmount;

      // Auto-create a corresponding Expense transaction in the Finance ledger
      await Expense.create({
        category: type === 'Advance' ? 'Staff Advance' : 'Staff Salary',
        amount: paymentAmount,
        paymentMode: mode || 'Cash',
        referenceId: staff._id,
        refModel: 'Staff',
        notes: notes || `${type} payment recorded for staff ${staff.name} (${staff.staffId})`,
        date: new Date(),
        createdBy: userId
      });
    }

    if (newPendingDues !== undefined && newPendingDues !== null && newPendingDues !== '') {
      staff.pendingDues = Math.max(0, Number(newPendingDues));
    } else if (paymentAmount > 0) {
      staff.pendingDues = Math.max(0, staff.pendingDues - paymentAmount);
    }

    return await staff.save();
  }

  // ─── Vehicle Services ────────────────────────────────────────────────────

  async getVehicles({ search, status, type, page = 1, limit = 100 } = {}) {
    const query = { isDeleted: false };

    if (status && status !== 'ALL') {
      query.status = status.toLowerCase().replace(' ', '_');
    }

    if (type) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { plateNumber: { $regex: search, $options: 'i' } },
        { vehicleId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Vehicle.countDocuments(query);
    const data = await Vehicle.find(query)
      .populate('assignedDriverId', 'name phone role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  async getVehicleById(id) {
    const vehicle = await Vehicle.findOne({ _id: id, isDeleted: false })
      .populate('assignedDriverId', 'name phone role')
      .populate('createdBy', 'name email')
      .lean();
    if (!vehicle) throw new Error('Vehicle not found');
    return vehicle;
  }

  async createVehicle(data, userId) {
    const counter = await Counter.findOneAndUpdate(
      { id: 'vehicleId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const vehicleId = `VEC-${counter.seq}`;

    const newVehicle = new Vehicle({
      ...data,
      vehicleId,
      createdBy: userId
    });

    const saved = await newVehicle.save();
    return await Vehicle.findById(saved._id).populate('assignedDriverId', 'name phone role').lean();
  }

  async updateVehicle(id, data) {
    const updatedVehicle = await Vehicle.findOneAndUpdate(
      { _id: id, isDeleted: false },
      data,
      { new: true, runValidators: true }
    ).populate('assignedDriverId', 'name phone role').lean();
    if (!updatedVehicle) throw new Error('Vehicle not found');
    return updatedVehicle;
  }

  async deleteVehicle(id) {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!vehicle) throw new Error('Vehicle not found');
    return vehicle;
  }
}

module.exports = new HRService();
