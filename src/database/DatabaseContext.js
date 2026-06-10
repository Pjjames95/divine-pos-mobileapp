import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DatabaseContext = createContext(null);

// Simple storage-based database for web testing
class SimpleDB {
  constructor() {
    this.ready = false;
  }

  async init() {
    this.ready = true;
    console.log('Database initialized for web');
  }

  async getProducts(filters = {}) {
    // Return sample products for testing
    return [
      { id: '1', name: 'Matte Lipstick - Ruby Red', brand: 'MAC Cosmetics', barcode: '1001', category: 'Makeup', price: 2500, quantity: 50, min_stock_level: 10 },
      { id: '2', name: 'Hydrating Face Cream', brand: 'Nivea', barcode: '1002', category: 'Skincare', price: 1200, quantity: 100, min_stock_level: 15 },
      { id: '3', name: 'Argan Oil Hair Treatment', brand: 'Garnier', barcode: '1003', category: 'Hair Care', price: 1800, quantity: 75, min_stock_level: 10 },
      { id: '4', name: 'Gel Nail Polish Set', brand: 'NYX', barcode: '1004', category: 'Nails', price: 3500, quantity: 30, min_stock_level: 5 },
      { id: '5', name: 'Rose Garden Perfume', brand: 'Revlon', barcode: '1005', category: 'Fragrances', price: 4500, quantity: 40, min_stock_level: 8 },
      { id: '6', name: 'Shea Butter Body Lotion', brand: 'Dove', barcode: '1006', category: 'Bath & Body', price: 950, quantity: 120, min_stock_level: 20 },
      { id: '7', name: 'Makeup Brush Set', brand: 'Maybelline', barcode: '1007', category: 'Tools', price: 2800, quantity: 25, min_stock_level: 5 },
      { id: '8', name: 'Vitamin C Serum', brand: 'Olay', barcode: '1008', category: 'Skincare', price: 3200, quantity: 45, min_stock_level: 8 },
    ];
  }

  async getSettings() {
    return { shop_name: 'Divine Beauty & Cosmetics Shop', mpesa_api_url: 'https://divine-pos-backend.onrender.com' };
  }

  async updateSetting(key, value) {
    console.log('Setting updated:', key, value);
  }
}

export const DatabaseProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const database = new SimpleDB();
    database.init().then(() => {
      setDb(database);
      setIsReady(true);
    });
  }, []);

  return (
    <DatabaseContext.Provider value={{ ...db, isReady }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => useContext(DatabaseContext);
