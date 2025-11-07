import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Page components
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import BrowseProjects from './pages/BrowseProjects';
import ProjectDetail from './pages/ProjectDetail';
import MyProjects from './pages/MyProjects';
import ProjectTasks from './pages/ProjectTasks';
import ProjectFiles from './pages/ProjectFiles';
import ProjectMilestones from './pages/ProjectMilestones';
import ProjectReports from './pages/ProjectReports';
import ProjectPayments from './pages/ProjectPayments';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import ProjectMemberRoute from './components/ProjectMemberRoute';
import PrivateRoute from './components/PrivateRoute';
import OwnerRoute from './components/OwnerRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        
        <main className="flex-grow">
          <Routes>
            {/* Public routes */}
            <Route 
              path="/" 
              element={
                <div className="container mx-auto px-4 py-16">
                  <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl font-bold text-gray-800 mb-4">
                      Freelance Project Collaboration Portal
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                      Connect, collaborate, and deliver exceptional projects together
                    </p>
                    <div className="flex gap-4 justify-center mb-12">
                      <a 
                        href="/register" 
                        className="px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-lg font-semibold shadow-lg"
                      >
                        Get Started Free
                      </a>
                      <a 
                        href="/projects" 
                        className="px-8 py-4 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors text-lg font-semibold"
                      >
                        Browse Projects
                      </a>
                    </div>
                    
                    {/* Feature Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-4xl mb-4">📋</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Task Management</h3>
                        <p className="text-gray-600">Organize tasks with Kanban boards and track progress in real-time</p>
                      </div>
                      
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-4xl mb-4">🎯</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Milestone Tracking</h3>
                        <p className="text-gray-600">Set milestones and monitor project progress with visual analytics</p>
                      </div>
                      
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-4xl mb-4">📁</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">File Management</h3>
                        <p className="text-gray-600">Share files, manage deliverables, and version control</p>
                      </div>
                      
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-4xl mb-4">👥</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Team Collaboration</h3>
                        <p className="text-gray-600">Work together seamlessly with real-time notifications</p>
                      </div>
                      
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-4xl mb-4">📊</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Progress Analytics</h3>
                        <p className="text-gray-600">Get insights with detailed progress reports and dashboards</p>
                      </div>
                      
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-4xl mb-4">🔔</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Smart Notifications</h3>
                        <p className="text-gray-600">Stay updated with instant notifications for all activities</p>
                      </div>
                    </div>
                  </div>
                </div>
              } 
            />
            
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/projects" element={<BrowseProjects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />

            {/* Protected routes - Require login */}
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            
            {/* Owner-only route - Require project_owner or admin role */}
            <Route 
              path="/projects/create" 
              element={
                <PrivateRoute>
                  <OwnerRoute>
                    <CreateProject />
                  </OwnerRoute>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/my-projects" 
              element={
                <PrivateRoute>
                  <MyProjects />
                </PrivateRoute>
              } 
            />
            
            {/* Project member routes */}
            <Route 
              path="/projects/:id/tasks" 
              element={
                <PrivateRoute>
                  <ProjectMemberRoute>
                    <ProjectTasks />
                  </ProjectMemberRoute>
                </PrivateRoute>
              } 
            />

            <Route 
              path="/projects/:id/files" 
              element={
                <PrivateRoute>
                  <ProjectMemberRoute>
                    <ProjectFiles />
                  </ProjectMemberRoute>
                </PrivateRoute>
              } 
            />

            <Route 
              path="/projects/:id/milestones" 
              element={
                <PrivateRoute>
                  <ProjectMemberRoute>
                    <ProjectMilestones />
                  </ProjectMemberRoute>
                </PrivateRoute>
              } 
            />
            <Route
                path="/projects/:id/payments"
                element={
                  <PrivateRoute>
                    <ProjectMemberRoute>
                      <ProjectPayments />
                    </ProjectMemberRoute>
                  </PrivateRoute>
                }
              />

            {/* NEW: Reports Route */}
            <Route 
              path="/projects/:id/reports" 
              element={
                <PrivateRoute>
                  <ProjectMemberRoute>
                    <ProjectReports />
                  </ProjectMemberRoute>
                </PrivateRoute>
              } 
            />

            {/* Admin routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <PrivateRoute>
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                </PrivateRoute>
              } 
            />

            <Route 
              path="/admin/users" 
              element={
                <PrivateRoute>
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                </PrivateRoute>
              } 
            />

            {/* 404 Not Found */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Page not found</p>
                    <a 
                      href="/" 
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Go Home
                    </a>
                  </div>
                </div>
              } 
            />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;