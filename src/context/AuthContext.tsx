import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DatabaseService } from '../lib/supabaseClient';

interface AuthContextType {
  user: any;
  loginWithUsername: (username: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  addUser: (userData: any) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const addUser = async (userData: any): Promise<boolean> => {
    try {
      console.log('Adding user to auth system:', userData);
      return true;
    } catch (error) {
      console.error('Error adding user to auth system:', error);
      return false;
    }
  };

  const loginWithUsername = async (username: string, password: string, role: string): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('🔍 Starting login process...');
      console.log('Username:', username);
      console.log('Role:', role);
      console.log('Password length:', password.length);

      if (!DatabaseService.isConnected()) {
        console.error('❌ Supabase not configured');
        return false;
      }

      console.log('✅ Supabase is connected, proceeding with authentication...');

      // First try to find user in users table
      let foundUser = null;
      
      // Try exact email match first
      
      // Try exact email match first
      const { data: userByEmail, error: emailError } = await DatabaseService.supabase!
        .from('users')
        .select('*')
        .eq('email', username.toLowerCase())
        .eq('role', role)
        .eq('active', true)
        .maybeSingle();
      
      if (emailError) {
        console.error('❌ Email lookup error:', emailError);
      } else if (userByEmail) {
        console.log('✅ Found user by email:', userByEmail);
        foundUser = userByEmail;
      }
      
      // If not found by email, try admin email for admin username
      if (!foundUser && username.toLowerCase() === 'admin' && role === 'admin') {
        const { data: adminUser, error: adminError } = await DatabaseService.supabase!
          .from('users')
          .select('*')
          .eq('email', 'admin@abispherekitchen.com')
          .eq('role', 'admin')
          .eq('active', true)
          .maybeSingle();
        
        if (adminError) {
          console.error('❌ Admin lookup error:', adminError);
        } else if (adminUser) {
          console.log('✅ Found admin user:', adminUser);
          foundUser = adminUser;
        }
      }
      
      // If still not found, try staff_members table
      if (!foundUser) {
        console.log('🔍 User not found in users table, checking staff_members table...');
        
        const { data: staffUser, error: staffError } = await DatabaseService.supabase!
          .from('staff_members')
          .select('*')
          .eq('username', username.toLowerCase())
          .eq('role', role)
          .eq('is_active', true)
          .maybeSingle();
        
        if (staffError) {
          console.error('❌ Staff lookup error:', staffError);
        }
      }
      // Try multiple lookup strategies
      
      // Strategy 1: Direct username lookup in staff_members table
      console.log('🔍 Strategy 1: Looking up by username in staff_members...');
      const { data: staffUser, error: staffError } = await DatabaseService.supabase!
        .from('staff_members')
        .select('*')
        .eq('username', username.toLowerCase())
        .eq('role', role)
        .eq('is_active', true)
        .maybeSingle();
      
      if (staffError) {
        console.error('❌ Staff lookup error:', staffError);
      } else if (staffUser) {
        console.log('✅ Found staff user by username:', staffUser);
        foundUser = {
          id: staffUser.id,
          email: staffUser.email,
          name: staffUser.name,
          role: staffUser.role,
          phone: staffUser.phone,
          password_hash: staffUser.password_hash,
          username: staffUser.username
        };
      }
      
      // Strategy 2: Email lookup in users table
      if (!foundUser) {
        console.log('🔍 Strategy 2: Looking up by email in users table...');
        const { data: userByEmail, error: emailError } = await DatabaseService.supabase!
          .from('users')
          .select('*')
          .eq('email', username.toLowerCase())
          .eq('role', role)
          .eq('active', true)
          .maybeSingle();
        
        if (emailError) {
          console.error('❌ Email lookup error:', emailError);
        } else if (userByEmail) {
          console.log('✅ Found user by email:', userByEmail);
          foundUser = userByEmail;
        }
      }
      
      // Strategy 3: Admin special case
      if (!foundUser && username.toLowerCase() === 'admin' && role === 'admin') {
        console.log('🔍 Strategy 3: Admin special case lookup...');
        const { data: adminUser, error: adminError } = await DatabaseService.supabase!
          .from('users')
          .select('*')
          .eq('email', 'admin@abispherekitchen.com')
          .eq('role', 'admin')
          .eq('active', true)
          .maybeSingle();
        
        if (adminError) {
          console.error('❌ Admin lookup error:', adminError);
        } else if (adminUser) {
          console.log('✅ Found admin user:', adminUser);
          foundUser = adminUser;
        }
      }

      if (!foundUser) {
        console.log('❌ No user found for username:', username, 'role:', role);
        
        // Debug: Show what users exist in both tables
        const { data: allUsers } = await DatabaseService.supabase!
          .from('users')
          .select('id, email, name, role, active');
        console.log('📋 Available users in users table:', allUsers);
        
        const { data: allStaff } = await DatabaseService.supabase!
          .from('staff_members')
          .select('id, email, name, role, username, is_active');
        console.log('📋 Available staff in staff_members table:', allStaff);
        
        return false;
      }

      console.log('👤 Found user:', foundUser);
      // Validate password - accept demo passwords
      const validPasswords = ['password123', 'AbisphereAdmin2025!', 'Abisphere@999'];
      const isValidPassword = validPasswords.includes(password) || 
                             (foundUser.password_hash && foundUser.password_hash === password);
      
      console.log('🔐 Password validation:', { 
        provided: password, 
        storedHash: foundUser.password_hash,
        isValid: isValidPassword,
        validOptions: [...validPasswords, 'stored password']
      });

      if (!isValidPassword) {
        console.log('❌ Invalid password');
        return false;
      }

      const authenticatedUser = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
        phone: foundUser.phone || '',
        username: foundUser.username || foundUser.email
      };

      console.log('✅ Authentication successful! Setting user:', authenticatedUser);
      setUser(authenticatedUser);
      localStorage.setItem('currentUser', JSON.stringify(authenticatedUser));

      return true;
      
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    console.log('👋 User logged out');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loginWithUsername,
      logout,
      isAuthenticated: !!user,
      loading,
      addUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}