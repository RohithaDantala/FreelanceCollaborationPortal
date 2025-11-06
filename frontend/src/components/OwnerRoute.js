import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const OwnerRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  // Check if user is logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is project owner or admin
  if (user.role !== 'project_owner' && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Only project owners can create projects. Your current role is: <strong>{user.role.replace('_', ' ')}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            If you want to create projects, please register as a project owner.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="/projects"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Browse Projects
            </a>
            <a
              href="/dashboard"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default OwnerRoute;