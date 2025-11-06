import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMyProjects, reset } from '../redux/slices/projectSlice';

const MyProjects = () => {
  const dispatch = useDispatch();
  const { myProjects, isLoading } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);

  const [filter, setFilter] = useState('all');

  useEffect(() => {
    dispatch(getMyProjects());
    return () => dispatch(reset());
  }, [dispatch]);

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      open: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800',
      archived: 'bg-yellow-100 text-yellow-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
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

  const filteredProjects = myProjects.filter((project) => {
    if (filter === 'all') return true;
    if (filter === 'owned') return project.owner._id === user.id;
    if (filter === 'member') return project.owner._id !== user.id;
    return project.status === filter;
  });

  const ownedProjects = myProjects.filter((p) => p.owner._id === user.id);
  const memberProjects = myProjects.filter((p) => p.owner._id !== user.id);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Projects</h1>
            <p className="text-gray-600">
              Manage and track all your projects in one place
            </p>
          </div>
          <Link
            to="/projects/create"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            + Create Project
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-500 text-sm font-medium">Total Projects</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{myProjects.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-500 text-sm font-medium">Owned</p>
            <p className="text-3xl font-bold text-primary-600 mt-2">{ownedProjects.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-500 text-sm font-medium">Member Of</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{memberProjects.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-500 text-sm font-medium">In Progress</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {myProjects.filter((p) => p.status === 'in_progress').length}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({myProjects.length})
            </button>
            <button
              onClick={() => setFilter('owned')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'owned'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Owned ({ownedProjects.length})
            </button>
            <button
              onClick={() => setFilter('member')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'member'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Member ({memberProjects.length})
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'open'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'in_progress'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading your projects...</p>
          </div>
        )}

        {/* Projects List */}
        {!isLoading && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Link
                key={project._id}
                to={`/projects/${project._id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 block"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 mb-1">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {getCategoryLabel(project.category)}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-2 ${getStatusBadge(
                      project.status
                    )}`}
                  >
                    {project.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Role Badge */}
                {project.owner._id === user.id ? (
                  <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full mb-3">
                    Owner
                  </span>
                ) : (
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mb-3">
                    Member
                  </span>
                )}

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {project.description}
                </p>

                {/* Skills */}
                {project.skillsRequired && project.skillsRequired.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {project.skillsRequired.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {project.skillsRequired.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{project.skillsRequired.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    {project.members?.length || 0}/{project.maxMembers} members
                  </div>
                  <div className="text-sm text-gray-500">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Pending Applicants (Owner Only) */}
                {project.owner._id === user.id &&
                  project.applicants?.filter((a) => a.status === 'pending').length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-sm text-yellow-600 font-medium">
                        {project.applicants.filter((a) => a.status === 'pending').length} pending
                        application(s)
                      </span>
                    </div>
                  )}
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProjects.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No projects found</h3>
            <p className="mt-2 text-gray-500">
              {filter === 'all'
                ? "You haven't created or joined any projects yet"
                : `No ${filter.replace('_', ' ')} projects found`}
            </p>
            {filter === 'all' && (
              <Link
                to="/projects/create"
                className="mt-4 inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Create Your First Project
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProjects;