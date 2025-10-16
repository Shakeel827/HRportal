import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, Employee } from '../lib/supabase';

type AuthContextType = {
  user: Employee | null;
  loading: boolean;
  signIn: (employeeId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data as Employee;
  };

  const refreshUser = async () => {
    const userId = localStorage.getItem('currentUserId');
    if (userId) {
      const profile = await fetchUserProfile(userId);
      setUser(profile);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const userId = localStorage.getItem('currentUserId');

      if (userId) {
        const profile = await fetchUserProfile(userId);
        setUser(profile);
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const signIn = async (employeeId: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: employee, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('password', password)
        .maybeSingle();

      if (fetchError || !employee) {
        return { success: false, error: 'Invalid employee ID or password' };
      }

      if (employee.status !== 'active') {
        return { success: false, error: 'Your account is not active. Please contact HR.' };
      }

      setUser(employee as Employee);

      localStorage.setItem('currentUserId', employee.id);

      await supabase.from('activity_logs').insert({
        employee_id: employee.id,
        action: 'User logged in',
        entity_type: 'auth',
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An error occurred. Please try again.' };
    }
  };

  const signOut = async () => {
    if (user) {
      await supabase.from('activity_logs').insert({
        employee_id: user.id,
        action: 'User logged out',
        entity_type: 'auth',
      });
    }

    localStorage.removeItem('currentUserId');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
