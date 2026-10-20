import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthScreen, User, LoginFormData, SignupFormData, AuthContextType } from '../types/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'chobideh_auth_user';
const OAUTH_INTENT_KEY = 'chobideh_oauth_intent';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screen, setScreen] = useState<AuthScreen>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>('tim.jennings@example.com');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to process session user safely
  const processUserSession = async (user: any, _eventName?: string) => {
    const intent = localStorage.getItem(OAUTH_INTENT_KEY);
    const isProfileCompleted = Boolean(user.user_metadata?.profile_completed);

    // 1. Restriction: If user clicked "Login with Google", but this account does not have a completed profile/sign up:
    if (intent === 'login' && !isProfileCompleted) {
      localStorage.removeItem(OAUTH_INTENT_KEY);
      setCurrentUser(null);
      setErrorMessage('No ChobiDeh account found with this Google email. Please sign up first.');
      setScreen('login');
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      if (supabase) {
        await supabase.auth.signOut();
      }
      return;
    }

    const providers: string[] = user.app_metadata?.providers || (user.identities ? user.identities.map((i: any) => i.provider) : []);
    const hasPassword = providers.includes('email') || Boolean(user.user_metadata?.has_password);

    // 2. If user clicked "Sign up with Google" and hasn't confirmed profile/name, take them to complete-profile form
    if (intent === 'signup' && !isProfileCompleted) {
      localStorage.removeItem(OAUTH_INTENT_KEY);
      const userObj: User = {
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member',
        email: user.email || '',
        biometricConsent: user.user_metadata?.biometric_consent ?? true,
        faceClusteringEnabled: user.user_metadata?.face_clustering_enabled ?? true,
        profileCompleted: false,
        providers,
        hasPassword,
      };
      setCurrentUser(userObj);
      setScreen('complete-profile');
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      return;
    }

    // Under NO circumstances should an uncompleted account reach the Home screen
    if (!isProfileCompleted) {
      localStorage.removeItem(OAUTH_INTENT_KEY);
      setScreen('complete-profile');
      return;
    }

    // 3. Normal existing authenticated user with completed profile
    localStorage.removeItem(OAUTH_INTENT_KEY);
    const userObj: User = {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member',
      email: user.email || '',
      biometricConsent: user.user_metadata?.biometric_consent ?? true,
      faceClusteringEnabled: user.user_metadata?.face_clustering_enabled ?? true,
      profileCompleted: true,
      providers,
      hasPassword,
    };

    setCurrentUser(userObj);
    setScreen((prev) => (prev === 'login' || prev === 'signup' ? 'home' : prev));

    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  useEffect(() => {
    if (supabase) {
      let isHandlingAuth = false;

      // Real-time auth state subscription (fires INITIAL_SESSION on mount and SIGNED_IN after OAuth)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setScreen((prev) => (prev === 'complete-profile' || prev === 'login' || prev === 'signup' ? prev : 'login'));
          return;
        }

        if (session?.user && !isHandlingAuth) {
          isHandlingAuth = true;
          try {
            await processUserSession(session.user, event);
          } finally {
            isHandlingAuth = false;
          }
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
          profileCompleted: Boolean(resData.user.user_metadata?.profile_completed),
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
      profileCompleted: true,
    };

    setCurrentUser(mockUser);
    if (data.rememberMe) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    }
    setIsLoading(false);
    setScreen('home');
    return true;
  };

  const loginWithGoogle = async (isSignup = false): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    // Save intent: 'login' (must be existing) vs 'signup' (can create profile)
    localStorage.setItem(OAUTH_INTENT_KEY, isSignup ? 'signup' : 'login');

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
    if (!isSignup) {
      // In dev fallback: check if account exists
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setErrorMessage('No ChobiDeh account found with this Google email. Please sign up first.');
        setIsLoading(false);
        return false;
      }
      const existing = JSON.parse(stored) as User;
      setCurrentUser(existing);
      setIsLoading(false);
      setScreen('home');
      return true;
    }

    // Sign up fallback: take them to complete-profile form
    const mockNewGoogleUser: User = {
      id: 'usr_g_' + Math.random().toString(36).substring(2, 9),
      name: 'Google Traveler',
      email: 'google.traveler@example.com',
      biometricConsent: true,
      profileCompleted: false,
    };
    setCurrentUser(mockNewGoogleUser);
    setIsLoading(false);
    setScreen('complete-profile');
    return true;
  };

  const completeGoogleProfile = async (fullName: string, biometricConsent: boolean): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    if (supabase && currentUser) {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          profile_completed: true,
          biometric_consent: biometricConsent,
          face_clustering_enabled: biometricConsent,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return false;
      }

      // Upsert profile in public.profiles table
      try {
        await supabase.from('profiles').upsert({
          id: currentUser.id,
          display_name: fullName.trim(),
          face_clustering_enabled: biometricConsent,
        });
      } catch {
        // Table might be pending migration
      }
    }

    if (currentUser) {
      const updated: User = {
        ...currentUser,
        name: fullName.trim(),
        biometricConsent,
        faceClusteringEnabled: biometricConsent,
        profileCompleted: true,
      };
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

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
            profile_completed: true,
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
          profileCompleted: true,
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
      profileCompleted: true,
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
    localStorage.removeItem(OAUTH_INTENT_KEY);
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

  const updateProfileName = async (newName: string): Promise<boolean> => {
    if (!newName.trim()) {
      setErrorMessage('Display name cannot be empty.');
      return false;
    }

    setIsLoading(true);
    setErrorMessage(null);

    if (supabase && currentUser) {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: newName.trim(),
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return false;
      }

      try {
        await supabase
          .from('profiles')
          .update({ display_name: newName.trim(), updated_at: new Date().toISOString() })
          .eq('id', currentUser.id);
      } catch {
        // Table might not be migrated yet
      }
    }

    if (currentUser) {
      const updated: User = {
        ...currentUser,
        name: newName.trim(),
      };
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    setIsLoading(false);
    return true;
  };

  const setUserPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    setIsLoading(true);

    if (supabase && currentUser) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          has_password: true,
        },
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      const updatedProviders = Array.from(new Set([...(currentUser.providers || ['google']), 'email']));
      const updated: User = {
        ...currentUser,
        hasPassword: true,
        providers: updatedProviders,
      };
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setIsLoading(false);
      return { success: true };
    }

    // Fallback simulation when Supabase is not connected
    if (currentUser) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const updatedProviders = Array.from(new Set([...(currentUser.providers || ['google']), 'email']));
      const updated: User = {
        ...currentUser,
        hasPassword: true,
        providers: updatedProviders,
      };
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: 'No active user session found.' };
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
        completeGoogleProfile,
        signup,
        logout,
        sendPasswordReset,
        resendVerificationEmail,
        updateBiometricConsent,
        updateProfileName,
        setUserPassword,
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
