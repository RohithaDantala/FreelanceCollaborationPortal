import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getProjectTasks,
  updateTask,
  deleteTask,
  reorderTasks,
  updateTasksOptimistically,
  reset,
} from '../redux/slices/taskSlice';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import CreateTaskModal from './CreateTaskModal';

const KanbanBoard = ({ projectId }) => {
  const dispatch = useDispatch();
  const { groupedTasks, isLoading } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);
  const { currentProject } = useSelector((state) => state.projects);
  
  const isOwner = currentProject?.owner?._id === user.id;
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [createModalStatus, setCreateModalStatus] = useState('todo');

  const columns = [
    { 
      id: 'todo', 
      title: '📋 To Do', 
      color: 'bg-gray-50',
      borderColor: 'border-gray-300'
    },
    { 
      id: 'in_progress', 
      title: '⚡ In Progress', 
      color: 'bg-blue-50',
      borderColor: 'border-blue-300'
    },
    { 
      id: 'review', 
      title: '👀 Review', 
      color: 'bg-yellow-50',
      borderColor: 'border-yellow-300'
    },
    { 
      id: 'done', 
      title: '✅ Done', 
      color: 'bg-green-50',
      borderColor: 'border-green-300'
    },
  ];

  useEffect(() => {
    if (projectId) {
      dispatch(getProjectTasks(projectId));
    }
    return () => dispatch(reset());
  }, [dispatch, projectId]);

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDraggedOverColumn(null);

    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    // Optimistic update
    const updatedGroupedTasks = { ...groupedTasks };
    
    // Remove from old column
    updatedGroupedTasks[draggedTask.status] = updatedGroupedTasks[
      draggedTask.status
    ].filter((t) => t._id !== draggedTask._id);

    // Add to new column
    updatedGroupedTasks[newStatus] = [
      ...updatedGroupedTasks[newStatus],
      { ...draggedTask, status: newStatus },
    ];

    dispatch(updateTasksOptimistically(updatedGroupedTasks));

    // Update on server
    try {
      await dispatch(
        updateTask({
          id: draggedTask._id,
          taskData: { status: newStatus },
        })
      ).unwrap();
      
      // Refresh tasks to get correct order
      dispatch(getProjectTasks(projectId));
    } catch (error) {
      // Revert on error
      dispatch(getProjectTasks(projectId));
    }

    setDraggedTask(null);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleCreateTask = (status) => {
    setCreateModalStatus(status);
    setShowCreateModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await dispatch(deleteTask(taskId));
      setShowTaskModal(false);
      dispatch(getProjectTasks(projectId));
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

  // Calculate task statistics
  const totalTasks = Object.values(groupedTasks).reduce((acc, col) => acc + col.length, 0);
  const completedTasks = groupedTasks.done?.length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Board Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Task Board</h2>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop tasks between columns to update their status
            </p>
          </div>
        </div>

        {/* Task Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Total</p>
                <p className="text-2xl font-bold text-gray-800">{totalTasks}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{groupedTasks.in_progress?.length || 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Review</p>
                <p className="text-2xl font-bold text-yellow-600">{groupedTasks.review?.length || 0}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-xl">👀</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Done</p>
                <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Completion</p>
                <p className="text-2xl font-bold text-primary-600">{completionRate}%</p>
              </div>
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🎯</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-350px)]">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`flex flex-col ${column.color} rounded-lg p-4 border-2 ${
              draggedOverColumn === column.id ? column.borderColor : 'border-transparent'
            } transition-all`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-800 text-lg">{column.title}</h3>
                <span className="px-2.5 py-0.5 bg-white text-gray-600 text-sm rounded-full font-medium shadow-sm">
                  {groupedTasks[column.id]?.length || 0}
                </span>
              </div>
              {/* Add Task Button - Only for Owner */}
              {isOwner && (
                <button
                  onClick={() => handleCreateTask(column.id)}
                  className="w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm hover:shadow-md hover:bg-primary-50 transition-all text-primary-600"
                  title="Add task"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>

            {/* Drop Zone Indicator */}
            {draggedOverColumn === column.id && (
              <div className="border-2 border-dashed border-primary-400 bg-primary-50 rounded-lg p-4 mb-2 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-8 h-8 text-primary-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <p className="text-sm text-primary-600 font-medium">Drop here</p>
                </div>
              </div>
            )}

            {/* Task Cards */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'thin' }}>
              {groupedTasks[column.id]?.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onDragStart={handleDragStart}
                  onClick={handleTaskClick}
                  getPriorityColor={getPriorityColor}
                  canDrag={isOwner} 
                />
              ))}

              {(!groupedTasks[column.id] || groupedTasks[column.id].length === 0) && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3 opacity-50">
                    {column.id === 'todo' && '📝'}
                    {column.id === 'in_progress' && '⚙️'}
                    {column.id === 'review' && '🔍'}
                    {column.id === 'done' && '🎉'}
                  </div>
                  <p className="text-gray-400 text-sm">No tasks yet</p>
                  {isOwner && (
                    <button
                      onClick={() => handleCreateTask(column.id)}
                      className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Add first task
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Detail Modal */}
      {showTaskModal && selectedTask && (
        <TaskModal
          task={selectedTask}
          projectId={projectId}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onDelete={handleDeleteTask}
          onUpdate={() => dispatch(getProjectTasks(projectId))}
        />
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          projectId={projectId}
          initialStatus={createModalStatus}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            dispatch(getProjectTasks(projectId));
          }}
        />
      )}
    </div>
  );
};

export default KanbanBoard;