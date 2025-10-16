import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Calendar, FileText, ClipboardList, TrendingUp, Clock } from 'lucide-react';

type Stats = {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaves: number;
  todayAttendance: number;
  activeTasks: number;
  completedTasks: number;
};

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    todayAttendance: 0,
    activeTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        employeesRes,
        leavesRes,
        attendanceRes,
        tasksRes,
        recentLeavesRes,
      ] = await Promise.all([
        supabase.from('employees').select('id, status', { count: 'exact' }),
        supabase.from('leaves').select('id, status', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('attendance').select('id', { count: 'exact' }).eq('date', new Date().toISOString().split('T')[0]),
        supabase.from('tasks').select('id, status', { count: 'exact' }),
        supabase
          .from('leaves')
          .select('id, employee_id, leave_type, from_date, to_date, status, employees(full_name, employee_id)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const activeEmployees = employeesRes.data?.filter(e => e.status === 'active').length || 0;
      const activeTasks = tasksRes.data?.filter(t => t.status === 'assigned' || t.status === 'in_progress').length || 0;
      const completedTasks = tasksRes.data?.filter(t => t.status === 'completed').length || 0;

      setStats({
        totalEmployees: employeesRes.count || 0,
        activeEmployees,
        pendingLeaves: leavesRes.count || 0,
        todayAttendance: attendanceRes.count || 0,
        activeTasks,
        completedTasks,
      });

      setRecentLeaves(recentLeavesRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      subtitle: `${stats.activeEmployees} active`,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: "Today's Attendance",
      value: stats.todayAttendance,
      subtitle: `Out of ${stats.activeEmployees}`,
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      title: 'Pending Leaves',
      value: stats.pendingLeaves,
      subtitle: 'Require approval',
      icon: FileText,
      color: 'bg-orange-500',
    },
    {
      title: 'Active Tasks',
      value: stats.activeTasks,
      subtitle: `${stats.completedTasks} completed`,
      icon: ClipboardList,
      color: 'bg-purple-500',
    },
  ];

  const getLeaveStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Leave Requests</h2>
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {recentLeaves.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No recent leave requests</p>
            ) : (
              recentLeaves.map((leave: any) => (
                <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{leave.employees?.full_name}</p>
                    <p className="text-sm text-gray-600">
                      {leave.leave_type} • {new Date(leave.from_date).toLocaleDateString()} - {new Date(leave.to_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLeaveStatusColor(leave.status)}`}>
                    {leave.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Stats</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Attendance Rate</p>
                  <p className="text-xs text-gray-600">Today</p>
                </div>
              </div>
              <p className="text-xl font-bold text-blue-600">
                {stats.activeEmployees > 0 ? Math.round((stats.todayAttendance / stats.activeEmployees) * 100) : 0}%
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Task Completion</p>
                  <p className="text-xs text-gray-600">Overall</p>
                </div>
              </div>
              <p className="text-xl font-bold text-purple-600">
                {(stats.activeTasks + stats.completedTasks) > 0
                  ? Math.round((stats.completedTasks / (stats.activeTasks + stats.completedTasks)) * 100)
                  : 0}%
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Pending Actions</p>
                  <p className="text-xs text-gray-600">Require attention</p>
                </div>
              </div>
              <p className="text-xl font-bold text-orange-600">{stats.pendingLeaves}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
