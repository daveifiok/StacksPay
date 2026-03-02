import React from 'react';
import { Bell, Check, Trash2, X, Filter, AlertCircle, CheckCircle, Clock, Zap, CreditCard, Globe, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotifications } from '@/hooks/use-notifications';
import { useNotificationStore } from '@/stores/notification-store';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/api/notification-api';

const NotificationIcon: React.FC<{ type: Notification['type']; urgency: Notification['urgency'] }> = ({ type, urgency }) => {
  const getIcon = () => {
    switch (type) {
      case 'payment_received':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'payment_failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'deposit_confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'withdrawal_completed':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case 'system_alert':
        return <Globe className="h-4 w-4 text-orange-500" />;
      case 'api_error':
        return <Shield className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getUrgencyStyle = () => {
    switch (urgency) {
      case 'critical':
        return 'animate-pulse';
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-orange-500 dark:text-orange-400';
      case 'low':
        return 'text-gray-500 dark:text-gray-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <div className={`flex-shrink-0 ${getUrgencyStyle()}`}>
      {getIcon()}
    </div>
  );
};

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  isMarkingAsRead: boolean;
  isDeleting: boolean;
}> = ({ notification, onMarkAsRead, onDelete, isMarkingAsRead, isDeleting }) => {
  const isUnread = notification.status === 'unread';

  return (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
      onClick={() => isUnread && onMarkAsRead(notification.id)}
      className={cn(
        'p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors group',
        isUnread && 'bg-blue-50/50 dark:bg-blue-900/10'
      )}
    >
      <div className="flex items-start space-x-3">
        <NotificationIcon type={notification.type} urgency={notification.urgency} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className={cn(
              "text-sm font-medium",
              isUnread 
                ? 'text-gray-900 dark:text-gray-100' 
                : 'text-gray-700 dark:text-gray-300'
            )}>
              {notification.title}
            </p>
            {isUnread && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
              
              {notification.urgency === 'critical' && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                  <Zap className="h-3 w-3 mr-1" />
                  Critical
                </Badge>
              )}
              
              {notification.urgency === 'high' && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  High
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isUnread && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                  disabled={isMarkingAsRead}
                  className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  title="Mark as read"
                >
                  <Check className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                disabled={isDeleting}
                className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                title="Delete notification"
              >
                <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const NotificationDropdown: React.FC = () => {
  const { 
    filter, 
    selectedType, 
    setFilter, 
    setSelectedType, 
    getFilteredNotifications,
    unreadCount,
    hasUnreadNotifications,
  } = useNotificationStore();

  const {
    notifications,
    isLoading,
    isMarkingAsRead,
    isMarkingAllAsRead,
    isDeleting,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    createTestNotification,
    isCreatingTest,
  } = useNotifications({ limit: 50 });

  const filteredNotifications = getFilteredNotifications();

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleTestNotification = () => {
    createTestNotification({
      type: 'payment_received',
      urgency: 'medium',
      amount: 5000,
      currency: 'USD',
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {hasUnreadNotifications() && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
            {hasUnreadNotifications() && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 mb-3">
            {hasUnreadNotifications() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllAsRead}
                className="h-7 px-2 text-xs text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshNotifications}
              disabled={isLoading}
              className="h-7 px-2 text-xs"
            >
              <Bell className="h-3 w-3 mr-1" />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
            
            {/* Test Button (Development) */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTestNotification}
                disabled={isCreatingTest}
                className="h-7 px-2 text-xs text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
              >
                <Zap className="h-3 w-3 mr-1" />
                Test
              </Button>
            )}
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-3 w-3 text-gray-500 dark:text-gray-400" />
            
            {/* Status Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
            
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="all">All Types</option>
              <option value="payment_received">Payments</option>
              <option value="payment_failed">Failed Payments</option>
              <option value="deposit_confirmed">Deposits</option>
              <option value="withdrawal_completed">Withdrawals</option>
              <option value="system_alert">System Alerts</option>
              <option value="api_error">API Errors</option>
            </select>
          </div>
        </div>
        
        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  isMarkingAsRead={isMarkingAsRead}
                  isDeleting={isDeleting}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-800">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-center text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
