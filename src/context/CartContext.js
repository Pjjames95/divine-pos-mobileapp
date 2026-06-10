import React, { createContext, useContext, useState, useCallback } from 'react';
import { Alert } from 'react-native';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = useCallback((product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        if (existingItem.quantity >= product.quantity) {
          Alert.alert('Stock Limit', `Only ${product.quantity} units available`);
          return prevItems;
        }
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      if (product.quantity <= 0) {
        Alert.alert('Out of Stock', 'This product is currently out of stock');
        return prevItems;
      }
      
      return [...prevItems, {
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        quantity: 1,
        maxQuantity: product.quantity,
        category: product.category,
      }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, newQuantity) => {
    setCartItems(prevItems => {
      if (newQuantity <= 0) {
        return prevItems.filter(item => item.id !== productId);
      }
      return prevItems.map(item => {
        if (item.id === productId) {
          if (newQuantity > item.maxQuantity) {
            Alert.alert('Stock Limit', `Maximum available quantity is ${item.maxQuantity}`);
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);

  const getItemCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotal,
      getItemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
