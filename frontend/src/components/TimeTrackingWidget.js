import React, { useState, useEffect } from 'react';
import { Play, Square, Pause, Clock } from 'lucide-react';

const TimeTrackingWidget = ({ projectId, taskId = null }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState('');
  const [workType, setWorkType] = useState('development');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    checkActiveSession();
  }, [projectId]);

  useEffect(() => {
    let interval;
    if (isTracking && activeSession) {
      interval = setInterval(() => {
        const start = new Date(activeSession.startTime);
        const now = new Date();
        const diff = Math.floor((now - start) / 1000);
        setElapsedTime(diff);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, activeSession]);

  const checkActiveSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/time-tracking/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.activeSession) {
        setActiveSession(data.activeSession);
        setIsTracking(true);
        setDescription(data.activeSession.description || '');
        setWorkType(data.activeSession.workType || 'development');
      }
    } catch (error) {
      console.error('Check active session error:', error);
    }
  };

  const startTracking = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/time-tracking/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId,
          taskId,
          description,
          workType
        })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || 'Failed to start tracking');
        return;
      }

      const data = await response.json();
      setActiveSession(data.timeEntry);
      setIsTracking(true);
    } catch (error) {
      console.error('Start tracking error:', error);
      alert('Failed to start time tracking');
    }
  };

  const stopTracking = async () => {
    if (!activeSession) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/time-tracking/stop/${activeSession._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to stop tracking');
      }

      const data = await response.json();
      alert(`Time tracked: ${(data.duration / 60).toFixed(1)} hours`);
      
      setIsTracking(false);
      setActiveSession(null);
      setElapsedTime(0);
      setDescription('');
    } catch (error) {
      console.error('Stop tracking error:', error);
      alert('Failed to stop time tracking');
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Clock className="text-blue-600" size={20} />
          Time Tracker
        </h3>
        {isTracking && (
          <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Active
          </span>
        )}
      </div>

      {isTracking ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2 font-mono">
              {formatTime(elapsedTime)}
            </div>
            <p className="text-sm text-gray-600">{activeSession?.description || 'No description'}</p>
            <p className="text-xs text-gray-500 mt-1">
              Started: {new Date(activeSession?.startTime).toLocaleTimeString()}
            </p>
          </div>

          <button
            onClick={stopTracking}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Square size={20} />
            Stop Tracking
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What are you working on?
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your task..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Type
            </label>
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="development">Development</option>
              <option value="design">Design</option>
              <option value="meeting">Meeting</option>
              <option value="research">Research</option>
              <option value="testing">Testing</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            onClick={startTracking}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <Play size={20} fill="white" />
            Start Tracking
          </button>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Time tracking helps monitor project progress and productivity
        </p>
      </div>
    </div>
  );
};

export default TimeTrackingWidget;