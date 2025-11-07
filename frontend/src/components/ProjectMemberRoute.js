import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';

const ProjectMemberRoute = ({ children }) => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [isChecking, setIsChecking] = useState(true);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const checkMembership = async () => {
      try {
        const response = await api.get(`/projects/${id}`);
        const project = response.data.data.project;
        
        const memberCheck = project.members?.some(
          (m) => m.user._id === user.id || m.user === user.id
        );
        
        setIsMember(memberCheck || project.owner._id === user.id);
      } catch (error) {
        setIsMember(false);
      } finally {
        setIsChecking(false);
      }
    };

    if (user && id) {
      checkMembership();
    } else {
      setIsChecking(false);
    }
  }, [id, user]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You must be a member of this project to access this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProjectMemberRoute;