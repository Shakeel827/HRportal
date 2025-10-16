import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X, MessageCircle, CheckCircle2 } from 'lucide-react';

export const TaskManagement: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    due_date: '',
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user) {
      fetchTasks();
      if (isAdmin) {
        fetchEmployees();
      }
    }
  }, [user, isAdmin]);

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id, employee_id, full_name')
      .eq('status', 'active')
      .order('full_name');

    setEmployees(data || []);
  };

  const fetchTasks = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_employee:employees!tasks_assigned_to_fkey(full_name, employee_id),
          assigned_by_employee:employees!tasks_assigned_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('assigned_to', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTaskId = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('task_id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) {
      return 'TASK001';
    }

    const lastId = data[0].task_id;
    const lastNumber = parseInt(lastId.replace('TASK', ''));
    const newNumber = lastNumber + 1;
    return `TASK${String(newNumber).padStart(3, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const taskId = await generateTaskId();

      const { error } = await supabase.from('tasks').insert({
        task_id: taskId,
        title: formData.title,
        description: formData.description,
        assigned_to: formData.assigned_to,
        assigned_by: user.id,
        priority: formData.priority,
        due_date: formData.due_date || null,
        status: 'assigned',
      });

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        employee_id: user.id,
        action: 'Created task',
        entity_type: 'task',
      });

      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        due_date: '',
      });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string, progress: number = 0) => {
    if (!user) return;

    try {
      const updateData: any = { status, progress_percentage: progress };

      if (status === 'completed') {
        updateData.completion_date = new Date().toISOString();
        updateData.progress_percentage = 100;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        employee_id: user.id,
        action: `Updated task status to ${status}`,
        entity_type: 'task',
        entity_id: taskId,
      });

      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  };

  const fetchComments = async (taskId: string) => {
    const { data } = await supabase
      .from('task_comments')
      .select('*, employees(full_name)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    setComments(data || []);
  };

  const handleAddComment = async () => {
    if (!user || !selectedTask || !newComment.trim()) return;

    try {
      const { error } = await supabase.from('task_comments').insert({
        task_id: selectedTask.id,
        employee_id: user.id,
        comment: newComment,
      });

      if (error) throw error;

      setNewComment('');
      fetchComments(selectedTask.id);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  const openComments = (task: any) => {
    setSelectedTask(task);
    setShowComments(true);
    fetchComments(task.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
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
            {isAdmin ? 'Task Management' : 'My Tasks'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Create and manage tasks for employees' : 'View and update your assigned tasks'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Create Task
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No tasks found
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{task.title}</h3>
                  <p className="text-xs text-gray-500">{task.task_id}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{task.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Assigned to:</span>
                  <span className="font-medium text-gray-900">{task.assigned_to_employee?.full_name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Assigned by:</span>
                  <span className="font-medium text-gray-900">{task.assigned_by_employee?.full_name}</span>
                </div>
                {task.due_date && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Due date:</span>
                    <span className="font-medium text-gray-900">{new Date(task.due_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium text-gray-900">{task.progress_percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${task.progress_percentage}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex-1 text-center ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
                <button
                  onClick={() => openComments(task)}
                  className="text-gray-600 hover:text-blue-600 p-2"
                  title="Comments"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>

              {!isAdmin && task.status !== 'completed' && task.status !== 'cancelled' && (
                <div className="flex gap-2">
                  {task.status === 'assigned' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'in_progress', 25)}
                      className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium py-2 rounded-lg transition"
                    >
                      Start Task
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'completed', 100)}
                      className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium py-2 rounded-lg transition flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Complete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Task'}
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

      {showComments && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedTask.title}</h2>
                <p className="text-sm text-gray-500">{selectedTask.task_id}</p>
              </div>
              <button onClick={() => setShowComments(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{comment.employees?.full_name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
