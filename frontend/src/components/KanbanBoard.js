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
    { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
    { id: 'review', title: 'Review', color: 'bg-yellow-100' },
    { id: 'done', title: 'Done', color: 'bg-green-100' },
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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Task Board</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {Object.values(groupedTasks).reduce((acc, col) => acc + col.length, 0)} tasks
            </span>
          </div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-250px)]">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex flex-col bg-gray-50 rounded-lg p-4"
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-800">{column.title}</h3>
                <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                    {groupedTasks[column.id]?.length || 0}
                </span>
                </div>
                {/* ONLY SHOW FOR OWNER */}
                {isOwner && (
                <button
                    onClick={() => handleCreateTask(column.id)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                    title="Add task"
                >
                    +
                </button>
                )}
            </div>

            {/* Drop Zone Indicator */}
            {draggedOverColumn === column.id && (
              <div className="border-2 border-dashed border-primary-400 bg-primary-50 rounded-lg p-4 mb-2">
                <p className="text-center text-sm text-primary-600">Drop here</p>
              </div>
            )}

            {/* Task Cards */}
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
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
                <div className="text-center py-8 text-gray-400 text-sm">
                  No tasks yet
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