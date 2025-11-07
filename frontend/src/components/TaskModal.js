import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
} from '../redux/slices/taskSlice';

const TaskModal = ({ task, projectId, onClose, onDelete, onUpdate }) => {
  const dispatch = useDispatch();
  const { currentProject } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);
  const isOwner = currentProject?.owner?._id === user?.id;  
  const isOwner = currentProject?.owner?._id === user.id;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    assignee: task.assignee?._id || '',
    status: task.status,
    priority: task.priority,
    deadline: task.deadline ? task.deadline.split('T')[0] : '',
    labels: task.labels?.join(', ') || '',
    estimatedHours: task.estimatedHours || '',
  });

  const [newSubtask, setNewSubtask] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        assignee: formData.assignee || null,
        status: formData.status,
        priority: formData.priority,
        deadline: formData.deadline || null,
        labels: formData.labels
          ? formData.labels.split(',').map((l) => l.trim())
          : [],
        estimatedHours: formData.estimatedHours
          ? parseFloat(formData.estimatedHours)
          : null,
      };

      await dispatch(updateTask({ id: task._id, taskData })).unwrap();
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;

    try {
      await dispatch(
        addSubtask({ taskId: task._id, title: newSubtask })
      ).unwrap();
      setNewSubtask('');
      onUpdate();
    } catch (error) {
      console.error('Failed to add subtask:', error);
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      await dispatch(toggleSubtask({ taskId: task._id, subtaskId })).unwrap();
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm('Delete this subtask?')) return;

    try {
      await dispatch(deleteSubtask({ taskId: task._id, subtaskId })).unwrap();
      onUpdate();
    } catch (error) {
      console.error('Failed to delete subtask:', error);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-yellow-100 text-yellow-800',
      done: 'bg-green-100 text-green-800',
    };
    return colors[status] || colors.todo;
  };

  const isOverdue =
    task.deadline &&
    new Date(task.deadline) < new Date() &&
    task.status !== 'done';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full text-2xl font-bold text-gray-800 border-b-2 border-primary-500 focus:outline-none"
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-800">{task.title}</h2>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    task.status
                  )}`}
                >
                  {task.status.replace('_', ' ')}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority} priority
                </span>
                {isOverdue && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    ⚠️ Overdue
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl ml-4"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isEditing ? (
              <>
               {/* ONLY SHOW EDIT/DELETE FOR OWNER */}
        {isOwner && (
            <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Edit Task
                </button>
                <button
                  onClick={() => onDelete(task._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Task
                </button>
              </>
               )}
            </>
            ) : (
              <>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      title: task.title,
                      description: task.description || '',
                      assignee: task.assignee?._id || '',
                      status: task.status,
                      priority: task.priority,
                      deadline: task.deadline ? task.deadline.split('T')[0] : '',
                      labels: task.labels?.join(', ') || '',
                      estimatedHours: task.estimatedHours || '',
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
            {isEditing ? (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Add task description"
                readOnly={!isOwner || !isEditing}
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">
                {task.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              {isEditing ? (
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={!isOwner || !isEditing}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              ) : (
                <p className="text-gray-700 capitalize">{task.status.replace('_', ' ')}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority
              </label>
              {isEditing ? (
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              ) : (
                <p className="text-gray-700 capitalize">{task.priority}</p>
              )}
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assigned To
              </label>
              {isEditing ? (
                <select
                  name="assignee"
                  value={formData.assignee}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Unassigned</option>
                  {currentProject?.members?.map((member) => (
                    <option key={member.user._id} value={member.user._id}>
                      {member.user.firstName} {member.user.lastName}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-700">
                  {task.assignee
                    ? `${task.assignee.firstName} ${task.assignee.lastName}`
                    : 'Unassigned'}
                </p>
              )}
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deadline
              </label>
              {isEditing ? (
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  readOnly={!isOwner || !isEditing}
                />
              ) : (
                <p className={`text-gray-700 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                  {task.deadline
                    ? new Date(task.deadline).toLocaleDateString()
                    : 'No deadline'}
                </p>
              )}
            </div>

            {/* Estimated Hours */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Estimated Hours
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="estimatedHours"
                  value={formData.estimatedHours}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  readOnly={!isOwner || !isEditing}
                />
              ) : (
                <p className="text-gray-700">
                  {task.estimatedHours ? `${task.estimatedHours} hours` : 'Not estimated'}
                </p>
              )}
            </div>

            {/* Labels */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Labels
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="labels"
                  value={formData.labels}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="bug, feature, urgent"
                  readOnly={!isOwner || !isEditing}
                />
              ) : task.labels && task.labels.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {task.labels.map((label, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No labels</p>
              )}
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Subtasks ({task.subtasks?.filter((st) => st.completed).length || 0}/
              {task.subtasks?.length || 0})
            </h3>

            {/* Add Subtask Form */}
        {isOwner && isEditing && (
            <form onSubmit={handleAddSubtask} className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Add a subtask"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
              >
                Add
              </button>
            </form>
        )}
            {/* Subtask List */}
            <div className="space-y-2">
              {task.subtasks && task.subtasks.length > 0 ? (
                task.subtasks.map((subtask) => (
                  <div
                    key={subtask._id}
                    className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => handleToggleSubtask(subtask._id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span
                      className={`flex-1 text-sm ${
                        subtask.completed
                          ? 'text-gray-400 line-through'
                          : 'text-gray-700'
                      }`}
                    >
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => handleDeleteSubtask(subtask._id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                      disabled={!isOwner}
                    >
                      Delete
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No subtasks yet</p>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t text-sm text-gray-500">
            <p>Created by: {task.createdBy?.firstName} {task.createdBy?.lastName}</p>
            <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
            <p>Last updated: {new Date(task.updatedAt).toLocaleString()}</p>
            {task.completedAt && (
              <p>Completed: {new Date(task.completedAt).toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;