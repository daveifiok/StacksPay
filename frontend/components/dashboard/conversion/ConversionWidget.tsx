"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpDown, 
  ArrowRight,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Balance {
  currency: string;
  amount: number;
  usdValue: number;
  available: number;
}

interface ConversionRate {
  rate: number;
  provider: string;
  estimatedTime: string;
  fees: {
    conversion: number;
    network: number;
    total: number;
  };
}

interface ConversionWidgetProps {
  balances: Balance[];
  onConversionComplete: (transaction: any) => void;
}

export function ConversionWidget({ balances, onConversionComplete }: ConversionWidgetProps) {
  const [fromCurrency, setFromCurrency] = useState('STX');
  const [toCurrency, setToCurrency] = useState('sBTC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [conversionRate, setConversionRate] = useState<ConversionRate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState('');

  // Available conversion pairs
  const supportedPairs = [
    { from: 'STX', to: 'sBTC', provider: 'internal', estimatedTime: '5-10 min' },
    { from: 'sBTC', to: 'STX', provider: 'internal', estimatedTime: '5-10 min' },
    { from: 'BTC', to: 'sBTC', provider: 'internal', estimatedTime: '10-20 min' },
    { from: 'sBTC', to: 'BTC', provider: 'internal', estimatedTime: '10-20 min' },
    { from: 'USD', to: 'USDC', provider: 'circle', estimatedTime: 'Instant' },
    { from: 'USDC', to: 'USD', provider: 'circle', estimatedTime: 'Instant' },
    { from: 'BTC', to: 'USDC', provider: 'coinbase', estimatedTime: '10-30 min' },
    { from: 'USDC', to: 'BTC', provider: 'coinbase', estimatedTime: '10-30 min' },
    { from: 'STX', to: 'USDC', provider: 'internal', estimatedTime: '15 min' },
    { from: 'sBTC', to: 'USDC', provider: 'circle', estimatedTime: '5-15 min' },
  ];

  const getAvailableToCurrencies = (from: string) => {
    return supportedPairs
      .filter(pair => pair.from === from)
      .map(pair => pair.to);
  };

  const getAvailableFromCurrencies = () => {
    return balances
      .filter(balance => balance.available > 0)
      .map(balance => balance.currency);
  };

  const selectedBalance = balances.find(b => b.currency === fromCurrency);

  // Fetch conversion rate
  useEffect(() => {
    if (fromCurrency && toCurrency && fromAmount && parseFloat(fromAmount) > 0) {
      fetchConversionRate();
    } else {
      setConversionRate(null);
      setToAmount('');
    }
  }, [fromCurrency, toCurrency, fromAmount]);

  const fetchConversionRate = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call to conversion service
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock conversion rates
      const mockRates: Record<string, number> = {
        'STX/sBTC': 0.00001111,
        'sBTC/STX': 90000,
        'BTC/sBTC': 1,
        'sBTC/BTC': 1,
        'USD/USDC': 1.001,
        'USDC/USD': 0.999,
        'BTC/USDC': 45000,
        'USDC/BTC': 0.0000222,
        'STX/USDC': 0.5,
        'sBTC/USDC': 45000,
      };

      const pair = `${fromCurrency}/${toCurrency}`;
      const rate = mockRates[pair] || 1;
      const amount = parseFloat(fromAmount);
      
      // Calculate fees based on provider
      const pairInfo = supportedPairs.find(p => p.from === fromCurrency && p.to === toCurrency);
      let conversionFee = 0.005; // 0.5% default
      let networkFee = 0;

      if (pairInfo?.provider === 'circle') {
        conversionFee = 0.003; // 0.3% for Circle
        networkFee = 0.1;
      } else if (pairInfo?.provider === 'coinbase') {
        conversionFee = 0.01; // 1% for Coinbase
        networkFee = 0.5;
      } else {
        conversionFee = 0.005; // 0.5% for internal
        networkFee = 0.01;
      }

      const grossAmount = amount * rate;
      const conversionFeeAmount = grossAmount * conversionFee;
      const totalFees = conversionFeeAmount + networkFee;
      const netAmount = grossAmount - totalFees;

      setConversionRate({
        rate,
        provider: pairInfo?.provider || 'internal',
        estimatedTime: pairInfo?.estimatedTime || '5-15 min',
        fees: {
          conversion: conversionFeeAmount,
          network: networkFee,
          total: totalFees,
        },
      });

      setToAmount(netAmount.toFixed(8));
    } catch (err) {
      setError('Failed to fetch conversion rate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapCurrencies = () => {
    const availableTo = getAvailableToCurrencies(toCurrency);
    if (availableTo.includes(fromCurrency)) {
      setFromCurrency(toCurrency);
      setToCurrency(fromCurrency);
      setFromAmount(toAmount);
      setToAmount('');
    }
  };

  const handleConvert = async () => {
    if (!conversionRate || !fromAmount || !selectedBalance) return;

    const amount = parseFloat(fromAmount);
    if (amount > selectedBalance.available) {
      setError('Insufficient balance');
      return;
    }

    setIsConverting(true);
    setError('');

    try {
      // Simulate conversion API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create transaction record
      const transaction = {
        id: Date.now().toString(),
        type: 'conversion' as const,
        fromCurrency,
        toCurrency,
        fromAmount: amount,
        toAmount: parseFloat(toAmount),
        amount: parseFloat(toAmount),
        currency: toCurrency,
        status: 'processing' as const,
        timestamp: new Date(),
        provider: conversionRate.provider,
        fees: conversionRate.fees,
      };

      onConversionComplete(transaction);

      // Reset form
      setFromAmount('');
      setToAmount('');
      setConversionRate(null);

    } catch (err) {
      setError('Conversion failed. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const canConvert = conversionRate && fromAmount && !isLoading && !isConverting && 
    selectedBalance && parseFloat(fromAmount) <= selectedBalance.available;

  return (
    <Card className="bg-white dark:bg-gray-900 border shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5" />
          Currency Conversion
        </CardTitle>
        <CardDescription>
          Convert between currencies using our multi-provider network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* From Currency */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="from-amount">From</Label>
            {selectedBalance && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Available: {selectedBalance.available} {fromCurrency}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                {getAvailableFromCurrencies().map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="from-amount"
              type="number"
              placeholder="0.00"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="flex-1"
            />
            {selectedBalance && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFromAmount(selectedBalance.available.toString())}
              >
                Max
              </Button>
            )}
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwapCurrencies}
            className="rounded-full p-2"
            disabled={!getAvailableToCurrencies(toCurrency).includes(fromCurrency)}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* To Currency */}
        <div className="space-y-3">
          <Label htmlFor="to-amount">To</Label>
          <div className="flex gap-3">
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                {getAvailableToCurrencies(fromCurrency).map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="to-amount"
              type="number"
              placeholder="0.00"
              value={toAmount}
              readOnly
              className="flex-1 bg-gray-50 dark:bg-gray-800"
            />
          </div>
        </div>

        {/* Conversion Rate Info */}
        {conversionRate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <Card className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <span className="font-medium">
                      1 {fromCurrency} = {conversionRate.rate.toFixed(8)} {toCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provider:</span>
                    <Badge variant="secondary" className="text-xs">
                      {conversionRate.provider}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated time:</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {conversionRate.estimatedTime}
                    </span>
                  </div>
                  <div className="pt-2 border-t space-y-1">
                    <div className="flex justify-between">
                      <span>Conversion fee:</span>
                      <span>{conversionRate.fees.conversion.toFixed(6)} {toCurrency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network fee:</span>
                      <span>{conversionRate.fees.network.toFixed(6)} {toCurrency}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total fees:</span>
                      <span>{conversionRate.fees.total.toFixed(6)} {toCurrency}</span>
                    </div>
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

        {/* Convert Button */}
        <Button
          onClick={handleConvert}
          disabled={!canConvert}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
          size="lg"
        >
          {isConverting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
          {isLoading ? 'Getting rate...' : isConverting ? 'Converting...' : 'Convert'}
        </Button>

        {/* Info */}
        <Alert className="bg-white dark:bg-gray-900 border shadow-sm">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Conversions are processed through our secure multi-provider network. 
            Rates are updated in real-time and include all applicable fees.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
