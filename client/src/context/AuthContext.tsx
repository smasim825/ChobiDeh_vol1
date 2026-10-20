import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthScreen, User, LoginFormData, SignupFormData, AuthContextType } from '../types/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'chobideh_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screen, setScreen] = useState<AuthScreen>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>('tim.jennings@example.com');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (supabase) {
      // 1. Initial active session check via Supabase
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!error && session?.user) {
          setCurrentUser({
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Member',
            email: session.user.email || '',
            biometricConsent: session.user.user_metadata?.biometric_consent ?? true,
            faceClusteringEnabled: session.user.user_metadata?.face_clustering_enabled ?? true,
          });
          setScreen('home');
        }
      });

      // 2. Real-time auth state subscription (login, logout, token refresh)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          setCurrentUser({
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Member',
            email: session.user.email || '',
            biometricConsent: session.user.user_metadata?.biometric_consent ?? true,
            faceClusteringEnabled: session.user.user_metadata?.face_clustering_enabled ?? true,
          });
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            setScreen('home');
            if (window.location.hash) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setScreen('login');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Development fallback without Supabase configured
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const user = JSON.parse(stored) as User;
          setCurrentUser(user);
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  }, []);

  const clearError = () => setErrorMessage(null);

  const login = async (data: LoginFormData): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    if (!data.email.trim() || !data.password) {
      setErrorMessage('Please provide both email and password.');
      setIsLoading(false);
      return false;
    }

    if (data.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      setIsLoading(false);
      return false;
    }

    if (supabase) {
      const { data: resData, error } = await supabase.auth.signInWithPassword({
        email: data.email.trim(),
        password: data.password,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return false;
      }

      if (resData.user) {
        const user: User = {
          id: resData.user.id,
          name: resData.user.user_metadata?.full_name || resData.user.email?.split('@')[0] || 'Member',
          email: resData.user.email || '',
          biometricConsent: resData.user.user_metadata?.biometric_consent ?? true,
          faceClusteringEnabled: resData.user.user_metadata?.face_clustering_enabled ?? true,
        };
        setCurrentUser(user);
        setScreen('home');
      }
      setIsLoading(false);
      return true;
    }

    // Fallback simulation when Supabase credentials are not set
    await new Promise((resolve) => setTimeout(resolve, 400));
    const mockUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: data.email.split('@')[0].replace(/[._]/g, ' '),
      email: data.email,
      biometricConsent: false,
    };

    setCurrentUser(mockUser);
    if (data.rememberMe) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    }
    setIsLoading(false);
    setScreen('home');
    return true;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    if (supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return false;
      }
      return true;
    }

    // Fallback simulation for Google login
    await new Promise((resolve) => setTimeout(resolve, 400));
    const mockUser: User = {
      id: 'usr_g_' + Math.random().toString(36).substring(2, 9),
      name: 'Tim Jennings',
      email: 'tim.jennings@gmail.com',
      biometricConsent: true,
    };
    setCurrentUser(mockUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    setIsLoading(false);
    setScreen('home');
    return true;
  };

  const signup = async (data: SignupFormData): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    if (!data.fullName.trim()) {
      setErrorMessage('Full name is required.');
      setIsLoading(false);
      return false;
    }

    if (!data.email.trim() || !data.email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      setIsLoading(false);
      return false;
    }

    if (data.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      setIsLoading(false);
      return false;
    }

    if (supabase) {
      const { data: resData, error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
            biometric_consent: data.biometricConsent,
            face_clustering_enabled: data.biometricConsent,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return false;
      }

      if (resData.session?.user) {
        const user: User = {
          id: resData.session.user.id,
          name: data.fullName.trim(),
          email: data.email.trim(),
          biometricConsent: data.biometricConsent,
        };
        setCurrentUser(user);
        setScreen('home');
      } else {
        // Confirmation email required
        setPendingEmail(data.email.trim());
        setScreen('check-email');
      }
      setIsLoading(false);
      return true;
    }

    // Fallback simulation
    await new Promise((resolve) => setTimeout(resolve, 400));
    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: data.fullName.trim(),
      email: data.email.trim(),
      biometricConsent: data.biometricConsent,
      enrolledAt: data.biometricConsent ? new Date().toISOString() : undefined,
    };

    setCurrentUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setIsLoading(false);
    setScreen('home');
    return true;
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
    setScreen('login');
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      setIsLoading(false);
      return false;
    }

    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}`,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return false;
      }

      setPendingEmail(email);
      setIsLoading(false);
      setScreen('check-email');
      return true;
    }

    // Fallback simulation
    await new Promise((resolve) => setTimeout(resolve, 400));
    setPendingEmail(email);
    setIsLoading(false);
    setScreen('check-email');
    return true;
  };

  const resendVerificationEmail = async (): Promise<boolean> => {
    setIsLoading(true);

    if (supabase && pendingEmail) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
      });
      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return false;
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    setIsLoading(false);
    return true;
  };

  const updateBiometricConsent = (consent: boolean) => {
    if (currentUser) {
      const updated: User = {
        ...currentUser,
        biometricConsent: consent,
        faceClusteringEnabled: consent,
        enrolledAt: consent ? currentUser.enrolledAt || new Date().toISOString() : undefined,
      };
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // If Supabase is connected, update user metadata
      if (supabase) {
        supabase.auth.updateUser({
          data: {
            biometric_consent: consent,
            face_clustering_enabled: consent,
          },
        });
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        screen,
        setScreen,
        currentUser,
        pendingEmail,
        setPendingEmail,
        isLoading,
        errorMessage,
        clearError,
        login,
        loginWithGoogle,
        signup,
        logout,
        sendPasswordReset,
        resendVerificationEmail,
        updateBiometricConsent,
        isSupabaseConnected: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
