import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';
import { getMyProjects } from '../redux/slices/projectSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { myProjects } = useSelector((state) => state.projects);

  useEffect(() => {
    dispatch(getMyProjects());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  const ownedProjects = myProjects.filter((p) => p.owner._id === user.id);
  const activeProjects = myProjects.filter((p) => p.status === 'in_progress');
  const canCreateProject = user.role === 'project_owner' || user.role === 'admin';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome back, {user.firstName}! 👋
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-gray-600">
                  Role: <span className="font-semibold capitalize">{user.role.replace('_', ' ')}</span>
                </p>
                <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                  user.role === 'project_owner' 
                    ? 'bg-purple-100 text-purple-800' 
                    : user.role === 'admin'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role === 'project_owner' ? '👔 Owner' : 
                   user.role === 'admin' ? '⚡ Admin' : '💼 Freelancer'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Projects</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{myProjects.length}</p>
              </div>
              <div className="bg-primary-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  {canCreateProject ? 'Owned Projects' : 'Joined Projects'}
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {canCreateProject ? ownedProjects.length : myProjects.length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Projects</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{activeProjects.length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {canCreateProject ? (
            <Link
              to="/projects/create"
              className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg p-6 text-white hover:from-primary-600 hover:to-primary-800 transition-all shadow-md"
            >
              <h3 className="text-xl font-bold mb-2">
                ✨ Create New Project
              </h3>
              <p className="text-primary-100">
                Start a new project and invite collaborators
              </p>
            </Link>
          ) : (
            <Link
              to="/projects"
              className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg p-6 text-white hover:from-primary-600 hover:to-primary-800 transition-all shadow-md"
            >
              <h3 className="text-xl font-bold mb-2">
                🔍 Find Projects
              </h3>
              <p className="text-primary-100">
                Browse available projects and apply to join
              </p>
            </Link>
          )}

          <Link
            to="/projects"
            className="bg-gradient-to-r from-secondary-500 to-secondary-700 rounded-lg p-6 text-white hover:from-secondary-600 hover:to-secondary-800 transition-all shadow-md"
          >
            <h3 className="text-xl font-bold mb-2">
              🔍 Browse Projects
            </h3>
            <p className="text-secondary-100">
              Discover exciting projects to {canCreateProject ? 'explore' : 'join'}
            </p>
          </Link>
        </div>

        {/* Role-specific Information */}
        {!canCreateProject && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Freelancer Account</h3>
                <p className="text-blue-800 text-sm">
                  As a freelancer, you can browse and apply to join projects. If you want to create your own projects, 
                  please register a new account with the "Project Owner" role.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Projects */}
        {myProjects.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Recent Projects</h2>
              <Link to="/my-projects" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {myProjects.slice(0, 5).map((project) => (
                <Link
                  key={project._id}
                  to={`/projects/${project._id}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="font-medium text-gray-800">{project.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-500 capitalize">
                        {project.category.replace('_', ' ')} • {project.status.replace('_', ' ')}
                      </p>
                      {project.owner._id === user.id && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Owner
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {project.members?.length}/{project.maxMembers} members
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {myProjects.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-yellow-900 mb-2">🚀 Get Started!</h3>
            <p className="text-yellow-800 mb-4">
              {canCreateProject 
                ? "You haven't created any projects yet. Create your first project to get started!"
                : "You haven't joined any projects yet. Browse available projects and apply to join!"}
            </p>
            <div className="flex gap-3">
              {canCreateProject ? (
                <Link
                  to="/projects/create"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Create Project
                </Link>
              ) : (
                <Link
                  to="/projects"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Find Projects
                </Link>
              )}
              <Link
                to="/projects"
                className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
              >
                Browse Projects
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;