import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X, Check, XCircle, FileText } from 'lucide-react';

export const LeaveManagement: React.FC = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [formData, setFormData] = useState({
    leave_type: 'casual' as 'sick' | 'casual' | 'earned' | 'unpaid',
    from_date: '',
    to_date: '',
    reason: '',
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user) {
      fetchLeaves();
      if (!isAdmin) {
        fetchLeaveBalance();
      }
    }
  }, [user, isAdmin]);

  const fetchLeaves = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('leaves')
        .select('*, employees(full_name, employee_id)')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('employee_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeaves(data || []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalance = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('employee_id', user.id)
      .eq('year', new Date().getFullYear())
      .maybeSingle();

    setLeaveBalance(data);
  };

  const calculateDays = (from: string, to: string) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diff = toDate.getTime() - fromDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const totalDays = calculateDays(formData.from_date, formData.to_date);

      if (totalDays <= 0) {
        alert('Invalid date range');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('leaves').insert({
        employee_id: user.id,
        leave_type: formData.leave_type,
        from_date: formData.from_date,
        to_date: formData.to_date,
        total_days: totalDays,
        reason: formData.reason,
        status: 'pending',
      });

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        employee_id: user.id,
        action: 'Applied for leave',
        entity_type: 'leave',
      });

      setShowModal(false);
      setFormData({
        leave_type: 'casual',
        from_date: '',
        to_date: '',
        reason: '',
      });
      fetchLeaves();
    } catch (error) {
      console.error('Error submitting leave:', error);
      alert('Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (leaveId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    if (!user) return;

    try {
      const updateData: any = {
        status,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      };

      if (status === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('leaves')
        .update(updateData)
        .eq('id', leaveId);

      if (error) throw error;

      if (status === 'approved') {
        const leave = leaves.find(l => l.id === leaveId);
        if (leave && leaveBalance) {
          const balanceField = `${leave.leave_type}_leave`;
          const currentBalance = leaveBalance[balanceField] || 0;

          if (leave.leave_type !== 'unpaid') {
            await supabase
              .from('leave_balances')
              .update({
                [balanceField]: Math.max(0, currentBalance - leave.total_days)
              })
              .eq('employee_id', leave.employee_id)
              .eq('year', new Date().getFullYear());
          }
        }
      }

      await supabase.from('activity_logs').insert({
        employee_id: user.id,
        action: `Leave ${status}`,
        entity_type: 'leave',
        entity_id: leaveId,
      });

      fetchLeaves();
      if (!isAdmin) {
        fetchLeaveBalance();
      }
    } catch (error) {
      console.error('Error updating leave:', error);
      alert('Failed to update leave status');
    }
  };

  const getStatusColor = (status: string) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? 'Leave Requests' : 'My Leaves'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Manage employee leave requests' : 'Apply for and track your leaves'}
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Apply Leave
          </button>
        )}
      </div>

      {!isAdmin && leaveBalance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Casual Leave</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{leaveBalance.casual_leave}</p>
                <p className="text-xs text-gray-500 mt-1">Available</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sick Leave</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{leaveBalance.sick_leave}</p>
                <p className="text-xs text-gray-500 mt-1">Available</p>
              </div>
              <FileText className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Earned Leave</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{leaveBalance.earned_leave}</p>
                <p className="text-xs text-gray-500 mt-1">Available</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {isAdmin && <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Employee</th>}
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Leave Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">From</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">To</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Days</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Reason</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                {isAdmin && <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 6} className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 6} className="text-center py-8 text-gray-500">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {isAdmin && (
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {leave.employees?.full_name}
                        <br />
                        <span className="text-xs text-gray-500">{leave.employees?.employee_id}</span>
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm text-gray-900 capitalize">{leave.leave_type}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(leave.from_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(leave.to_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{leave.total_days}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{leave.reason}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        {leave.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveReject(leave.id, 'approved')}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Approve"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Rejection reason:');
                                if (reason) handleApproveReject(leave.id, 'rejected', reason);
                              }}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Apply for Leave</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="earned">Earned Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={formData.from_date}
                  onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={formData.to_date}
                  onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  required
                  placeholder="Please provide a reason for your leave..."
                />
              </div>

              {formData.from_date && formData.to_date && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Total days: <span className="font-semibold">{calculateDays(formData.from_date, formData.to_date)}</span>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
