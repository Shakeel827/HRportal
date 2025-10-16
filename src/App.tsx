import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { AdminDashboard } from './components/AdminDashboard';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { EmployeeManagement } from './components/EmployeeManagement';
import { AttendanceView } from './components/AttendanceView';
import { LeaveManagement } from './components/LeaveManagement';
import { TaskManagement } from './components/TaskManagement';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    if (user.role === 'admin') {
      switch (currentPage) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'employees':
          return <EmployeeManagement />;
        case 'attendance':
          return <AttendanceView />;
        case 'leaves':
          return <LeaveManagement />;
        case 'tasks':
          return <TaskManagement />;
        default:
          return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
              <p className="text-gray-600">This feature is under development</p>
            </div>
          );
      }
    } else {
      switch (currentPage) {
        case 'dashboard':
          return <EmployeeDashboard />;
        case 'attendance':
          return <AttendanceView />;
        case 'leaves':
          return <LeaveManagement />;
        case 'tasks':
          return <TaskManagement />;
        default:
          return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
              <p className="text-gray-600">This feature is under development</p>
            </div>
          );
      }
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
