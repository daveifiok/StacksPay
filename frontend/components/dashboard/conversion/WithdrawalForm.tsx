"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight,
  CreditCard,
  Landmark,
  Wallet,
  AlertTriangle,
  Info,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Balance {
  currency: string;
  amount: number;
  available: number;
}

interface WithdrawalMethod {
  id: string;
  type: 'bank' | 'crypto' | 'card';
  name: string;
  details: string;
  currency: string;
  fees: {
    fixed: number;
    percentage: number;
  };
  minAmount: number;
  maxAmount: number;
  estimatedTime: string;
}

interface WithdrawalFormProps {
  balances: Balance[];
  onWithdrawalSubmit: (withdrawal: any) => void;
}

export function WithdrawalForm({ balances, onWithdrawalSubmit }: WithdrawalFormProps) {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Mock withdrawal methods
  const withdrawalMethods: WithdrawalMethod[] = [
    {
      id: 'bank_usd',
      type: 'bank',
      name: 'Bank Transfer (ACH)',
      details: 'Direct deposit to your bank account',
      currency: 'USD',
      fees: { fixed: 5, percentage: 0 },
      minAmount: 50,
      maxAmount: 50000,
      estimatedTime: '1-3 business days',
    },
    {
      id: 'wire_usd',
      type: 'bank',
      name: 'Wire Transfer',
      details: 'International wire transfer',
      currency: 'USD',
      fees: { fixed: 25, percentage: 0 },
      minAmount: 500,
      maxAmount: 100000,
      estimatedTime: '1-2 business days',
    },
    {
      id: 'crypto_btc',
      type: 'crypto',
      name: 'Bitcoin Wallet',
      details: 'Send to external Bitcoin address',
      currency: 'sBTC',
      fees: { fixed: 0.0001, percentage: 0 },
      minAmount: 0.001,
      maxAmount: 10,
      estimatedTime: '10-30 minutes',
    },
    {
      id: 'crypto_usdc',
      type: 'crypto',
      name: 'USDC Wallet',
      details: 'Send to Ethereum/Polygon address',
      currency: 'USDC',
      fees: { fixed: 1, percentage: 0 },
      minAmount: 10,
      maxAmount: 100000,
      estimatedTime: '5-15 minutes',
    },
    {
      id: 'stx_wallet',
      type: 'crypto',
      name: 'STX Wallet',
      details: 'Send to Stacks wallet address',
      currency: 'STX',
      fees: { fixed: 0.1, percentage: 0 },
      minAmount: 1,
      maxAmount: 100000,
      estimatedTime: '5-10 minutes',
    },
  ];

  const availableBalances = balances.filter(balance => balance.available > 0);
  const selectedBalance = balances.find(b => b.currency === selectedCurrency);
  const availableMethods = withdrawalMethods.filter(method => method.currency === selectedCurrency);
  const selectedMethodData = withdrawalMethods.find(m => m.id === selectedMethod);

  const calculateFees = (withdrawalAmount: number, method: WithdrawalMethod) => {
    const percentageFee = withdrawalAmount * method.fees.percentage;
    const totalFee = method.fees.fixed + percentageFee;
    return {
      fixed: method.fees.fixed,
      percentage: percentageFee,
      total: totalFee,
      net: withdrawalAmount - totalFee,
    };
  };

  const fees = selectedMethodData && amount 
    ? calculateFees(parseFloat(amount) || 0, selectedMethodData)
    : null;

  const canWithdraw = selectedBalance && selectedMethodData && amount && 
    parseFloat(amount) >= selectedMethodData.minAmount &&
    parseFloat(amount) <= Math.min(selectedMethodData.maxAmount, selectedBalance.available) &&
    (selectedMethodData.type !== 'crypto' || recipientAddress);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWithdraw || !selectedMethodData || !fees) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const withdrawal = {
        id: Date.now().toString(),
        type: 'withdrawal' as const,
        amount: parseFloat(amount),
        currency: selectedCurrency,
        status: 'processing' as const,
        timestamp: new Date(),
        method: selectedMethodData.name,
        recipientAddress: selectedMethodData.type === 'crypto' ? recipientAddress : undefined,
        fees: {
          total: fees.total,
          network: fees.fixed,
        },
        estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        note,
      };

      onWithdrawalSubmit(withdrawal);

      // Reset form
      setAmount('');
      setRecipientAddress('');
      setNote('');
      setSelectedMethod('');

    } catch (err) {
      setError('Withdrawal request failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <Landmark className="h-4 w-4" />;
      case 'crypto':
        return <Wallet className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <ArrowUpRight className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5" />
          Withdraw Funds
        </CardTitle>
        <CardDescription>
          Transfer your earnings to external accounts or wallets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Currency Selection */}
          <div className="space-y-3">
            <Label>Select Currency</Label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                {availableBalances.map((balance) => (
                  <SelectItem key={balance.currency} value={balance.currency}>
                    {balance.currency} - Available: {balance.available}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="withdrawal-amount">Amount</Label>
              {selectedBalance && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Available: {selectedBalance.available} {selectedCurrency}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Input
                id="withdrawal-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
              />
              {selectedBalance && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(selectedBalance.available.toString())}
                >
                  Max
                </Button>
              )}
            </div>
          </div>

          {/* Withdrawal Method */}
          <div className="space-y-3">
            <Label>Withdrawal Method</Label>
            <div className="grid gap-3">
              {availableMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedMethod === method.id
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600'
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getMethodIcon(method.type)}
                      <div>
                        <p className="font-medium">{method.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {method.details}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {method.estimatedTime}
                      </Badge>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Fee: {method.fees.fixed} {method.currency}
                        {method.fees.percentage > 0 && ` + ${method.fees.percentage}%`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recipient Address (for crypto withdrawals) */}
          {selectedMethodData?.type === 'crypto' && (
            <div className="space-y-3">
              <Label htmlFor="recipient-address">
                Recipient Address *
              </Label>
              <Input
                id="recipient-address"
                placeholder={`Enter ${selectedCurrency} address`}
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          )}

          {/* Note */}
          <div className="space-y-3">
            <Label htmlFor="withdrawal-note">Note (Optional)</Label>
            <Textarea
              id="withdrawal-note"
              placeholder="Add a note for this withdrawal"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          {/* Fee Breakdown */}
          {fees && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Withdrawal Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span>{amount} {selectedCurrency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing fee:</span>
                      <span>{fees.total.toFixed(6)} {selectedCurrency}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-medium">
                      <span>You'll receive:</span>
                      <span>{fees.net.toFixed(6)} {selectedCurrency}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!canWithdraw}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
            size="lg"
          >
            {isSubmitting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {isSubmitting ? 'Processing...' : `Withdraw ${amount || '0'} ${selectedCurrency}`}
          </Button>

          {/* Info */}
          <Alert className="bg-white dark:bg-gray-900 border shadow-sm">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Withdrawals are processed securely through our verified partners. 
              Processing times may vary based on network conditions and verification requirements.
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  );
}
