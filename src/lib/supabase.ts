import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Employee = {
  id: string;
  employee_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'employee';
  department: string | null;
  position: string | null;
  phone: string | null;
  address: string | null;
  joining_date: string;
  basic_salary: number;
  status: 'active' | 'inactive' | 'terminated';
  profile_photo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Attendance = {
  id: string;
  employee_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: 'present' | 'absent' | 'half_day' | 'late';
  work_hours: number | null;
  notes: string | null;
  created_at: string;
};

export type Leave = {
  id: string;
  employee_id: string;
  leave_type: 'sick' | 'casual' | 'earned' | 'unpaid';
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  task_id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  assigned_by: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  completion_date: string | null;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
};

export type Schedule = {
  id: string;
  employee_id: string;
  shift_name: string;
  date: string;
  shift_start: string;
  shift_end: string;
  break_duration: number;
  location: string | null;
  notes: string | null;
  created_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  posted_by: string;
  priority: 'normal' | 'important' | 'urgent';
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
};

export type Payroll = {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_pay: number;
  payslip_url: string | null;
  payment_status: 'pending' | 'paid';
  payment_date: string | null;
  created_at: string;
};

export type LeaveBalance = {
  id: string;
  employee_id: string;
  year: number;
  sick_leave: number;
  casual_leave: number;
  earned_leave: number;
  updated_at: string;
};
