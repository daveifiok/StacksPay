import { ClarityValue } from "@stacks/transactions";

export interface ContractCallData {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  network?: 'mainnet' | 'testnet';
  senderAddress?: string;
}

export interface PaymentContractState {
  merchantAddress: string;
  paymentAmount: bigint;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  stxAmount?: bigint;
  sbtcAmount?: bigint;
  conversionRate?: number;
  timestamp: number;
}