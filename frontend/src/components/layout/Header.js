import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import NotificationBell from '../NotificationBell';

const Header = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Check if user is project owner or admin
  const canCreateProject = user && (user.role === 'project_owner' || user.role === 'admin');

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-xl font-bold text-gray-800">
              FreelanceHub
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-6">
            <Link
              to="/"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/projects"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Browse Projects
            </Link>
            {user && (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/my-projects"
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                >
                  My Projects
                </Link>
              </>
            )}
          </div>

          {/* Auth Buttons or User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />
                
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">
                    Hi, <span className="font-semibold">{user.firstName}</span>
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'project_owner' 
                      ? 'bg-purple-100 text-purple-800' 
                      : user.role === 'admin'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role === 'project_owner' ? '👔 Owner' : 
                     user.role === 'admin' ? '⚡ Admin' : '💼 Freelancer'}
                  </span>
                </div>
                
                {/* Only show Create Project for project owners and admins */}
                {canCreateProject && (
                  <Link
                    to="/projects/create"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    + Create Project
                  </Link>
                )}
                
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;