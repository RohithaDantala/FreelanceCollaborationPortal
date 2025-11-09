import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const WelcomeModal = ({ user, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getRoleEmoji = () => {
    switch (user.role) {
      case 'admin':
        return '⚡';
      case 'project_owner':
        return '👔';
      case 'freelancer':
        return '💼';
      default:
        return '👋';
    }
  };

  const getRoleBadgeColor = () => {
    switch (user.role) {
      case 'admin':
        return 'from-red-500 to-pink-600';
      case 'project_owner':
        return 'from-purple-500 to-indigo-600';
      case 'freelancer':
        return 'from-blue-500 to-cyan-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-[9998] ${
          isVisible ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div
          className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-all duration-300 transform ${
            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Animated gradient header */}
          <div className={`h-32 bg-gradient-to-r ${getRoleBadgeColor()} relative overflow-hidden`}>
            {/* Animated circles */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-white opacity-10 rounded-full translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Welcome text */}
            <div className="relative h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-2 animate-bounce">🎉</div>
                <h2 className="text-white text-2xl font-bold">Welcome Back!</h2>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* User info */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {user.firstName} {user.lastName}
              </h3>
              <div className="flex items-center justify-center gap-2">
                <span className="text-gray-600">{user.email}</span>
              </div>
            </div>

            {/* Role badge */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-2xl">{getRoleEmoji()}</span>
              <span className={`px-4 py-2 rounded-full text-white font-semibold bg-gradient-to-r ${getRoleBadgeColor()} shadow-lg`}>
                {user.role === 'project_owner' ? 'Project Owner' : 
                 user.role === 'admin' ? 'Administrator' : 
                 'Freelancer'}
              </span>
            </div>

            {/* Quick stats */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
              <p className="text-center text-gray-700 font-medium">
                🚀 Ready to collaborate and create amazing projects!
              </p>
            </div>

            {/* Action button */}
            <button
              onClick={handleClose}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
              Let's Get Started
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WelcomeModal;