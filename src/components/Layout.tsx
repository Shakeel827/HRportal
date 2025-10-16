import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  DollarSign,
  Clock,
  FileText,
  Bell,
  LogOut,
  Menu,
  X,
  Building2,
  User as UserIcon,
} from 'lucide-react';

type Props = {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
};

export const Layout: React.FC<Props> = ({ children, currentPage, onNavigate }) => {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'leaves', label: 'Leave Requests', icon: FileText },
    { id: 'tasks', label: 'Task Management', icon: ClipboardList },
    { id: 'schedules', label: 'Schedules', icon: Clock },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'announcements', label: 'Announcements', icon: Bell },
  ];

  const employeeMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'My Attendance', icon: Calendar },
    { id: 'leaves', label: 'My Leaves', icon: FileText },
    { id: 'tasks', label: 'My Tasks', icon: ClipboardList },
    { id: 'schedule', label: 'My Schedule', icon: Clock },
    { id: 'payroll', label: 'Payslips', icon: DollarSign },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : employeeMenuItems;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-3 ml-2 lg:ml-0">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">GENPANDAX</h1>
                  <p className="text-xs text-gray-600 hidden sm:block">HR Portal</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-600">{user?.employee_id} • {user?.role === 'admin' ? 'Admin' : 'Employee'}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        <aside
          className={`
            fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-20
            transition-transform duration-300 ease-in-out w-64
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
          `}
        >
          <nav className="p-4 space-y-1 overflow-y-auto h-full">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
