import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  getProject,
  applyToProject,
  handleApplication,
  removeMember,
  deleteProject,
  clearCurrentProject,
  reset,
} from '../redux/slices/projectSlice';

const ProjectDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentProject: project, isLoading, isSuccess, message } = useSelector(
    (state) => state.projects
  );
  const { user } = useSelector((state) => state.auth);

  const [applicationMessage, setApplicationMessage] = useState('');
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  useEffect(() => {
    dispatch(getProject(id));
    return () => {
      dispatch(clearCurrentProject());
      dispatch(reset());
    };
  }, [dispatch, id]);

  const isOwner = user && project && project.owner._id === user.id;
  const isMember = user && project && project.members?.some((m) => m.user._id === user.id);
  const hasApplied = user && project && project.applicants?.some((a) => a.user._id === user.id);

  const handleApply = () => {
    if (!applicationMessage.trim()) {
      alert('Please write a message explaining why you want to join');
      return;
    }
    dispatch(applyToProject({ id: project._id, message: applicationMessage }));
    setShowApplicationModal(false);
    setApplicationMessage('');
  };

  const handleAcceptReject = (applicantId, status) => {
    if (window.confirm(`Are you sure you want to ${status} this application?`)) {
      dispatch(handleApplication({ projectId: project._id, applicantId, status }));
    }
  };

  const handleRemoveMember = (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      dispatch(removeMember({ projectId: project._id, memberId }));
    }
  };

  const handleDeleteProject = () => {
    if (window.confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      dispatch(deleteProject(project._id));
      navigate('/my-projects');
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      web_development: 'Web Development',
      mobile_app: 'Mobile App',
      design: 'Design',
      writing: 'Writing',
      marketing: 'Marketing',
      data_science: 'Data Science',
      other: 'Other',
    };
    return labels[category] || category;
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      archived: 'bg-yellow-100 text-yellow-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Project not found</p>
          <Link to="/projects" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
            Browse Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Success Message */}
          {isSuccess && message && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
              {message}
            </div>
          )}

          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-800">{project.title}</h1>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(
                      project.status
                    )}`}
                  >
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-gray-600 capitalize">{getCategoryLabel(project.category)}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Tasks button for all members (including owner) */}
                {isMember && (
                  <Link
                    to={`/projects/${project._id}/tasks`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <span>📋</span>
                    <span>Tasks</span>
                  </Link>
                )}
                
                {isOwner && (
                  <>
                    <Link
                      to={`/projects/${project._id}/edit`}
                      className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={handleDeleteProject}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </>
                )}
                {!isOwner && !isMember && !hasApplied && project.status === 'open' && (
                  <button
                    onClick={() => setShowApplicationModal(true)}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Apply to Join
                  </button>
                )}
                {hasApplied && (
                  <span className="px-6 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                    Application Pending
                  </span>
                )}
              </div>
            </div>

            {/* Project Owner */}
            <div className="flex items-center space-x-3 pt-4 border-t">
              {project.owner.avatar ? (
                <img
                  src={project.owner.avatar}
                  alt={project.owner.firstName}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {project.owner.firstName?.charAt(0)}
                    {project.owner.lastName?.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-800">
                  {project.owner.firstName} {project.owner.lastName}
                </p>
                <p className="text-sm text-gray-500">Project Owner</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
              </div>

              {/* Skills Required */}
              {project.skillsRequired && project.skillsRequired.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Skills Required</h2>
                  <div className="flex flex-wrap gap-2">
                    {project.skillsRequired.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones */}
              {project.milestones && project.milestones.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Milestones</h2>
                  <div className="space-y-3">
                    {project.milestones.map((milestone, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-800">{milestone.title}</h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              milestone.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : milestone.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {milestone.status}
                          </span>
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                        )}
                        {milestone.dueDate && (
                          <p className="text-sm text-gray-500">
                            Due: {new Date(milestone.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Members */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Team Members ({project.members?.length || 0}/{project.maxMembers})
                </h2>
                <div className="space-y-3">
                  {project.members?.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {member.user.avatar ? (
                          <img
                            src={member.user.avatar}
                            alt={member.user.firstName}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 text-sm font-semibold">
                              {member.user.firstName?.charAt(0)}
                              {member.user.lastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                        </div>
                      </div>
                      {isOwner && member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.user._id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Applicants (Owner Only) */}
              {isOwner && project.applicants && project.applicants.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Applications ({project.applicants.filter((a) => a.status === 'pending').length}{' '}
                    pending)
                  </h2>
                  <div className="space-y-3">
                    {project.applicants
                      .filter((a) => a.status === 'pending')
                      .map((applicant) => (
                        <div key={applicant._id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              {applicant.user.avatar ? (
                                <img
                                  src={applicant.user.avatar}
                                  alt={applicant.user.firstName}
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                  <span className="text-primary-600 text-sm font-semibold">
                                    {applicant.user.firstName?.charAt(0)}
                                    {applicant.user.lastName?.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-800">
                                  {applicant.user.firstName} {applicant.user.lastName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Applied {new Date(applicant.appliedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          {applicant.message && (
                            <p className="text-gray-700 text-sm mb-3">{applicant.message}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptReject(applicant.user._id, 'accepted')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleAcceptReject(applicant.user._id, 'rejected')}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions - NEW */}
              {isMember && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                  <div className="space-y-2">
                    <Link
                      to={`/projects/${project._id}/tasks`}
                      className="block w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-center font-medium transition-colors"
                    >
                      📋 Manage Tasks
                    </Link>
                    {isOwner && (
                      <Link
                        to={`/projects/${project._id}/edit`}
                        className="block w-full px-4 py-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 text-center font-medium transition-colors"
                      >
                        ✏️ Edit Project
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Project Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Project Details</h2>
                <div className="space-y-3">
                  {project.budget && (project.budget.min > 0 || project.budget.max > 0) && (
                    <div>
                      <p className="text-sm text-gray-500">Budget</p>
                      <p className="font-medium text-gray-800">
                        ${project.budget.min} - ${project.budget.max} {project.budget.currency}
                      </p>
                    </div>
                  )}
                  {project.timeline?.estimatedDuration && (
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium text-gray-800">
                        {project.timeline.estimatedDuration}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium text-gray-800">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium text-gray-800">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Apply to Join Project</h2>
            <p className="text-gray-600 mb-4">
              Tell the project owner why you'd be a great fit for this project.
            </p>
            <textarea
              value={applicationMessage}
              onChange={(e) => setApplicationMessage(e.target.value)}
              rows="5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
              placeholder="I would like to join this project because..."
            />
            <div className="flex gap-3">
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Submit Application
              </button>
              <button
                onClick={() => {
                  setShowApplicationModal(false);
                  setApplicationMessage('');
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
  );
};

export default ProjectDetail;