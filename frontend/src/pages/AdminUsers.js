// frontend/src/pages/AdminUsers.js
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: '',
    isActive: '',
    search: '',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
  }, [user, navigate, filters]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data.data.users);
      setPagination({
        totalPages: response.data.data.totalPages,
        currentPage: response.data.data.currentPage,
        totalUsers: response.data.data.totalUsers,
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'suspend' : 'activate'} this user?`)) {
      try {
        await api.put(`/admin/users/${userId}/status`);
        fetchUsers();
      } catch (error) {
        alert('Failed to update user status');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        fetchUsers();
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  };

  const handleChangeRole = async () => {
    if (!newRole || !selectedUser) return;

    try {
      await api.put(`/admin/users/${selectedUser._id}/role`, { role: newRole });
      setShowRoleModal(false);
      setSelectedUser(null);
      setNewRole('');
      fetchUsers();
    } catch (error) {
      alert('Failed to change user role');
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-100 text-red-800',
      project_owner: 'bg-purple-100 text-purple-800',
      freelancer: 'bg-blue-100 text-blue-800',
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link to="/admin/dashboard" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
          <p className="text-gray-600">Manage all users in the system</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />

            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Roles</option>
              <option value="freelancer">Freelancer</option>
              <option value="project_owner">Project Owner</option>
              <option value="admin">Admin</option>
            </select>

            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Suspended</option>
            </select>

            <button
              onClick={() => setFilters({ role: '', isActive: '', search: '', page: 1, limit: 20 })}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-800">{pagination.totalUsers || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-500">Active Users</p>
            <p className="text-2xl font-bold text-green-600">
              {users.filter(u => u.isActive).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-500">Suspended Users</p>
            <p className="text-2xl font-bold text-red-600">
              {users.filter(u => !u.isActive).length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((usr) => (
                    <tr key={usr._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-600 font-semibold">
                              {usr.firstName?.charAt(0)}{usr.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {usr.firstName} {usr.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{usr.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(usr.role)}`}>
                          {usr.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          usr.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {usr.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {usr.lastLogin ? new Date(usr.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openRoleModal(usr)}
                            className="text-blue-600 hover:text-blue-900"
                            disabled={usr.role === 'admin'}
                          >
                            Change Role
                          </button>
                          <button
                            onClick={() => handleToggleStatus(usr._id, usr.isActive)}
                            className={`${usr.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                            disabled={usr.role === 'admin'}
                          >
                            {usr.isActive ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(usr._id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={usr.role === 'admin'}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                <div className="text-sm text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Role Change Modal */}
        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Change User Role</h2>
              <p className="text-gray-600 mb-4">
                Changing role for: <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="freelancer">Freelancer</option>
                  <option value="project_owner">Project Owner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleChangeRole}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Confirm Change
                </button>
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedUser(null);
                    setNewRole('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;