// frontend/src/components/TimeTracker.js
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRunning, startTimer, stopTimer } from '../redux/slices/timeSlice';
import { getMyProjects } from '../redux/slices/projectSlice';

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const diffToHMS = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const TimeTracker = () => {
  const dispatch = useDispatch();
  const { running, isLoading, error } = useSelector((s) => s.time);
  const { myProjects } = useSelector((s) => s.projects);
  const { user } = useSelector((s) => s.auth);

  const eligibleProjects = useMemo(() => myProjects || [], [myProjects]);

  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('Working');
  const [isBillable, setIsBillable] = useState(true);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    dispatch(getMyProjects());
    dispatch(fetchRunning());
  }, [dispatch]);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (eligibleProjects.length && !projectId) {
      setProjectId(eligibleProjects[0]._id);
    }
  }, [eligibleProjects, projectId]);

  const onStart = async () => {
    if (!projectId) return;
    await dispatch(
      startTimer({ projectId, description, isBillable, hourlyRate: Number(hourlyRate) || 0 })
    );
    dispatch(fetchRunning());
  };

  const onStop = async () => {
    await dispatch(stopTimer());
    dispatch(fetchRunning());
  };

  const elapsed = running ? now - new Date(running.startTime).getTime() : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Time Tracker</h3>
        {running ? (
          <span className="text-sm px-2 py-1 rounded-full bg-green-100 text-green-700">Running</span>
        ) : (
          <span className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-700">Idle</span>
        )}
      </div>

      {!running ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {eligibleProjects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="What are you working on?"
            />
          </div>
          <div className="flex items-end gap-3">
            <button
              onClick={onStart}
              disabled={isLoading || !projectId}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
            >
              Start
            </button>
          </div>
          <div className="flex items-center gap-3 md:col-span-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={isBillable} onChange={(e) => setIsBillable(e.target.checked)} />
              Billable
            </label>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Rate</span>
              <input
                type="number"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-24 border rounded px-2 py-1"
              />
              <span className="text-gray-400">{user?.currency || 'USD'}/hr</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500">Project</div>
            <div className="font-medium">{running.project?.title || '...'}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Elapsed</div>
            <div className="text-3xl font-mono font-bold">{diffToHMS(elapsed)}</div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onStop}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Stop
            </button>
          </div>
        </div>
      )}
      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
    </div>
  );
};

export default TimeTracker;
