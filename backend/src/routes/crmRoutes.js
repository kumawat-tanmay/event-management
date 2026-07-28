const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/crmController');
const { protect } = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/requirePermission');

router.use(protect);

// Customer Routes
router.get('/customers', requirePermission('crm.view'), getCustomers);
router.get('/customers/:id', requirePermission('crm.view'), getCustomerById);
router.post('/customers', requirePermission('crm.create'), createCustomer);
router.put('/customers/:id', requirePermission('crm.update'), updateCustomer);
router.delete('/customers/:id', requirePermission('crm.delete'), deleteCustomer);

// Lead Routes
router.get('/leads', requirePermission('crm.view'), getLeads);
router.get('/leads/:id', requirePermission('crm.view'), getLeadById);
router.post('/leads', requirePermission('crm.create'), createLead);
router.put('/leads/:id', requirePermission('crm.update'), updateLead);
router.delete('/leads/:id', requirePermission('crm.delete'), deleteLead);

// Site Visit Routes
router.get('/site-visits', requirePermission('crm.view'), getSiteVisits);
router.get('/site-visits/:id', requirePermission('crm.view'), getSiteVisitById);
router.post('/site-visits', requirePermission('crm.create'), createSiteVisit);
router.put('/site-visits/:id', requirePermission('crm.update'), updateSiteVisit);

module.exports = router;
