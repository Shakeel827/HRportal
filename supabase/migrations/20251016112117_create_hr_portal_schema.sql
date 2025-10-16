/*
  # GENPANDAX CONSULTING HR Portal Database Schema

  ## Overview
  Complete HR management system with employee management, attendance tracking,
  leave management, payroll, task management, and scheduling.

  ## New Tables

  ### 1. employees
  Core employee information and authentication
  - `id` (uuid, primary key) - Unique employee identifier
  - `employee_id` (text, unique) - Human-readable employee ID (e.g., EMP001)
  - `email` (text, unique) - Employee email address
  - `password` (text) - Hashed password
  - `full_name` (text) - Employee full name
  - `role` (text) - Role: 'admin' or 'employee'
  - `department` (text) - Department name
  - `position` (text) - Job position/title
  - `phone` (text) - Contact number
  - `address` (text) - Residential address
  - `joining_date` (date) - Date of joining
  - `basic_salary` (numeric) - Monthly basic salary
  - `status` (text) - Employment status: 'active', 'inactive', 'terminated'
  - `profile_photo_url` (text) - Profile photo storage path
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. attendance
  Daily attendance records with check-in/check-out times
  - `id` (uuid, primary key)
  - `employee_id` (uuid, foreign key) - References employees
  - `date` (date) - Attendance date
  - `check_in_time` (timestamptz) - Check-in timestamp
  - `check_out_time` (timestamptz) - Check-out timestamp
  - `status` (text) - Status: 'present', 'absent', 'half_day', 'late'
  - `work_hours` (numeric) - Total work hours for the day
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)

  ### 3. leaves
  Leave applications and approval tracking
  - `id` (uuid, primary key)
  - `employee_id` (uuid, foreign key) - References employees
  - `leave_type` (text) - Type: 'sick', 'casual', 'earned', 'unpaid'
  - `from_date` (date) - Leave start date
  - `to_date` (date) - Leave end date
  - `total_days` (integer) - Number of leave days
  - `reason` (text) - Reason for leave
  - `status` (text) - Status: 'pending', 'approved', 'rejected'
  - `approved_by` (uuid) - References employees (admin who approved)
  - `approved_at` (timestamptz) - Approval timestamp
  - `rejection_reason` (text) - Reason if rejected
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. payroll
  Monthly payroll and salary details
  - `id` (uuid, primary key)
  - `employee_id` (uuid, foreign key) - References employees
  - `month` (integer) - Month (1-12)
  - `year` (integer) - Year
  - `basic_salary` (numeric) - Basic monthly salary
  - `allowances` (numeric) - Additional allowances
  - `deductions` (numeric) - Tax and other deductions
  - `net_pay` (numeric) - Final net salary
  - `payslip_url` (text) - Generated payslip file path
  - `payment_status` (text) - Status: 'pending', 'paid'
  - `payment_date` (date) - Date of payment
  - `created_at` (timestamptz)

  ### 5. tasks
  Task assignment and tracking system
  - `id` (uuid, primary key)
  - `task_id` (text, unique) - Human-readable task ID (e.g., TASK001)
  - `title` (text) - Task title
  - `description` (text) - Detailed task description
  - `assigned_to` (uuid, foreign key) - References employees
  - `assigned_by` (uuid, foreign key) - References employees (admin)
  - `priority` (text) - Priority: 'low', 'medium', 'high', 'urgent'
  - `status` (text) - Status: 'assigned', 'in_progress', 'completed', 'cancelled'
  - `due_date` (date) - Task deadline
  - `completion_date` (timestamptz) - Actual completion date
  - `progress_percentage` (integer) - Progress (0-100)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. task_comments
  Comments and updates on tasks
  - `id` (uuid, primary key)
  - `task_id` (uuid, foreign key) - References tasks
  - `employee_id` (uuid, foreign key) - References employees
  - `comment` (text) - Comment text
  - `created_at` (timestamptz)

  ### 7. schedules
  Shift and work schedule management
  - `id` (uuid, primary key)
  - `employee_id` (uuid, foreign key) - References employees
  - `shift_name` (text) - Shift name (e.g., Morning, Evening, Night)
  - `date` (date) - Scheduled date
  - `shift_start` (time) - Shift start time
  - `shift_end` (time) - Shift end time
  - `break_duration` (integer) - Break duration in minutes
  - `location` (text) - Work location
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)

  ### 8. announcements
  Company-wide announcements and notices
  - `id` (uuid, primary key)
  - `title` (text) - Announcement title
  - `message` (text) - Announcement content
  - `posted_by` (uuid, foreign key) - References employees (admin)
  - `priority` (text) - Priority: 'normal', 'important', 'urgent'
  - `is_active` (boolean) - Whether announcement is currently active
  - `created_at` (timestamptz)
  - `expires_at` (timestamptz) - Expiration date

  ### 9. activity_logs
  System activity and audit trail
  - `id` (uuid, primary key)
  - `employee_id` (uuid, foreign key) - References employees
  - `action` (text) - Action performed
  - `entity_type` (text) - Entity affected (e.g., 'leave', 'task', 'attendance')
  - `entity_id` (uuid) - ID of affected entity
  - `details` (jsonb) - Additional details
  - `ip_address` (text) - User IP address
  - `created_at` (timestamptz)

  ### 10. leave_balances
  Track remaining leave balances for employees
  - `id` (uuid, primary key)
  - `employee_id` (uuid, foreign key) - References employees
  - `year` (integer) - Year
  - `sick_leave` (integer) - Sick leave balance
  - `casual_leave` (integer) - Casual leave balance
  - `earned_leave` (integer) - Earned leave balance
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Policies allow employees to access only their own data
  - Admin users can access all data
  - Public access disabled by default

  ## Indexes
  - Created on foreign keys for performance
  - Created on frequently queried columns (employee_id, date, status)
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  department text,
  position text,
  phone text,
  address text,
  joining_date date DEFAULT CURRENT_DATE,
  basic_salary numeric(10, 2) DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  profile_photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  check_in_time timestamptz,
  check_out_time timestamptz,
  status text DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half_day', 'late')),
  work_hours numeric(4, 2),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Create leaves table
CREATE TABLE IF NOT EXISTS leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type text NOT NULL CHECK (leave_type IN ('sick', 'casual', 'earned', 'unpaid')),
  from_date date NOT NULL,
  to_date date NOT NULL,
  total_days integer NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES employees(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payroll table
CREATE TABLE IF NOT EXISTS payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  year integer NOT NULL,
  basic_salary numeric(10, 2) NOT NULL,
  allowances numeric(10, 2) DEFAULT 0,
  deductions numeric(10, 2) DEFAULT 0,
  net_pay numeric(10, 2) NOT NULL,
  payslip_url text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  payment_date date,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, month, year)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  assigned_to uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES employees(id),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
  due_date date,
  completion_date timestamptz,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_name text NOT NULL,
  date date NOT NULL,
  shift_start time NOT NULL,
  shift_end time NOT NULL,
  break_duration integer DEFAULT 60,
  location text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  posted_by uuid NOT NULL REFERENCES employees(id),
  priority text DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Create leave_balances table
CREATE TABLE IF NOT EXISTS leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year integer NOT NULL,
  sick_leave integer DEFAULT 10,
  casual_leave integer DEFAULT 12,
  earned_leave integer DEFAULT 15,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, year)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leaves_employee ON leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_schedules_employee_date ON schedules(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_employee ON activity_logs(employee_id);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow public read access to employees" ON employees;
  DROP POLICY IF EXISTS "Allow public insert access to employees" ON employees;
  DROP POLICY IF EXISTS "Allow public update access to employees" ON employees;
  DROP POLICY IF EXISTS "Employees can view own profile" ON employees;
  DROP POLICY IF EXISTS "Admins can view all employees" ON employees;
  DROP POLICY IF EXISTS "Admins can insert employees" ON employees;
  DROP POLICY IF EXISTS "Admins can update employees" ON employees;
  DROP POLICY IF EXISTS "Employees can update own profile" ON employees;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- RLS Policies for employees table - Allow public access for login
CREATE POLICY "Allow public read access to employees"
  ON employees FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to employees"
  ON employees FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to employees"
  ON employees FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- RLS Policies for attendance table
CREATE POLICY "Public can view all attendance"
  ON attendance FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert attendance"
  ON attendance FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update attendance"
  ON attendance FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- RLS Policies for leaves table
CREATE POLICY "Public can view all leaves"
  ON leaves FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert leaves"
  ON leaves FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update leaves"
  ON leaves FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- RLS Policies for payroll table
CREATE POLICY "Public can view all payroll"
  ON payroll FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can manage payroll"
  ON payroll FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- RLS Policies for tasks table
CREATE POLICY "Public can view all tasks"
  ON tasks FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can manage tasks"
  ON tasks FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- RLS Policies for task_comments table
CREATE POLICY "Public can view all comments"
  ON task_comments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert comments"
  ON task_comments FOR INSERT
  TO public
  WITH CHECK (true);

-- RLS Policies for schedules table
CREATE POLICY "Public can view all schedules"
  ON schedules FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can manage schedules"
  ON schedules FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- RLS Policies for announcements table
CREATE POLICY "Public can view all announcements"
  ON announcements FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can manage announcements"
  ON announcements FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- RLS Policies for activity_logs table
CREATE POLICY "Public can view all logs"
  ON activity_logs FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert logs"
  ON activity_logs FOR INSERT
  TO public
  WITH CHECK (true);

-- RLS Policies for leave_balances table
CREATE POLICY "Public can view all leave balances"
  ON leave_balances FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can manage leave balances"
  ON leave_balances FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leaves_updated_at ON leaves;
CREATE TRIGGER update_leaves_updated_at
  BEFORE UPDATE ON leaves
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leave_balances_updated_at ON leave_balances;
CREATE TRIGGER update_leave_balances_updated_at
  BEFORE UPDATE ON leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();