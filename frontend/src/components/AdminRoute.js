// frontend/src/components/AdminRoute.js
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  // Check if user is logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            This area is restricted to administrators only.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Your current role: <strong className="capitalize">{user.role.replace('_', ' ')}</strong>
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="/dashboard"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Go to Dashboard
            </a>
            <a
              href="/projects"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Browse Projects
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;