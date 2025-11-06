import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProject } from '../redux/slices/projectSlice';
import KanbanBoard from '../components/KanbanBoard';

const ProjectTasks = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject: project } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (id) {
      dispatch(getProject(id));
    }
  }, [dispatch, id]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  const isMember = user && project.members?.some((m) => m.user._id === user.id);

  if (!isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You must be a member of this project to view tasks.
          </p>
          <Link
            to={`/projects/${id}`}
            className="text-primary-600 hover:text-primary-700"
          >
            Back to Project Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/my-projects" className="hover:text-primary-600">
              My Projects
            </Link>
            <span>/</span>
            <Link to={`/projects/${id}`} className="hover:text-primary-600">
              {project.title}
            </Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">Tasks</span>
          </nav>
        </div>

        {/* Project Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {project.title}
              </h1>
              <p className="text-gray-600">
                Manage and track all project tasks
              </p>
            </div>
            <Link
              to={`/projects/${id}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back to Project
            </Link>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <KanbanBoard projectId={id} />
        </div>
      </div>
    </div>
  );
};

export default ProjectTasks;