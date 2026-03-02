/**
 * Utility functions for the sBTC Gateway SDK
 */

import { SupportedCurrency, CURRENCY_CONFIG, STXAddress } from './types';

// STX utility functions
export class STXUtils {
  /**
   * Convert STX to microSTX
   * @param stx Amount in STX
   * @returns Amount in microSTX
   */
  static toMicroSTX(stx: number): number {
    return Math.floor(stx * 1000000);
  }

  /**
   * Convert microSTX to STX
   * @param microSTX Amount in microSTX
   * @returns Amount in STX
   */
  static fromMicroSTX(microSTX: number): number {
    return microSTX / 1000000;
  }

  /**
   * Format STX amount for display
   * @param microSTX Amount in microSTX
   * @param decimals Number of decimal places (default: 6)
   * @returns Formatted string like "1.500000 STX"
   */
  static formatSTX(microSTX: number, decimals: number = 6): string {
    const stx = this.fromMicroSTX(microSTX);
    return `${stx.toFixed(decimals)} STX`;
  }

  /**
   * Validate STX address format
   * @param address STX address to validate
   * @param network 'mainnet' or 'testnet'
   * @returns true if address is valid
   */
  static isValidAddress(address: string, network: 'mainnet' | 'testnet' = 'mainnet'): boolean {
    if (!address || typeof address !== 'string') {
      return false;
    }

    // STX addresses on mainnet start with 'SP', testnet with 'ST'
    const prefix = network === 'mainnet' ? 'SP' : 'ST';
    
    // Address should be 41 characters total (2 prefix + 39 base58)
    if (address.length !== 41 || !address.startsWith(prefix)) {
      return false;
    }

    // Basic base58 character validation for the rest
    const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
    return base58Regex.test(address.slice(2));
  }

  /**
   * Get minimum STX amount in microSTX
   */
  static getMinAmount(): number {
    return CURRENCY_CONFIG.stx.minAmount;
  }
}

// General currency utilities
export class CurrencyUtils {
  /**
   * Get currency information
   * @param currency Currency code
   * @returns Currency configuration
   */
  static getInfo(currency: SupportedCurrency) {
    return CURRENCY_CONFIG[currency];
  }

  /**
   * Format amount for display based on currency
   * @param amount Amount in smallest unit
   * @param currency Currency code
   * @param includeSymbol Whether to include currency symbol
   * @returns Formatted string
   */
  static formatAmount(amount: number, currency: SupportedCurrency, includeSymbol: boolean = true): string {
    const config = CURRENCY_CONFIG[currency];
    
    switch (currency) {
      case 'stx':
        const stx = amount / 1000000;
        return includeSymbol ? `${stx.toFixed(6)} ${config.symbol}` : stx.toFixed(6);
      
      case 'btc':
      case 'sbtc':
        const btc = amount / 100000000;
        return includeSymbol ? `${btc.toFixed(8)} ${config.symbol}` : btc.toFixed(8);
      
      default:
        return includeSymbol ? `${amount} ${config.symbol}` : amount.toString();
    }
  }

  /**
   * Convert amount to smallest unit
   * @param amount Amount in main unit (STX, BTC, etc.)
   * @param currency Currency code
   * @returns Amount in smallest unit
   */
  static toSmallestUnit(amount: number, currency: SupportedCurrency): number {
    switch (currency) {
      case 'stx':
        return STXUtils.toMicroSTX(amount);
      case 'btc':
      case 'sbtc':
        return Math.floor(amount * 100000000); // Convert to satoshis
      default:
        return amount;
    }
  }

  /**
   * Convert amount from smallest unit to main unit
   * @param amount Amount in smallest unit
   * @param currency Currency code
   * @returns Amount in main unit
   */
  static fromSmallestUnit(amount: number, currency: SupportedCurrency): number {
    switch (currency) {
      case 'stx':
        return STXUtils.fromMicroSTX(amount);
      case 'btc':
      case 'sbtc':
        return amount / 100000000; // Convert from satoshis
      default:
        return amount;
    }
  }

  /**
   * Validate amount for currency
   * @param amount Amount in smallest unit
   * @param currency Currency code
   * @returns Validation result
   */
  static validateAmount(amount: number, currency: SupportedCurrency): { valid: boolean; error?: string } {
    const config = CURRENCY_CONFIG[currency];
    
    if (!Number.isInteger(amount) || amount <= 0) {
      return { valid: false, error: 'Amount must be a positive integer' };
    }

    if (amount < config.minAmount) {
      return { 
        valid: false, 
        error: `Amount must be at least ${config.minAmount} ${currency === 'stx' ? 'microSTX' : 'satoshis'}` 
      };
    }

    return { valid: true };
  }
}

// Address utilities
export class AddressUtils {
  /**
   * Validate any supported address format
   * @param address Address to validate
   * @param currency Currency type
   * @param network Network type
   * @returns true if address is valid
   */
  static isValid(address: string, currency: SupportedCurrency, network: 'mainnet' | 'testnet' = 'mainnet'): boolean {
    switch (currency) {
      case 'stx':
      case 'sbtc':
        return STXUtils.isValidAddress(address, network);
      case 'btc':
        // Basic Bitcoin address validation (simplified)
        return this.isValidBitcoinAddress(address, network);
      default:
        return false;
    }
  }

  /**
   * Basic Bitcoin address validation
   * @param address Bitcoin address
   * @param network Network type
   * @returns true if address appears valid
   */
  private static isValidBitcoinAddress(address: string, network: 'mainnet' | 'testnet'): boolean {
    if (!address || typeof address !== 'string') {
      return false;
    }

    // Very basic validation - in production, use a proper Bitcoin library
    if (network === 'mainnet') {
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
    } else {
      return /^(tb1|[2mn])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
    }
  }

  /**
   * Format address for display (truncate middle)
   * @param address Full address
   * @param startChars Characters to show at start
   * @param endChars Characters to show at end
   * @returns Formatted address like "SP1234...wxyz"
   */
  static formatForDisplay(address: string, startChars: number = 6, endChars: number = 4): string {
    if (!address || address.length <= startChars + endChars) {
      return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }
}

// Export everything
export { STXUtils as STX, CurrencyUtils as Currency, AddressUtils as Address };