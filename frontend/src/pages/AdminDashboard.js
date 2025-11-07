// frontend/src/pages/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats?.users.total}</p>
                <p className="text-sm text-green-600 mt-2">
                  {stats?.users.active} active
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Projects */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Projects</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats?.projects.total}</p>
                <p className="text-sm text-green-600 mt-2">
                  {stats?.projects.active} active
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Tasks */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats?.tasks.total}</p>
                <p className="text-sm text-green-600 mt-2">
                  {stats?.tasks.completionRate}% completed
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Completed Tasks</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats?.tasks.completed}</p>
                <p className="text-sm text-gray-600 mt-2">
                  of {stats?.tasks.total} total
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Overview
              </button>
              <button
                onClick={() => navigate('/admin/users')}
                className="px-6 py-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
              >
                👥 User Management
              </button>
              <button
                onClick={() => navigate('/admin/projects')}
                className="px-6 py-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
              >
                📁 Project Management
              </button>
              <button
                onClick={() => navigate('/admin/logs')}
                className="px-6 py-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
              >
                📋 Activity Logs
              </button>
            </nav>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">User Growth (Last 6 Months)</h3>
            <div className="space-y-3">
              {stats?.users.growth.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(item._id.year, item._id.month - 1).toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-2 flex-1 mx-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((item.count / Math.max(...stats.users.growth.map(g => g.count))) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Project Trends Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Trends (Last 6 Months)</h3>
            <div className="space-y-3">
              {stats?.projects.trends.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(item._id.year, item._id.month - 1).toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-2 flex-1 mx-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((item.count / Math.max(...stats.projects.trends.map(t => t.count))) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">👥</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Manage Users</h4>
                  <p className="text-sm text-gray-600">View and manage all users</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/projects')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📁</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Manage Projects</h4>
                  <p className="text-sm text-gray-600">Oversee all projects</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/logs')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📋</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">View Logs</h4>
                  <p className="text-sm text-gray-600">Check admin activity logs</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;