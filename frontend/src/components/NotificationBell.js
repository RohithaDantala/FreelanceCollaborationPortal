// frontend/src/components/NotificationBell.js - IMPROVED VERSION
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../redux/slices/notificationSlice';

const NotificationBell = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef(null);
  const prevUnreadCount = useRef(unreadCount);

  useEffect(() => {
    // Fetch unread count on mount
    dispatch(getUnreadCount());

    // Poll for new notifications every 15 seconds (more frequent)
    const interval = setInterval(() => {
      dispatch(getUnreadCount());
    }, 15000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Animate bell when new notifications arrive
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current && unreadCount > 0) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    // Fetch notifications when dropdown opens
    if (showDropdown) {
      dispatch(getNotifications({ page: 1, limit: 10 }));
    }
  }, [showDropdown, dispatch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await dispatch(markAsRead(notification._id));
      dispatch(getUnreadCount());
    }
    setShowDropdown(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    await dispatch(markAllAsRead());
    dispatch(getUnreadCount());
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await dispatch(deleteNotification(id));
    dispatch(getUnreadCount());
  };

  const getNotificationIcon = (type) => {
    const icons = {
      project_application: '📝',
      application_accepted: '✅',
      application_rejected: '❌',
      member_removed: '👋',
      task_assigned: '📋',
      task_completed: '✓',
      file_uploaded: '📁',
      deliverable_submitted: '📤',
      deliverable_reviewed: '👀',
      project_updated: '🔄',
      comment_mention: '💬',
      payment_created: '💰',
      payment_escrowed: '🔒',
      payment_released: '✅',
      payment_refunded: '↩️',
      payment_disputed: '⚠️',
    };
    return icons[type] || '🔔';
  };

  const formatTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return notificationDate.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all ${
          isAnimating ? 'animate-bounce' : ''
        }`}
      >
        <svg 
          className={`w-6 h-6 ${isAnimating ? 'animate-wiggle' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div 
          className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200 max-h-[600px] overflow-hidden flex flex-col animate-slideDown"
          style={{
            animation: 'slideDown 0.2s ease-out'
          }}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              🔔 Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium px-3 py-1 rounded-full hover:bg-primary-50 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all ${
                    !notification.isRead ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0 animate-fadeIn">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                          {notification.title}
                        </h4>
                        <button
                          onClick={(e) => handleDelete(e, notification._id)}
                          className="text-gray-400 hover:text-red-600 flex-shrink-0 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.createdAt)}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p>No notifications yet</p>
                <p className="text-xs mt-1">We'll notify you when something happens</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center bg-gray-50">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/notifications');
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline"
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }

        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in;
        }

        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;