import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, MessageSquare, DollarSign, FileText } from 'lucide-react';

const NotificationToast = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'application_accepted':
      case 'task_completed':
      case 'deliverable_approved':
      case 'payment_released':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'application_rejected':
      case 'member_removed':
      case 'payment_disputed':
        return <AlertCircle className="text-red-500" size={24} />;
      case 'comment_mention':
      case 'project_application':
        return <MessageSquare className="text-blue-500" size={24} />;
      case 'payment_created':
      case 'payment_escrowed':
        return <DollarSign className="text-yellow-500" size={24} />;
      case 'file_uploaded':
      case 'deliverable_submitted':
        return <FileText className="text-purple-500" size={24} />;
      default:
        return <Info className="text-blue-500" size={24} />;
    }
  };

  const handleClick = () => {
    if (notification.link) {
      window.location.href = notification.link;
    }
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed top-20 right-4 z-[9999] w-96 transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-3xl transition-shadow"
        onClick={handleClick}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2"></div>
        
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-1">
              {getIcon()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-gray-400 mt-2">Just now</p>
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
            style={{ 
              animation: 'progress 5s linear',
              width: '100%'
            }}
          ></div>
        </div>
      </div>

      {/* ✅ FIXED: Removed jsx attribute */}
      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;