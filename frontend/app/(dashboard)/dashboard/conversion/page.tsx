"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ArrowUpRight,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BalanceCard } from '@/components/dashboard/conversion/BalanceCard';
import { TransactionHistory } from '@/components/dashboard/conversion/TransactionHistory';
import { ConversionWidget } from '@/components/dashboard/conversion/ConversionWidget';
import { WithdrawalForm } from '@/components/dashboard/conversion/WithdrawalForm';


interface Balance {
  currency: string;
  amount: number;
  usdValue: number;
  change24h: number;
  available: number;
  pending: number;
  reserved: number;
}

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

export default function ConversionPage() {
  const [balances, setBalances] = useState<Balance[]>([
    {
      currency: 'sBTC',
      amount: 0.00125,
      usdValue: 56.25,
      change24h: 2.5,
      available: 0.00125,
      pending: 0,
      reserved: 0,
    },
    {
      currency: 'USD',
      amount: 1234.56,
      usdValue: 1234.56,
      change24h: 0,
      available: 1234.56,
      pending: 0,
      reserved: 0,
    },
    {
      currency: 'USDC',
      amount: 567.89,
      usdValue: 567.89,
      change24h: 0.1,
      available: 567.89,
      pending: 0,
      reserved: 0,
    },
    {
      currency: 'STX',
      amount: 2500,
      usdValue: 1250,
      change24h: -1.2,
      available: 2500,
      pending: 0,
      reserved: 0,
    },
  ]);

  const [transactions, setTransactions] = useState<ConversionTransaction[]>([
    {
      id: '1',
      type: 'conversion',
      fromCurrency: 'STX',
      toCurrency: 'sBTC',
      fromAmount: 100,
      toAmount: 0.001,
      amount: 0.001,
      currency: 'sBTC',
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      provider: 'internal',
      fees: { conversion: 0.5, network: 0.1, total: 0.6 },
    },
    {
      id: '2',
      type: 'withdrawal',
      amount: 500,
      currency: 'USD',
      status: 'processing',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      txId: 'USD_WIRE_789',
      fees: { network: 25, total: 25 },
    },
    {
      id: '3',
      type: 'receive',
      amount: 0.0005,
      currency: 'sBTC',
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      txId: 'sbtc_123...',
      fees: { total: 0 },
    },
  ]);

  const [activeTab, setActiveTab] = useState<'overview' | 'convert' | 'withdraw'>('overview');
  const [hideBalances, setHideBalances] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const totalUsdBalance = balances.reduce((sum, balance) => sum + balance.usdValue, 0);
  const totalChange24h = balances.reduce((sum, balance) => sum + (balance.usdValue * balance.change24h / 100), 0);
  const totalChangePercent = totalChange24h / totalUsdBalance * 100;

  const refreshBalances = async () => {
    setIsLoading(true);
    // TODO: Implement actual API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Balance & Conversion
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your funds, convert currencies, and withdraw earnings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHideBalances(!hideBalances)}
            className="flex items-center gap-2"
          >
            {hideBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {hideBalances ? 'Show' : 'Hide'} Balances
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshBalances}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Total Balance Card */}
      <Card className="bg-orange-600 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Balance</p>
              <h2 className="text-3xl font-bold">
                {hideBalances ? '••••••' : `$${totalUsdBalance.toLocaleString()}`}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {totalChangePercent >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-300" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-300" />
                )}
                <span className={`text-sm ${totalChangePercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}% (24h)
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={() => setActiveTab('convert')}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Convert
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={() => setActiveTab('withdraw')}
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-1 rounded-lg shadow-sm">
        {[
          { id: 'overview', label: 'Overview', icon: Wallet },
          { id: 'convert', label: 'Convert', icon: ArrowUpDown },
          { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
              activeTab === tab.id
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Balance Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {balances.map((balance) => (
                <BalanceCard
                  key={balance.currency}
                  balance={balance}
                  hideAmount={hideBalances}
                />
              ))}
            </div>

            {/* Recent Activity */}
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest conversions, deposits, and withdrawals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionHistory transactions={transactions} />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'convert' && (
          <div className="max-w-2xl mx-auto">
            <ConversionWidget
              balances={balances}
              onConversionComplete={(transaction) => {
                setTransactions(prev => [transaction, ...prev]);
                // Update balances
                refreshBalances();
              }}
            />
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="max-w-2xl mx-auto">
            <WithdrawalForm
              balances={balances}
              onWithdrawalSubmit={(withdrawal) => {
                setTransactions(prev => [withdrawal, ...prev]);
                refreshBalances();
              }}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}
