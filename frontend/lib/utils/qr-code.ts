/**
 * QR Code generation utilities for payment addresses
 */

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generate QR code data URL for STX payment
 * Note: Most Stacks wallets only support plain addresses in QR codes, not SIP-010 URIs with amount/memo
 */
export async function generateSTXPaymentQR(
  address: string,
  amount: number,
  memo?: string,
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    // Dynamically import QR code library to avoid SSR issues
    const QRCode = (await import('qrcode')).default;

    // Use plain address only - Stacks wallets don't support amount/memo in QR codes
    // The user will need to manually enter the amount
    const stxAddress = address;

    // Generate QR code
    const qrOptions = {
      width: options.size || 256,
      margin: options.margin || 2,
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    const qrDataUrl = await QRCode.toDataURL(stxAddress, qrOptions);
    return qrDataUrl;

  } catch (error) {
    console.error('Failed to generate STX payment QR code:', error);
    throw new Error('QR code generation failed');
  }
}

/**
 * Generate QR code data URL for Bitcoin payment
 * Note: Using plain address for maximum wallet compatibility
 */
export async function generateBitcoinPaymentQR(
  address: string,
  amount?: number,
  label?: string,
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    const QRCode = (await import('qrcode')).default;

    // Use plain address for better wallet compatibility
    // Users will need to manually enter the amount
    const bitcoinAddress = address;

    // Generate QR code
    const qrOptions = {
      width: options.size || 256,
      margin: options.margin || 2,
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    const qrDataUrl = await QRCode.toDataURL(bitcoinAddress, qrOptions);
    return qrDataUrl;

  } catch (error) {
    console.error('Failed to generate Bitcoin payment QR code:', error);
    throw new Error('QR code generation failed');
  }
}

/**
 * Generate QR code for generic text/URL
 */
export async function generateGenericQR(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    const QRCode = (await import('qrcode')).default;
    
    const qrOptions = {
      width: options.size || 256,
      margin: options.margin || 2,
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    const qrDataUrl = await QRCode.toDataURL(text, qrOptions);
    return qrDataUrl;
    
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('QR code generation failed');
  }
}

/**
 * Generate QR code based on payment method
 */
export async function generatePaymentQR(
  paymentMethod: string,
  address: string,
  amount: number,
  memo?: string,
  options: QRCodeOptions = {}
): Promise<string> {
  switch (paymentMethod.toLowerCase()) {
    case 'stx':
      return generateSTXPaymentQR(address, amount, memo, options);
    
    case 'btc':
    case 'sbtc':
      // Convert from satoshis to BTC for Bitcoin URI
      const btcAmount = paymentMethod === 'btc' ? amount / 100000000 : amount;
      return generateBitcoinPaymentQR(address, btcAmount, memo, options);
    
    default:
      // Fallback to generic QR with address
      return generateGenericQR(address, options);
  }
}