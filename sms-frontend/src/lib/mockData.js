// Seed data for the Stock Management System frontend demo.
// In production this would come from the backend REST API.

export const ROLES = [
  "Administrator",
  "Property Administration Officer",
  "Store Head",
  "Stock Clerk",
  "Technical Evaluation Committee",
  "Property Registration Officer",
  "Department Head",
  "Accountant",
  "Disposal Committee",
  "Campus Security Officer",
];

export const DEMO_USERS = [
  {
    id: "u1",
    name: "Abel Tesfaye",
    role: "Administrator",
    email: "abel.admin@org.et",
  },
  {
    id: "u2",
    name: "Meron Alemu",
    role: "Property Administration Officer",
    email: "meron.pao@org.et",
  },
  {
    id: "u3",
    name: "Dawit Bekele",
    role: "Store Head",
    email: "dawit.store@org.et",
  },
  {
    id: "u4",
    name: "Sara Getachew",
    role: "Stock Clerk",
    email: "sara.clerk@org.et",
  },
  {
    id: "u5",
    name: "Yonas Kebede",
    role: "Technical Evaluation Committee",
    email: "yonas.tec@org.et",
  },
  {
    id: "u6",
    name: "Hana Girma",
    role: "Property Registration Officer",
    email: "hana.registration@org.et",
  },
  {
    id: "u7",
    name: "Tewodros Fikru",
    role: "Department Head",
    email: "tewodros.dept@org.et",
  },
  {
    id: "u8",
    name: "Selam Mulu",
    role: "Accountant",
    email: "selam.acct@org.et",
  },
  {
    id: "u9",
    name: "Disposal Committee Board",
    role: "Disposal Committee",
    email: "disposal.committee@org.et",
  },
  {
    id: "u10",
    name: "Girum Assefa",
    role: "Campus Security Officer",
    email: "girum.security@org.et",
  },
];

export const STORES = [
  {
    id: "st1",
    code: "MS-01",
    name: "Main Store",
    type: "Main Store",
    head: "Dawit Bekele",
  },
  {
    id: "st2",
    code: "DS-01",
    name: "IT Department Store",
    type: "Department Store",
    head: "Sara Getachew",
  },
  {
    id: "st3",
    code: "DS-02",
    name: "Facilities Department Store",
    type: "Department Store",
    head: "Sara Getachew",
  },
  {
    id: "st4",
    code: "CS-01",
    name: "Cafeteria Store",
    type: "Cafeteria Store",
    head: "Dawit Bekele",
  },
];

export const CATEGORIES = [
  {
    id: "c1",
    code: "CAT-ELEC",
    name: "Electronics & IT Equipment",
    storeId: "st2",
  },
  { id: "c2", code: "CAT-STAT", name: "Office Stationery", storeId: "st1" },
  { id: "c3", code: "CAT-FURN", name: "Furniture", storeId: "st1" },
  { id: "c4", code: "CAT-MAINT", name: "Maintenance Supplies", storeId: "st3" },
  { id: "c5", code: "CAT-FOOD", name: "Cafeteria Consumables", storeId: "st4" },
];

export const SUPPLIERS = [
  {
    id: "sup1",
    name: "Addis Office Supplies PLC",
    contact: "Fikadu Wolde",
    phone: "+251 911 223344",
    email: "sales@addisoffice.et",
    status: "Active",
  },
  {
    id: "sup2",
    name: "Horizon IT Solutions",
    contact: "Betelhem Assefa",
    phone: "+251 922 334455",
    email: "info@horizonit.et",
    status: "Active",
  },
  {
    id: "sup3",
    name: "Nile Furniture Manufacturing",
    contact: "Samuel Tadesse",
    phone: "+251 933 445566",
    email: "orders@nilefurniture.et",
    status: "Active",
  },
  {
    id: "sup4",
    name: "Blue Nile Facility Supplies",
    contact: "Ruth Haile",
    phone: "+251 944 556677",
    email: "contact@bluenile-fs.et",
    status: "Inactive",
  },
];

