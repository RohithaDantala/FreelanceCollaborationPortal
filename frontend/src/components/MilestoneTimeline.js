// frontend/src/components/MilestoneTimeline.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getProjectMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  reset,
} from '../redux/slices/milestoneSlice';

const MilestoneTimeline = ({ projectId }) => {
  const dispatch = useDispatch();
  const { milestones, isLoading } = useSelector((state) => state.milestones);
  const { user } = useSelector((state) => state.auth);
  const { currentProject } = useSelector((state) => state.projects);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
  });

  const isOwner = currentProject?.owner?._id === user.id;

  useEffect(() => {
    if (projectId) {
      dispatch(getProjectMilestones(projectId));
    }
    return () => dispatch(reset());
  }, [dispatch, projectId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMilestone) {
        await dispatch(
          updateMilestone({
            id: editingMilestone._id,
            milestoneData: formData,
          })
        ).unwrap();
      } else {
        await dispatch(
          createMilestone({ projectId, milestoneData: formData })
        ).unwrap();
      }
      setShowCreateModal(false);
      setEditingMilestone(null);
      setFormData({ title: '', description: '', dueDate: '' });
      dispatch(getProjectMilestones(projectId));
    } catch (error) {
      alert(error);
    }
  };

  const handleEdit = (milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      title: milestone.title,
      description: milestone.description,
      dueDate: milestone.dueDate.split('T')[0],
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      await dispatch(deleteMilestone(id));
      dispatch(getProjectMilestones(projectId));
    }
  };

  const handleStatusChange = async (milestone, newStatus) => {
    await dispatch(
      updateMilestone({
        id: milestone._id,
        milestoneData: { status: newStatus },
      })
    );
    dispatch(getProjectMilestones(projectId));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800 border-gray-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[status] || colors.pending;
  };

  const getProgressColor = (progress) => {
    if (progress >= 75) return 'bg-green-600';
    if (progress >= 50) return 'bg-blue-600';
    if (progress >= 25) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const isOverdue = (milestone) => {
    if (milestone.status === 'completed') return false;
    return new Date(milestone.dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Milestones</h2>
        {isOwner && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            + Add Milestone
          </button>
        )}
      </div>

      {/* Timeline */}
      {milestones.length > 0 ? (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

          {/* Milestones */}
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={milestone._id} className="relative pl-20">
                {/* Timeline dot */}
                <div
                  className={`absolute left-6 w-5 h-5 rounded-full border-4 ${
                    milestone.status === 'completed'
                      ? 'bg-green-600 border-green-200'
                      : milestone.status === 'in_progress'
                      ? 'bg-blue-600 border-blue-200'
                      : 'bg-gray-400 border-gray-200'
                  }`}
                ></div>

                {/* Milestone card */}
                <div
                  className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                    isOverdue(milestone) && milestone.status !== 'completed'
                      ? 'border-red-500'
                      : 'border-primary-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {milestone.title}
                      </h3>
                      {milestone.description && (
                        <p className="text-gray-600 text-sm">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          milestone.status
                        )}`}
                      >
                        {milestone.status.replace('_', ' ')}
                      </span>
                      {isOwner && (
                        <>
                          <button
                            onClick={() => handleEdit(milestone)}
                            className="text-primary-600 hover:text-primary-700 p-1"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(milestone._id)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span className="font-medium">{milestone.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressColor(
                          milestone.progress
                        )}`}
                        style={{ width: `${milestone.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Due date and tasks */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span
                        className={`${
                          isOverdue(milestone) && milestone.status !== 'completed'
                            ? 'text-red-600 font-semibold'
                            : 'text-gray-500'
                        }`}
                      >
                        {isOverdue(milestone) && milestone.status !== 'completed' && '⚠️ '}
                        Due: {new Date(milestone.dueDate).toLocaleDateString()}
                      </span>
                      {milestone.tasks && milestone.tasks.length > 0 && (
                        <span className="text-gray-500">
                          📋 {milestone.tasks.length} task
                          {milestone.tasks.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Status change buttons */}
                    {isOwner && milestone.status !== 'completed' && (
                      <div className="flex gap-2">
                        {milestone.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(milestone, 'in_progress')}
                            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Start
                          </button>
                        )}
                        {milestone.status === 'in_progress' && (
                          <button
                            onClick={() => handleStatusChange(milestone, 'completed')}
                            className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <span className="text-6xl mb-4 block">🎯</span>
          <h3 className="text-lg font-medium text-gray-900">No milestones yet</h3>
          <p className="text-gray-500 mt-2">
            Add milestones to track your project progress
          </p>
          {isOwner && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Add First Milestone
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowCreateModal(false);
            setEditingMilestone(null);
            setFormData({ title: '', description: '', dueDate: '' });
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {editingMilestone ? 'Edit Milestone' : 'Create Milestone'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Complete UI Design"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe the milestone..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingMilestone ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingMilestone(null);
                    setFormData({ title: '', description: '', dueDate: '' });
                  }}
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
  );
};

export default MilestoneTimeline;