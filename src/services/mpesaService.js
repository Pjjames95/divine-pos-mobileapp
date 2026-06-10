// src/services/mpesaService.js
/**
 * M-Pesa Service for Mobile App
 * Connects to the same backend as the desktop app
 */

const API_URL = 'https://divine-pos-backend.onrender.com';

export const mpesaService = {
  /**
   * Test connection to M-Pesa server
   */
  async testConnection() {
    try {
      const response = await fetch(`${API_URL}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      return { connected: true, message: `Connected (${data.environment})`, data };
    } catch (error) {
      return { connected: false, message: `Cannot connect to server at ${API_URL}. Ensure the backend is running.` };
    }
  },

  /**
   * Format phone number to 2547XXXXXXXX
   */
  formatPhone(phone) {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) return '254' + cleaned.substring(1);
    if (cleaned.startsWith('7') && cleaned.length === 9) return '254' + cleaned;
    if (cleaned.startsWith('254') && cleaned.length === 12) return cleaned;
    return cleaned;
  },

  /**
   * Validate Kenyan phone number
   */
  validatePhone(phone) {
    const formatted = this.formatPhone(phone);
    if (formatted.length !== 12) return false;
    if (!formatted.startsWith('254')) return false;
    return formatted.startsWith('2547') || formatted.startsWith('2541');
  },

  /**
   * Initiate M-Pesa STK Push payment
   */
  async initiatePayment(phoneNumber, amount, reference, description = 'Beauty Shop Purchase') {
    // Validate phone
    if (!this.validatePhone(phoneNumber)) {
      return {
        success: false,
        error: 'Invalid phone number. Enter a valid Kenyan mobile number (e.g., 0712 345 678).'
      };
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { success: false, error: 'Invalid amount.' };
    }
    if (numAmount > 150000) {
      return { success: false, error: 'Amount exceeds M-Pesa daily limit of KES 150,000.' };
    }

    try {
      const formattedPhone = this.formatPhone(phoneNumber);
      
      console.log(`[M-Pesa] Sending payment: KES ${numAmount} to ${formattedPhone}`);
      
      const response = await fetch(`${API_URL}/api/mpesa/stkpush`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: formattedPhone,
          amount: Math.round(numAmount),
          shop_id: 'beauty_shop_mobile',
          account_reference: (reference || `BEAUTY${Date.now().toString().slice(-6)}`).substring(0, 12),
          description: description.substring(0, 13),
        }),
      });

      const result = await response.json();
      console.log('[M-Pesa] Response:', result);

      if (result.success) {
        return {
          success: true,
          checkoutRequestId: result.checkout_request_id,
          message: result.customer_message || 'M-Pesa prompt sent. Enter PIN to complete payment.',
        };
      } else {
        return {
          success: false,
          error: result.error || result.response_description || 'Payment initiation failed.',
        };
      }
    } catch (error) {
      console.error('[M-Pesa] Error:', error);
      return {
        success: false,
        error: `Connection failed: ${error.message}. Ensure the M-Pesa server is running at ${API_URL}.`,
      };
    }
  },

  /**
   * Check payment status
   */
  async checkStatus(checkoutRequestId) {
    try {
      const response = await fetch(`${API_URL}/api/mpesa/status/${checkoutRequestId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      console.log('[M-Pesa] Status result:', JSON.stringify(result));

      // The backend returns: 'completed', 'cancelled', 'failed', 'pending'
      const backendStatus = result.status;
      
      if (backendStatus === 'completed') {
        return { 
          status: 'Success', 
          message: 'Payment Successful', 
          receipt: result.mpesa_receipt_number || result.result_description || 'M-Pesa payment confirmed'
        };
      } else if (backendStatus === 'cancelled') {
        return { 
          status: 'Cancelled', 
          message: result.result_description || 'Transaction cancelled by user' 
        };
      } else if (backendStatus === 'failed') {
        return { 
          status: 'Failed', 
          message: result.result_description || 'Payment failed' 
        };
      } else {
        // 'pending' or anything else
        return { 
          status: 'Pending', 
          message: result.result_description || 'Waiting for payment...' 
        };
      }
    } catch (error) {
      console.error('[M-Pesa] Status check error:', error);
      return { status: 'Error', message: `Status check failed: ${error.message}` };
    }
  },
};