export const ITEMS = [
  {
    id: "it1",
    code: "ITM-0001",
    name: "Dell Latitude 5440 Laptop",
    categoryId: "c1",
    unit: "Piece",
    type: "Fixed Asset",
    reorderLevel: 5,
    qty: 12,
    unitCost: 68000,
  },
  {
    id: "it2",
    code: "ITM-0002",
    name: "HP LaserJet Toner Cartridge",
    categoryId: "c2",
    unit: "Piece",
    type: "Consumable",
    reorderLevel: 10,
    qty: 6,
    unitCost: 3200,
  },
  {
    id: "it3",
    code: "ITM-0003",
    name: "Ergonomic Office Chair",
    categoryId: "c3",
    unit: "Piece",
    type: "Fixed Asset",
    reorderLevel: 3,
    qty: 8,
    unitCost: 9500,
  },
  {
    id: "it4",
    code: "ITM-0004",
    name: "A4 Photocopy Paper (Ream)",
    categoryId: "c2",
    unit: "Ream",
    type: "Consumable",
    reorderLevel: 50,
    qty: 34,
    unitCost: 380,
  },
  {
    id: "it5",
    code: "ITM-0005",
    name: "Network Switch 24-Port",
    categoryId: "c1",
    unit: "Piece",
    type: "Fixed Asset",
    reorderLevel: 2,
    qty: 3,
    unitCost: 21000,
  },
  {
    id: "it6",
    code: "ITM-0006",
    name: "Cleaning Detergent 5L",
    categoryId: "c4",
    unit: "Bottle",
    type: "Consumable",
    reorderLevel: 15,
    qty: 9,
    unitCost: 450,
  },
  {
    id: "it7",
    code: "ITM-0007",
    name: "Bottled Drinking Water (Carton)",
    categoryId: "c5",
    unit: "Carton",
    type: "Consumable",
    reorderLevel: 20,
    qty: 18,
    unitCost: 600,
  },
];

export const ITEM_LOCATIONS = [
  {
    id: "loc1",
    itemId: "it1",
    storeId: "st2",
    bin: "BIN-A1",
    updatedAt: "2026-07-20",
  },
  {
    id: "loc2",
    itemId: "it2",
    storeId: "st1",
    bin: "BIN-C3",
    updatedAt: "2026-07-18",
  },
  {
    id: "loc3",
    itemId: "it3",
    storeId: "st1",
    bin: "BIN-B2",
    updatedAt: "2026-07-15",
  },
  {
    id: "loc4",
    itemId: "it4",
    storeId: "st1",
    bin: "BIN-C1",
    updatedAt: "2026-08-01",
  },
  {
    id: "loc5",
    itemId: "it5",
    storeId: "st2",
    bin: "BIN-A2",
    updatedAt: "2026-07-28",
  },
];

export const GOODS_RECEIPTS = [
  {
    id: "gr1",
    refNo: "GR-2026-014",
    supplierId: "sup2",
    storeId: "st2",
    itemId: "it1",
    qty: 5,
    poReference: "PO-2026-0091",
    status: "Awaiting Evaluation",
    evaluation: null,
    grnNo: null,
    date: "2026-08-10",
  },
  {
    id: "gr2",
    refNo: "GR-2026-013",
    supplierId: "sup3",
    storeId: "st1",
    itemId: "it3",
    qty: 4,
    poReference: "PO-2026-0088",
    status: "Approved",
    evaluation: {
      by: "Yonas Kebede",
      decision: "Approved",
      remarks: "Matches specification and PO quantity.",
      date: "2026-08-08",
    },
    grnNo: null,
    date: "2026-08-07",
  },
  {
    id: "gr3",
    refNo: "GR-2026-012",
    supplierId: "sup1",
    storeId: "st1",
    itemId: "it4",
    qty: 40,
    poReference: "PO-2026-0083",
    status: "GRN Generated",
    evaluation: {
      by: "Yonas Kebede",
      decision: "Approved",
      remarks: "Verified against PO; quality acceptable.",
      date: "2026-08-02",
    },
    grnNo: "GRN-2026-0041",
    date: "2026-08-01",
  },
  {
    id: "gr4",
    refNo: "GR-2026-011",
    supplierId: "sup4",
    storeId: "st3",
    itemId: "it6",
    qty: 20,
    poReference: "PO-2026-0079",
    status: "Rejected",
    evaluation: {
      by: "Yonas Kebede",
      decision: "Rejected",
      remarks: "Packaging damaged; does not meet acceptance criteria.",
      date: "2026-07-30",
    },
    grnNo: null,
    date: "2026-07-29",
  },
];

