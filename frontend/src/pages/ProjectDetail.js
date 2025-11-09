import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import CommentSection from '../components/CommentSection';
import ProjectChat from '../components/ProjectChat';
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

  // Refresh project data when operations complete
  useEffect(() => {
    if (isSuccess && message) {
      dispatch(getProject(id));
    }
  }, [isSuccess, message, id, dispatch]);

  const isOwner = user && project?.owner?._id === user.id;
  const isMember = user && project?.members?.some((m) => m.user?._id === user.id);

  // Check application status more accurately
  const myApplication = user && project?.applicants?.find(
    (a) => (a.user?._id === user.id || a.user === user.id)
  );
  
  const applicationStatus = myApplication?.status;
  const isRemoved = applicationStatus === 'removed';
  
  if (project && user && !isLoading && !isMember && !isOwner && isRemoved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Removed</h2>
          <p className="text-gray-600 mb-4">
            You have been removed from this project and no longer have access.
          </p>
          <Link
            to="/projects"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 inline-block"
          >
            Browse Other Projects
          </Link>
        </div>
      </div>
    );
  }

  const handleApply = async () => {
    if (!applicationMessage.trim()) {
      alert('Please write a message explaining why you want to join');
      return;
    }
    try {
      await dispatch(applyToProject({ id: project._id, message: applicationMessage })).unwrap();
      setShowApplicationModal(false);
      setApplicationMessage('');
      dispatch(getProject(id));
    } catch (error) {
      alert(error || 'Failed to submit application');
    }
  };

  const handleAcceptReject = async (applicantId, action) => {
    const actionText = action === 'approve' ? 'approve' : 'reject';
    
    if (window.confirm(`Are you sure you want to ${actionText} this application?`)) {
      try {
        console.log('🔄 Handling application:', { applicantId, action });
        
        const result = await dispatch(
          handleApplication({ 
            projectId: project._id, 
            applicantId, 
            action
          })
        ).unwrap();
        
        console.log('✅ Application handled:', result);
        
        // Wait a bit for backend to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force refresh with full population
        const refreshResult = await dispatch(getProject(project._id)).unwrap();
        console.log('📊 Refreshed project data:', {
          membersCount: refreshResult.members?.length,
          members: refreshResult.members,
          applicantsCount: refreshResult.applicants?.length
        });
        
      } catch (error) {
        console.error('❌ Error handling application:', error);
        alert(error || 'Failed to handle application');
      }
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await dispatch(removeMember({ projectId: project._id, memberId })).unwrap();
        dispatch(getProject(project._id));
      } catch (error) {
        alert('Failed to remove member');
      }
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
    return labels[category] || category || 'Other';
  };

  const getStatusBadge = (status) => {
    // Handle undefined or null status
    if (!status) {
      return 'bg-gray-100 text-gray-800';
    }
    
    const badges = {
      open: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      archived: 'bg-yellow-100 text-yellow-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    if (!status) return 'unknown';
    return status.replace('_', ' ');
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
                      project?.status
                    )}`}
                  >
                    {getStatusText(project?.status)}
                  </span>
                </div>
                <p className="text-gray-600 capitalize">{getCategoryLabel(project.category)}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                {/* Member links */}
                {isMember && (
                  <>
                    <Link
                      to={`/projects/${project._id}/tasks`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <span>📋</span>
                      <span>Tasks</span>
                    </Link>
                    <Link
                      to={`/projects/${project._id}/milestones`}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <span>🎯</span>
                      <span>Milestones</span>
                    </Link>
                    <Link
                      to={`/projects/${project._id}/files`}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                      <span>📁</span>
                      <span>Files</span>
                    </Link>
                    <Link
                      to={`/projects/${project._id}/payments`}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                    >
                      <span>💳</span>
                      <span>Payments</span>
                    </Link>
                  </>
                )}

                {/* Owner controls */}
                {isOwner && (
                  <>
                    <Link
                      to={`/projects/${project._id}/edit`}
                      className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
                    >
                      ✏️ Edit
                    </Link>
                    <button
                      onClick={handleDeleteProject}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      🗑️ Delete
                    </button>
                  </>
                )}

                {/* Application Status Display */}
                {!isOwner && !isMember && !myApplication && project.status === 'open' && (
                  <button
                    onClick={() => setShowApplicationModal(true)}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                  >
                    Apply to Join
                  </button>
                )}

                {!isOwner && !isMember && myApplication && applicationStatus === 'pending' && (
                  <span className="px-6 py-2 bg-yellow-100 text-yellow-800 rounded-lg flex items-center gap-2 font-medium">
                    <span className="animate-pulse">⏳</span>
                    Application Pending
                  </span>
                )}

                {!isMember && myApplication && applicationStatus === 'accepted' && (
                  <span className="px-6 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                    ✅ Application Accepted
                  </span>
                )}

                {!isMember && myApplication && applicationStatus === 'rejected' && (
                  <span className="px-6 py-2 bg-red-100 text-red-800 rounded-lg font-medium">
                    ❌ Application Rejected
                  </span>
                )}
              </div>
            </div>

            {/* Project Owner */}
            <div className="flex items-center space-x-3 pt-4 border-t">
              {project.owner?.avatar ? (
                <img
                  src={project.owner.avatar}
                  alt={project.owner.firstName}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {project.owner?.firstName?.charAt(0) || '?'}
                    {project.owner?.lastName?.charAt(0) || ''}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-800">
                  {project.owner?.firstName || 'Unknown'} {project.owner?.lastName || ''}
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

              {/* Team Members */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Team Members ({project.members?.length || 0}/{project.maxMembers})
                </h2>
                {project.members && project.members.length > 0 ? (
                  <div className="space-y-3">
                    {project.members.map((member, index) => {
                      // Handle both populated and non-populated user references
                      const memberUser = typeof member.user === 'object' ? member.user : null;
                      const memberUserId = typeof member.user === 'string' ? member.user : member.user?._id;
                      
                      return (
                        <div
                          key={member._id || `member-${index}`}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            {memberUser?.avatar ? (
                              <img
                                src={memberUser.avatar}
                                alt={memberUser.firstName}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-primary-600 text-sm font-semibold">
                                  {memberUser?.firstName?.charAt(0) || '?'}
                                  {memberUser?.lastName?.charAt(0) || ''}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800">
                                {memberUser?.firstName || 'Loading...'} {memberUser?.lastName || ''}
                              </p>
                              <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                            </div>
                          </div>
                          {isOwner && member.role !== 'owner' && memberUserId && (
                            <button
                              onClick={() => handleRemoveMember(memberUserId)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No team members yet</p>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              {isMember && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <CommentSection projectId={project._id} />
                </div>
              )}

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
                        <div key={applicant._id} className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              {applicant.user?.avatar ? (
                                <img
                                  src={applicant.user.avatar}
                                  alt={applicant.user.firstName}
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                  <span className="text-primary-600 text-sm font-semibold">
                                    {applicant.user?.firstName?.charAt(0) || '?'}
                                    {applicant.user?.lastName?.charAt(0) || ''}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-800">
                                  {applicant.user?.firstName || 'Unknown'} {applicant.user?.lastName || ''}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Applied {new Date(applicant.appliedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">
                              New
                            </span>
                          </div>
                          {applicant.message && (
                            <p className="text-gray-700 text-sm mb-3 bg-white p-3 rounded border border-gray-200">
                              {applicant.message}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptReject(applicant.user._id, 'approve')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              ✓ Accept
                            </button>
                            <button
                              onClick={() => handleAcceptReject(applicant.user._id, 'reject')}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                              ✗ Reject
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
                </div>
              </div>

              {/* ProjectChat Component */}
              {isMember && (
                <div className="sticky top-4">
                  <ProjectChat projectId={project._id} />
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