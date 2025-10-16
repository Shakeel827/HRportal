# Create Admin User - Quick Setup Guide

Since the database is empty, you need to create the first admin user. Follow these steps:

## Step 1: Create Auth User in Supabase

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"** or **"Create new user"**
4. Fill in:
   - **Email**: `admin@genpandax.com`
   - **Password**: `Admin@123`
   - Click **"Create user"**

5. **IMPORTANT**: Copy the **User ID (UUID)** that gets generated - you'll need it in the next step

## Step 2: Add Employee Record

1. In Supabase Dashboard, go to **SQL Editor**
2. Paste and run this SQL (replace `YOUR_USER_UUID_HERE` with the UUID from Step 1):

```sql
-- Insert admin employee record
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
  'YOUR_USER_UUID_HERE',
  'EMP001',
  'admin@genpandax.com',
  'Admin@123',
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
  'YOUR_USER_UUID_HERE',
  EXTRACT(YEAR FROM CURRENT_DATE),
  10,
  12,
  15
);
```

## Step 3: Login

Now you can login to the HR Portal with:

- **Employee ID**: `EMP001`
- **Password**: `Admin@123`

## Alternative: Quick Setup Script

If you prefer, you can also use the Supabase Dashboard to:

1. Go to **Table Editor** → **employees**
2. Click **"Insert row"**
3. Fill in the fields manually using the values above

---

## After Login

Once logged in as admin, you can:
- Create additional employee accounts through the **Employee Management** page
- The system will auto-generate Employee IDs (EMP002, EMP003, etc.)
- Each new employee gets automatic leave balance initialization

## Troubleshooting

**Error: "Invalid employee ID or password"**
- Make sure the UUID in the SQL matches exactly
- Verify the auth user was created successfully
- Check that employee status is 'active'

**Error: "Account is not active"**
- The status field must be 'active', not 'inactive' or 'terminated'
