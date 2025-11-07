// frontend/src/pages/ProjectPayments.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';

const ProjectPayments = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [payments, setPayments] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    recipientId: '',
    milestoneId: '',
    amount: '',
    currency: 'USD',
    description: '',
  });

  useEffect(() => {
    fetchProject();
    fetchPayments();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data.data.project);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/projects/${id}/payments`);
      setPayments(response.data.data.payments);
      setEarnings(response.data.data.earnings || []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = user && project?.owner?._id === user.id;

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments/create-intent', {
        projectId: id,
        ...formData,
        amount: parseFloat(formData.amount),
      });
      alert('Payment created successfully!');
      setShowCreateModal(false);
      setFormData({
        recipientId: '',
        milestoneId: '',
        amount: '',
        currency: 'USD',
        description: '',
      });
      fetchPayments();
    } catch (error) {
      alert('Failed to create payment');
    }
  };

  const handleReleasePayment = async (paymentId) => {
    if (window.confirm('Are you sure you want to release this payment?')) {
      try {
        await api.post(`/payments/${paymentId}/release`);
        alert('Payment released successfully!');
        fetchPayments();
      } catch (error) {
        alert('Failed to release payment');
      }
    }
  };

  const handleHoldInEscrow = async (paymentId) => {
    try {
      await api.post(`/payments/${paymentId}/escrow`);
      alert('Payment held in escrow successfully!');
      fetchPayments();
    } catch (error) {
      alert('Failed to hold payment in escrow');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      held_in_escrow: 'bg-blue-100 text-blue-800',
      released: 'bg-green-100 text-green-800',
      refunded: 'bg-gray-100 text-gray-800',
      disputed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || badges.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      held_in_escrow: '🔒',
      released: '✅',
      refunded: '↩️',
      disputed: '⚠️',
      cancelled: '❌',
    };
    return icons[status] || '💰';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link to={`/projects/${id}`} className="text-primary-600 hover:text-primary-700">
            ← Back to Project
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">💰 Payment Management</h1>
              <p className="text-gray-600">{project?.title}</p>
            </div>
            {isOwner && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Create Payment
              </button>
            )}
          </div>

          {/* Earnings Summary */}
          {earnings.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Earnings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {earnings.map((earning) => (
                  <div key={earning._id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-700 mb-1">Total Earnings ({earning._id})</p>
                    <p className="text-2xl font-bold text-green-900">
                      {earning._id} {earning.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600 mt-1">{earning.count} transactions</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Payments List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{getStatusIcon(payment.status)}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {payment.currency} {payment.amount.toFixed(2)}
                        </h3>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(payment.status)}`}>
                          {payment.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-1">
                        <strong>From:</strong> {payment.payer?.firstName} {payment.payer?.lastName}
                      </p>
                      <p className="text-gray-600 text-sm mb-1">
                        <strong>To:</strong> {payment.recipient?.firstName} {payment.recipient?.lastName}
                      </p>
                      {payment.description && (
                        <p className="text-gray-600 text-sm mt-2">{payment.description}</p>
                      )}
                      {payment.milestone && (
                        <p className="text-sm text-blue-600 mt-2">
                          🎯 Milestone: {payment.milestone.title}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Created: {new Date(payment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {isOwner && payment.status === 'pending' && (
                      <button
                        onClick={() => handleHoldInEscrow(payment._id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        🔒 Hold in Escrow
                      </button>
                    )}
                    {isOwner && payment.status === 'held_in_escrow' && (
                      <button
                        onClick={() => handleReleasePayment(payment._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        ✅ Release Payment
                      </button>
                    )}
                  </div>
                </div>

                {/* Escrow Info */}
                {payment.status === 'held_in_escrow' && payment.escrowReleaseDate && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Escrow Release Date:</strong>{' '}
                      {new Date(payment.escrowReleaseDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Released Info */}
                {payment.status === 'released' && payment.releasedAt && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Released on:</strong> {new Date(payment.releasedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <span className="text-6xl mb-4 block">💰</span>
            <h3 className="text-lg font-medium text-gray-900">No payments yet</h3>
            <p className="text-gray-500 mt-2">
              {isOwner ? 'Create your first payment to get started' : 'No payments have been created for this project'}
            </p>
          </div>
        )}

        {/* Create Payment Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Create Payment</h2>
              <form onSubmit={handleCreatePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient *
                  </label>
                  <select
                    value={formData.recipientId}
                    onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select recipient...</option>
                    {project?.members
                      ?.filter((m) => m.user._id !== user.id)
                      .map((member) => (
                        <option key={member.user._id} value={member.user._id}>
                          {member.user.firstName} {member.user.lastName}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="100.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Payment for milestone completion..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Create Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectPayments;