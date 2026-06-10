import React, { useState, useEffect, useCallback } from 'react';
import { mpesaService } from './src/services/mpesaService';

import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, SafeAreaView, StatusBar, Modal,
  FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';

const API_URL = 'https://divine-pos-backend.onrender.com';

const COLORS = {
  primary: '#E91E63', secondary: '#F48FB1', success: '#388E3C',
  warning: '#F57C00', error: '#D32F2F', background: '#FCE4EC',
  surface: '#FFFFFF', text: '#212121', textLight: '#616161',
  textWhite: '#FFFFFF', border: '#F8BBD0',
};

const CATEGORIES = ['All','Makeup','Skincare','Hair Care','Nails','Fragrances','Bath & Body','Tools'];



export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);  // Start empty, load from server
  const [screen, setScreen] = useState('shop');
  const [salesHistory, setSalesHistory] = useState([]);
  const [serverConnected, setServerConnected] = useState(false);


  //load products from server
  const loadProductsFromServer = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          // REPLACE all products with server data
          setProducts(data);
          setServerConnected(true);
          console.log(`✅ Loaded ${data.length} products from server`);
          return data;
        }
      }
      setServerConnected(false);
    } catch (error) {
      console.log('❌ Server not reachable:', error.message);
      setServerConnected(false);
    }
    return null;
  };

  // Load products on login and screen changes
  useEffect(() => {
    if (isLoggedIn) {
      loadProductsFromServer();
    }
  }, [isLoggedIn, screen]);

  // Cart functions
  const addToCart = (product) => {
    if (product.quantity <= 0) { Alert.alert('Out of Stock'); return; }
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.quantity) { Alert.alert('Stock Limit'); return prev; }
        return prev.map(i => i.id === product.id ? {...i, qty: i.qty+1} : i);
      }
      return [...prev, {...product, qty: 1}];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newQty = i.qty + delta;
      if (newQty <= 0) return null;
      if (newQty > i.quantity) { Alert.alert('Stock Limit'); return i; }
      return {...i, qty: newQty};
    }).filter(Boolean));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setCart([]);
  const cartTotal = cart.reduce((t,i) => t + (i.price * i.qty), 0);
  const cartCount = cart.reduce((t,i) => t + i.qty, 0);

  // Handle login
  const handleLogin = (userData) => {
    setCurrentUser({ ...userData, loginTime: Date.now() });
    setIsLoggedIn(true);
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCart([]);
    setScreen('login');
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const quickActions = [
    { label: 'Reports', screen: 'reports', icon: '📊' },
    { label: 'Inventory', screen: 'inventory', icon: '📦' },
    { label: 'Settings', screen: 'settings', icon: '⚙️' },
  ];
  if (currentUser?.role === 'admin') quickActions.push({ label: 'Users', screen: 'users', icon: '👥' });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {screen === 'shop' && (
        <ShopScreen
          products={products} cart={cart} addToCart={addToCart}
          cartCount={cartCount} setScreen={setScreen} currentUser={currentUser}
          loadProductsFromServer={loadProductsFromServer}
          serverConnected={serverConnected}
        />
      )}
      
      {screen === 'cart' && (
        <CartScreen
          cart={cart} updateCartQty={updateCartQty} removeFromCart={removeFromCart}
          clearCart={clearCart} cartTotal={cartTotal} cartCount={cartCount}
          setScreen={setScreen} currentUser={currentUser} setProducts={setProducts}
          setSalesHistory={setSalesHistory}
        />
      )}
      
      {screen === 'reports' && <ReportsScreen setScreen={setScreen} />}
      {screen === 'inventory' && <InventoryScreen products={products} setProducts={setProducts} setScreen={setScreen} currentUser={currentUser} loadProductsFromServer={loadProductsFromServer} />}
      {screen === 'settings' && <SettingsScreen setScreen={setScreen} />}
      {screen === 'users' && <UsersScreen setScreen={setScreen} currentUser={currentUser} />}
      
      {/* Bottom Nav - Show all actions */}
      <View style={styles.bottomNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottomNavScroll}>
          <TouchableOpacity style={styles.navBtn} onPress={() => setScreen('shop')}>
            <Text style={styles.navText}>🏠 Shop</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => setScreen('cart')}>
            <Text style={styles.navText}>🛒 Cart ({cartCount})</Text>
          </TouchableOpacity>
          {quickActions.map(a => (
            <TouchableOpacity key={a.screen} style={styles.navBtn} onPress={() => setScreen(a.screen)}>
              <Text style={styles.navText}>{a.icon} {a.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.navBtn} onPress={() => {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: handleLogout }
            ]);
          }}>
            <Text style={[styles.navText, {color: COLORS.error}]}>🚪 Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
// ==================== LOGIN SCREEN ====================
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleLogin = () => {
    if (!username) { Alert.alert('Error','Enter username'); return; }
    if (showPin) {
      if (pin.length !== 4) { Alert.alert('Error','PIN must be 4 digits'); return; }
    } else {
      if (!password) { Alert.alert('Error','Enter password'); return; }
    }
      onLogin({ id:'1', username, fullName: username==='admin'?'Admin':username, role: username==='admin'?'admin':'cashier' });
  };

  return (
    <View style={styles.loginContainer}>
      <Text style={styles.logo}>💄</Text>
      <Text style={styles.shopName}>Divine Beauty & Cosmetics Shop</Text>
      <Text style={styles.subtitle}>POS System</Text>
      
      <View style={styles.toggleRow}>
        <TouchableOpacity style={[styles.toggleBtn, !showPin&&styles.toggleActive]} onPress={()=>setShowPin(false)}><Text style={[styles.toggleText,!showPin&&styles.toggleTextActive]}>Password</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, showPin&&styles.toggleActive]} onPress={()=>setShowPin(true)}><Text style={[styles.toggleText,showPin&&styles.toggleTextActive]}>PIN</Text></TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
      
      {showPin ? (
        <TextInput style={styles.input} placeholder="4-digit PIN" value={pin} onChangeText={t=>setPin(t.replace(/[^0-9]/g,'').slice(0,4))} keyboardType="numeric" maxLength={4} secureTextEntry />
      ) : (
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      )}
      
      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}><Text style={styles.loginBtnText}>Sign In</Text></TouchableOpacity>
      <Text style={styles.hint}>Hello Beauty Shop</Text>
    </View>
  );
}

// ==================== SHOP SCREEN ====================
function ShopScreen({ products, cart, addToCart, cartCount, setScreen, currentUser, loadProductsFromServer, serverConnected }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    if (loadProductsFromServer) {
      await loadProductsFromServer();
    }
    setRefreshing(false);
  };

  const filtered = products.filter(p => {
    if (category !== 'All' && p.category !== category) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brand?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Divine Beauty & Cosmetics Shop</Text>
        <View style={{flexDirection:'row', gap:10, alignItems:'center'}}>
          <View style={[styles.statusDot, {backgroundColor: serverConnected ? COLORS.success : COLORS.error}]} />
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.cartIcon}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setScreen('cart')}>
            <Text style={styles.cartIcon}>🛒 {cartCount}</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} style={[styles.catBtn, category===c&&styles.catBtnActive]} onPress={()=>setCategory(c)}>
            <Text style={[styles.catText, category===c&&styles.catTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TextInput style={styles.searchInput} placeholder="Search products..." value={search} onChangeText={setSearch} />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.productCard} onPress={() => addToCart(item)}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.productBrand}>{item.brand}</Text>
            <Text style={styles.productPrice}>KES {item.price.toLocaleString()}</Text>
            <Text style={[styles.stockText, {color: item.quantity>10?COLORS.success:item.quantity>0?COLORS.warning:COLORS.error}]}>
              {item.quantity>10?'In Stock':item.quantity>0?`${item.quantity} left`:'Out of Stock'}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// ==================== CART SCREEN ====================
