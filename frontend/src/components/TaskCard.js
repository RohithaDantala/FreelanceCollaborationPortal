import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTask, updateTasksOptimistically } from '../redux/slices/taskSlice';

const TaskCard = ({ task, onDragStart, onClick, getPriorityColor, canDrag = true }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { currentProject } = useSelector((state) => state.projects);
  const { groupedTasks } = useSelector((state) => state.tasks);
  const canDragTask = isOwner && canDrag;
  const isOwner = currentProject?.owner?._id === user.id;
  const isAssignee = task.assignee?._id === user.id;
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
  
  const getSubtasksProgress = () => {
    if (!task.subtasks || task.subtasks.length === 0) return null;
    const completed = task.subtasks.filter((st) => st.completed).length;
    const total = task.subtasks.length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  };

  const subtasksProgress = getSubtasksProgress();

  const handleQuickComplete = async (e) => {
    e.stopPropagation();
    
    // Optimistic update
    const updatedGroupedTasks = { ...groupedTasks };
    
    // Remove from current column
    updatedGroupedTasks[task.status] = updatedGroupedTasks[task.status].filter(
      (t) => t._id !== task._id
    );
    
    // Add to done column
    const updatedTask = { ...task, status: 'done' };
    updatedGroupedTasks.done = [...updatedGroupedTasks.done, updatedTask];
    
    // Update state immediately
    dispatch(updateTasksOptimistically(updatedGroupedTasks));
    
    try {
      await dispatch(updateTask({ 
        id: task._id, 
        taskData: { status: 'done' } 
      })).unwrap();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleQuickStatusChange = async (e, newStatus) => {
    e.stopPropagation();
    
    // Optimistic update
    const updatedGroupedTasks = { ...groupedTasks };
    
    // Remove from current column
    updatedGroupedTasks[task.status] = updatedGroupedTasks[task.status].filter(
      (t) => t._id !== task._id
    );
    
    // Add to new column
    const updatedTask = { ...task, status: newStatus };
    updatedGroupedTasks[newStatus] = [...updatedGroupedTasks[newStatus], updatedTask];
    
    // Update state immediately
    dispatch(updateTasksOptimistically(updatedGroupedTasks));
    
    try {
      await dispatch(updateTask({ 
        id: task._id, 
        taskData: { status: newStatus } 
      })).unwrap();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <div
      draggable={canDragTask}
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onClick(task)}
      className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 group"
    >
      {/* Task Title */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-800 line-clamp-2 flex-1">
          {task.title}
        </h4>
        
        {/* Quick Complete Button - Only show for assignee or owner in non-done status */}
        {(isAssignee || isOwner) && task.status !== 'done' && (
          <button
            onClick={handleQuickComplete}
            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-green-50 rounded"
            title="Mark as done"
          >
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Description (if exists) */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 2).map((label, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
            >
              {label}
            </span>
          ))}
          {task.labels.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              +{task.labels.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Subtasks Progress Bar */}
      {subtasksProgress && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Subtasks
            </span>
            <span className="font-medium">
              {subtasksProgress.completed}/{subtasksProgress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                subtasksProgress.percentage === 100 
                  ? 'bg-green-600' 
                  : subtasksProgress.percentage > 50 
                  ? 'bg-blue-600' 
                  : 'bg-yellow-600'
              }`}
              style={{ width: `${subtasksProgress.percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Estimated Hours */}
      {task.estimatedHours && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{task.estimatedHours}h estimated</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        {/* Priority Badge */}
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
            task.priority
          )}`}
        >
          {task.priority}
        </span>

        {/* Right side info */}
        <div className="flex items-center gap-2">
          {/* Deadline */}
          {task.deadline && (
            <span
              className={`text-xs flex items-center gap-1 ${
                isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'
              }`}
              title={`Deadline: ${new Date(task.deadline).toLocaleDateString()}`}
            >
              {isOverdue && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {new Date(task.deadline).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}

          {/* Assignee Avatar */}
          {task.assignee ? (
            <div
              className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center"
              title={`${task.assignee.firstName} ${task.assignee.lastName}`}
            >
              {task.assignee.avatar ? (
                <img
                  src={task.assignee.avatar}
                  alt={task.assignee.firstName}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <span className="text-primary-600 text-xs font-semibold">
                  {task.assignee.firstName?.charAt(0)}
                  {task.assignee.lastName?.charAt(0)}
                </span>
              )}
            </div>
          ) : (
            <div
              className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"
              title="Unassigned"
            >
              <span className="text-gray-400 text-xs">?</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Status Change Buttons - Show on hover */}
      {(isAssignee || isOwner) && (
        <div className="mt-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            {task.status !== 'in_progress' && task.status !== 'done' && (
              <button
                onClick={(e) => handleQuickStatusChange(e, 'in_progress')}
                className="flex-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
              >
                Start
              </button>
            )}
            {task.status === 'in_progress' && (
              <button
                onClick={(e) => handleQuickStatusChange(e, 'review')}
                className="flex-1 px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100"
              >
                Review
              </button>
            )}
            {task.status !== 'done' && (
              <button
                onClick={handleQuickComplete}
                className="flex-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
              >
                ✓ Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;