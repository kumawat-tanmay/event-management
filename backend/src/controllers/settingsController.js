const Company = require('../models/Company');

// @desc    Get company settings
// @route   GET /api/settings/company
// @access  Private
exports.getCompanySettings = async (req, res) => {
  try {
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create({
        name: 'Krishna Tent & Events',
        email: 'artifactgeekscompany@gmail.com',
        phone: '+91 98290 12345',
        address: 'Tonk Road, Near Sanganer Flyover, Jaipur, Rajasthan 302018',
        gstin: '08AAAAA0000A1Z5',
        isSetupComplete: true
      });
    }
    return res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Get Company Settings Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching company settings'
    });
  }
};

// @desc    Update company settings
// @route   PUT /api/settings/company
// @access  Private
exports.updateCompanySettings = async (req, res) => {
  try {
    let company = await Company.findOne();
    if (!company) {
      company = new Company();
    }

    const { name, email, phone, address, gstin } = req.body;

    if (name) company.name = name;
    if (email !== undefined) company.email = email;
    if (phone !== undefined) company.phone = phone;
    if (address !== undefined) company.address = address;
    if (gstin !== undefined) company.gstin = gstin;

    if (req.file) {
      // If logo file uploaded via multer, convert to base64 data URI or Cloudinary URL
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const mimeType = req.file.mimetype || 'image/png';
      company.logo = `data:${mimeType};base64,${b64}`;
    } else if (req.body.logo) {
      company.logo = req.body.logo;
    }

    company.isSetupComplete = true;
    await company.save();

    return res.status(200).json({
      success: true,
      data: company,
      message: 'Company settings updated successfully'
    });
  } catch (error) {
    console.error('Update Company Settings Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating company settings'
    });
  }
};
