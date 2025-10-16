import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const AttendanceView: React.FC = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [employees, setEmployees] = useState<any[]>([]);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchEmployees();
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchAttendance();
  }, [month, year, selectedEmployee, user]);

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id, employee_id, full_name')
      .eq('status', 'active')
      .order('full_name');

    setEmployees(data || []);
  };

  const fetchAttendance = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      let query = supabase
        .from('attendance')
        .select('*, employees(full_name, employee_id)')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (isAdmin && selectedEmployee) {
        query = query.eq('employee_id', selectedEmployee);
      } else if (!isAdmin) {
        query = query.eq('employee_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-orange-100 text-orange-800';
      case 'half_day':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateStats = () => {
    const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const totalWorkHours = attendance.reduce((sum, a) => sum + (a.work_hours || 0), 0);
    const avgWorkHours = attendance.length > 0 ? totalWorkHours / attendance.length : 0;

    return { present, absent, totalWorkHours, avgWorkHours };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isAdmin ? 'Attendance Management' : 'My Attendance'}
        </h1>
        <p className="text-gray-600 mt-1">View and track attendance records</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {isAdmin && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_id})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const y = new Date().getFullYear() - i;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Present Days</p>
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Absent Days</p>
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Hours</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalWorkHours.toFixed(1)}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Avg Hours/Day</p>
            <p className="text-2xl font-bold text-purple-600">{stats.avgWorkHours.toFixed(1)}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Date</th>
                {isAdmin && <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Employee</th>}
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Check In</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Check Out</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Work Hours</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {record.employees?.full_name}
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {record.work_hours ? `${record.work_hours.toFixed(2)} hrs` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
