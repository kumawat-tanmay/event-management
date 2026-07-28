const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const SiteVisit = require('../models/SiteVisit');

// Helper to clean empty string ObjectId & Date fields
const sanitizeCrmPayload = (body) => {
  const payload = { ...body };
  if (payload.assignedStaff === '' || payload.assignedStaff === null) delete payload.assignedStaff;
  if (payload.lead === '' || payload.lead === null) delete payload.lead;
  if (payload.eventDate === '' || payload.eventDate === null) delete payload.eventDate;
  if (payload.email === '') payload.email = undefined;
  if (payload.gstNumber === '') payload.gstNumber = undefined;
  return payload;
};

// ─── Customer Controllers ────────────────────────────────────────────────────

// @desc    Fetch paginated customers with search & type filter
// @route   GET /api/crm/customers
const getCustomers = async (req, res) => {
  try {
    const { type, search, page = 1, limit = 50 } = req.query;
    const query = { isDeleted: false };

    if (type && type !== 'ALL CUSTOMERS') {
      if (type === 'RETAIL') query.type = 'Retail';
      else if (type === 'CORPORATE') query.type = 'Corporate';
      else query.type = type;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Customer.countDocuments(query);
    const data = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single customer profile
// @route   GET /api/crm/customers/:id
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create new customer
// @route   POST /api/crm/customers
const createCustomer = async (req, res) => {
  try {
    const cleanPayload = sanitizeCrmPayload(req.body);

    const customer = await Customer.create({
      ...cleanPayload,
      type: cleanPayload.type || 'Retail',
      creditLimit: Number(cleanPayload.creditLimit || 0),
      paymentTerms: Number(cleanPayload.paymentTerms || 0),
      createdBy: req.user?._id
    });

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully'
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Update customer details
// @route   PUT /api/crm/customers/:id
const updateCustomer = async (req, res) => {
  try {
    const cleanPayload = sanitizeCrmPayload(req.body);

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: cleanPayload },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Soft delete customer
// @route   DELETE /api/crm/customers/:id
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ─── Lead Operations ─────────────────────────────────────────────────────────

// @desc    Get all leads with stage, phone, customerName filters
// @route   GET /api/crm/leads
const getLeads = async (req, res) => {
  try {
    const { stage, search, phone, customerName } = req.query;
    const query = { isDeleted: false };

    if (stage && stage !== 'ALL LEADS') {
      query.stage = stage;
    }

    // ponytail: server-side filters to avoid full-collection client downloads
    if (phone) {
      query.phone = { $regex: phone, $options: 'i' };
    }
    if (customerName) {
      query.customerName = { $regex: `^${customerName}$`, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { leadId: { $regex: search, $options: 'i' } }
      ];
    }

    const data = await Lead.find(query)
      .populate('assignedStaff', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single lead detail
// @route   GET /api/crm/leads/:id
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, isDeleted: false })
      .populate('assignedStaff', 'name email')
      .lean();
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create lead with auto-generated leadId (LD-1001...)
// @route   POST /api/crm/leads
const createLead = async (req, res) => {
  try {
    const cleanPayload = sanitizeCrmPayload(req.body);
    // ponytail: race-safe sequential ID using last doc sort instead of countDocuments
    const lastLead = await Lead.findOne().sort({ createdAt: -1 }).select('leadId').lean();
    let nextNum = 1001;
    if (lastLead && lastLead.leadId) {
      const parsed = parseInt(lastLead.leadId.replace('LD-', ''), 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    }
    const leadId = `LD-${nextNum}`;

    // Auto-sync customer to Customer directory if phone not already registered
    if (cleanPayload.customerName && cleanPayload.phone) {
      const existingCust = await Customer.findOne({ phone: cleanPayload.phone, isDeleted: false });
      if (!existingCust) {
        await Customer.create({
          name: cleanPayload.customerName,
          phone: cleanPayload.phone,
          email: cleanPayload.email,
          address: 'Created from Sales Lead ' + leadId,
          type: 'Retail',
          createdBy: req.user?._id
        });
      }
    }

    const lead = await Lead.create({
      ...cleanPayload,
      leadId,
      createdBy: req.user?._id
    });

    res.status(201).json({
      success: true,
      data: lead,
      message: 'Lead created successfully'
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Update lead stage or details
// @route   PUT /api/crm/leads/:id
const updateLead = async (req, res) => {
  try {
    const cleanPayload = sanitizeCrmPayload(req.body);

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: cleanPayload },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.json({ success: true, data: lead, message: 'Lead updated successfully' });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Soft delete lead
// @route   DELETE /api/crm/leads/:id
const deleteLead = async (req, res) => {
  try {
    await Lead.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ─── Site Visit Operations ───────────────────────────────────────────────────

// @desc    Get all site visits with optional phone, customerName, leadId filters
// @route   GET /api/crm/site-visits
const getSiteVisits = async (req, res) => {
  try {
    const { phone, customerName, leadId } = req.query;
    const query = { isDeleted: false };

    // ponytail: server-side filters to avoid full-collection client downloads
    if (phone) {
      query.phone = { $regex: phone, $options: 'i' };
    }
    if (customerName) {
      query.customerName = { $regex: `^${customerName}$`, $options: 'i' };
    }
    if (leadId) {
      query.lead = leadId;
    }

    const data = await SiteVisit.find(query)
      .populate('assignedStaff', 'name email')
      .populate('lead', 'leadId eventType')
      .sort({ visitDate: -1 })
      .lean();

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching site visits:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single site visit detail
// @route   GET /api/crm/site-visits/:id
const getSiteVisitById = async (req, res) => {
  try {
    const siteVisit = await SiteVisit.findOne({ _id: req.params.id, isDeleted: false })
      .populate('assignedStaff', 'name email')
      .populate('lead', 'leadId eventType')
      .lean();
    if (!siteVisit) {
      return res.status(404).json({ success: false, message: 'Site Visit not found' });
    }
    res.json({ success: true, data: siteVisit });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Schedule new site visit
// @route   POST /api/crm/site-visits
const createSiteVisit = async (req, res) => {
  try {
    const cleanPayload = sanitizeCrmPayload(req.body);

    const siteVisit = await SiteVisit.create({
      ...cleanPayload,
      createdBy: req.user?._id
    });

    // Auto-update linked Lead stage to 'Site Visit'
    if (cleanPayload.lead) {
      await Lead.findByIdAndUpdate(cleanPayload.lead, { stage: 'Site Visit' });
    }

    res.status(201).json({
      success: true,
      data: siteVisit,
      message: 'Site Visit scheduled successfully'
    });
  } catch (error) {
    console.error('Error creating site visit:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Update site visit
// @route   PUT /api/crm/site-visits/:id
const updateSiteVisit = async (req, res) => {
  try {
    const cleanPayload = sanitizeCrmPayload(req.body);

    const siteVisit = await SiteVisit.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: cleanPayload },
      { new: true }
    );

    if (!siteVisit) {
      return res.status(404).json({ success: false, message: 'Site Visit not found' });
    }

    res.json({ success: true, data: siteVisit, message: 'Site Visit updated successfully' });
  } catch (error) {
    console.error('Error updating site visit:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getSiteVisits,
  getSiteVisitById,
  createSiteVisit,
  updateSiteVisit
};
