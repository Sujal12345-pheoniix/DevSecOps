import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/ToastContainer';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SprintBoard from './pages/SprintBoard';
import PipelineSimulator from './pages/PipelineSimulator';
import Settings from './pages/Settings';

const DashboardLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-darkBg transition-colors duration-150">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout title="Platform Health Dashboard">
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <DashboardLayout title="Sprint Board & Active Backlog">
                    <SprintBoard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pipelines"
              element={
                <ProtectedRoute>
                  <DashboardLayout title="Deployment Pipeline Simulator">
                    <PipelineSimulator />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout title="Registry Configuration & Services">
                    <Settings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Floating alert toasts */}
          <ToastContainer />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
