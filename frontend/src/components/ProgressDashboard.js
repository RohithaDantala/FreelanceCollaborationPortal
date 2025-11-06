// frontend/src/components/ProgressDashboard.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProjectProgress, reset } from '../redux/slices/milestoneSlice';
import { getProjectTasks } from '../redux/slices/taskSlice';

const ProgressDashboard = ({ projectId }) => {
  const dispatch = useDispatch();
  const { progress, isLoading } = useSelector((state) => state.milestones);
  const { groupedTasks } = useSelector((state) => state.tasks);

  useEffect(() => {
    if (projectId) {
      dispatch(getProjectProgress(projectId));
      dispatch(getProjectTasks(projectId));
    }
    return () => dispatch(reset());
  }, [dispatch, projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const taskStats = {
    total: Object.values(groupedTasks).reduce((sum, tasks) => sum + tasks.length, 0),
    todo: groupedTasks.todo?.length || 0,
    inProgress: groupedTasks.in_progress?.length || 0,
    review: groupedTasks.review?.length || 0,
    done: groupedTasks.done?.length || 0,
  };

  const taskCompletionRate =
    taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Project Progress</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-100 text-sm mb-1">Overall Completion</p>
            <p className="text-5xl font-bold">{progress.overallProgress}%</p>
          </div>
          <div className="text-right">
            <p className="text-primary-100 text-sm mb-1">Milestones</p>
            <p className="text-3xl font-bold">
              {progress.statistics.completedMilestones}/{progress.statistics.totalMilestones}
            </p>
          </div>
        </div>
        <div className="w-full bg-primary-800 rounded-full h-4">
          <div
            className="bg-white h-4 rounded-full transition-all"
            style={{ width: `${progress.overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Milestone Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-medium">Total Milestones</span>
            <span className="text-3xl">🎯</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {progress.statistics.totalMilestones}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-medium">Completed</span>
            <span className="text-3xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {progress.statistics.completedMilestones}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-medium">In Progress</span>
            <span className="text-3xl">⚡</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {progress.statistics.inProgressMilestones}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-medium">Overdue</span>
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-3xl font-bold text-red-600">
            {progress.statistics.overdueMilestones}
          </p>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Task Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{taskStats.total}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">{taskStats.todo}</p>
            <p className="text-sm text-gray-500">To Do</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</p>
            <p className="text-sm text-gray-500">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{taskStats.review}</p>
            <p className="text-sm text-gray-500">Review</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{taskStats.done}</p>
            <p className="text-sm text-gray-500">Done</p>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Task Completion Rate</span>
            <span className="font-medium">{taskCompletionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all"
              style={{ width: `${taskCompletionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Upcoming Milestones */}
      {progress.upcomingMilestones && progress.upcomingMilestones.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Upcoming Milestones
          </h3>
          <div className="space-y-3">
            {progress.upcomingMilestones.map((milestone) => {
              const daysRemaining = Math.ceil(
                (new Date(milestone.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
              );
              const isOverdue = daysRemaining < 0;
              const isUrgent = daysRemaining >= 0 && daysRemaining <= 3;

              return (
                <div
                  key={milestone._id}
                  className={`p-4 rounded-lg border-l-4 ${
                    isOverdue
                      ? 'bg-red-50 border-red-500'
                      : isUrgent
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 mb-1">
                        {milestone.title}
                      </h4>
                      <div className="flex items-center gap-4 text-sm">
                        <span
                          className={`font-medium ${
                            isOverdue
                              ? 'text-red-600'
                              : isUrgent
                              ? 'text-yellow-700'
                              : 'text-blue-700'
                          }`}
                        >
                          {isOverdue
                            ? `${Math.abs(daysRemaining)} days overdue`
                            : isUrgent
                            ? `${daysRemaining} days left`
                            : `Due in ${daysRemaining} days`}
                        </span>
                        <span className="text-gray-500">
                          {new Date(milestone.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-gray-800">
                        {milestone.progress}%
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          milestone.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {milestone.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        isOverdue
                          ? 'bg-red-600'
                          : isUrgent
                          ? 'bg-yellow-600'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${milestone.progress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Insights */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Insights</h3>
        <div className="space-y-3">
          {progress.overallProgress >= 75 && (
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-medium text-green-800">Great Progress!</p>
                <p className="text-sm text-green-700">
                  You're on track to complete this project successfully.
                </p>
              </div>
            </div>
          )}

          {progress.statistics.overdueMilestones > 0 && (
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-medium text-red-800">Action Needed</p>
                <p className="text-sm text-red-700">
                  {progress.statistics.overdueMilestones} milestone(s) are overdue. 
                  Consider updating timelines or prioritizing tasks.
                </p>
              </div>
            </div>
          )}

          {taskCompletionRate < 30 && taskStats.total > 0 && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-medium text-yellow-800">Keep Going!</p>
                <p className="text-sm text-yellow-700">
                  Focus on completing tasks to increase your progress rate.
                </p>
              </div>
            </div>
          )}

          {progress.statistics.inProgressMilestones === 0 &&
            progress.statistics.completedMilestones < progress.statistics.totalMilestones && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <span className="text-2xl">🚀</span>
                <div>
                  <p className="font-medium text-blue-800">Ready to Start</p>
                  <p className="text-sm text-blue-700">
                    Start working on pending milestones to make progress.
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;