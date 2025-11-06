import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAllProjects, reset } from '../redux/slices/projectSlice';

const BrowseProjects = () => {
  const dispatch = useDispatch();
  const { projects, isLoading, pagination } = useSelector((state) => state.projects);

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: 'open',
    skills: '',
    page: 1,
    limit: 12,
  });

  useEffect(() => {
    dispatch(getAllProjects(filters));
    return () => dispatch(reset());
  }, [dispatch, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value, page: 1 });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(getAllProjects(filters));
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Browse Projects</h1>
          <p className="text-gray-600">
            Discover exciting projects and collaborate with talented teams
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search projects..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Category */}
              <div>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="web_development">Web Development</option>
                  <option value="mobile_app">Mobile App</option>
                  <option value="design">Design</option>
                  <option value="writing">Writing</option>
                  <option value="marketing">Marketing</option>
                  <option value="data_science">Data Science</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Skills Filter */}
            <div>
              <input
                type="text"
                name="skills"
                value={filters.skills}
                onChange={handleFilterChange}
                placeholder="Filter by skills (comma-separated, e.g., React, Node.js)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Apply Filters
            </button>
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && projects.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {projects.map((project) => (
                <Link
                  key={project._id}
                  to={`/projects/${project._id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 block"
                >
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                        {project.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                          project.status
                        )}`}
                      >
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 capitalize">
                      {getCategoryLabel(project.category)}
                    </p>
                  </div>

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
                            +{project.skillsRequired.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      {project.owner?.avatar ? (
                        <img
                          src={project.owner.avatar}
                          alt={project.owner.firstName}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 text-xs font-semibold">
                            {project.owner?.firstName?.charAt(0)}
                            {project.owner?.lastName?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span className="text-sm text-gray-600">
                        {project.owner?.firstName} {project.owner?.lastName}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {project.members?.length || 0}/{project.maxMembers} members
                    </div>
                  </div>

                  {/* Budget */}
                  {project.budget && (project.budget.min > 0 || project.budget.max > 0) && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Budget:</span> $
                        {project.budget.min} - ${project.budget.max}
                      </p>
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && projects.length === 0 && (
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
            <p className="mt-2 text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseProjects;