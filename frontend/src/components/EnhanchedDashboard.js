import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Clock, TrendingUp, Users, Activity, Calendar, AlertCircle } from 'lucide-react';

const EnhancedDashboard = ({ projectId }) => {
  const [timeData, setTimeData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [dailyProgress, setDailyProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7');
  const [activeUsers, setActiveUsers] = useState([]);
  
  const { user } = useSelector(state => state.auth);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (projectId) {
      loadDashboardData();
    }
  }, [projectId, selectedPeriod]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [timeResponse, progressResponse] = await Promise.all([
        fetch(`${API_URL}/api/time-tracking/project/${projectId}`, { headers }),
        fetch(`${API_URL}/api/time-tracking/project/${projectId}/daily-progress?days=${selectedPeriod}`, { headers })
      ]);

      const timeDataResult = await timeResponse.json();
      const progressDataResult = await progressResponse.json();

      setStatistics(timeDataResult.statistics);
      setTimeData(timeDataResult.timeEntries || []);
      
      const formattedProgress = (progressDataResult.progressData || []).map(day => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: Number((day.total / 60).toFixed(1)),
        users: Object.keys(day.byUser).length,
        ...Object.fromEntries(
          Object.entries(day.byUser).map(([userId, data]) => [
            data.user.name,
            Number((data.minutes / 60).toFixed(1))
          ])
        )
      }));

      setDailyProgress(formattedProgress);

      if (timeDataResult.statistics?.byUser) {
        setActiveUsers(timeDataResult.statistics.byUser.map(u => ({
          name: u.user.name,
          hours: Number((u.totalMinutes / 60).toFixed(1)),
          entries: u.entries
        })));
      }

    } catch (error) {
      console.error('Dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Progress Dashboard</h2>
        <div className="flex gap-2">
          {['7', '14', '30'].map(days => (
            <button
              key={days}
              onClick={() => setSelectedPeriod(days)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedPeriod === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Hours</p>
              <p className="text-3xl font-bold mt-1">{statistics?.totalHours || 0}</p>
            </div>
            <Clock size={40} className="opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Time Entries</p>
              <p className="text-3xl font-bold mt-1">{statistics?.entriesCount || 0}</p>
            </div>
            <Activity size={40} className="opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Active Users</p>
              <p className="text-3xl font-bold mt-1">{activeUsers.length}</p>
            </div>
            <Users size={40} className="opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Avg Hours/Day</p>
              <p className="text-3xl font-bold mt-1">
                {dailyProgress.length > 0 
                  ? (dailyProgress.reduce((sum, d) => sum + d.hours, 0) / dailyProgress.length).toFixed(1)
                  : 0}
              </p>
            </div>
            <TrendingUp size={40} className="opacity-80" />
          </div>
        </div>
      </div>

      {/* Daily Progress Line Chart */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="text-blue-600" size={20} />
          Daily Progress Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyProgress}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="hours" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* User Contributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - User Hours */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="text-green-600" size={20} />
            Team Member Contributions
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activeUsers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Bar dataKey="hours" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - User Distribution */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="text-purple-600" size={20} />
            Work Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={activeUsers}
                dataKey="hours"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {activeUsers.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="text-blue-600" size={20} />
          Recent Time Entries
        </h3>
        <div className="space-y-3">
          {timeData.slice(0, 5).map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {entry.user?.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{entry.user?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">{entry.description || entry.workType}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-blue-600">{(entry.duration / 60).toFixed(1)}h</p>
                <p className="text-xs text-gray-500">
                  {new Date(entry.startTime).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {timeData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle size={48} className="mx-auto mb-2 opacity-50" />
              <p>No time entries recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;