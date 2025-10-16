# GENPANDAX CONSULTING - HR Management Portal

A comprehensive HR management system built with React, TypeScript, TailwindCSS, and Supabase.

## Features

### Admin Features
- **Dashboard** - Overview of company metrics, attendance, leaves, and tasks
- **Employee Management** - Create, edit, and manage employee accounts
- **Attendance Tracking** - Monitor employee attendance and work hours
- **Leave Management** - Approve/reject leave requests and track leave balances
- **Task Management** - Create, assign, and track tasks for employees
- **Schedules** - Manage shift schedules for employees
- **Payroll** - Generate payslips and manage salary information
- **Announcements** - Create company-wide announcements

### Employee Features
- **Personal Dashboard** - View personal stats and upcoming tasks
- **Attendance** - Check-in/check-out functionality and view attendance history
- **Leave Applications** - Apply for leaves and track leave balance
- **Task Tracking** - View assigned tasks, update progress, and add comments
- **Schedule** - View personal work schedule
- **Payslips** - Access salary slips and payment history
- **Profile** - Update personal information

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. The database schema is already applied via migrations

### Creating the First Admin User

Since the system requires an admin to create employees, you need to set up the first admin manually:

1. Go to your Supabase Dashboard
2. Navigate to Authentication > Users
3. Create a new user with email and password
4. Copy the User ID (UUID)
5. Go to SQL Editor and run:

```sql
INSERT INTO employees (
  id,
  employee_id,
  email,
  password,
  full_name,
  role,
  department,
  position,
  basic_salary,
  status,
  joining_date
) VALUES (
  'paste-user-uuid-here',
  'EMP001',
  'admin@genpandax.com',
  'admin123',
  'System Administrator',
  'admin',
  'IT',
  'HR Manager',
  50000,
  'active',
  CURRENT_DATE
);

-- Create leave balance for admin
INSERT INTO leave_balances (
  employee_id,
  year,
  sick_leave,
  casual_leave,
  earned_leave
) VALUES (
  'paste-user-uuid-here',
  EXTRACT(YEAR FROM CURRENT_DATE),
  10,
  12,
  15
);
```

6. Now you can login with:
   - Employee ID: `EMP001`
   - Password: `admin123`

### Running the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # React components
│   ├── Login.tsx       # Login page
│   ├── Layout.tsx      # Main layout with sidebar
│   ├── AdminDashboard.tsx
│   ├── EmployeeDashboard.tsx
│   ├── EmployeeManagement.tsx
│   ├── AttendanceView.tsx
│   ├── LeaveManagement.tsx
│   └── TaskManagement.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── lib/                # Utilities
│   └── supabase.ts    # Supabase client and types
├── App.tsx            # Main app component
└── main.tsx           # Entry point
```

## Database Schema

### Core Tables
- **employees** - Employee information and authentication
- **attendance** - Daily attendance records
- **leaves** - Leave applications and approvals
- **tasks** - Task assignments and tracking
- **task_comments** - Comments on tasks
- **schedules** - Shift schedules
- **payroll** - Salary and payslip information
- **announcements** - Company announcements
- **leave_balances** - Employee leave balances
- **activity_logs** - System activity audit trail

## Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control (Admin/Employee)
- Secure authentication via Supabase Auth
- Activity logging for audit trails

## Default Leave Balance

When creating a new employee, the system automatically initializes:
- Casual Leave: 12 days
- Sick Leave: 10 days
- Earned Leave: 15 days

## Usage

### For Admins

1. Login with admin credentials
2. Create employee accounts from Employee Management
3. Review and approve leave requests
4. Create and assign tasks
5. Monitor attendance and generate reports

### For Employees

1. Login with Employee ID and password
2. Mark daily attendance (check-in/check-out)
3. Apply for leaves when needed
4. View and update assigned tasks
5. Check work schedule and payslips

## Support

For issues or questions, contact IT Support at GENPANDAX CONSULTING.

## License

Proprietary - GENPANDAX CONSULTING © 2025
