import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface PaymentWebSocketMessage {
  type: 'payment.status.changed' | 'payment.confirmed' | 'payment.failed' | 'payment.expired';
  paymentId: string;
  status: string;
  data?: any;
}

export interface WebSocketOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export const usePaymentWebSocket = (
  paymentId: string | undefined,
  onMessage?: (message: PaymentWebSocketMessage) => void,
  options: WebSocketOptions = {}
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  const {
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000
  } = options;

  const connect = useCallback(() => {
    if (!paymentId || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000'}/payments/${paymentId}`;
      const token = localStorage.getItem('authToken');
      
      wsRef.current = new WebSocket(`${wsUrl}${token ? `?token=${token}` : ''}`);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for payment:', paymentId);
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        
        // Start heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, heartbeatInterval);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: PaymentWebSocketMessage = JSON.parse(event.data);
          
          if (message.type === 'payment.status.changed') {
            setPaymentStatus(message.status);
            
            // Show toast notification
            switch (message.status) {
              case 'confirmed':
                toast({
                  title: 'Payment confirmed!',
                  description: 'The payment has been successfully confirmed.',
                });
                break;
              case 'failed':
                toast({
                  title: 'Payment failed',
                  description: 'The payment has failed.',
                  variant: 'destructive',
                });
                break;
              case 'expired':
                toast({
                  title: 'Payment expired',
                  description: 'The payment has expired.',
                  variant: 'destructive',
                });
                break;
            }
          }
          
          // Call custom message handler
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error occurred');
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        
        // Attempt reconnection if not a clean close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          setConnectionError(`Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionError('Max reconnection attempts reached');
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionError('Failed to connect');
    }
  }, [paymentId, onMessage, reconnectInterval, maxReconnectAttempts, heartbeatInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounted');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (paymentId) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [paymentId, connect, disconnect]);

  return {
    isConnected,
    paymentStatus,
    connectionError,
    sendMessage,
    reconnect: connect,
    disconnect
  };
};

// Hook for general WebSocket connection (not payment-specific)
export const useWebSocket = (
  url: string,
  onMessage?: (message: any) => void,
  options: WebSocketOptions = {}
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  const {
    reconnectInterval = 5000,
    maxReconnectAttempts = 5
  } = options;

  const connect = useCallback(() => {
    if (!url || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error occurred');
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          setConnectionError(`Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionError('Max reconnection attempts reached');
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionError('Failed to connect');
    }
  }, [url, onMessage, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounted');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (url) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [url, connect, disconnect]);

  return {
    isConnected,
    connectionError,
    sendMessage,
    reconnect: connect,
    disconnect
  };
};
