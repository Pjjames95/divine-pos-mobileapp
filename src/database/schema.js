// src/database/schema.js
/**
 * Database schema and initialization for Beauty Shop POS
 * Using SQLite for complete offline functionality
 */

export const DB_NAME = 'beauty_shop_pos.db';

export const CREATE_TABLES = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    pin_hash TEXT,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'cashier',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT
  )`,

  // Categories table
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )`,

  // Brands table
  `CREATE TABLE IF NOT EXISTS brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )`,

  // Products table
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    sku TEXT UNIQUE,
    barcode TEXT UNIQUE,
    description TEXT,
    category TEXT,
    subcategory TEXT,
    price REAL NOT NULL,
    cost_price REAL,
    quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    unit TEXT DEFAULT 'piece',
    size TEXT,
    color TEXT,
    ingredients TEXT,
    expiry_date TEXT,
    is_featured INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 0,
    is_sale INTEGER DEFAULT 0,
    sale_price REAL,
    image_url TEXT,
    supplier TEXT,
    notes TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,

  // Sales table
  `CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    receipt_number TEXT UNIQUE,
    total_amount REAL NOT NULL,
    discount_amount REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    payment_method TEXT NOT NULL,
    payment_status TEXT DEFAULT 'completed',
    mpesa_checkout_request_id TEXT,
    mpesa_receipt_number TEXT,
    cash_tendered REAL,
    change_amount REAL,
    cashier_id TEXT,
    customer_id TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    notes TEXT,
    is_void INTEGER DEFAULT 0,
    void_reason TEXT,
    voided_at TEXT,
    voided_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (cashier_id) REFERENCES users(id)
  )`,

  // Sale items table
  `CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_brand TEXT,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    discount REAL DEFAULT 0,
    total_price REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`,

  // Stock movements table
  `CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    movement_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    reference TEXT,
    notes TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`,

  // M-Pesa transactions table
  `CREATE TABLE IF NOT EXISTS mpesa_transactions (
    id TEXT PRIMARY KEY,
    sale_id TEXT,
    checkout_request_id TEXT UNIQUE,
    phone_number TEXT,
    amount REAL,
    status TEXT DEFAULT 'pending',
    receipt_number TEXT,
    result_description TEXT,
    initiated_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    synced INTEGER DEFAULT 0,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
  )`,

  // Settings table
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  )`,

  // Customers table
  `CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    birthdate TEXT,
    skin_type TEXT,
    preferences TEXT,
    notes TEXT,
    total_purchases REAL DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    last_visit TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,

  // Create indexes for performance
  `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`,
  `CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand)`,
  `CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`,
  `CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id)`,
];

// Sample data for beauty shop
export const SAMPLE_CATEGORIES = [
  { id: 'cat1', name: '💄 Makeup', description: 'Cosmetics and makeup products', icon: '💄', color: '#FF69B4' },
  { id: 'cat2', name: '💆 Skincare', description: 'Skin care products', icon: '💆', color: '#87CEEB' },
  { id: 'cat3', name: '💇 Hair Care', description: 'Hair care and styling', icon: '💇', color: '#DDA0DD' },
  { id: 'cat4', name: '💅 Nails', description: 'Nail care and polish', icon: '💅', color: '#FFB6C1' },
  { id: 'cat5', name: '🧴 Fragrances', description: 'Perfumes and sprays', icon: '🧴', color: '#FFD700' },
  { id: 'cat6', name: '🛁 Bath & Body', description: 'Bath and body care', icon: '🛁', color: '#98FB98' },
  { id: 'cat7', name: '✨ Tools', description: 'Beauty tools and accessories', icon: '✨', color: '#C0C0C0' },
];

export const SAMPLE_PRODUCTS = [
  {
    name: 'Matte Lipstick - Ruby Red',
    brand: 'MAC Cosmetics',
    barcode: '1000000001',
    category: '💄 Makeup',
    price: 2500,
    cost_price: 1800,
    quantity: 50,
    min_stock_level: 10,
    color: 'Ruby Red',
    is_featured: 1,
  },
  {
    name: 'Hydrating Face Cream',
    brand: 'Nivea',
    barcode: '1000000002',
    category: '💆 Skincare',
    price: 1200,
    cost_price: 800,
    quantity: 100,
    min_stock_level: 15,
  },
  {
    name: 'Argan Oil Hair Treatment',
    brand: 'Garnier',
    barcode: '1000000003',
    category: '💇 Hair Care',
    price: 1800,
    cost_price: 1200,
    quantity: 75,
    min_stock_level: 10,
  },
  {
    name: 'Gel Nail Polish Set',
    brand: 'NYX Professional',
    barcode: '1000000004',
    category: '💅 Nails',
    price: 3500,
    cost_price: 2500,
    quantity: 30,
    min_stock_level: 5,
  },
  {
    name: 'Rose Garden Perfume',
    brand: 'Revlon',
    barcode: '1000000005',
    category: '🧴 Fragrances',
    price: 4500,
    cost_price: 3200,
    quantity: 40,
    min_stock_level: 8,
  },
  {
    name: 'Shea Butter Body Lotion',
    brand: 'Dove',
    barcode: '1000000006',
    category: '🛁 Bath & Body',
    price: 950,
    cost_price: 650,
    quantity: 120,
    min_stock_level: 20,
  },
  {
    name: 'Makeup Brush Set',
    brand: 'Maybelline',
    barcode: '1000000007',
    category: '✨ Tools',
    price: 2800,
    cost_price: 2000,
    quantity: 25,
    min_stock_level: 5,
  },
  {
    name: 'Vitamin C Serum',
    brand: 'Olay',
    barcode: '1000000008',
    category: '💆 Skincare',
    price: 3200,
    cost_price: 2200,
    quantity: 45,
    min_stock_level: 8,
    is_new: 1,
  },
  {
    name: 'Waterproof Mascara',
    brand: "L'Oreal",
    barcode: '1000000009',
    category: '💄 Makeup',
    price: 1500,
    cost_price: 1000,
    quantity: 80,
    min_stock_level: 15,
    is_sale: 1,
    sale_price: 1200,
  },
  {
    name: 'Coconut Shampoo',
    brand: 'Garnier',
    barcode: '1000000010',
    category: '💇 Hair Care',
    price: 850,
    cost_price: 550,
    quantity: 90,
    min_stock_level: 15,
  },
];

export const DEFAULT_SETTINGS = [
  { key: 'shop_name', value: 'Divine Cosmetics & Beauty Shop', description: 'Shop name' },
  { key: 'shop_address', value: 'Nairobi Stage, Embu Town', description: 'Shop address' },
  { key: 'shop_phone', value: '+254 700 000000', description: 'Shop phone number' },
  { key: 'shop_email', value: 'info@divinebeauty.com', description: 'Shop email' },
  { key: 'currency', value: 'KES', description: 'Currency' },
  { key: 'tax_rate', value: '16', description: 'Tax rate percentage' },
  { key: 'receipt_prefix', value: 'GBS', description: 'Receipt number prefix' },
  { key: 'mpesa_api_url', value: 'https://divine-pos-backend.onrender.com', description: 'M-Pesa API URL' },
  { key: 'low_stock_alert', value: '5', description: 'Low stock alert threshold' },
  { key: 'theme_color', value: '#FF69B4', description: 'App theme color' },
];