// Stock card transactions per item (auto-maintained by the system in the real product)
export const STOCK_TRANSACTIONS = [
  {
    id: "tx1",
    itemId: "it4",
    type: "Receipt",
    qty: 40,
    balance: 34,
    ref: "GRN-2026-0041",
    date: "2026-08-01",
  },
  {
    id: "tx2",
    itemId: "it4",
    type: "Issue",
    qty: -6,
    balance: 34,
    ref: "SIV-2026-0102",
    date: "2026-08-05",
  },
  {
    id: "tx3",
    itemId: "it1",
    type: "Receipt",
    qty: 12,
    balance: 12,
    ref: "GRN-2026-0035",
    date: "2026-07-20",
  },
  {
    id: "tx4",
    itemId: "it2",
    type: "Receipt",
    qty: 10,
    balance: 10,
    ref: "GRN-2026-0030",
    date: "2026-07-10",
  },
  {
    id: "tx5",
    itemId: "it2",
    type: "Issue",
    qty: -4,
    balance: 6,
    ref: "SIV-2026-0095",
    date: "2026-07-22",
  },
  {
    id: "tx6",
    itemId: "it3",
    type: "Receipt",
    qty: 8,
    balance: 8,
    ref: "GRN-2026-0028",
    date: "2026-07-05",
  },
];

// Bin cards per store/bin
export const BIN_CARDS = [
  {
    id: "bc1",
    storeId: "st1",
    bin: "BIN-C1",
    itemId: "it4",
    transactions: [
      {
        id: "bt1",
        direction: "Inbound",
        ref: "GRN-2026-0041",
        qty: 40,
        balance: 40,
        date: "2026-08-01",
      },
      {
        id: "bt2",
        direction: "Outbound",
        ref: "SIV-2026-0102",
        qty: -6,
        balance: 34,
        date: "2026-08-05",
      },
    ],
  },
  {
    id: "bc2",
    storeId: "st2",
    bin: "BIN-A1",
    itemId: "it1",
    transactions: [
      {
        id: "bt3",
        direction: "Inbound",
        ref: "GRN-2026-0035",
        qty: 12,
        balance: 12,
        date: "2026-07-20",
      },
    ],
  },
];

export const REQUISITIONS = [
  {
    id: "req1",
    refNo: "SR-2026-0210",
    department: "IT Department",
    requestedBy: "Tewodros Fikru",
    itemId: "it1",
    qty: 2,
    status: "Pending Approval",
    date: "2026-08-12",
  },
  {
    id: "req2",
    refNo: "SR-2026-0209",
    department: "Facilities",
    requestedBy: "Tewodros Fikru",
    itemId: "it6",
    qty: 5,
    status: "Approved",
    date: "2026-08-09",
  },
  {
    id: "req3",
    refNo: "SR-2026-0208",
    department: "Administration",
    requestedBy: "Meron Alemu",
    itemId: "it4",
    qty: 6,
    status: "Issued",
    date: "2026-08-04",
  },
];

export const ISSUE_VOUCHERS = [
  {
    id: "iv1",
    refNo: "SIV-2026-0103",
    requisitionRef: "SR-2026-0209",
    model: "Model 20 (Preliminary)",
    itemId: "it6",
    qty: 5,
    status: "Preliminary",
    date: "2026-08-09",
  },
  {
    id: "iv2",
    refNo: "SIV-2026-0102",
    requisitionRef: "SR-2026-0208",
    model: "Model 22 (Final)",
    itemId: "it4",
    qty: 6,
    status: "Issued",
    date: "2026-08-05",
  },
];

