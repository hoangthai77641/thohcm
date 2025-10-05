const crypto = require('crypto');

class PaymentService {
  
  // VNPay Integration
  static createVNPayPayment(bookingData) {
    const {
      amount,
      bookingId,
      customerInfo,
      returnUrl = 'http://localhost:3000/payment/callback'
    } = bookingData;

    const vnp_TmnCode = process.env.VNPAY_TMN_CODE;
    const vnp_HashSecret = process.env.VNPAY_HASH_SECRET; 
    const vnp_Url = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    
    const createDate = this.formatDate(new Date());
    const orderId = `${bookingId}_${Date.now()}`;
    
    let vnp_Params = {
      'vnp_Version': '2.1.0',
      'vnp_Command': 'pay',
      'vnp_TmnCode': vnp_TmnCode,
      'vnp_Locale': 'vn',
      'vnp_CurrCode': 'VND',
      'vnp_TxnRef': orderId,
      'vnp_OrderInfo': `Thanh toan dich vu dien lanh - Don hang ${bookingId}`,
      'vnp_OrderType': 'other',
      'vnp_Amount': amount * 100, // VNPay expects amount in VND cents
      'vnp_ReturnUrl': returnUrl,
      'vnp_IpAddr': '127.0.0.1',
      'vnp_CreateDate': createDate
    };

    // Sort parameters
    vnp_Params = this.sortObject(vnp_Params);
    
    // Create query string
    const querystring = require('qs');
    const signData = querystring.stringify(vnp_Params, { encode: false });
    
    // Create secure hash
    const hmac = crypto.createHmac('sha512', vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;
    
    return vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });
  }

  // MoMo Integration
  static async createMoMoPayment(bookingData) {
    const {
      amount,
      bookingId,
      customerInfo,
      notifyUrl = 'http://localhost:5000/api/payment/momo/callback',
      returnUrl = 'http://localhost:3000/payment/success'
    } = bookingData;

    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretkey = process.env.MOMO_SECRET_KEY;
    const requestId = `${bookingId}_${Date.now()}`;
    const orderId = requestId;
    const orderInfo = `Thanh toán dịch vụ điện lạnh - Đơn hàng ${bookingId}`;
    const redirectUrl = returnUrl;
    const ipnUrl = notifyUrl;
    const extraData = JSON.stringify({ bookingId, customerId: customerInfo.id });

    // Create signature
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;
    
    const signature = crypto
      .createHmac('sha256', secretkey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType: 'captureWallet',
      signature,
      lang: 'vi'
    };

    try {
      const response = await fetch('https://test-payment.momo.vn/v2/gateway/api/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('MoMo payment error:', error);
      throw new Error('Unable to create MoMo payment');
    }
  }

  // ZaloPay Integration (simplified)
  static createZaloPayPayment(bookingData) {
    const { amount, bookingId } = bookingData;
    
    // ZaloPay integration would go here
    // For now, return a mock response
    return {
      order_url: `https://sandbox.zalopay.vn/v001/tpe/zptransaction?order_id=${bookingId}&amount=${amount}`,
      app_trans_id: `${Date.now()}_${bookingId}`
    };
  }

  // Verify VNPay callback
  static verifyVNPayCallback(vnp_Params) {
    const vnp_SecureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = this.sortObject(vnp_Params);
    
    const secretKey = process.env.VNPAY_HASH_SECRET;
    const querystring = require('qs');
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return vnp_SecureHash === signed;
  }

  // Verify MoMo callback
  static verifyMoMoCallback(params) {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature
    } = params;

    const secretKey = process.env.MOMO_SECRET_KEY;
    const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    return signature === expectedSignature;
  }

  // Utility functions
  static sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  static formatDate(date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const seconds = ('0' + date.getSeconds()).slice(-2);
    
    return year + month + day + hours + minutes + seconds;
  }
}

module.exports = PaymentService;