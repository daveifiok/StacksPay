export interface SbtcDepositRequest {
  stacksAddress: string;
  amountSats: number;
  bitcoinChangeAddress?: string;
  feeRate?: 'low' | 'medium' | 'high';
  reclaimPublicKey?: string;
  maxSignerFee?: number;
  reclaimLockTime?: number;
}

export interface SbtcDepositResponse {
  depositAddress: string;
  stacksAddress: string;
  depositScript: string;
  reclaimScript: string;
  signerPublicKey: string;
  maxSignerFee: number;
  reclaimLockTime: number;
  expiresAt: Date;
  amountBtc: string;
  amountSats: number;
  network: 'MAINNET' | 'TESTNET';
  qrCodeData: string;
}

export interface SbtcDepositTransaction {
  transaction: any;
  depositAddress: string;
  stacksAddress: string;
  depositScript: string;
  reclaimScript: string;
  signerPublicKey: string;
  txid?: string;
  estimatedFee: number;
  changeAmount: number;
}

export interface SbtcWithdrawalRequest {
  amountMicroSbtc: bigint;
  bitcoinAddress: string;
  stacksPrivateKey: string;
  fee?: number;
}

export interface SbtcBalanceResponse {
  address: string;
  balanceMicroSbtc: string;
  balanceSbtc: string;
  balanceBtc: string;
  lastUpdated: Date;
}

export interface SbtcTransactionStatus {
  txid: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  blockHeight?: number;
  timestamp?: number;
  fee?: number;
}

export interface SbtcNetworkInfo {
  network: 'mainnet' | 'testnet' | 'devnet';
  isMainnet: boolean;
  sbtcApiUrl: string;
  stacksApiUrl: string;
  bitcoinApiUrl: string;
  contractAddress: string;
  signerAddress?: string;
  signerPublicKey?: string;
}