export const FIXED_ASSETS = [
  {
    id: "fa1",
    tag: "FA-2026-0044",
    itemId: "it1",
    custodian: "Tewodros Fikru",
    department: "IT Department",
    acquisitionDate: "2026-07-20",
    value: 68000,
    status: "In Use",
  },
  {
    id: "fa2",
    tag: "FA-2026-0043",
    itemId: "it3",
    custodian: "Meron Alemu",
    department: "Administration",
    acquisitionDate: "2026-07-08",
    value: 9500,
    status: "In Use",
  },
  {
    id: "fa3",
    tag: "FA-2026-0042",
    itemId: "it5",
    custodian: "Sara Getachew",
    department: "IT Department",
    acquisitionDate: "2026-06-15",
    value: 21000,
    status: "In Use",
  },
];

export const RETURNS = [
  {
    id: "rt1",
    refNo: "SRN-2026-0031",
    itemId: "it3",
    qty: 1,
    returnedBy: "Tewodros Fikru",
    reason: "Chair mechanism faulty",
    status: "Pending Technical Evaluation",
    condition: null,
    date: "2026-08-11",
  },
  {
    id: "rt2",
    refNo: "SRN-2026-0030",
    itemId: "it2",
    qty: 2,
    returnedBy: "Selam Mulu",
    reason: "Wrong toner model issued",
    status: "Approved",
    condition: "Serviceable",
    date: "2026-08-03",
  },
];

export const TRANSFERS = [
  {
    id: "tr1",
    refNo: "MT-2026-0018",
    itemId: "it2",
    qty: 3,
    fromStoreId: "st1",
    toStoreId: "st2",
    status: "Pending Approval",
    date: "2026-08-13",
  },
  {
    id: "tr2",
    refNo: "MT-2026-0017",
    itemId: "it6",
    qty: 5,
    fromStoreId: "st1",
    toStoreId: "st3",
    status: "Approved",
    date: "2026-08-06",
  },
];

export const DISPOSALS = [
  {
    id: "dp1",
    refNo: "DR-2026-0009",
    itemId: "it6",
    qty: 20,
    reason: "Damaged packaging on receipt inspection",
    status: "Pending Disposal",
    method: null,
    date: "2026-07-30",
  },
  {
    id: "dp2",
    refNo: "DR-2026-0008",
    itemId: "it3",
    qty: 1,
    reason: "Beyond economical repair",
    status: "Approved",
    method: "Auction",
    date: "2026-07-25",
  },
];

export const AUDIT_LOGS = [
  {
    id: "al1",
    user: "Hana Girma",
    action: "Generated GRN-2026-0041",
    module: "Goods Receipt",
    timestamp: "2026-08-01 09:14",
  },
  {
    id: "al2",
    user: "Yonas Kebede",
    action: "Rejected GR-2026-011 (damaged packaging)",
    module: "Technical Evaluation",
    timestamp: "2026-07-30 11:02",
  },
  {
    id: "al3",
    user: "Meron Alemu",
    action: "Approved SR-2026-0209",
    module: "Requisition",
    timestamp: "2026-08-09 14:20",
  },
  {
    id: "al4",
    user: "Dawit Bekele",
    action: "Issued SIV-2026-0102 (Model 22)",
    module: "Issuing",
    timestamp: "2026-08-05 10:45",
  },
  {
    id: "al5",
    user: "Disposal Committee Board",
    action: "Approved disposal DR-2026-0008 via Auction",
    module: "Disposal",
    timestamp: "2026-07-25 16:30",
  },
  {
    id: "al6",
    user: "Abel Tesfaye",
    action: "Deactivated supplier Blue Nile Facility Supplies",
    module: "Suppliers",
    timestamp: "2026-07-22 08:55",
  },
];

export function nextId(prefix) {
  return `${prefix}-${Date.now().toString(36)}`;
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
