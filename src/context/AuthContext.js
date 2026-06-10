import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkSavedSession();
  }, []);

  const checkSavedSession = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('currentUser');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking saved session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    // Simple login for web testing - accepts any credentials
    if (username && password) {
      const userData = {
        id: '1',
        username: username,
        fullName: username === 'admin' ? 'Admin User' : username,
        role: username === 'admin' ? 'admin' : 'cashier',
        phone: '0700000000',
        permissions: username === 'admin' ? ['all'] : ['view_inventory', 'process_sale'],
      };
      
      await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    }
    
    return { success: false, error: 'Please enter username and password' };
  };

  const loginWithPin = async (username, pin) => {
    if (username && pin && pin.length === 4) {
      const userData = {
        id: '1',
        username: username,
        fullName: username === 'admin' ? 'Admin User' : username,
        role: username === 'admin' ? 'admin' : 'cashier',
        phone: '0700000000',
        permissions: username === 'admin' ? ['all'] : ['view_inventory', 'process_sale'],
      };
      
      await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    }
    
    return { success: false, error: 'Invalid PIN' };
  };

  const logout = async () => {
    await AsyncStorage.removeItem('currentUser');
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    return user.permissions.includes('all') || user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated,
      login,
      loginWithPin,
      logout,
      hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
