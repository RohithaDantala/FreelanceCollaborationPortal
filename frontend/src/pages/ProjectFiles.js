// frontend/src/pages/ProjectFiles.js
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import FileLibrary from '../components/FileLibrary';

const ProjectFiles = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link to={`/projects/${id}`} className="text-primary-600 hover:text-primary-700">
            ← Back to Project
          </Link>
        </nav>

        {/* File Library */}
        <FileLibrary projectId={id} />
      </div>
    </div>
  );
};

export default ProjectFiles;