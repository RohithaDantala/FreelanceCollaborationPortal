import React from 'react';

const TaskCard = ({ task, onDragStart, onClick, getPriorityColor , canDrag = true}) => {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
  
  const getSubtasksProgress = () => {
    if (!task.subtasks || task.subtasks.length === 0) return null;
    const completed = task.subtasks.filter((st) => st.completed).length;
    const total = task.subtasks.length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  };

  const subtasksProgress = getSubtasksProgress();

  return (
    <div
      draggable={canDrag}
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onClick(task)}
      className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
    >
      {/* Task Title */}
      <h4 className="font-medium text-gray-800 mb-2 line-clamp-2">
        {task.title}
      </h4>

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

      {/* Subtasks Progress */}
      {subtasksProgress && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Subtasks</span>
            <span>
              {subtasksProgress.completed}/{subtasksProgress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-primary-600 h-1.5 rounded-full transition-all"
              style={{ width: `${subtasksProgress.percentage}%` }}
            ></div>
          </div>
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

        {/* Assignee */}
        <div className="flex items-center gap-2">
          {task.deadline && (
            <span
              className={`text-xs ${
                isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'
              }`}
              title={`Deadline: ${new Date(task.deadline).toLocaleDateString()}`}
            >
              {isOverdue && '⚠️ '}
              {new Date(task.deadline).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}

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
    </div>
  );
};

export default TaskCard;