import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';

const ProjectReports = () => {
  const { id } = useParams();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generating, setGenerating] = useState({
    contribution: false,
    milestone: false,
    summary: false,
  });
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
      // ✅ FIX: Set specific type to generating, not the whole state
      setGenerating(prev => ({ ...prev, [type]: true }));
      
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
      console.error('Failed to generate report:', error);
      alert(error.response?.data?.message || 'Failed to generate report');
    } finally {
      // ✅ FIX: Reset specific type, not the whole state
      setGenerating(prev => ({ ...prev, [type]: false }));
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
    URL.revokeObjectURL(url);
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
      URL.revokeObjectURL(url);
    }
  };

  const deleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }
    
    try {
      await api.delete(`/reports/${reportId}`);
      alert('Report deleted successfully');
      fetchReports();
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report');
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
          <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-3xl">📊</span>
            Project Reports
          </h1>
          
          {/* Date Range for Contribution Report */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Generate Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => generateReport('contribution')}
              disabled={generating.contribution || !dateRange.startDate || !dateRange.endDate}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {generating.contribution ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>📈</span>
                  <span>Generate Contribution Report</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => generateReport('milestone')}
              disabled={generating.milestone}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {generating.milestone ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>🎯</span>
                  <span>Generate Milestone Report</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => generateReport('summary')}
              disabled={generating.summary}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {generating.summary ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Generate Project Summary</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Reports Yet</h3>
            <p className="text-gray-600">
              Generate your first report using the buttons above
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{report.title}</h3>
                    <p className="text-sm text-gray-500">
                      Generated by {report.generatedBy?.firstName} {report.generatedBy?.lastName} on{' '}
                      {new Date(report.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {report.reportType.replace(/_/g, ' ')}
                  </span>
                </div>

                {report.description && (
                  <p className="text-gray-600 mb-4">{report.description}</p>
                )}

                {/* Report Summary Stats */}
                {report.data && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {report.reportType === 'contribution' && (
                        <>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800">
                              {report.data.summary?.totalTasks || 0}
                            </p>
                            <p className="text-xs text-gray-500">Total Tasks</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800">
                              {report.data.summary?.totalFiles || 0}
                            </p>
                            <p className="text-xs text-gray-500">Files</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800">
                              {report.data.summary?.activeMembers || 0}
                            </p>
                            <p className="text-xs text-gray-500">Active Members</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800">
                              {report.data.contributions?.length || 0}
                            </p>
                            <p className="text-xs text-gray-500">Contributors</p>
                          </div>
                        </>
                      )}
                      {report.reportType === 'milestone' && (
                        <>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800">
                              {report.data.totalMilestones || 0}
                            </p>
                            <p className="text-xs text-gray-500">Total</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                              {report.data.completedMilestones || 0}
                            </p>
                            <p className="text-xs text-gray-500">Completed</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">
                              {report.data.overdueMilestones || 0}
                            </p>
                            <p className="text-xs text-gray-500">Overdue</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => exportReport(report)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                  >
                    <span>📥</span>
                    <span>Export JSON</span>
                  </button>
                  {report.reportType === 'contribution' && (
                    <button
                      onClick={() => exportToCSV(report)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <span>📊</span>
                      <span>Export CSV</span>
                    </button>
                  )}
                  <button
                    onClick={() => deleteReport(report._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
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