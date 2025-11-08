// frontend/src/pages/ProjectPayments.js - FIXED
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  createPayment,
  getProjectPayments,
  holdInEscrow,
  releasePayment,
  reset,
} from '../redux/slices/paymentSlice';
import { getProject } from '../redux/slices/projectSlice'; // FIXED: getProject not getProjectById
import { toast } from 'react-toastify';

const ProjectPayments = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { payments, earnings, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.payments
  );
  const { user } = useSelector((state) => state.auth);
  // FIXED: Get project from the correct state property
  const { project, currentProject } = useSelector((state) => state.projects);
  
  // Use whichever one exists
  const activeProject = currentProject || project;
  
  // DEBUG: Log the entire projects state
  const projectsState = useSelector((state) => state.projects);
  console.log('Full projects state:', projectsState);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    recipientId: '',
    amount: '',
    currency: 'USD',
    description: '',
    milestoneId: '',
  });

  useEffect(() => {
    // FIXED: Fetch project details first
    dispatch(getProject(projectId));
    dispatch(getProjectPayments(projectId));

    return () => {
      dispatch(reset());
    };
  }, [dispatch, projectId]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    if (isSuccess && message) {
      toast.success(message);
      setShowCreateModal(false);
      setFormData({
        recipientId: '',
        amount: '',
        currency: 'USD',
        description: '',
        milestoneId: '',
      });
    }
  }, [isError, isSuccess, message]);

  const handleCreatePayment = (e) => {
    e.preventDefault();
    dispatch(
      createPayment({
        projectId,
        ...formData,
      })
    );
  };

  const handleHoldInEscrow = (paymentId) => {
    if (window.confirm('Hold this payment in escrow for 7 days?')) {
      dispatch(holdInEscrow({ paymentId, escrowDays: 7 }));
    }
  };

  const handleReleasePayment = (paymentId) => {
    if (window.confirm('Release this payment to the recipient?')) {
      dispatch(releasePayment(paymentId));
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
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  // FIXED: Better ownership check with debug logging
  const isProjectOwner = React.useMemo(() => {
    const proj = activeProject;
    const ownerCheck = proj?.owner?._id === user?.id || proj?.owner === user?.id;
    console.log('Owner check:', {
      projectOwner: proj?.owner?._id || proj?.owner,
      currentUser: user?.id,
      isOwner: ownerCheck,
      hasProject: !!proj
    });
    return ownerCheck;
  }, [activeProject, user]);

  if (isLoading && !payments.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="text-primary-600 hover:text-primary-700 mb-4 flex items-center"
        >
          ← Back to Project
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Payments</h1>
            <p className="text-gray-600 mt-2">Manage project payments and earnings</p>
            {/* DEBUG INFO - Remove after testing */}
            <p className="text-xs text-gray-400 mt-1">
              Owner: {isProjectOwner ? 'Yes' : 'No'} | 
              User: {user?.id} | 
              Project Owner: {activeProject?.owner?._id || activeProject?.owner || 'Loading...'}
            </p>
          </div>
          {isProjectOwner && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              + Create Payment
            </button>
          )}
        </div>
      </div>

      {/* Earnings Summary */}
      {earnings && earnings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {earnings.map((earning) => (
            <div key={earning._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Earnings</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {earning._id} {earning.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{earning.count} payments</p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Payment History</h2>
        </div>

        {payments && payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  {isProjectOwner && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {payment.payer?.avatar && (
                          <img
                            src={payment.payer.avatar}
                            alt=""
                            className="h-8 w-8 rounded-full mr-2"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.payer?.firstName} {payment.payer?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{payment.payer?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {payment.recipient?.avatar && (
                          <img
                            src={payment.recipient.avatar}
                            alt=""
                            className="h-8 w-8 rounded-full mr-2"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.recipient?.firstName} {payment.recipient?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.recipient?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {payment.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                          payment.status
                        )}`}
                      >
                        {payment.status.replace('_', ' ')}
                      </span>
                    </td>
                    {isProjectOwner && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {payment.status === 'pending' && (
                            <button
                              onClick={() => handleHoldInEscrow(payment._id)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Hold Escrow
                            </button>
                          )}
                          {payment.status === 'held_in_escrow' && (
                            <button
                              onClick={() => handleReleasePayment(payment._id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              Release
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💳</div>
            <p className="text-gray-500 text-lg">No payments yet</p>
            {isProjectOwner && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-primary-600 hover:text-primary-700"
              >
                Create your first payment
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Create Payment</h3>
            <form onSubmit={handleCreatePayment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient *
                  </label>
                  <select
                    value={formData.recipientId}
                    onChange={(e) =>
                      setFormData({ ...formData, recipientId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select recipient</option>
                    {activeProject?.members?.map((member) => (
                      <option key={member.user._id || member.user} value={member.user._id || member.user}>
                        {member.user.firstName} {member.user.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows="3"
                    placeholder="Payment description..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPayments;