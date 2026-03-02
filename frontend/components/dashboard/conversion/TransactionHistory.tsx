"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpDown, 
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface ConversionTransaction {
  id: string;
  type: 'conversion' | 'deposit' | 'withdrawal' | 'receive';
  fromCurrency?: string;
  toCurrency?: string;
  fromAmount?: number;
  toAmount?: number;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: Date;
  txId?: string;
  provider?: string;
  fees: {
    conversion?: number;
    network?: number;
    total: number;
  };
}

interface TransactionHistoryProps {
  transactions: ConversionTransaction[];
  limit?: number;
}

export function TransactionHistory({ transactions, limit = 10 }: TransactionHistoryProps) {
  const displayTransactions = transactions.slice(0, limit);

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'pending' || status === 'processing') {
      return <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />;
    }
    if (status === 'failed') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (status === 'completed') {
      switch (type) {
        case 'conversion':
          return <ArrowUpDown className="h-4 w-4 text-blue-500" />;
        case 'withdrawal':
          return <ArrowUpRight className="h-4 w-4 text-red-500" />;
        case 'deposit':
        case 'receive':
          return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
        default:
          return <CheckCircle className="h-4 w-4 text-green-500" />;
      }
    }
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <Badge 
        variant="outline" 
        className={`${variants[status as keyof typeof variants]} text-xs`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'USD' || currency === 'USDC' || currency === 'USDT') {
      return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (currency === 'sBTC' || currency === 'BTC') {
      return `${amount.toFixed(8)} ${currency}`;
    } else {
      return `${amount.toLocaleString()} ${currency}`;
    }
  };

  const getTransactionDescription = (transaction: ConversionTransaction) => {
    switch (transaction.type) {
      case 'conversion':
        return `Convert ${transaction.fromAmount?.toFixed(6)} ${transaction.fromCurrency} to ${transaction.toAmount?.toFixed(6)} ${transaction.toCurrency}`;
      case 'withdrawal':
        return `Withdraw ${formatAmount(transaction.amount, transaction.currency)}`;
      case 'deposit':
        return `Deposit ${formatAmount(transaction.amount, transaction.currency)}`;
      case 'receive':
        return `Received ${formatAmount(transaction.amount, transaction.currency)}`;
      default:
        return `${transaction.type} ${formatAmount(transaction.amount, transaction.currency)}`;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (displayTransactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No transactions yet</p>
        <p className="text-sm">Your transaction history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayTransactions.map((transaction, index) => (
        <motion.div
          key={transaction.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {getTransactionIcon(transaction.type, transaction.status)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {getTransactionDescription(transaction)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(transaction.timestamp, { addSuffix: true })}
                </p>
                {transaction.provider && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <Badge variant="outline" className="text-xs">
                      {transaction.provider}
                    </Badge>
                  </>
                )}
              </div>
              {transaction.txId && (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {transaction.txId.length > 20 
                      ? `${transaction.txId.substring(0, 10)}...${transaction.txId.substring(transaction.txId.length - 10)}`
                      : transaction.txId
                    }
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => copyToClipboard(transaction.txId!)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {transaction.type === 'conversion' && transaction.toAmount
                  ? `+${formatAmount(transaction.toAmount, transaction.toCurrency!)}`
                  : transaction.type === 'withdrawal'
                  ? `-${formatAmount(transaction.amount, transaction.currency)}`
                  : `+${formatAmount(transaction.amount, transaction.currency)}`
                }
              </p>
              {transaction.fees.total > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Fee: {transaction.fees.total.toFixed(6)}
                </p>
              )}
            </div>
            {getStatusBadge(transaction.status)}
          </div>
        </motion.div>
      ))}

      {transactions.length > limit && (
        <div className="text-center pt-4">
          <Button variant="outline" size="sm">
            View All Transactions
          </Button>
        </div>
      )}
    </div>
  );
}
