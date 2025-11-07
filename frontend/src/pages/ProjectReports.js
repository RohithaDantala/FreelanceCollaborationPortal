import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';

const ProjectReports = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generating, setGenerating] = useState({
    contribution: false,
    milestone: false,
    summary: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchReports();
  }, [id]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/reports/project/${id}`);
      setReports(response.data.data.reports);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async (type) => {
    try {
      setGenerating(true);
      let response;
      
      if (type === 'contribution') {
        response = await api.post('/reports/contribution', {
          projectId: id,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
      } else if (type === 'milestone') {
        response = await api.post('/reports/milestone', {
          projectId: id,
        });
      } else if (type === 'summary') {
        response = await api.post('/reports/summary', {
          projectId: id,
        });
      }
      
      alert('Report generated successfully!');
      fetchReports();
    } catch (error) {
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = (report) => {
    // Convert to JSON and download
    const dataStr = JSON.stringify(report.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.replace(/\s+/g, '_')}.json`;
    link.click();
  };

  const exportToCSV = (report) => {
    if (report.reportType === 'contribution') {
      const contributions = report.data.contributions;
      const csvContent = [
        ['Name', 'Email', 'Tasks Completed', 'Tasks In Progress', 'Files Uploaded', 'Hours Estimated'].join(','),
        ...contributions.map(c => [
          c.user.name,
          c.user.email,
          c.tasksCompleted,
          c.tasksInProgress,
          c.filesUploaded,
          c.totalHoursEstimated
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title.replace(/\s+/g, '_')}.csv`;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link to={`/projects/${id}`} className="text-primary-600 hover:text-primary-700">
            ← Back to Project
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">📊 Project Reports</h1>
          
          {/* Date Range for Contribution Report */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Generate Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => generateReport('contribution')}
              disabled={generating || !dateRange.startDate}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : '📈 Generate Contribution Report'}
            </button>
            <button
              onClick={() => generateReport('milestone')}
              disabled={generating}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : '🎯 Generate Milestone Report'}
            </button>
            <button
              onClick={() => generateReport('summary')}
              disabled={generating}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : '📋 Generate Project Summary'}
            </button>
          </div>
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{report.title}</h3>
                    <p className="text-sm text-gray-500">
                      Generated by {report.generatedBy?.firstName} {report.generatedBy?.lastName} on{' '}
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {report.reportType.replace('_', ' ')}
                  </span>
                </div>

                {report.description && (
                  <p className="text-gray-600 mb-4">{report.description}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => exportReport(report)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    📥 Export JSON
                  </button>
                  {report.reportType === 'contribution' && (
                    <button
                      onClick={() => exportToCSV(report)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      📊 Export CSV
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectReports;