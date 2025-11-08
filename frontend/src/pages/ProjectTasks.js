import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProject } from '../redux/slices/projectSlice';
import KanbanBoard from '../components/KanbanBoard';
import { getProjectTasks } from '../redux/slices/taskSlice';
import { fetchRunning, startTimer, stopTimer } from '../redux/slices/timeSlice';

const ProjectTasks = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject: project } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);


  useEffect(() => {
    if (id) {
      dispatch(getProject(id));
      dispatch(getProjectTasks(id));
      dispatch(fetchRunning());
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
            <div className="flex items-center gap-2">
              <Link
                to={`/projects/${id}/payments`}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Payments
              </Link>
              <Link
                to={`/projects/${id}`}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back to Project
              </Link>
            </div>
          </div>
        </div>

        {/* Task Time Tracker */}
        <TaskTimeTracker projectId={id} />

        {/* Kanban Board */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <KanbanBoard projectId={id} />
        </div>
      </div>
    </div>
  );
};

// Inline component: Task-focused Time Tracker panel
const TaskTimeTracker = ({ projectId }) => {
  const dispatch = useDispatch();
  const { groupedTasks } = useSelector((s) => s.tasks);
  const { user } = useSelector((s) => s.auth);
  const { running, isLoading } = useSelector((s) => s.time);
  const [selectedTaskId, setSelectedTaskId] = React.useState('');
  const [description, setDescription] = React.useState('Focused work');
  // Pomodoro controls
  const [mode, setMode] = React.useState('25/5'); // '25/5', '50/10', 'custom'
  const [focusMins, setFocusMins] = React.useState(25);
  const [breakMins, setBreakMins] = React.useState(5);
  const [phase, setPhase] = React.useState('idle'); // 'idle' | 'focus' | 'break'
  const [remaining, setRemaining] = React.useState(0); // seconds
  const intervalRef = React.useRef(null);

  // Flatten tasks assigned to me
  const myTasks = React.useMemo(() => {
    const lists = Object.values(groupedTasks || {});
    const flat = [].concat(...lists);
    return flat.filter(t => (t.assignee?._id || t.assignee) === user?.id);
  }, [groupedTasks, user]);

  useEffect(() => {
    if (myTasks.length && !selectedTaskId) setSelectedTaskId(myTasks[0]._id);
  }, [myTasks, selectedTaskId]);

  // Handle preset change
  useEffect(() => {
    if (mode === '25/5') { setFocusMins(25); setBreakMins(5); }
    if (mode === '50/10') { setFocusMins(50); setBreakMins(10); }
  }, [mode]);

  const clearTick = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };

  const startFocus = async () => {
    // Start backend timer for focus work
    await dispatch(startTimer({ projectId, taskId: selectedTaskId || null, description }));
    dispatch(fetchRunning());
    setPhase('focus');
    setRemaining(focusMins * 60);
    clearTick();
    intervalRef.current = setInterval(() => setRemaining((s) => s - 1), 1000);
  };
  const onStop = async () => {
    await dispatch(stopTimer());
    dispatch(fetchRunning());
    setPhase('idle');
    clearTick();
    setRemaining(0);
  };

  // Auto-progress timer
  useEffect(() => {
    if (remaining <= 0 && (phase === 'focus' || phase === 'break')) {
      if (phase === 'focus') {
        // End focus: stop logging
        onStop();
        // Auto-start break countdown (no logging)
        setPhase('break');
        setRemaining(breakMins * 60);
        clearTick();
        intervalRef.current = setInterval(() => setRemaining((s) => s - 1), 1000);
      } else if (phase === 'break') {
        // End break -> idle
        setPhase('idle');
        clearTick();
        setRemaining(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phase]);

  useEffect(() => () => clearTick(), []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Task Time Tracker</h3>
        {running ? (
          <span className="text-sm px-2 py-1 rounded-full bg-green-100 text-green-700">Running</span>
        ) : (
          <span className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-700">Idle</span>
        )}
      </div>
      {/* Controls when not running a focus session */}
      {phase !== 'focus' && !running ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Task</label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {myTasks.map(t => (
                <option key={t._id} value={t._id}>{t.title}</option>
              ))}
              {myTasks.length === 0 && <option value="">No assigned tasks</option>}
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
          {/* Pomodoro presets */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="25/5">25m focus / 5m break</option>
              <option value="50/10">50m focus / 10m break</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {mode === 'custom' && (
            <div className="md:col-span-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Focus (mins)</label>
                <input type="number" min="1" value={focusMins} onChange={(e) => setFocusMins(Number(e.target.value)||1)} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Break (mins)</label>
                <input type="number" min="1" value={breakMins} onChange={(e) => setBreakMins(Number(e.target.value)||1)} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
          )}

          <div className="md:col-span-4 flex gap-3">
            <button onClick={startFocus} disabled={isLoading || myTasks.length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">
              Start Focus ({focusMins}m)
            </button>
            {phase === 'break' && (
              <button onClick={() => { setPhase('idle'); clearTick(); setRemaining(0); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                End Break
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">{phase === 'focus' ? 'Focus' : 'Break'} time remaining</div>
            <div className="text-3xl font-mono font-semibold">
              {String(Math.floor(remaining / 60)).padStart(2, '0')}:
              {String(remaining % 60).padStart(2, '0')}
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {phase === 'focus' && (
              <button onClick={onStop} disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                Stop Focus
              </button>
            )}
            {phase === 'break' && (
              <button onClick={() => { setPhase('idle'); clearTick(); setRemaining(0); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                End Break
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTasks;