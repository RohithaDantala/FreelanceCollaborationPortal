// frontend/src/pages/ProjectInterviews.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';

const ProjectInterviews = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [interviews, setInterviews] = useState([]);
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [proposedDates, setProposedDates] = useState([
    { date: '', startTime: '', endTime: '' }
  ]);

  useEffect(() => {
    fetchProject();
    fetchInterviews();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data.data.project);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };

  const fetchInterviews = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/interviews');
      setInterviews(response.data.data.interviews.filter(i => i.project._id === id));
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = user && project?.owner?._id === user.id;
  const isMember = user && project?.members?.some((m) => m.user._id === user.id);

  const handleProposeInterview = async () => {
    try {
      await api.post('/interviews/propose', {
        projectId: id,
        proposedDates: proposedDates.filter(d => d.date)
      });
      alert('Interview dates proposed successfully!');
      setShowProposeModal(false);
      setProposedDates([{ date: '', startTime: '', endTime: '' }]);
      fetchInterviews();
    } catch (error) {
      alert('Failed to propose interview dates');
    }
  };

  const handleApproveDate = async (interviewId, dateId) => {
    if (window.confirm('Confirm this interview date?')) {
      try {
        await api.put(`/interviews/${interviewId}/approve`, { dateId });
        alert('Interview scheduled successfully!');
        fetchInterviews();
      } catch (error) {
        alert('Failed to approve interview date');
      }
    }
  };

  const handleCancelInterview = async (interviewId) => {
    if (window.confirm('Cancel this interview?')) {
      try {
        await api.delete(`/interviews/${interviewId}`);
        alert('Interview cancelled');
        fetchInterviews();
      } catch (error) {
        alert('Failed to cancel interview');
      }
    }
  };

  const addDateSlot = () => {
    setProposedDates([...proposedDates, { date: '', startTime: '', endTime: '' }]);
  };

  const removeDateSlot = (index) => {
    setProposedDates(proposedDates.filter((_, i) => i !== index));
  };

  const updateDateSlot = (index, field, value) => {
    const updated = [...proposedDates];
    updated[index][field] = value;
    setProposedDates(updated);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    return badges[status] || badges.pending;
  };

  if (!isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You must be a member of this project.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link to={`/projects/${id}`} className="text-primary-600 hover:text-primary-700">
            ← Back to Project
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">📅 Interview Scheduling</h1>
              <p className="text-gray-600">{project?.title}</p>
            </div>
            {!isOwner && (
              <button
                onClick={() => setShowProposeModal(true)}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Propose Interview Dates
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : interviews.length > 0 ? (
          <div className="space-y-4">
            {interviews.map((interview) => (
              <div key={interview._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Interview with {interview.freelancer.firstName} {interview.freelancer.lastName}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(interview.status)}`}>
                        {interview.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Requested: {new Date(interview.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancelInterview(interview._id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Cancel
                  </button>
                </div>

                {interview.status === 'scheduled' && interview.confirmedDate ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-semibold text-green-800 mb-2">✅ Interview Confirmed</p>
                    <p className="text-sm text-green-700">
                      <strong>Date:</strong> {new Date(interview.confirmedDate.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-green-700">
                      <strong>Time:</strong> {interview.confirmedDate.startTime} - {interview.confirmedDate.endTime}
                    </p>
                    {interview.meetingLink && (
                      <a
                        href={interview.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        🔗 Join Meeting
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium text-gray-700 mb-2">Proposed Dates:</p>
                    {interview.proposedDates.map((dateSlot) => (
                      <div
                        key={dateSlot._id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <p className="text-gray-800">
                            {new Date(dateSlot.date).toLocaleDateString()} • {dateSlot.startTime} - {dateSlot.endTime}
                          </p>
                        </div>
                        {isOwner && dateSlot.status === 'pending' && (
                          <button
                            onClick={() => handleApproveDate(interview._id, dateSlot._id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          >
                            ✓ Approve
                          </button>
                        )}
                        {dateSlot.status === 'accepted' && (
                          <span className="text-green-600 text-sm font-medium">✓ Accepted</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {interview.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{interview.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <span className="text-6xl mb-4 block">📅</span>
            <h3 className="text-lg font-medium text-gray-900">No interviews scheduled</h3>
            <p className="text-gray-500 mt-2">
              {isOwner ? 'Waiting for interview proposals' : 'Propose interview dates to get started'}
            </p>
          </div>
        )}

        {/* Propose Dates Modal */}
        {showProposeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Propose Interview Dates</h2>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {proposedDates.map((slot, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Date Slot {index + 1}</span>
                      {proposedDates.length > 1 && (
                        <button
                          onClick={() => removeDateSlot(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(e) => updateDateSlot(index, 'date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateDateSlot(index, 'startTime', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Start"
                      />
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateDateSlot(index, 'endTime', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="End"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addDateSlot}
                className="w-full mt-4 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary-500 hover:text-primary-600"
              >
                + Add Another Date Option
              </button>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleProposeInterview}
                  disabled={!proposedDates.some(d => d.date)}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  Propose Dates
                </button>
                <button
                  onClick={() => {
                    setShowProposeModal(false);
                    setProposedDates([{ date: '', startTime: '', endTime: '' }]);
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
    </div>
  );
};

export default ProjectInterviews;