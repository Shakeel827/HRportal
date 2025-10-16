import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if admin already exists
    const { data: existingEmployee } = await supabase
      .from('employees')
      .select('employee_id')
      .eq('employee_id', 'EMP001')
      .maybeSingle();

    if (existingEmployee) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Admin already exists',
          credentials: {
            employeeId: 'EMP001',
            password: 'Admin@123',
          },
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Create admin auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@genpandax.com',
      password: 'Admin@123',
      email_confirm: true,
      user_metadata: {
        full_name: 'System Administrator',
      },
    });

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user');
    }

    const userId = authData.user.id;

    // Create employee record
    const { error: empError } = await supabase.from('employees').insert({
      id: userId,
      employee_id: 'EMP001',
      email: 'admin@genpandax.com',
      password: 'Admin@123',
      full_name: 'System Administrator',
      role: 'admin',
      department: 'IT',
      position: 'HR Manager',
      basic_salary: 50000,
      status: 'active',
      joining_date: new Date().toISOString().split('T')[0],
    });

    if (empError) {
      throw new Error(`Employee error: ${empError.message}`);
    }

    // Create leave balance
    const { error: leaveError } = await supabase.from('leave_balances').insert({
      employee_id: userId,
      year: new Date().getFullYear(),
      sick_leave: 10,
      casual_leave: 12,
      earned_leave: 15,
    });

    if (leaveError) {
      throw new Error(`Leave balance error: ${leaveError.message}`);
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      employee_id: userId,
      action: 'Admin account initialized',
      entity_type: 'system',
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin account created successfully!',
        credentials: {
          employeeId: 'EMP001',
          password: 'Admin@123',
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});