"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Bitcoin, 
  DollarSign,
  Coins,
  Wallet,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Balance {
  currency: string;
  amount: number;
  usdValue: number;
  change24h: number;
  available: number;
  pending: number;
  reserved: number;
}

interface BalanceCardProps {
  balance: Balance;
  hideAmount?: boolean;
}

const currencyIcons: Record<string, React.ReactNode> = {
  sBTC: <Bitcoin className="h-5 w-5 text-orange-500" />,
  BTC: <Bitcoin className="h-5 w-5 text-orange-500" />,
  USD: <DollarSign className="h-5 w-5 text-green-500" />,
  USDC: <Coins className="h-5 w-5 text-blue-500" />,
  USDT: <Coins className="h-5 w-5 text-green-500" />,
  STX: <Wallet className="h-5 w-5 text-purple-500" />,
  ETH: <Coins className="h-5 w-5 text-blue-600" />,
};

const currencyColors: Record<string, string> = {
  sBTC: 'bg-white dark:bg-gray-900 border-l-4 border-l-orange-500',
  BTC: 'bg-white dark:bg-gray-900 border-l-4 border-l-orange-500',
  USD: 'bg-white dark:bg-gray-900 border-l-4 border-l-green-500',
  USDC: 'bg-white dark:bg-gray-900 border-l-4 border-l-blue-500',
  USDT: 'bg-white dark:bg-gray-900 border-l-4 border-l-green-500',
  STX: 'bg-white dark:bg-gray-900 border-l-4 border-l-purple-500',
  ETH: 'bg-white dark:bg-gray-900 border-l-4 border-l-blue-500',
};

export function BalanceCard({ balance, hideAmount = false }: BalanceCardProps) {
  const isPositiveChange = balance.change24h >= 0;
  const hasActivity = balance.pending > 0 || balance.reserved > 0;

  const formatAmount = (amount: number, currency: string) => {
    if (hideAmount) return '••••••';
    
    if (currency === 'USD' || currency === 'USDC' || currency === 'USDT') {
      return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (currency === 'sBTC' || currency === 'BTC') {
      return `${amount.toFixed(8)} ${currency}`;
    } else {
      return `${amount.toLocaleString()} ${currency}`;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`${currencyColors[balance.currency] || 'bg-white dark:bg-gray-900 border'} hover:shadow-lg transition-all duration-200 border shadow-sm`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {currencyIcons[balance.currency] || <Coins className="h-5 w-5" />}
              <span className="font-semibold text-gray-900 dark:text-white">
                {balance.currency}
              </span>
            </div>
            {hasActivity && (
              <Badge variant="secondary" className="text-xs">
                Activity
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            {/* Main Balance */}
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatAmount(balance.amount, balance.currency)}
              </p>
              {balance.currency !== 'USD' && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {hideAmount ? '••••••' : `≈ $${balance.usdValue.toFixed(2)}`}
                </p>
              )}
            </div>

            {/* 24h Change */}
            <div className="flex items-center gap-1">
              {isPositiveChange ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs font-medium ${
                isPositiveChange ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {isPositiveChange ? '+' : ''}{balance.change24h.toFixed(2)}%
              </span>
              <span className="text-xs text-gray-500">24h</span>
            </div>

            {/* Breakdown */}
            {hasActivity && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Available:</span>
                    <span className="font-medium">
                      {hideAmount ? '••••••' : formatAmount(balance.available, balance.currency)}
                    </span>
                  </div>
                  {balance.pending > 0 && (
                    <div className="flex justify-between">
                      <span className="text-yellow-600 dark:text-yellow-400">Pending:</span>
                      <span className="font-medium text-yellow-600 dark:text-yellow-400">
                        {hideAmount ? '••••••' : formatAmount(balance.pending, balance.currency)}
                      </span>
                    </div>
                  )}
                  {balance.reserved > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Reserved:</span>
                      <span className="font-medium">
                        {hideAmount ? '••••••' : formatAmount(balance.reserved, balance.currency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
