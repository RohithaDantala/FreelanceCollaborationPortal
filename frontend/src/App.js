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
import ProjectTasks from './pages/ProjectTasks'; // NEW
import PrivateRoute from './components/PrivateRoute';
import ProjectFiles from './pages/ProjectFiles'; // adjust path as needed

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
                <div className="container mx-auto px-4 py-16 text-center">
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">
                    Freelance Project Collaboration Portal
                  </h1>
                  <p className="text-xl text-gray-600 mb-8">
                    Connect, collaborate, and deliver exceptional projects together
                  </p>
                  <div className="flex gap-4 justify-center">
                    <a 
                      href="/register" 
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Get Started
                    </a>
                    <a 
                      href="/projects" 
                      className="px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      Browse Projects
                    </a>
                  </div>
                </div>
              } 
            />
            
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/projects" element={<BrowseProjects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/project-files" element={<ProjectFiles />} />

            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/projects/create" 
              element={
                <PrivateRoute>
                  <CreateProject />
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
            <Route 
              path="/projects/:id/tasks" 
              element={
                <PrivateRoute>
                  <ProjectTasks />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/projects/:id/files" 
              element={
                <PrivateRoute>
                  <ProjectFiles />
                </PrivateRoute>
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