// ==================== CART SCREEN (with M-Pesa Integration) ====================
function CartScreen({ cart, updateCartQty, removeFromCart, clearCart, cartTotal, cartCount, setScreen, setProducts, currentUser, setSalesHistory }) {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashTendered, setCashTendered] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [mpesaStatus, setMpesaStatus] = useState('');
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState(null);
  const [mpesaWaiting, setMpesaWaiting] = useState(false);
  const [pollTimer, setPollTimer] = useState(null);
  const [countdown, setCountdown] = useState(120);
  const [notification, setNotification] = useState(null); // { title, message, type, onOk }


  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [pollTimer]);

  // Cash payment handler
  const handleCashPayment = () => {
    const cash = parseFloat(cashTendered) || 0;
    if (cash < cartTotal) { 
      setNotification({
        title: 'Error', message: 'Insufficient cash amount.',
        type: 'error', onOk: () => setNotification(null)
      });
      return; 
    }
    
    const sale = {
      total_amount: cartTotal,
      payment_method: 'cash',
      payment_status: 'completed',
      cash_tendered: cash,
      change_amount: cash - cartTotal,
      cashier_id: currentUser?.id || '1',
      items: cart.map(c => ({
        product_id: c.id,
        product_name: c.name,
        quantity: c.qty,
        unit_price: c.price,
        total_price: c.price * c.qty,
        cost_price: c.cost_price || 0  // Include cost price
      }))
    };
    
    // Send to server
    console.log('Sending sale to server:', JSON.stringify(sale));
    fetch(`${API_URL}/api/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale),
    }).then(res => res.json()).then(data => {
      console.log('Sale recorded on server:', data);
    }).catch(err => {
      console.log('Server not available, sale saved locally only:', err.message);
    });
    
    // Also update local state
    const localSale = {
      id: Date.now().toString(),
      receipt: `GBS-${Date.now().toString().slice(-8)}`,
      date: new Date().toISOString(),
      items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.price, total: c.price * c.qty, cost: c.cost_price || 0 })),
      totalAmount: cartTotal,
      paymentMethod: 'cash',
      cashTendered: cash,
      change: cash - cartTotal,
      cashier: currentUser?.fullName || 'Unknown',
    };
    setSalesHistory(prev => [localSale, ...prev]);
    
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(c => c.id === p.id);
      if (cartItem) return { ...p, quantity: p.quantity - cartItem.qty };
      return p;
    }));
    
    setShowPayment(false);
    
    setNotification({
      title: '✅ Payment Successful',
      message: `Receipt: ${localSale.receipt}\nTotal: KES ${cartTotal.toLocaleString()}\nChange: KES ${(cash-cartTotal).toLocaleString()}\n\nThank you for your purchase!`,
      type: 'success',
      onOk: () => {
        clearCart();
        setScreen('shop');
        setNotification(null);
      }
    });
  };

  // M-Pesa payment handler
  const handleMpesaPayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number');
      return;
    }

    setMpesaLoading(true);
    setMpesaStatus('Connecting to M-Pesa server...');

    // Test connection first
    const connection = await mpesaService.testConnection();
    if (!connection.connected) {
      setMpesaLoading(false);
      setMpesaStatus('');
      Alert.alert(
        'M-Pesa Unavailable',
        connection.message + '\n\nMake sure:\n1. Backend server is running (python app.py)\n2. Server URL is correct\n3. Internet is connected',
        [{ text: 'OK' }]
      );
      return;
    }

    setMpesaStatus('Sending M-Pesa request...');
    
    const result = await mpesaService.initiatePayment(
      phoneNumber,
      cartTotal,
      `GBS-${Date.now().toString().slice(-6)}`
    );

    if (result.success) {
      setMpesaCheckoutId(result.checkoutRequestId);
      setMpesaStatus('M-Pesa prompt sent! Check your phone.');
      setMpesaLoading(false);
      setMpesaWaiting(true);
      setCountdown(120);
      startPolling(result.checkoutRequestId);
    } else {
      setMpesaLoading(false);
      setMpesaStatus('');
      Alert.alert(
        'M-Pesa Failed',
        result.error + '\n\nWould you like to try again?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: () => handleMpesaPayment() }
        ]
      );
    }
  };

  // Poll for payment status
  const startPolling = (checkoutId) => {
    let elapsed = 0;
    const timer = setInterval(async () => {
      elapsed += 3;
      setCountdown(120 - elapsed);
      
      const status = await mpesaService.checkStatus(checkoutId);
      console.log('[Cart] Poll status:', status.status, status.message);
      
        if (status.status === 'Success') {
        console.log('[Cart] Payment successful!');
        clearInterval(timer);
        setPollTimer(null);
        setMpesaWaiting(false);
        setMpesaCheckoutId(null);
        setMpesaStatus('');
        setShowPayment(false);
        
        // Create the sale object - THIS WAS MISSING
        const sale = {
          id: Date.now().toString(),
          receipt: status.receipt || `GBS-${Date.now().toString().slice(-8)}`,
          date: new Date().toISOString(),
          items: cart.map(c => ({ 
            name: c.name, 
            qty: c.qty, 
            price: c.price, 
            total: c.price * c.qty, 
            cost: c.cost_price || 0 
          })),
          totalAmount: cartTotal,
          paymentMethod: 'mpesa',
          phone: phoneNumber,
          mpesaRef: status.receipt,
          cashier: currentUser?.fullName || 'Unknown',
        };
        
        setSalesHistory(prev => [sale, ...prev]);
        
        setProducts(prev => prev.map(p => {
          const cartItem = cart.find(c => c.id === p.id);
          if (cartItem) return { ...p, quantity: p.quantity - cartItem.qty };
          return p;
        }));
        
        // Show success notification
        setTimeout(() => {
          setNotification({
            title: '✅ Payment Successful',
            message: `M-Pesa payment received!\n\nReceipt: ${sale.receipt}\nAmount: KES ${cartTotal.toLocaleString()}\n\nThank you for your purchase!`,
            type: 'success',
            onOk: () => {
              clearCart();
              setScreen('shop');
              setNotification(null);
            }
          });
        }, 500);        
      } else if (status.status === 'Cancelled') {
        console.log('[Cart] Payment cancelled');
        clearInterval(timer);
        setPollTimer(null);
        setMpesaWaiting(false);
        setMpesaCheckoutId(null);
        setMpesaStatus('');
        setShowPayment(false);
        
        setTimeout(() => {
          setNotification({
            title: '🚫 Transaction Cancelled',
            message: 'The customer cancelled the M-Pesa prompt on their phone.\n\nThe items are still in your cart.',
            type: 'warning',
            onOk: () => setNotification(null),
            onRetry: () => {
              setNotification(null);
              setPaymentMethod('mpesa');
              setShowPayment(true);
            }
          });
        }, 500);
        
      } else if (status.status === 'Failed') {
        console.log('[Cart] Payment failed');
        clearInterval(timer);
        setPollTimer(null);
        setMpesaWaiting(false);
        setMpesaCheckoutId(null);
        setMpesaStatus('');
        setShowPayment(false);
        
        setTimeout(() => {
          setNotification({
            title: '❌ Payment Failed',
            message: status.message + '\n\nThe items are still in your cart.',
            type: 'error',
            onOk: () => setNotification(null),
            onRetry: () => {
              setNotification(null);
              setPaymentMethod('mpesa');
              setShowPayment(true);
            }
          });
        }, 500);
      }
      
      if (elapsed >= 120) {
        clearInterval(timer);
        setPollTimer(null);
        setMpesaWaiting(false);
        setMpesaCheckoutId(null);
        setMpesaStatus('');
        setShowPayment(false);
        
        setTimeout(() => {
          setNotification({
            title: '⏰ Timeout',
            message: 'Payment confirmation timed out.\n\nItems are still in your cart.',
            type: 'warning',
            onOk: () => setNotification(null)
          });
        }, 500);
      }
    }, 3000);
    
    setPollTimer(timer);
  };

  // Cancel waiting
  const cancelWaiting = () => {
    if (pollTimer) clearInterval(pollTimer);
    setPollTimer(null);
    setMpesaWaiting(false);
    setMpesaCheckoutId(null);
    setMpesaStatus('');
    Alert.alert('Cancelled', 'Payment waiting stopped. Items are still in cart.');
  };

  // Show payment method selection
  const openPayment = (method) => {
    setPaymentMethod(method);
    setShowPayment(true);
    setCashTendered('');
    setPhoneNumber('');
    setMpesaStatus('');
    setMpesaWaiting(false);
    setMpesaLoading(false);
  };

  if (cart.length === 0) {
    return (
      <View style={styles.screenContainer}>
        <View style={styles.header}><TouchableOpacity onPress={()=>setScreen('shop')}><Text style={styles.backText}>← Back</Text></TouchableOpacity><Text style={styles.headerTitle}>Cart</Text><View/></View>
        <View style={styles.emptyCart}><Text style={styles.emptyEmoji}>🛒</Text><Text style={styles.emptyText}>Cart is empty</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>setScreen('shop')}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Cart ({cartCount})</Text>
        <TouchableOpacity onPress={clearCart}><Text style={styles.clearText}>Clear</Text></TouchableOpacity>
      </View>

      <FlatList
        data={cart}
        keyExtractor={item => item.id}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.cartItemInfo}>
              <Text style={styles.cartItemName}>{item.name}</Text>
              <Text style={styles.cartItemPrice}>KES {item.price.toLocaleString()}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={()=>updateCartQty(item.id,-1)}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
                <Text style={styles.qtyValue}>{item.qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={()=>updateCartQty(item.id,1)}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
              </View>
            </View>
            <View style={styles.cartItemRight}>
              <Text style={styles.cartItemTotal}>KES {(item.price*item.qty).toLocaleString()}</Text>
              <TouchableOpacity style={styles.removeBtn} onPress={()=>removeFromCart(item.id)}><Text style={styles.removeBtnText}>✕</Text></TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={styles.cartFooter}>
        <Text style={styles.totalText}>Total: KES {cartTotal.toLocaleString()}</Text>
        <View style={styles.paymentRow}>
          <TouchableOpacity style={styles.payBtn} onPress={()=>openPayment('cash')}><Text style={styles.payBtnText}>Pay Cash</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.payBtn,{backgroundColor:'#4CAF50'}]} onPress={()=>openPayment('mpesa')}><Text style={styles.payBtnText}>Pay M-Pesa</Text></TouchableOpacity>
        </View>
      </View>

      {/* Payment Modal */}
      <Modal visible={showPayment} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{flexGrow:1, justifyContent:'center'}}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{paymentMethod==='cash'?'Cash Payment':'M-Pesa Payment'}</Text>
              <Text style={styles.modalAmount}>KES {cartTotal.toLocaleString()}</Text>
              
              {/* Cash Payment */}
              {paymentMethod === 'cash' && !mpesaWaiting && (
                <>
                  <TextInput style={styles.input} placeholder="Cash tendered" value={cashTendered} onChangeText={setCashTendered} keyboardType="decimal-pad" />
                  {cashTendered && parseFloat(cashTendered) >= cartTotal && (
                    <Text style={styles.changeText}>Change: KES {(parseFloat(cashTendered)-cartTotal).toLocaleString()}</Text>
                  )}
                  <View style={styles.modalBtns}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={()=>setShowPayment(false)}><Text>Cancel</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.confirmBtn} onPress={handleCashPayment}>
                      <Text style={styles.confirmBtnText}>Pay </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* M-Pesa Payment - Input */}
              {paymentMethod === 'mpesa' && !mpesaWaiting && (
                <>
                  <TextInput style={styles.input} placeholder="0712..." value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
                  <View style={styles.modalBtns}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={()=>setShowPayment(false)}><Text>Cancel</Text></TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.confirmBtn, {backgroundColor: '#4CAF50'}]} 
                      onPress={handleMpesaPayment}
                      disabled={mpesaLoading}
                    >
                      {mpesaLoading ? (
                        <ActivityIndicator color={COLORS.textWhite} size="small" />
                      ) : (
                        <Text style={styles.confirmBtnText}>Send Request</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  {mpesaStatus ? (
                    <Text style={styles.mpesaStatus}>{mpesaStatus}</Text>
                  ) : null}
                </>
              )}

              {/* M-Pesa Waiting Dialog */}
              {paymentMethod === 'mpesa' && mpesaWaiting && (
                <View style={styles.waitingContainer}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.waitingTitle}>Waiting for Payment</Text>
                  <Text style={styles.waitingAmount}>KES {cartTotal.toLocaleString()}</Text>
                  <Text style={styles.waitingPhone}>Sent to: {phoneNumber}</Text>
                  <Text style={styles.waitingStatus}>{mpesaStatus}</Text>
                  <Text style={styles.waitingTimer}>Time remaining: {countdown}s</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, {width: `${((120-countdown)/120)*100}%`}]} />
                  </View>
                  <TouchableOpacity style={[styles.cancelBtn, {marginTop:15}]} onPress={cancelWaiting}>
                    <Text style={{color: COLORS.error}}>Cancel Payment</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
      <Modal visible={notification !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.notificationCard}>
            <Text style={[
              styles.notificationIcon,
              {color: notification?.type === 'success' ? COLORS.success : 
                      notification?.type === 'error' ? COLORS.error : COLORS.warning}
            ]}>
              {notification?.type === 'success' ? '✅' : 
               notification?.type === 'error' ? '❌' : '🚫'}
            </Text>
            <Text style={styles.notificationTitle}>{notification?.title}</Text>
            <Text style={styles.notificationMessage}>{notification?.message}</Text>
            
            <View style={styles.notificationBtns}>
              {notification?.onRetry && (
                <TouchableOpacity style={styles.notifRetryBtn} onPress={notification.onRetry}>
                  <Text style={styles.notifRetryText}>Retry Payment</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.notifOkBtn, {backgroundColor: 
                  notification?.type === 'success' ? COLORS.success : 
                  notification?.type === 'error' ? COLORS.error : COLORS.primary}]} 
                onPress={notification?.onOk}
              >
                <Text style={styles.notifOkText}>
                  {notification?.type === 'success' ? 'Done' : 'OK'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
// ==================== REPORTS SCREEN ====================
function ReportsScreen({ setScreen }) {
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [serverSales, setServerSales] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch sales from server
  const fetchSalesFromServer = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/sales`);
      if (response.ok) {
        const data = await response.json();
        setServerSales(data);
        console.log(`Loaded ${data.length} sales from server`);
      }
    } catch (error) {
      console.log('Server not available:', error.message);
    }
    setLoading(false);
  };

  // Fetch on mount and when filter changes
  useEffect(() => {
    fetchSalesFromServer();
  }, [dateFilter]);

  // Use serverSales instead of salesHistory for all calculations
  const filteredSales = serverSales.filter(sale => {
    const saleDate = new Date(sale.created_at || sale.date);
    const now = new Date();
    const today = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (dateFilter === 'today') return saleDate.toDateString() === today;
    if (dateFilter === 'week') return saleDate >= weekAgo;
    if (dateFilter === 'month') return saleDate >= monthAgo;
    return true;
  });

  // Calculate summaries from filteredSales
  const totalSales = filteredSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalTransactions = filteredSales.length;
  const cashSales = filteredSales
    .filter(s => (s.payment_method === 'cash'))
    .reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const mpesaSales = filteredSales
    .filter(s => (s.payment_method === 'mpesa'))
    .reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const avgSale = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Product breakdown - use actual profit from server
  const productBreakdown = {};
  filteredSales.forEach(sale => {
    const items = sale.items || [];
    items.forEach(item => {
      if (!item) return;
      const name = item.product_name || 'Unknown';
      if (!productBreakdown[name]) {
        productBreakdown[name] = { name, qty: 0, revenue: 0, cost: 0, profit: 0 };
      }
      productBreakdown[name].qty += (item.quantity || 0);
      productBreakdown[name].revenue += (item.total_price || 0);
      // Use actual cost and profit from server
      const cost = (item.cost_price || 0) * (item.quantity || 0);
      const profit = (item.profit || 0);
      productBreakdown[name].cost += cost;
      productBreakdown[name].profit += profit;
    });
  });
  const productList = Object.values(productBreakdown).sort((a, b) => b.revenue - a.revenue);
  const totalCost = productList.reduce((sum, p) => sum + p.cost, 0);
  const totalProfit = productList.reduce((sum, p) => sum + p.profit, 0);

  // Report type selection screen
  if (!selectedReport) {
    return (
      <View style={styles.screenContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={()=>setScreen('shop')}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Reports</Text>
          <View/>
        </View>
        <ScrollView style={{padding:15}}>
          {/* Date Filter */}
          <Text style={styles.sectionTitle}>Filter</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:15}}>
            {['all','today','week','month'].map(f => (
              <TouchableOpacity key={f} style={[styles.catBtn, dateFilter===f&&styles.catBtnActive]} onPress={()=>setDateFilter(f)}>
                <Text style={[styles.catText, dateFilter===f&&styles.catTextActive]}>{f === 'all' ? 'All Time' : f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Report Types */}
          <Text style={styles.sectionTitle}>Report Types</Text>
          <TouchableOpacity style={styles.reportCard} onPress={()=>setSelectedReport('summary')}>
            <Text style={styles.reportCardTitle}>📊 Sales Summary</Text>
            <Text style={styles.reportCardDesc}>Overview of sales, transactions, and payment methods</Text>
            <Text style={styles.reportCardValue}>{totalTransactions} transactions | KES {totalSales.toLocaleString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportCard} onPress={()=>setSelectedReport('products')}>
            <Text style={styles.reportCardTitle}>📦 Product Breakdown</Text>
            <Text style={styles.reportCardDesc}>Sales by product with quantities and revenue</Text>
            <Text style={styles.reportCardValue}>{productList.length} products sold</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportCard} onPress={()=>setSelectedReport('profit')}>
            <Text style={styles.reportCardTitle}>💰 Profit & Loss</Text>
            <Text style={styles.reportCardDesc}>Revenue, costs, and profit analysis</Text>
            <Text style={[styles.reportCardValue, {color: totalProfit >= 0 ? COLORS.success : COLORS.error}]}>
              {totalProfit >= 0 ? 'Profit' : 'Loss'}: KES {Math.abs(totalProfit).toLocaleString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportCard} onPress={()=>setSelectedReport('transactions')}>
            <Text style={styles.reportCardTitle}>🧾 Recent Transactions</Text>
            <Text style={styles.reportCardDesc}>List of all sales transactions</Text>
            <Text style={styles.reportCardValue}>{totalTransactions} total</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ===== SALES SUMMARY REPORT =====
  if (selectedReport === 'summary') {
    return (
      <View style={styles.screenContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={()=>setSelectedReport(null)}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Sales Summary</Text>
          <View/>
        </View>
        <ScrollView style={{padding:15}}>
          {/* Summary Cards */}
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, {backgroundColor: '#FFF0F5'}]}>
              <Text style={styles.summaryIcon}>💰</Text>
              <Text style={styles.summaryLabel}>Total Sales</Text>
              <Text style={styles.summaryValue}>KES {totalSales.toLocaleString()}</Text>
            </View>
            <View style={[styles.summaryCard, {backgroundColor: '#F0FFF0'}]}>
              <Text style={styles.summaryIcon}>🧾</Text>
              <Text style={styles.summaryLabel}>Transactions</Text>
              <Text style={styles.summaryValue}>{totalTransactions}</Text>
            </View>
            <View style={[styles.summaryCard, {backgroundColor: '#FFF8E1'}]}>
              <Text style={styles.summaryIcon}>💵</Text>
              <Text style={styles.summaryLabel}>Cash Sales</Text>
              <Text style={styles.summaryValue}>KES {cashSales.toLocaleString()}</Text>
            </View>
            <View style={[styles.summaryCard, {backgroundColor: '#E8F5E9'}]}>
              <Text style={styles.summaryIcon}>📱</Text>
              <Text style={styles.summaryLabel}>M-Pesa Sales</Text>
              <Text style={styles.summaryValue}>KES {mpesaSales.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.avgCard}>
            <Text style={styles.avgLabel}>Average Sale Value</Text>
            <Text style={styles.avgValue}>KES {avgSale.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
          </View>

          {/* Payment Method Breakdown */}
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <View style={styles.barContainer}>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Cash</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, {width: totalSales > 0 ? `${(cashSales/totalSales*100).toFixed(0)}%` : '0%', backgroundColor: COLORS.success}]} />
              </View>
              <Text style={styles.barPercent}>{totalSales > 0 ? (cashSales/totalSales*100).toFixed(0) : 0}%</Text>
            </View>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>M-Pesa</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, {width: totalSales > 0 ? `${(mpesaSales/totalSales*100).toFixed(0)}%` : '0%', backgroundColor: '#4CAF50'}]} />
              </View>
              <Text style={styles.barPercent}>{totalSales > 0 ? (mpesaSales/totalSales*100).toFixed(0) : 0}%</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ===== PRODUCT BREAKDOWN REPORT =====
  if (selectedReport === 'products') {
    return (
      <View style={styles.screenContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={()=>setSelectedReport(null)}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Product Breakdown</Text>
          <View/>
        </View>
        <FlatList
          data={productList}
          keyExtractor={item => item.name}
          contentContainerStyle={{padding:15}}
          ListHeaderComponent={
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, {flex:2}]}>Product</Text>
              <Text style={[styles.thText, {flex:1}]}>Qty</Text>
              <Text style={[styles.thText, {flex:1.5}]}>Revenue</Text>
              <Text style={[styles.thText, {flex:1.5}]}>Profit</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={[styles.tableRow, {backgroundColor: index % 2 === 0 ? COLORS.surface : COLORS.background}]}>
              <Text style={[styles.tdText, {flex:2}]} numberOfLines={2}>{item.name}</Text>
              <Text style={[styles.tdText, {flex:1}]}>{item.qty}</Text>
              <Text style={[styles.tdText, {flex:1.5}]}>KES {item.revenue.toLocaleString()}</Text>
              <Text style={[styles.tdText, {flex:1.5, color: item.profit >= 0 ? COLORS.success : COLORS.error}]}>
                KES {item.profit.toLocaleString()}
              </Text>
            </View>
          )}
          ListFooterComponent={
            <View style={[styles.tableRow, {backgroundColor: COLORS.secondary}]}>
              <Text style={[styles.tdText, {flex:2, fontWeight:'bold'}]}>TOTALS</Text>
              <Text style={[styles.tdText, {flex:1, fontWeight:'bold'}]}>{productList.reduce((s,p)=>s+p.qty,0)}</Text>
              <Text style={[styles.tdText, {flex:1.5, fontWeight:'bold'}]}>KES {totalSales.toLocaleString()}</Text>
              <Text style={[styles.tdText, {flex:1.5, fontWeight:'bold', color: totalProfit >= 0 ? COLORS.success : COLORS.error}]}>
                KES {totalProfit.toLocaleString()}
              </Text>
            </View>
          }
        />
      </View>
    );
  }

  // ===== PROFIT & LOSS REPORT =====
  if (selectedReport === 'profit') {
    const profitMargin = totalSales > 0 ? (totalProfit / totalSales * 100) : 0;
    
    return (
      <View style={styles.screenContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={()=>setSelectedReport(null)}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Profit & Loss</Text>
          <View/>
        </View>
        <ScrollView style={{padding:15}}>
          {/* P&L Summary */}
          <View style={styles.plCard}>
            <Text style={styles.plTitle}>Profit & Loss Statement</Text>
            
            <View style={styles.plRow}>
              <Text style={styles.plLabel}>Total Revenue</Text>
              <Text style={styles.plValue}>KES {totalSales.toLocaleString()}</Text>
            </View>
            <View style={styles.plRow}>
              <Text style={styles.plLabel}>Total Cost of Goods</Text>
              <Text style={[styles.plValue, {color: COLORS.error}]}>- KES {totalCost.toLocaleString()}</Text>
            </View>
            <View style={styles.plDivider} />
            <View style={styles.plRow}>
              <Text style={[styles.plLabel, {fontWeight:'bold', fontSize:18}]}>Gross Profit</Text>
              <Text style={[styles.plValue, {fontWeight:'bold', fontSize:18, color: totalProfit >= 0 ? COLORS.success : COLORS.error}]}>
                KES {totalProfit.toLocaleString()}
              </Text>
            </View>
            <View style={styles.plRow}>
              <Text style={styles.plLabel}>Profit Margin</Text>
              <Text style={[styles.plValue, {color: profitMargin >= 0 ? COLORS.success : COLORS.error}]}>
                {profitMargin.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Top Products by Profit */}
          <Text style={styles.sectionTitle}>Top Products by Profit</Text>
          {productList.slice(0, 10).map((p, i) => (
            <View key={i} style={styles.plItem}>
              <View style={{flex:1}}>
                <Text style={styles.plItemName}>{p.name}</Text>
                <Text style={styles.plItemQty}>{p.qty} sold</Text>
              </View>
              <View style={{alignItems:'flex-end'}}>
                <Text style={[styles.plItemProfit, {color: p.profit >= 0 ? COLORS.success : COLORS.error}]}>
                  KES {p.profit.toLocaleString()}
                </Text>
                <Text style={styles.plItemMargin}>
                  Margin: {p.revenue > 0 ? ((p.profit/p.revenue)*100).toFixed(1) : 0}%
                </Text>
              </View>
            </View>
          ))}

          {productList.length === 0 && (
            <Text style={styles.emptyText}>No sales data available</Text>
          )}
        </ScrollView>
      </View>
    );
  }

  // ===== TRANSACTIONS REPORT =====
  if (selectedReport === 'transactions') {
    return (
      <View style={styles.screenContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={()=>setSelectedReport(null)}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Transactions</Text>
          <View/>
        </View>
        {filteredSales.length === 0 ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyEmoji}>🧾</Text>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          <FlatList
            data={filteredSales.slice(0, 50)}
            keyExtractor={item => item.id}
            contentContainerStyle={{padding:15}}
            renderItem={({ item }) => (
              <View style={styles.txnCard}>
                <View style={styles.txnHeader}>
                  <Text style={styles.txnReceipt}>{item.receipt}</Text>
                  <Text style={[styles.txnMethod, {color: (item.payment_method === 'cash' || item.paymentMethod === 'cash') ? COLORS.success : '#4CAF50'}]}>
                    {(item.payment_method === 'cash' || item.paymentMethod === 'cash') ? '💵 Cash' : '📱 M-Pesa'}
                  </Text>
                </View>
                <View style={styles.txnDetails}>
                  <Text style={styles.txnDate}>{item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</Text>
                  <Text style={styles.txnAmount}>KES {(item.total_amount || item.totalAmount || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.txnItems}>
                  {(item.items || []).map((it, idx) => (
                    <Text key={idx} style={styles.txnItem}>
                      {it.quantity || 0}x {it.product_name || 'Item'} @ KES {(it.unit_price || 0).toLocaleString()}
                    </Text>
                  ))}
                </View>
                <Text style={styles.txnCashier}>Cashier: {item.cashier}</Text>
              </View>
            )}
          />
        )}
      </View>
    );
  }

  return null;
}

// ==================== INVENTORY SCREEN (with Add/Edit) ====================
function InventoryScreen({ products, setProducts, setScreen, currentUser, loadProductsFromServer }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formCategory, setFormCategory] = useState('Makeup');
  const [formPrice, setFormPrice] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formQty, setFormQty] = useState('');
  const [formMinStock, setFormMinStock] = useState('5');
  const canEdit = currentUser?.role !== 'cashier';

  const filtered = products.filter(p => {
    if (filter === 'In Stock' && p.quantity <= 0) return false;
    if (filter === 'Low Stock' && (p.quantity <= 0 || p.quantity > p.min_stock_level)) return false;
    if (filter === 'Out of Stock' && p.quantity > 0) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openAddForm = () => {
    setEditProduct(null);
    setFormName(''); setFormBrand(''); setFormCategory('Makeup');
    setFormPrice(''); setFormCost(''); setFormQty(''); setFormMinStock('5');
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditProduct(product);
    setFormName(product.name); setFormBrand(product.brand || '');
    setFormCategory(product.category); setFormPrice(product.price.toString());
    setFormCost(product.cost_price ? product.cost_price.toString() : '');
    setFormQty(product.quantity.toString()); setFormMinStock(product.min_stock_level.toString());
    setShowForm(true);
  };

  const saveProduct = async () => {
    if (!formName || !formPrice) { Alert.alert('Error', 'Name and price are required'); return; }
    
    const productData = {
      name: formName,
      brand: formBrand,
      category: formCategory,
      price: parseFloat(formPrice),
      cost_price: parseFloat(formCost) || 0,
      quantity: parseInt(formQty) || 0,
      min_stock_level: parseInt(formMinStock) || 5,
    };

    try {
      if (editProduct) {
        // Update on server
        await fetch(`${API_URL}/api/products/${editProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
      } else {
        // Add to server
        await fetch(`${API_URL}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
      }
      
      // Reload from server to get the server-assigned ID
      if (loadProductsFromServer) {
        await loadProductsFromServer();
      }
      
      setShowForm(false);
      Alert.alert('Success', editProduct ? 'Product updated!' : 'Product added!');
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('Error', 'Failed to save product. Is the server running?');
    }
  };

  const deleteProduct = (product) => {
    Alert.alert('Delete', `Delete "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setProducts(prev => prev.filter(p => p.id !== product.id));
        Alert.alert('Deleted', 'Product removed');
      }}
    ]);
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>setScreen('shop')}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory</Text>
        {canEdit && <TouchableOpacity onPress={openAddForm}><Text style={styles.addBtnText}>+ Add</Text></TouchableOpacity>}
      </View>
      
      <TextInput style={styles.searchInput} placeholder="Search inventory..." value={search} onChangeText={setSearch} />
      
      <ScrollView horizontal style={styles.catScroll}>
        {['All','In Stock','Low Stock','Out of Stock'].map(f => (
          <TouchableOpacity key={f} style={[styles.catBtn,filter===f&&styles.catBtnActive]} onPress={()=>setFilter(f)}>
            <Text style={[styles.catText,filter===f&&styles.catTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.invItem} onPress={() => canEdit && openEditForm(item)} onLongPress={() => canEdit && deleteProduct(item)}>
            <View style={{flex:1}}>
              <Text style={styles.invName}>{item.name}</Text>
              <Text style={styles.invBrand}>{item.brand} | {item.category}</Text>
              <Text style={styles.invPrice}>KES {item.price.toLocaleString()}</Text>
            </View>
            <View style={{alignItems:'center'}}>
              <Text style={[styles.invStock,{color:item.quantity>10?COLORS.success:item.quantity>0?COLORS.warning:COLORS.error}]}>{item.quantity}</Text>
              <Text style={styles.invStockLabel}>stock</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Add/Edit Product Modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>{editProduct ? 'Edit Product' : 'Add New Product'}</Text>
            
            <Text style={styles.fieldLabel}>Product Name *</Text>
            <TextInput style={styles.input} value={formName} onChangeText={setFormName} placeholder="e.g. Matte Lipstick" />
            
            <Text style={styles.fieldLabel}>Brand</Text>
            <TextInput style={styles.input} value={formBrand} onChangeText={setFormBrand} placeholder="e.g. MAC" />
            
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['Makeup','Skincare','Hair Care','Nails','Fragrances','Bath & Body','Tools'].map(c => (
                <TouchableOpacity key={c} style={[styles.catBtn, formCategory===c&&styles.catBtnActive]} onPress={()=>setFormCategory(c)}>
                  <Text style={[styles.catText, formCategory===c&&styles.catTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={styles.fieldLabel}>Selling Price *</Text>
            <TextInput style={styles.input} value={formPrice} onChangeText={setFormPrice} keyboardType="decimal-pad" placeholder="0.00" />
            
            <Text style={styles.fieldLabel}>Cost Price</Text>
            <TextInput style={styles.input} value={formCost} onChangeText={setFormCost} keyboardType="decimal-pad" placeholder="0.00" />
            
            <Text style={styles.fieldLabel}>Initial Stock</Text>
            <TextInput style={styles.input} value={formQty} onChangeText={setFormQty} keyboardType="numeric" placeholder="0" />
            
            <Text style={styles.fieldLabel}>Min Stock Alert</Text>
            <TextInput style={styles.input} value={formMinStock} onChangeText={setFormMinStock} keyboardType="numeric" placeholder="5" />
            
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={()=>setShowForm(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={saveProduct}>
                <Text style={styles.confirmBtnText}>{editProduct ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ==================== SETTINGS SCREEN (with Change Password) ====================
function SettingsScreen({ setScreen }) {
  const [shopName, setShopName] = useState('Divine Beauty & Cosmetics Shop');
  const [phone, setPhone] = useState('0700000000');
  const [taxRate, setTaxRate] = useState('16');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = () => {
    if (!newPassword) { Alert.alert('Error', 'Enter new password'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    if (newPassword.length < 4) { Alert.alert('Error', 'Password must be at least 4 characters'); return; }
    Alert.alert('Success', 'Password changed successfully!');
    setShowPassword(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.header}><TouchableOpacity onPress={()=>setScreen('shop')}><Text style={styles.backText}>← Back</Text></TouchableOpacity><Text style={styles.headerTitle}>Settings</Text><View/></View>
      <ScrollView style={{padding:15}}>
        <Text style={styles.sectionTitle}>Shop Information</Text>
        <Text style={styles.fieldLabel}>Shop Name</Text>
        <TextInput style={styles.input} value={shopName} onChangeText={setShopName} />
        <Text style={styles.fieldLabel}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} />
        <Text style={styles.fieldLabel}>Tax Rate (%)</Text>
        <TextInput style={styles.input} value={taxRate} onChangeText={setTaxRate} keyboardType="numeric" />
        
        <TouchableOpacity style={styles.loginBtn} onPress={()=>Alert.alert('Saved','Settings saved!')}>
          <Text style={styles.loginBtnText}>Save Settings</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, {marginTop: 30}]}>Security</Text>
        
        {!showPassword ? (
          <TouchableOpacity style={[styles.loginBtn, {backgroundColor: '#2196F3'}]} onPress={()=>setShowPassword(true)}>
            <Text style={styles.loginBtnText}>Change Password</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.passwordCard}>
            <Text style={styles.fieldLabel}>New Password</Text>
            <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Enter new password" />
            <Text style={styles.fieldLabel}>Confirm Password</Text>
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Confirm password" />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={()=>{setShowPassword(false);setNewPassword('');setConfirmPassword('');}}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, {backgroundColor: '#2196F3'}]} onPress={handleChangePassword}>
                <Text style={styles.confirmBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ==================== USERS SCREEN (Full Management) ====================
function UsersScreen({ setScreen, currentUser }) {
  const [users, setUsers] = useState([
    { id: '1', username: 'admin', full_name: 'Admin User', role: 'admin', phone: '0700000000', is_active: true, created_at: '2024-01-01' },
    { id: '2', username: 'cashier1', full_name: 'Jane Doe', role: 'cashier', phone: '0712345678', is_active: true, created_at: '2024-02-15' },
    { id: '3', username: 'manager1', full_name: 'John Smith', role: 'manager', phone: '0723456789', is_active: true, created_at: '2024-03-01' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Form fields
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState('cashier');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPin, setFormPin] = useState('');

  const openAddForm = () => {
    setEditUser(null);
    setFormUsername(''); setFormFullName(''); setFormRole('cashier');
    setFormPhone(''); setFormPassword(''); setFormPin('');
    setShowForm(true);
  };

  const openEditForm = (user) => {
    setEditUser(user);
    setFormUsername(user.username);
    setFormFullName(user.full_name);
    setFormRole(user.role);
    setFormPhone(user.phone || '');
    setFormPassword('');
    setFormPin('');
    setShowForm(true);
  };

  const saveUser = () => {
    if (!formUsername || !formFullName) {
      Alert.alert('Error', 'Username and full name are required');
      return;
    }

    if (!editUser && !formPassword) {
      Alert.alert('Error', 'Password is required for new users');
      return;
    }

    if (formPassword && formPassword.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters');
      return;
    }

    if (formPin && formPin.length !== 4) {
      Alert.alert('Error', 'PIN must be exactly 4 digits');
      return;
    }

    if (editUser) {
      setUsers(prev => prev.map(u => u.id === editUser.id ? {
        ...u, full_name: formFullName, role: formRole, phone: formPhone
      } : u));
      Alert.alert('Success', 'User updated successfully!');
    } else {
      const newUser = {
        id: Date.now().toString(),
        username: formUsername,
        full_name: formFullName,
        role: formRole,
        phone: formPhone,
        is_active: true,
        created_at: new Date().toISOString().split('T')[0],
      };
      setUsers(prev => [...prev, newUser]);
      Alert.alert('Success', `User "${formUsername}" created successfully!`);
    }
    setShowForm(false);
  };

  const toggleUserStatus = (user) => {
    if (user.id === currentUser?.id) {
      Alert.alert('Error', 'You cannot deactivate your own account!');
      return;
    }

    const action = user.is_active ? 'deactivate' : 'activate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} "${user.full_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: action.charAt(0).toUpperCase() + action.slice(1), style: 'destructive', onPress: () => {
          setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
          Alert.alert('Success', `User "${user.full_name}" ${action}d.`);
        }}
      ]
    );
  };

  const openChangePassword = (user) => {
    setPasswordUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(true);
  };

  const handleChangePassword = () => {
    if (!newPassword) {
      Alert.alert('Error', 'Enter new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters');
      return;
    }
    Alert.alert('Success', `Password changed for ${passwordUser.full_name}!`);
    setShowPassword(false);
    setPasswordUser(null);
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>setScreen('shop')}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Users</Text>
        <TouchableOpacity onPress={openAddForm}><Text style={styles.addBtnText}>+ Add</Text></TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={item => item.id}
        contentContainerStyle={{padding:15}}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.userCard, !item.is_active && styles.userCardInactive]} 
            onPress={() => openEditForm(item)}
            onLongPress={() => toggleUserStatus(item)}
          >
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{item.full_name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{flex:1, marginLeft:12}}>
              <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <Text style={styles.userName}>{item.full_name}</Text>
                <View style={[styles.roleBadge, {
                  backgroundColor: item.role === 'admin' ? COLORS.primary : 
                                   item.role === 'manager' ? COLORS.warning : '#2196F3'
                }]}>
                  <Text style={styles.roleBadgeText}>{item.role}</Text>
                </View>
              </View>
              <Text style={styles.userDetail}>@{item.username}</Text>
              <Text style={styles.userDetail}>{item.phone}</Text>
              <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:4}}>
                <Text style={[styles.userStatus, {color: item.is_active ? COLORS.success : COLORS.error}]}>
                  {item.is_active ? '● Active' : '● Inactive'}
                </Text>
                <Text style={styles.userDate}>Since {item.created_at}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.passwordBtn} 
              onPress={() => openChangePassword(item)}
            >
              <Text style={styles.passwordBtnText}>🔑</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyCart}><Text style={styles.emptyText}>No users found</Text></View>
        }
      />

      {/* Add/Edit User Modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>{editUser ? 'Edit User' : 'Add New User'}</Text>
            
            <Text style={styles.fieldLabel}>Username *</Text>
            <TextInput 
              style={[styles.input, editUser && {backgroundColor: COLORS.background}]} 
              value={formUsername} 
              onChangeText={setFormUsername} 
              placeholder="Username"
              editable={!editUser}
            />
            
            <Text style={styles.fieldLabel}>Full Name *</Text>
            <TextInput style={styles.input} value={formFullName} onChangeText={setFormFullName} placeholder="Full name" />
            
            {!editUser && (
              <>
                <Text style={styles.fieldLabel}>Password *</Text>
                <TextInput style={styles.input} value={formPassword} onChangeText={setFormPassword} placeholder="Password" secureTextEntry />
              </>
            )}
            
            <Text style={styles.fieldLabel}>PIN (optional)</Text>
            <TextInput style={styles.input} value={formPin} onChangeText={t=>setFormPin(t.replace(/[^0-9]/g,'').slice(0,4))} placeholder="4-digit PIN" keyboardType="numeric" maxLength={4} secureTextEntry />
            
            <Text style={styles.fieldLabel}>Role</Text>
            <View style={{flexDirection:'row', gap:10, marginBottom:15}}>
              {['admin', 'manager', 'cashier'].map(role => (
                <TouchableOpacity 
                  key={role}
                  style={[styles.roleOption, formRole===role && styles.roleOptionActive]} 
                  onPress={()=>setFormRole(role)}
                >
                  <Text style={[styles.roleOptionText, formRole===role&&styles.roleOptionTextActive]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput style={styles.input} value={formPhone} onChangeText={setFormPhone} placeholder="Phone number" keyboardType="phone-pad" />
            
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={()=>setShowForm(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={saveUser}>
                <Text style={styles.confirmBtnText}>{editUser ? 'Update' : 'Create User'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPassword} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={{textAlign:'center', color:COLORS.textLight, marginBottom:15}}>
              For: {passwordUser?.full_name} (@{passwordUser?.username})
            </Text>
            
            <Text style={styles.fieldLabel}>New Password</Text>
            <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="Enter new password" secureTextEntry />
            
            <Text style={styles.fieldLabel}>Confirm Password</Text>
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" secureTextEntry />
            
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={()=>{setShowPassword(false); setPasswordUser(null);}}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, {backgroundColor:'#2196F3'}]} onPress={handleChangePassword}>
                <Text style={styles.confirmBtnText}>Change Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  screenContainer: { flex: 1 },

  addBtnText: { fontSize: 16, color: COLORS.textWhite, fontWeight: 'bold' },
  modalContentLarge: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 25, width: '90%', maxHeight: '80%' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 15, marginTop: 10 },
  passwordCard: { backgroundColor: COLORS.surface, borderRadius: 15, padding: 15, borderWidth: 1, borderColor: COLORS.border, marginTop: 10 },
  
  // Login
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: COLORS.background },
  logo: { fontSize: 80, marginBottom: 10 },
  shopName: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary },
  subtitle: { fontSize: 16, color: COLORS.textLight, marginBottom: 30 },
  toggleRow: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 15, marginBottom: 30 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 15, paddingHorizontal:15 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleText: { fontSize: 14, color: COLORS.textLight, fontWeight: '600' },
  toggleTextActive: { color: COLORS.textWhite },
  input: { backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border, borderRadius: 25, paddingHorizontal: 20, paddingVertical: 14, fontSize: 16, marginBottom: 15, width: '100%', color: COLORS.text },
  loginBtn: { backgroundColor: COLORS.primary, width: '100%', paddingVertical: 16, borderRadius: 25, alignItems: 'center', marginTop: 10 },
  loginBtnText: { color: COLORS.textWhite, fontSize: 18, fontWeight: 'bold' },
  hint: { marginTop: 20, color: COLORS.textLight, fontSize: 12 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: COLORS.primary },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textWhite },
  cartIcon: { fontSize: 18, color: COLORS.textWhite },
  backText: { fontSize: 16, color: COLORS.textWhite },
  clearText: { fontSize: 14, color: COLORS.textWhite },
  
  // Categories
  catScroll: { maxHeight: 50, paddingHorizontal: 10, marginVertical: 10 },
  catBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  catBtnActive: { backgroundColor: COLORS.primary },
  catText: { fontSize: 13, color: COLORS.textLight },
  catTextActive: { color: COLORS.textWhite, fontWeight: '600' },
  
  // Search
  searchInput: { backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border, borderRadius: 25, paddingHorizontal: 20, paddingVertical: 12, fontSize: 14, marginHorizontal: 15, marginBottom: 10, color: COLORS.text },
  
  // Products
  productCard: { width: '46%', backgroundColor: COLORS.surface, borderRadius: 15, padding: 12, margin: '2%', borderWidth: 1, borderColor: COLORS.border },
  productName: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  productBrand: { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
  productPrice: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
  stockText: { fontSize: 11, fontWeight: '500' },
  
  // Cart
  emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 80, marginBottom: 20 },
  emptyText: { fontSize: 18, color: COLORS.textLight },
  cartItem: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 12, padding: 15, marginHorizontal: 15, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  cartItemPrice: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: COLORS.textWhite, fontSize: 18, fontWeight: 'bold' },
  qtyValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, minWidth: 25, textAlign: 'center' },
  cartItemRight: { alignItems: 'flex-end', justifyContent: 'center' },
  cartItemTotal: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  removeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.error, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  removeBtnText: { color: COLORS.textWhite, fontWeight: 'bold', fontSize: 14 },
  cartFooter: { backgroundColor: COLORS.surface, padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalText: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, marginBottom: 15, textAlign: 'right' },
  paymentRow: { flexDirection: 'row', gap: 10 },
  payBtn: { flex: 1, backgroundColor: COLORS.success, paddingVertical: 15, borderRadius: 25, alignItems: 'center' },
  payBtnText: { color: COLORS.textWhite, fontSize: 16, fontWeight: 'bold' },
  
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 25, width: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10, textAlign: 'center' },
  modalAmount: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 20 },
  changeText: { fontSize: 18, color: COLORS.success, textAlign: 'center', marginTop: 10 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 25, alignItems: 'center', backgroundColor: COLORS.success },
  confirmBtnText: { color: COLORS.textWhite, fontWeight: 'bold' },
  
  // Bottom Nav
  bottomNav: { flexDirection: 'row', backgroundColor: COLORS.surface, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border, flexWrap: 'wrap' },
  navBtn: { flex: 1, alignItems: 'center', paddingVertical: 5, minWidth: 80 },
  navText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  
  // Reports
  reportBtn: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  reportText: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
    // Reports - Summary
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
  summaryCard: { width: '47%', padding: 15, borderRadius: 15, alignItems: 'center' },
  summaryIcon: { fontSize: 30, marginBottom: 5 },
  summaryLabel: { fontSize: 11, color: COLORS.textLight, marginBottom: 3 },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  avgCard: { backgroundColor: COLORS.primary, padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
  avgLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 5 },
  avgValue: { color: COLORS.textWhite, fontSize: 28, fontWeight: 'bold' },

  // Reports - Cards
  reportCard: { backgroundColor: COLORS.surface, padding: 18, borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  reportCardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  reportCardDesc: { fontSize: 13, color: COLORS.textLight, marginBottom: 8 },
  reportCardValue: { fontSize: 15, fontWeight: '600', color: COLORS.primary },

  // Reports - Bar chart
  barContainer: { backgroundColor: COLORS.surface, padding: 15, borderRadius: 15, marginBottom: 15 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  barLabel: { width: 60, fontSize: 13, fontWeight: '600', color: COLORS.text },
  barTrack: { flex: 1, height: 20, backgroundColor: COLORS.background, borderRadius: 10, marginHorizontal: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 10 },
  barPercent: { width: 40, fontSize: 12, fontWeight: '600', color: COLORS.textLight, textAlign: 'right' },

  // Reports - Table
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 12, borderRadius: 10, marginBottom: 5 },
  thText: { color: COLORS.textWhite, fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  tableRow: { flexDirection: 'row', padding: 10, alignItems: 'center' },
  tdText: { fontSize: 12, color: COLORS.text, textAlign: 'center', paddingHorizontal: 3 },

  // Reports - P&L
  plCard: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 15, marginBottom: 20, borderWidth: 2, borderColor: COLORS.border },
  plTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 15, textAlign: 'center' },
  plRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  plLabel: { fontSize: 14, color: COLORS.text },
  plValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  plDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 5 },
  plItem: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: 12, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border },
  plItemName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  plItemQty: { fontSize: 11, color: COLORS.textLight },
  plItemProfit: { fontSize: 15, fontWeight: 'bold' },
  plItemMargin: { fontSize: 10, color: COLORS.textLight },


  bottomNav: { backgroundColor: COLORS.surface, paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  bottomNavScroll: { flexDirection: 'row', paddingHorizontal: 10, alignItems: 'center' },
  navBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  navText: { fontSize: 13, fontWeight: '600', color: COLORS.text },


    // Notification Modal
  notificationCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 25, width: '85%', alignItems: 'center' },
  notificationIcon: { fontSize: 50, marginBottom: 10 },
  notificationTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 8, textAlign: 'center' },
  notificationMessage: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  notificationBtns: { flexDirection: 'row', gap: 10, width: '100%' },
  notifRetryBtn: { flex: 1, paddingVertical: 12, borderRadius: 25, alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary },
  notifRetryText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 15 },
  notifOkBtn: { flex: 1, paddingVertical: 12, borderRadius: 25, alignItems: 'center' },
  notifOkText: { color: COLORS.textWhite, fontWeight: 'bold', fontSize: 15 },

  // Reports - Transactions
  txnCard: { backgroundColor: COLORS.surface, padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  txnHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  txnReceipt: { fontSize: 13, fontWeight: 'bold', color: COLORS.primary },
  txnMethod: { fontSize: 12, fontWeight: '600' },
  txnDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  txnDate: { fontSize: 11, color: COLORS.textLight },
  txnAmount: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  txnItems: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 6, marginBottom: 4 },
  txnItem: { fontSize: 11, color: COLORS.textLight, marginBottom: 2 },
  txnCashier: { fontSize: 10, color: COLORS.textLight, textAlign: 'right' },
  

  statusDot: { width: 8, height: 8, borderRadius: 4 }, //status of the connection
  // Inventory
  invItem: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: 15, marginHorizontal: 15, marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  invName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  invBrand: { fontSize: 12, color: COLORS.textLight },
  invPrice: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  invStock: { fontSize: 22, fontWeight: 'bold' },
  invStockLabel: { fontSize: 10, color: COLORS.textLight },


    // User Management
  userCard: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: 15, marginBottom: 10, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  userCardInactive: { opacity: 0.6, backgroundColor: '#F5F5F5' },
  userAvatar: { width: 45, height: 45, borderRadius: 23, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { color: COLORS.textWhite, fontSize: 20, fontWeight: 'bold' },
  userName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  userDetail: { fontSize: 12, color: COLORS.textLight, marginTop: 1 },
  userStatus: { fontSize: 11, fontWeight: '600' },
  userDate: { fontSize: 10, color: COLORS.textLight },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  roleBadgeText: { color: COLORS.textWhite, fontSize: 11, fontWeight: '600' },
  passwordBtn: { padding: 8, marginLeft: 8 },
  passwordBtnText: { fontSize: 20 },

  // Role selection
  roleOption: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center', borderWidth: 2, borderColor: COLORS.border },
  roleOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleOptionText: { fontSize: 13, fontWeight: '600', color: COLORS.textLight },
  roleOptionTextActive: { color: COLORS.textWhite },
  

    // M-Pesa waiting
  mpesaStatus: { fontSize: 13, color: '#4CAF50', textAlign: 'center', marginTop: 10, fontWeight: '500' },
  waitingContainer: { alignItems: 'center', padding: 15 },
  waitingTitle: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50', marginTop: 15 },
  waitingAmount: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, marginTop: 5 },
  waitingPhone: { fontSize: 14, color: COLORS.textLight, marginTop: 5 },
  waitingStatus: { fontSize: 13, color: COLORS.textLight, marginTop: 10, textAlign: 'center' },
  waitingTimer: { fontSize: 12, color: COLORS.textLight, marginTop: 8 },
  progressBar: { width: '100%', height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 3 },

  // Settings
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 5, marginTop: 10 },
});