const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Company = require('../models/Company');
const Warehouse = require('../models/Warehouse');
const Item = require('../models/Item');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const SiteVisit = require('../models/SiteVisit');
const Quotation = require('../models/Quotation');
const Booking = require('../models/Booking');
const Reservation = require('../models/Reservation');
const Dispatch = require('../models/Dispatch');
const EventExecution = require('../models/EventExecution');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const InventoryLedger = require('../models/InventoryLedger');
const Staff = require('../models/Staff');
const Vehicle = require('../models/Vehicle');
const WarehouseTransfer = require('../models/WarehouseTransfer');
const Role = require('../models/Role');
const { DEFAULT_ROLES } = require('../config/permissions');

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/krishna-event-erp';
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB successfully.`);

    console.log(`Clearing old test data...`);
    await User.deleteMany({});
    await Company.deleteMany({});
    await Warehouse.deleteMany({});
    await Item.deleteMany({});
    await Customer.deleteMany({});
    await Lead.deleteMany({});
    await SiteVisit.deleteMany({});
    await Quotation.deleteMany({});
    await Booking.deleteMany({});
    await Reservation.deleteMany({});
    await Dispatch.deleteMany({});
    await EventExecution.deleteMany({});
    await Expense.deleteMany({});
    await Payment.deleteMany({});
    await Invoice.deleteMany({});
    await InventoryLedger.deleteMany({});
    await Staff.deleteMany({});
    await Vehicle.deleteMany({});
    await WarehouseTransfer.deleteMany({});
    await Role.deleteMany({});
    console.log(`Old data cleared.`);

    console.log(`Seeding Default Roles...`);
    const roleDocs = Object.values(DEFAULT_ROLES).map(r => ({
      name: r.name,
      permissions: r.permissions,
      isSystem: r.isSystem || true,
      isDeleted: false,
    }));
    await Role.insertMany(roleDocs);
    console.log(`Default roles seeded.`);

    // 1. Company Profile
    console.log(`Seeding Company Profile...`);
    const company = await Company.create({
      name: 'Krishna Tent & Events',
      email: 'artifactgeekscompany@gmail.com',
      phone: '+91 98290 12345',
      address: 'Tonk Road, Near Sanganer Flyover, Jaipur, Rajasthan 302018',
      gstin: '08AAAAA0000A1Z5',
      isSetupComplete: true
    });

    // 2. Admin & Staff Users
    console.log(`Seeding Admin & Staff Users...`);
    const adminUser = new User({
      name: 'Kuldeep Kumawat',
      email: 'artifactgeekscompany@gmail.com',
      password: 'Admin@123', // Hashed automatically by pre('save')
      role: 'Admin',
      status: 'Active',
      isActive: true
    });
    await adminUser.save();

    const adminUser2 = new User({
      name: 'Tanmay Kumawat',
      email: 'tanmaymk03@gmail.com',
      password: 'Admin@123',
      role: 'Admin',
      status: 'Active',
      isActive: true
    });
    await adminUser2.save();

    const managerUser = new User({
      name: 'Rajesh Sharma',
      email: 'manager@krishnatent.com',
      password: 'Admin@123',
      role: 'Manager',
      status: 'Active',
      isActive: true
    });
    await managerUser.save();

    const storeUser = new User({
      name: 'Suresh Gurjar',
      email: 'store@krishnatent.com',
      password: 'Admin@123',
      role: 'Manager',
      status: 'Active',
      isActive: true
    });
    await storeUser.save();

    // 3. 4 Warehouses (Godowns)
    console.log(`Seeding 4 Godowns (Warehouses)...`);
    const w1 = await Warehouse.create({
      name: 'Main Godown Jaipur',
      code: 'WH-MAIN',
      address: 'Tonk Road, Near Sanganer Flyover, Jaipur',
      capacity: 50000,
      manager: 'Suresh Gurjar',
      contactPhone: '+91 98290 12345',
      status: 'Active',
      isDefault: true,
      zones: [
        {
          name: 'Zone A - German Tents & Canopies',
          code: 'ZA',
          description: 'German Waterproof Tents, Trussing & Stage Canopies',
          racks: [
            { name: 'Rack 1A - Heavy Aluminium Truss Framework', capacity: '500 pcs', description: 'Truss pillars & beams' },
            { name: 'Rack 1B - Waterproof PVC Tarpaulin Covers', capacity: '1000 pcs', description: 'White & German PVC Sheets' }
          ]
        },
        {
          name: 'Zone B - Plastic Chairs & Furniture',
          code: 'ZB',
          description: 'Plastic Moulded Chairs, Banquet Tables & Stools',
          racks: [
            { name: 'Rack 2A - Red Plastic Chair Stacking Bay', capacity: '5000 pcs', description: 'High-density plastic chair stacks' },
            { name: 'Rack 2B - Round & Rectangular Banquet Tables', capacity: '800 pcs', description: 'Folding steel & plastic tables' }
          ]
        },
        {
          name: 'Zone C - Sound, Lights & Electronics',
          code: 'ZC',
          description: 'Sharpy Beam Lights, JBL Speakers & Stage Power DBs',
          racks: [
            { name: 'Rack 3A - Sound Amplifier Racks', capacity: '200 pcs', description: 'Power amps & digital mixers' },
            { name: 'Rack 3B - Sharpy Light Flight Cases', capacity: '300 pcs', description: 'Moving head sharpies & LED Pars' }
          ]
        }
      ]
    });

    const w2 = await Warehouse.create({
      name: 'Mansarovar Godown',
      code: 'WH-MANS',
      address: 'Sector 5, Main VT Road, Mansarovar, Jaipur',
      capacity: 30000,
      manager: 'Ramesh Patel',
      contactPhone: '+91 98290 23456',
      status: 'Active',
      isDefault: false,
      zones: [
        {
          name: 'Zone A - Plastic Seating & Stools',
          code: 'Z-CHAIR',
          description: 'Plastic Chairs, Cushioned Stools & Dining Tables',
          racks: [
            { name: 'Rack 1A - Armless Plastic Chairs Bay', capacity: '3000 pcs', description: 'Commercial event plastic chairs' },
            { name: 'Rack 1B - Velvet VIP Stools Bay', capacity: '1500 pcs', description: 'Cushioned square stools' }
          ]
        },
        {
          name: 'Zone B - Carpets & Stage Drapes',
          code: 'Z-CARPET',
          description: 'VIP Red Carpets, Mandap Fabrics & Backdrop Curtains',
          racks: [
            { name: 'Rack 2A - Red Carpet Roll Storage Racks', capacity: '400 rolls', description: '50ft x 10ft carpet rolls' },
            { name: 'Rack 2B - Satin & Velvet Fabric Racks', capacity: '600 rolls', description: 'Stage backdrop fabrics' }
          ]
        }
      ]
    });

    const w3 = await Warehouse.create({
      name: 'Vaishali Nagar Godown',
      code: 'WH-VAISH',
      address: 'Queens Road, Vaishali Nagar, Jaipur',
      capacity: 25000,
      manager: 'Vikram Singh',
      contactPhone: '+91 98290 34567',
      status: 'Active',
      isDefault: false,
      zones: [
        {
          name: 'Zone A - VIP Lounges & Sofas',
          code: 'Z-VIP',
          description: 'Maharaja Sofas, Velvet Armchairs & VIP Coffee Tables',
          racks: [
            { name: 'Rack 1A - Leatherette Maharaja Sofas', capacity: '150 pcs', description: '2-seater & 3-seater luxury sofas' },
            { name: 'Rack 1B - Gold Carved VIP Chairs', capacity: '200 pcs', description: 'Royal bride/groom chairs' }
          ]
        }
      ]
    });

    const w4 = await Warehouse.create({
      name: 'Sitapura Central Depot',
      code: 'WH-SITA',
      address: 'RIICO Industrial Area, Sitapura, Jaipur',
      capacity: 60000,
      manager: 'Mahesh Meena',
      contactPhone: '+91 98290 45678',
      status: 'Active',
      isDefault: false,
      zones: [
        {
          name: 'Zone Heavy - German Tents & Structural Truss',
          code: 'Z-HEAVY',
          description: 'Heavy Structural Pillars, Stage Rigging & Silent Generators',
          racks: [
            { name: 'Rack 1A - Steel Structural Beams Bay', capacity: '1000 pcs', description: 'Heavy structural pillars' },
            { name: 'Rack 1B - Silent Sound-proof Silent Generators Bay', capacity: '50 pcs', description: '125 KVA Kirloskar Silent DG sets' }
          ]
        }
      ]
    });

    // 4. Staff & Vehicles
    console.log(`Seeding Staff & Vehicles...`);
    const staffList = await Staff.create([
      { staffId: 'STF-001', name: 'Kuldeep Kumawat', phone: '+91 98290 12345', email: 'artifactgeekscompany@gmail.com', role: 'Admin', compensationType: 'monthly', basePay: 50000, totalPaid: 50000, pendingDues: 0, status: 'Active', companyId: company._id, createdBy: adminUser._id },
      { staffId: 'STF-002', name: 'Tanmay Kumawat', phone: '+91 98290 54321', email: 'tanmaymk03@gmail.com', role: 'Admin', compensationType: 'monthly', basePay: 50000, totalPaid: 50000, pendingDues: 0, status: 'Active', companyId: company._id, createdBy: adminUser._id },
      { staffId: 'STF-003', name: 'Rajesh Sharma', phone: '+91 98290 23456', email: 'manager@krishnatent.com', role: 'Manager', compensationType: 'monthly', basePay: 35000, totalPaid: 35000, pendingDues: 0, status: 'Active', companyId: company._id, createdBy: adminUser._id },
      { staffId: 'STF-004', name: 'Suresh Gurjar', phone: '+91 98290 34567', email: 'store@krishnatent.com', role: 'Godown Manager', compensationType: 'monthly', basePay: 30000, totalPaid: 30000, pendingDues: 0, status: 'Active', companyId: company._id, createdBy: adminUser._id },
      { staffId: 'STF-005', name: 'Ramcharan Singh', phone: '+91 98291 11111', email: 'ramcharan@krishnatent.com', role: 'Driver', compensationType: 'monthly', basePay: 18000, totalPaid: 18000, pendingDues: 0, status: 'Active', companyId: company._id, createdBy: adminUser._id },
      { staffId: 'STF-006', name: 'Mukesh Saini', phone: '+91 98291 22222', email: 'mukesh@krishnatent.com', role: 'Driver', compensationType: 'monthly', basePay: 18000, totalPaid: 15000, pendingDues: 3000, status: 'Active', companyId: company._id, createdBy: adminUser._id },
      { staffId: 'STF-007', name: 'Kailash Meena', phone: '+91 98291 33333', email: 'kailash@krishnatent.com', role: 'Event Supervisor', compensationType: 'monthly', basePay: 25000, totalPaid: 20000, pendingDues: 5000, status: 'Active', companyId: company._id, createdBy: adminUser._id },
      { staffId: 'STF-008', name: 'Prakash Sharma', phone: '+91 98291 44444', email: 'prakash@krishnatent.com', role: 'Godown Manager', compensationType: 'monthly', basePay: 30000, totalPaid: 30000, pendingDues: 0, status: 'Active', companyId: company._id, createdBy: adminUser._id },
      { staffId: 'STF-009', name: 'Ramesh Patel', phone: '+91 98291 55555', email: 'ramesh.patel@krishnatent.com', role: 'Godown Manager', compensationType: 'monthly', basePay: 28000, totalPaid: 25000, pendingDues: 3000, status: 'Active', companyId: company._id, createdBy: adminUser._id },
      { staffId: 'STF-010', name: 'Sanjay Verma', phone: '+91 98291 66666', email: 'sanjay.verma@krishnatent.com', role: 'Accountant', compensationType: 'monthly', basePay: 26000, totalPaid: 26000, pendingDues: 0, status: 'Active', companyId: company._id, createdBy: adminUser._id },
      { staffId: 'STF-011', name: 'Bhanwar Lal Gurjar', phone: '+91 98291 77777', email: 'bhanwar@krishnatent.com', role: 'Labour', compensationType: 'daily', basePay: 500, totalPaid: 10000, pendingDues: 2000, status: 'Active', companyId: company._id, createdBy: adminUser._id },
      { staffId: 'STF-012', name: 'Devendra Singh Rathore', phone: '+91 98291 88888', email: 'devendra@krishnatent.com', role: 'Labour', compensationType: 'daily', basePay: 500, totalPaid: 12000, pendingDues: 1000, status: 'Active', companyId: company._id, createdBy: adminUser._id }
    ]);

    const vehicleList = await Vehicle.create([
      { vehicleId: 'VEH-001', name: 'Heavy Eicher Truck 1', plateNumber: 'RJ-14-GA-1234', type: 'Heavy Truck', capacity: '5 Tons', assignedDriverId: staffList[4]._id, status: 'available', companyId: company._id, createdBy: adminUser._id },
      { vehicleId: 'VEH-002', name: 'Tata Ace Pickup 1', plateNumber: 'RJ-14-GC-5678', type: 'Tata Ace', capacity: '1.5 Tons', assignedDriverId: staffList[5]._id, status: 'available', companyId: company._id, createdBy: adminUser._id },
      { vehicleId: 'VEH-003', name: 'Mahindra Bolero Maxi Truck', plateNumber: 'RJ-14-GE-9012', type: 'Bolero', capacity: '2 Tons', assignedDriverId: staffList[6]._id, status: 'available', companyId: company._id, createdBy: adminUser._id }
    ]);

    // 5. Inventory Catalog (Items) with Warehouse Stock Breakup
    console.log(`Seeding Inventory Catalog & Godown Breakdown...`);
    const rawItemsData = [
      { name: 'German Waterproof Tent Panel (10x20 ft)', code: 'ITEM-GER-TENT', category: 'Tents & Structure', unit: 'sq ft', minStockAlert: 500, totalStock: 3000, description: 'Heavy-duty aluminium German waterproof structure' },
      { name: 'Royal Sofa Set (3-Seater Velvet)', code: 'ITEM-SOFA-3S', category: 'Furniture', unit: 'set', minStockAlert: 20, totalStock: 80, description: 'Luxury golden trim velvet 3-seater sofa for stage' },
      { name: 'Golden Maharaja Chair', code: 'ITEM-MAH-CHAIR', category: 'Furniture', unit: 'pc', minStockAlert: 30, totalStock: 150, description: 'Carved golden throne chair for groom & bride' },
      { name: 'Banquet Chair with White Cushion & Cover', code: 'ITEM-BAN-CHAIR', category: 'Furniture', unit: 'pc', minStockAlert: 500, totalStock: 2500, description: 'Steel frame cushioned banquet chair with satin cover' },
      { name: 'Round Dining Table (6 Feet)', code: 'ITEM-TBL-6FT', category: 'Furniture', unit: 'pc', minStockAlert: 50, totalStock: 200, description: 'Round wooden dining table with tablecloth' },
      { name: 'LED Flood Light 200W Warm White', code: 'ITEM-LED-200W', category: 'Lighting', unit: 'pc', minStockAlert: 100, totalStock: 400, description: 'High-intensity IP65 warm LED flood light' },
      { name: 'Crystal Chandelier Jhummar (4 Feet)', code: 'ITEM-JHUMMAR-4F', category: 'Lighting', unit: 'pc', minStockAlert: 10, totalStock: 30, description: 'Decorative crystal chandelier for tent ceiling' },
      { name: 'Red Royal Carpet Heavy GSM', code: 'ITEM-CRPT-RED', category: 'Carpets & Flooring', unit: 'sq ft', minStockAlert: 2000, totalStock: 10000, description: 'Plush red carpet for entrance & aisles' },
      { name: 'JBL VRX Tour Line Array Sound System', code: 'ITEM-JBL-SOUND', category: 'Sound System', unit: 'set', minStockAlert: 2, totalStock: 6, description: 'Complete outdoor line array sound setup with subwoofers' },
      { name: 'P3 Outdoor LED Video Wall (12x8 ft)', code: 'ITEM-LED-WALL', category: 'Audio Visual', unit: 'set', minStockAlert: 2, totalStock: 5, description: 'High resolution P3 LED screen with video processor' },
      { name: 'Buffet Counter Setup (Steel & Glass)', code: 'ITEM-BUFFET-SET', category: 'Catering Equipment', unit: 'counter', minStockAlert: 10, totalStock: 40, description: 'Illuminated glass & stainless steel food counter' },
      { name: 'Stage Flower Arch Frame (Waterdrop Shape)', code: 'ITEM-FLWR-ARCH', category: 'Decoration', unit: 'pc', minStockAlert: 5, totalStock: 15, description: 'Iron arch frame for floral stage entrance' },
      { name: 'Pagoda Canopy Tent (15x15 ft)', code: 'ITEM-PAGODA-15', category: 'Tents & Structure', unit: 'pc', minStockAlert: 20, totalStock: 60, description: 'Peak top white pagoda tent for stalls & VIP entry' },
      { name: 'Halogen Warm Halide Light 1000W', code: 'ITEM-HAL-1000W', category: 'Lighting', unit: 'pc', minStockAlert: 50, totalStock: 200, description: 'Halogen light for lawn perimeter illumination' },
      { name: 'Wooden Stage Platform Module (4x8 ft)', code: 'ITEM-STG-MOD', category: 'Stage & Truss', unit: 'pc', minStockAlert: 40, totalStock: 120, description: 'Heavy plywood stage module with steel legs' }
    ];

    const itemsData = rawItemsData.map(it => {
      const w1Qty = Math.round(it.totalStock * 0.5);
      const w2Qty = Math.round(it.totalStock * 0.25);
      const w3Qty = Math.round(it.totalStock * 0.15);
      const w4Qty = it.totalStock - (w1Qty + w2Qty + w3Qty);
      const dispatched = Math.round(it.totalStock * 0.08);
      const available = it.totalStock - dispatched;

      return {
        ...it,
        availableStock: available,
        dispatchedStock: dispatched,
        damagedStock: 0,
        warehouseStock: [
          { warehouse: w1._id, zoneId: w1.zones[0]._id.toString(), rackId: w1.zones[0].racks[0]._id.toString(), quantity: w1Qty, dispatched: Math.round(dispatched * 0.6), damaged: 0 },
          { warehouse: w2._id, zoneId: w2.zones[0]._id.toString(), rackId: w2.zones[0].racks[0]._id.toString(), quantity: w2Qty, dispatched: Math.round(dispatched * 0.2), damaged: 0 },
          { warehouse: w3._id, zoneId: w3.zones[0]._id.toString(), rackId: w3.zones[0].racks[0]._id.toString(), quantity: w3Qty, dispatched: Math.round(dispatched * 0.1), damaged: 0 },
          { warehouse: w4._id, zoneId: w4.zones[0]._id.toString(), rackId: w4.zones[0].racks[0]._id.toString(), quantity: w4Qty, dispatched: Math.round(dispatched * 0.1), damaged: 0 }
        ]
      };
    });

    const items = await Item.create(itemsData);

    // Initial Stock Ledger Entries for Main Godown
    for (const it of items) {
      await InventoryLedger.create({
        item: it._id,
        warehouse: w1._id,
        type: 'OPENING_STOCK',
        quantity: it.totalStock,
        balanceBefore: 0,
        balanceAfter: it.totalStock,
        reference: 'SYSTEM_INIT',
        remarks: 'Initial godown opening stock entry',
        performedBy: adminUser._id
      });
    }

    // 6. 20 Indian Customers (Retail & Corporate)
    console.log(`Seeding 20 Customers...`);
    const customersData = [
      { name: 'Ramesh Chandra Sharma', type: 'Retail', phone: '+91 98290 99001', email: 'ramesh.sharma@gmail.com', address: 'B-12, Malviya Nagar, Jaipur', isVip: true },
      { name: 'Singhania Wedding & Events Pvt Ltd', type: 'Corporate', companyName: 'Singhania Planners', phone: '+91 98290 99002', email: 'events@singhania.com', address: 'Apex Tower, Tonk Road, Jaipur', creditLimit: 500000, isVip: true },
      { name: 'Apex Corporate Solutions Ltd', type: 'Corporate', companyName: 'Apex Corp', phone: '+91 98290 99003', email: 'info@apexcorp.com', address: 'RIICO Tech Park, Sitapura, Jaipur', creditLimit: 800000, isVip: true },
      { name: 'Sunita Agarwal', type: 'Retail', phone: '+91 98290 99004', email: 'sunita.agarwal@outlook.com', address: 'Plot 45, Vaishali Nagar, Jaipur', isVip: false },
      { name: 'Jaipur Heritage Resort & Club', type: 'Corporate', companyName: 'Heritage Resort', phone: '+91 98290 99005', email: 'bookings@jaipurheritage.com', address: 'Delhi Highway, Kukas, Jaipur', creditLimit: 600000, isVip: true },
      { name: 'Rajesh Verma', type: 'Retail', phone: '+91 98290 99006', email: 'verma.rajesh@yahoo.com', address: 'C-78, Mansarovar, Jaipur', isVip: false },
      { name: 'Royal Rajputana Planners', type: 'Corporate', companyName: 'Rajputana Events', phone: '+91 98290 99007', email: 'admin@rajputanaplanners.in', address: 'M.I. Road, Jaipur', creditLimit: 400000, isVip: true },
      { name: 'Dr. Alok Gupta', type: 'Retail', phone: '+91 98290 99008', email: 'dralok.gupta@hospital.org', address: '72, Raja Park, Jaipur', isVip: true },
      { name: 'Grand Sapphire Events', type: 'Corporate', companyName: 'Grand Sapphire', phone: '+91 98290 99009', email: 'contact@grandsapphire.com', address: 'Civil Lines, Jaipur', creditLimit: 500000, isVip: false },
      { name: 'Vikrant Singh Rathore', type: 'Retail', phone: '+91 98290 99010', email: 'vikrant.rathore@hotmail.com', address: 'Rathore House, C-Scheme, Jaipur', isVip: true },
      { name: 'Sanjay Jain', type: 'Retail', phone: '+91 98290 99011', email: 'sanjay.jain@jainjewellers.in', address: 'Johari Bazaar, Jaipur', isVip: false },
      { name: 'Elite Destination Weddings', type: 'Corporate', companyName: 'Elite Weddings', phone: '+91 98290 99012', email: 'hello@eliteweddings.co', address: 'Ajmer Road, Jaipur', creditLimit: 750000, isVip: true },
      { name: 'Mahendra Singh Shekhawat', type: 'Retail', phone: '+91 98290 99013', email: 'ms.shekhawat@gmail.com', address: 'Bani Park, Jaipur', isVip: false },
      { name: 'Vibrant Rajasthan Expo Society', type: 'Corporate', companyName: 'Vibrant Expo', phone: '+91 98290 99014', email: 'expo@vibrantrajasthan.org', address: 'JECC Exhibition Center, Sitapura', creditLimit: 1000000, isVip: true },
      { name: 'Pooja Khandelwal', type: 'Retail', phone: '+91 98290 99015', email: 'pooja.khandelwal@gmail.com', address: 'Shastri Nagar, Jaipur', isVip: false },
      { name: 'Marriott Convention & Banquets', type: 'Corporate', companyName: 'Marriott Banquets', phone: '+91 98290 99016', email: 'banquets@marriottjaipur.com', address: 'Ashram Marg, Near JLN Marg', creditLimit: 900000, isVip: true },
      { name: 'Anil Kumar Choudhary', type: 'Retail', phone: '+91 98290 99017', email: 'anil.choudhary@gmail.com', address: 'Jagatpura, Jaipur', isVip: false },
      { name: 'Celebration Planners India', type: 'Corporate', companyName: 'Celebrations', phone: '+91 98290 99018', email: 'info@celebrationsindia.in', address: 'Sodala, Jaipur', creditLimit: 350000, isVip: false },
      { name: 'Deepak Mathur', type: 'Retail', phone: '+91 98290 99019', email: 'dmathur@gmail.com', address: 'Vidhyadhar Nagar, Jaipur', isVip: false },
      { name: 'Kishan Gopal Mittal', type: 'Retail', phone: '+91 98290 99020', email: 'kg.mittal@gmail.com', address: 'Adarsh Nagar, Jaipur', isVip: false }
    ];

    const customers = await Customer.create(customersData);

    // 7. CRM Leads & Site Visits
    console.log(`Seeding CRM Leads & Site Visits...`);
    const leads = await Lead.create([
      { leadId: 'LD-2026-001', customerName: customers[0].name, phone: customers[0].phone, email: customers[0].email, eventType: 'Wedding', stage: 'Quotation', notes: 'Daughter wedding tent and sofa requirement', createdBy: adminUser._id },
      { leadId: 'LD-2026-002', customerName: customers[1].name, phone: customers[1].phone, email: customers[1].email, eventType: 'Corporate', stage: 'Contacted', notes: 'German tent 10,000 sq ft for annual meet', createdBy: adminUser._id },
      { leadId: 'LD-2026-003', customerName: customers[4].name, phone: customers[4].phone, email: customers[4].email, eventType: 'Reception', stage: 'New', notes: 'Resort lawn royal setup', createdBy: adminUser._id }
    ]);

    await SiteVisit.create([
      { lead: leads[0]._id, customerName: customers[0].name, phone: customers[0].phone, visitDate: new Date(), venueAddress: 'Rambagh Palace Lawn, Jaipur', status: 'Completed', notes: 'Lawn measurement 120x80 ft complete', createdBy: adminUser._id },
      { lead: leads[1]._id, customerName: customers[1].name, phone: customers[1].phone, visitDate: new Date(), venueAddress: 'JECC Ground Sitapura, Jaipur', status: 'Scheduled', notes: 'Check entry gate height for Eicher truck', createdBy: adminUser._id }
    ]);

    // 8. 20 Quotations & 20 Bookings (including Today's Events)
    console.log(`Seeding 20 Quotations & 20 Bookings...`);
    const venues = [
      'Rambagh Palace Lawns, Jaipur',
      'Taj Jai Mahal Palace, Civil Lines, Jaipur',
      'Marriott Convention Hall, JLN Marg, Jaipur',
      'Chokhi Dhani Resort, Tonk Road, Jaipur',
      'Indana Palace, Kukas, Jaipur',
      'JECC Convention Center, Sitapura, Jaipur',
      'Hotel Clarks Amer, JLN Marg, Jaipur',
      'The Oberoi Rajvilas, Goner Road, Jaipur',
      'Chomu Palace Hotel, Chomu, Jaipur',
      'Samode Palace, Samode, Jaipur'
    ];

    const eventTypes = ['Wedding', 'Reception', 'Corporate', 'Birthday', 'Exhibition'];

    for (let i = 0; i < 20; i++) {
      const cust = customers[i % customers.length];
      const qtnId = `QTN-2026-${String(i + 101).padStart(3, '0')}`;
      const bkId = `BK-2026-${String(i + 101).padStart(3, '0')}`;
      const venue = venues[i % venues.length];
      const eventType = eventTypes[i % eventTypes.length];
      const title = `${cust.name.split(' ')[0]}'s ${eventType} Event`;

      // Set first 2 events to TODAY for Dashboard Today's Events Widget
      const startDate = i < 2 ? new Date() : new Date(Date.now() + (i * 86400000));
      const endDate = new Date(startDate.getTime() + (2 * 86400000));

      // Historical transaction dates across past 6 months for growth charts
      const pastTxDate = new Date();
      pastTxDate.setMonth(pastTxDate.getMonth() - (i % 6));

      // Select 3-4 random items
      const selectedItems = [
        { item: items[0]._id, itemName: items[0].name, itemCode: items[0].code, unit: items[0].unit, quantity: 50 + (i * 10) },
        { item: items[1]._id, itemName: items[1].name, itemCode: items[1].code, unit: items[1].unit, quantity: 2 + (i % 3) },
        { item: items[3]._id, itemName: items[3].name, itemCode: items[3].code, unit: items[3].unit, quantity: 100 + (i * 15) },
        { item: items[7]._id, itemName: items[7].name, itemCode: items[7].code, unit: items[7].unit, quantity: 200 + (i * 20) }
      ];

      const transportCharges = 3000 + (i * 500);
      const labourCharges = 5000 + (i * 800);
      const subtotal = 0;
      const totalBeforeDiscount = transportCharges + labourCharges;
      const discount = 5;
      const discountAmt = (totalBeforeDiscount * discount) / 100;
      const taxable = totalBeforeDiscount - discountAmt;
      const taxRate = 18;
      const taxAmount = Math.round((taxable * taxRate) / 100);
      const grandTotal = taxable + taxAmount;
      const advancePaid = Math.round(grandTotal * 0.4);
      const balanceDue = grandTotal - advancePaid;

      // Create Quotation
      const quotation = await Quotation.create({
        quotationId: qtnId,
        customer: cust._id,
        eventTitle: title,
        eventType,
        eventStartDate: startDate,
        eventEndDate: endDate,
        venueAddress: venue,
        items: selectedItems,
        subtotal,
        transportCharges,
        labourCharges,
        discount,
        taxRate,
        taxAmount,
        grandTotal,
        status: i % 4 === 0 ? 'Approved' : (i % 3 === 0 ? 'Sent' : 'Converted')
      });

      // Create Booking
      const booking = await Booking.create({
        bookingId: bkId,
        quotation: quotation._id,
        customer: cust._id,
        eventTitle: title,
        eventType,
        eventStartDate: startDate,
        eventEndDate: endDate,
        venueAddress: venue,
        items: selectedItems,
        subtotal,
        transportCharges,
        labourCharges,
        discount,
        taxRate,
        taxAmount,
        grandTotal,
        advancePaid,
        balanceDue,
        balanceAmount: balanceDue,
        status: i % 5 === 0 ? 'Completed' : (i % 2 === 0 ? 'Confirmed' : 'InProgress')
      });

      // Create Stock Reservation for Booking
      await Reservation.create({
        bookingId: booking._id,
        customer: cust._id,
        eventStartDate: startDate,
        eventEndDate: endDate,
        status: 'Locked',
        items: selectedItems.map(it => ({ item: it.item, name: it.itemName, code: it.itemCode, requestedQty: it.quantity, lockedQty: it.quantity, isFullyLocked: true })),
        createdBy: adminUser._id
      });

      // Create Payment (Spread across past 6 months for revenue chart)
      await Payment.create({
        bookingId: booking._id,
        customerId: cust._id,
        amount: advancePaid,
        paymentType: 'advance',
        paymentMode: i % 2 === 0 ? 'UPI' : 'Bank Transfer',
        transactionId: `UPI-REF-${Date.now()}-${i}`,
        transactionDate: pastTxDate,
        createdBy: adminUser._id
      });

      // Create Expense (Spread across past 6 months for expense chart)
      await Expense.create({
        category: i % 2 === 0 ? 'Transport' : 'Staff Salary',
        amount: transportCharges,
        paymentMode: 'Cash',
        refModel: 'Booking',
        referenceId: booking._id,
        notes: `Transport & Fuel Charge for ${title}`,
        date: pastTxDate,
        createdBy: adminUser._id
      });

      // Create Invoice
      await Invoice.create({
        invoiceNumber: `INV-2026-${String(i + 101).padStart(3, '0')}`,
        bookingId: booking._id,
        subtotal: totalBeforeDiscount,
        gstRate: taxRate,
        taxAmount,
        totalAmount: grandTotal,
        status: balanceDue === 0 ? 'Paid' : 'Unpaid',
        createdBy: adminUser._id
      });

      // Create Dispatches for Dashboard Widgets (Loading, Delivered, In-Transit)
      if (i < 8) {
        // i = 0, 1 -> Loading (Shows in PENDING DISPATCH)
        // i = 2, 3 -> Delivered (Shows in PENDING RETURNS)
        // i = 4..7 -> In-Transit
        let dispStatus = 'In-Transit';
        let deliveredAtDate = null;

        if (i === 0 || i === 1) {
          dispStatus = 'Loading';
        } else if (i === 2 || i === 3) {
          dispStatus = 'Delivered';
          deliveredAtDate = new Date();
        }

        const dispatch = await Dispatch.create({
          dispatchNumber: `DSP-2026-${String(i + 101).padStart(3, '0')}`,
          bookingId: booking._id,
          warehouseId: w1._id,
          driverName: staffList[i % staffList.length].name,
          driverPhone: staffList[i % staffList.length].phone,
          vehicleNumber: vehicleList[i % vehicleList.length].plateNumber,
          gatePassNumber: `GP-${String(i + 101).padStart(3, '0')}`,
          dispatchedAt: new Date(),
          deliveredAt: deliveredAtDate,
          items: selectedItems.map(it => ({ item: it.item, name: it.itemName, code: it.itemCode, dispatchedQty: it.quantity })),
          status: dispStatus,
          createdBy: adminUser._id
        });

        await EventExecution.create({
          bookingId: booking._id,
          dispatchId: dispatch._id,
          type: 'SiteReceipt',
          status: 'Submitted',
          materialCondition: 'OK',
          remarks: 'Material received on site in good condition',
          supervisorName: 'Kailash Meena',
          createdBy: adminUser._id
        });
      }
    }

    console.log(`\n======================================================`);
    console.log(`  End-to-End Master Data Seeding Completed Successfully!`);
    console.log(`======================================================`);
    console.log(`  Admin Owner Email : artifactgeekscompany@gmail.com`);
    console.log(`  Admin Password    : Admin@123`);
    console.log(`  Godowns (Warehouses): 4 Created`);
    console.log(`  Customers         : 20 Created (Retail & Corporate)`);
    console.log(`  Quotations        : 20 Created`);
    console.log(`  Bookings          : 20 Created (including Today's Events)`);
    console.log(`  Inventory Items   : 15 Created with Godown Breakdown`);
    console.log(`  Dispatches        : 8 Created (Loading, Delivered, In-Transit)`);
    console.log(`  Finance Charts    : 6-Month Historical Revenue & Expenses`);
    console.log(`======================================================\n`);

    process.exit(0);
  } catch (err) {
    console.error(`Error during data seeding:`, err);
    process.exit(1);
  }
};

seedDB();
