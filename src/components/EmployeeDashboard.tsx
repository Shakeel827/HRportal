import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, FileText, ClipboardList, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayAttendance: null as any,
    pendingLeaves: 0,
    activeTasks: 0,
    upcomingShifts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const [attendanceRes, leavesRes, tasksRes, shiftsRes, leaveBalanceRes] = await Promise.all([
        supabase
          .from('attendance')
          .select('*')
          .eq('employee_id', user.id)
          .eq('date', today)
          .maybeSingle(),
        supabase
          .from('leaves')
          .select('*', { count: 'exact' })
          .eq('employee_id', user.id)
          .eq('status', 'pending'),
        supabase
          .from('tasks')
          .select('*, assigned_by_employee:employees!tasks_assigned_by_fkey(full_name)')
          .eq('assigned_to', user.id)
          .in('status', ['assigned', 'in_progress'])
          .order('due_date', { ascending: true })
          .limit(5),
        supabase
          .from('schedules')
          .select('*', { count: 'exact' })
          .eq('employee_id', user.id)
          .gte('date', today)
          .limit(3),
        supabase
          .from('leave_balances')
          .select('*')
          .eq('employee_id', user.id)
          .eq('year', new Date().getFullYear())
          .maybeSingle(),
      ]);

      setStats({
        todayAttendance: attendanceRes.data,
        pendingLeaves: leavesRes.count || 0,
        activeTasks: tasksRes.data?.length || 0,
        upcomingShifts: shiftsRes.count || 0,
      });

      setTasks(tasksRes.data || []);
      setLeaveBalance(leaveBalanceRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;
    setCheckingIn(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      const { error } = await supabase.from('attendance').insert({
        employee_id: user.id,
        date: today,
        check_in_time: now,
        status: 'present',
      });

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        employee_id: user.id,
        action: 'Checked in',
        entity_type: 'attendance',
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user || !stats.todayAttendance) return;
    setCheckingIn(true);

    try {
      const now = new Date().toISOString();
      const checkInTime = new Date(stats.todayAttendance.check_in_time);
      const checkOutTime = new Date(now);
      const workHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      const { error } = await supabase
        .from('attendance')
        .update({
          check_out_time: now,
          work_hours: Math.round(workHours * 100) / 100,
        })
        .eq('id', stats.todayAttendance.id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        employee_id: user.id,
        action: 'Checked out',
        entity_type: 'attendance',
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Error checking out:', error);
      alert('Failed to check out. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
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
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.full_name}!</h1>
        <p className="text-gray-600 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Attendance Today</h2>
            {stats.todayAttendance ? (
              <>
                <p className="text-blue-100">
                  Checked in at {new Date(stats.todayAttendance.check_in_time).toLocaleTimeString()}
                </p>
                {stats.todayAttendance.check_out_time && (
                  <p className="text-blue-100 mt-1">
                    Checked out at {new Date(stats.todayAttendance.check_out_time).toLocaleTimeString()}
                  </p>
                )}
              </>
            ) : (
              <p className="text-blue-100">You haven't checked in today</p>
            )}
          </div>
          <div>
            {!stats.todayAttendance ? (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition disabled:opacity-50"
              >
                {checkingIn ? 'Processing...' : 'Check In'}
              </button>
            ) : !stats.todayAttendance.check_out_time ? (
              <button
                onClick={handleCheckOut}
                disabled={checkingIn}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition disabled:opacity-50"
              >
                {checkingIn ? 'Processing...' : 'Check Out'}
              </button>
            ) : (
              <div className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Completed
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingLeaves}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tasks</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeTasks}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <ClipboardList className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Shifts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.upcomingShifts}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Leave Balance</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {leaveBalance ? leaveBalance.casual_leave + leaveBalance.sick_leave + leaveBalance.earned_leave : 0}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Active Tasks</h2>
            <ClipboardList className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No active tasks</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Assigned by: {task.assigned_by_employee?.full_name}</span>
                    {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Leave Balance Details</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          {leaveBalance ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Casual Leave</p>
                  <p className="text-xs text-gray-600">Available</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{leaveBalance.casual_leave}</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Sick Leave</p>
                  <p className="text-xs text-gray-600">Available</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{leaveBalance.sick_leave}</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Earned Leave</p>
                  <p className="text-xs text-gray-600">Available</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">{leaveBalance.earned_leave}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-4 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">Leave balance not initialized. Contact HR.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
