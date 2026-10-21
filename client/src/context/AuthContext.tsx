import React, { useState, useEffect } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { AuthScreen, User, LoginFormData, SignupFormData } from '../types/auth';
import { supabase } from '../lib/supabase';
import { AuthContext } from './AuthContextBase';
import { optimizeAvatarPhoto } from '../utils/imageOptimizer';

const STORAGE_KEY = 'chobideh_auth_user';

const hasStoredAuthSession = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
        return true;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return false;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screen, setScreen] = useState<AuthScreen>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignore parse error
    }
    return null;
  });
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!supabase) return false;
    return hasStoredAuthSession();
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to process session user safely without trusting client-side metadata
  const processUserSession = async (user: SupabaseUser, eventName?: string) => {
    if (eventName === 'PASSWORD_RECOVERY') {
      setScreen('reset-password');
      return;
    }

    const providers: string[] =
      user.app_metadata?.providers ||
      (user.identities ? user.identities.map((i) => i.provider) : []);
    const hasPassword =
      providers.includes('email') || Boolean(user.user_metadata?.has_password);

    if (supabase) {
      // Source of truth for onboarding and profile name is public.profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, face_clustering_enabled, onboarding_completed, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      const isCompleted = profile ? Boolean(profile.onboarding_completed) : (profileError ? true : false);

      const userObj: User = {
        id: user.id,
        name:
          profile?.display_name ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'Member',
        email: user.email || '',
        avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || '',
        biometricConsent: profile?.face_clustering_enabled ?? false,
        faceClusteringEnabled: profile?.face_clustering_enabled ?? false,
        profileCompleted: isCompleted,
        providers,
        hasPassword,
      };

      setCurrentUser(userObj);

      if (!isCompleted) {
        setScreen('complete-profile');
      } else {
        setScreen((prev) => (prev === 'login' || prev === 'signup' ? 'home' : prev));
      }

      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      return;
    }

    // No-Supabase fallback simulation
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        setCurrentUser(parsed);
        if (!parsed.profileCompleted) {
          setScreen('complete-profile');
        } else {
          setScreen((prev) => (prev === 'login' || prev === 'signup' ? 'home' : prev));
        }
        return;
      } catch {
        // Fall through
      }
    }

    const fallbackUser: User = {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member',
      email: user.email || '',
      biometricConsent: false,
      faceClusteringEnabled: false,
      profileCompleted: false,
      providers,
      hasPassword,
    };
    setCurrentUser(fallbackUser);
    setScreen('complete-profile');
  };

  useEffect(() => {
    if (supabase) {
      let isHandlingAuth = false;

      // Real-time auth state subscription
      // Note: Never await Supabase auth calls directly inside the callback to prevent deadlocks
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setTimeout(() => {
          if (event === 'PASSWORD_RECOVERY') {
            setScreen('reset-password');
            return;
          }

          if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
            setScreen('login');
            return;
          }

          if (session?.user && !isHandlingAuth) {
            isHandlingAuth = true;
            processUserSession(session.user, event).finally(() => {
              isHandlingAuth = false;
              setIsLoading(false);
            });
          } else if (!session) {
            setIsLoading(false);
          }
        }, 0);
      });

      // Hydrate initial session on mount
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          if (session?.user && !isHandlingAuth) {
            isHandlingAuth = true;
            processUserSession(session.user).finally(() => {
              isHandlingAuth = false;
              setIsLoading(false);
            });
          } else {
            setIsLoading(false);
          }
        })
        .catch(() => {
          setIsLoading(false);
        });

      return () => {
        subscription.unsubscribe();
      };
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

    if (data.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
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
        await processUserSession(resData.user, 'SIGNED_IN');
      }

      setIsLoading(false);
      return true;
    }

    // Fallback simulation when Supabase is not configured
    await new Promise((resolve) => setTimeout(resolve, 400));
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        if (user.email.toLowerCase() === data.email.trim().toLowerCase()) {
          setCurrentUser(user);
          setIsLoading(false);
          setScreen(user.profileCompleted ? 'home' : 'complete-profile');
          return true;
        }
      } catch {
        // Fall through
      }
    }

    const mockUser: User = {
      id: 'usr_mock_' + Math.random().toString(36).substring(2, 9),
      name: data.email.split('@')[0],
      email: data.email.trim(),
      biometricConsent: false,
      faceClusteringEnabled: false,
      profileCompleted: true,
    };
    setCurrentUser(mockUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    setIsLoading(false);
    setScreen('home');
    return true;
  };

  const loginWithGoogle = async (_isSignup = false): Promise<boolean> => {
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
    const mockGoogleUser: User = {
      id: 'usr_g_' + Math.random().toString(36).substring(2, 9),
      name: 'Google Traveler',
      email: 'google.traveler@example.com',
      biometricConsent: false,
      faceClusteringEnabled: false,
      profileCompleted: false,
    };
    setCurrentUser(mockGoogleUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockGoogleUser));
    setIsLoading(false);
    setScreen('complete-profile');
    return true;
  };

  const completeGoogleProfile = async (
    fullName: string,
    biometricConsent: boolean
  ): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    if (supabase && currentUser) {
      // 1. Call SECURITY DEFINER RPC to mark onboarding completed and set display_name
      const { error: rpcError } = await supabase.rpc('complete_onboarding', {
        display_name: fullName.trim(),
      });

      if (rpcError) {
        setErrorMessage(rpcError.message);
        setIsLoading(false);
        return false;
      }

      // 2. Update global biometric preference in profiles
      const { error: consentError } = await supabase
        .from('profiles')
        .update({
          face_clustering_enabled: biometricConsent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (consentError) {
        setErrorMessage(consentError.message);
        setIsLoading(false);
        return false;
      }

      // 3. Keep auth metadata in sync
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          profile_completed: true,
          biometric_consent: biometricConsent,
          face_clustering_enabled: biometricConsent,
        },
      });

      if (authError) {
        setErrorMessage(authError.message);
        setIsLoading(false);
        return false;
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
      if (!supabase) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
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
          faceClusteringEnabled: data.biometricConsent,
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
      faceClusteringEnabled: data.biometricConsent,
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
        redirectTo: `${window.location.origin}/reset-password`,
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
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsLoading(false);
    return true;
  };

  const updateBiometricConsent = async (
    consent: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'No authenticated user session.' };
    }

    if (supabase) {
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          face_clustering_enabled: consent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (dbError) {
        setErrorMessage(dbError.message);
        return { success: false, error: dbError.message };
      }

      await supabase.auth.updateUser({
        data: {
          face_clustering_enabled: consent,
          biometric_consent: consent,
        },
      });
    }

    const updated: User = {
      ...currentUser,
      biometricConsent: consent,
      faceClusteringEnabled: consent,
      enrolledAt: consent ? currentUser.enrolledAt || new Date().toISOString() : undefined,
    };
    setCurrentUser(updated);
    if (!supabase) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return { success: true };
  };

  const purgeAllFaceData = async (): Promise<{ success: boolean; error?: string; message?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'User session not found.' };
    }

    if (supabase) {
      const { data: members, error: memberError } = await supabase
        .from('room_members')
        .select('room_id, role')
        .eq('user_id', currentUser.id);

      if (memberError) {
        return { success: false, error: memberError.message };
      }

      if (!members || members.length === 0) {
        await updateBiometricConsent(false);
        return {
          success: true,
          message: 'No active rooms found. Face clustering preferences have been reset and disabled globally.',
        };
      }

      const errors: string[] = [];
      for (const m of members) {
        if (m.role === 'owner' || m.role === 'admin') {
          const { error: purgeError } = await supabase.rpc('purge_room_face_data', {
            target_room_id: m.room_id,
          });
          if (purgeError) {
            errors.push(purgeError.message);
          }
        } else {
          const { error: withdrawError } = await supabase.rpc('withdraw_member_face_consent', {
            target_room_id: m.room_id,
          });
          if (withdrawError) {
            errors.push(withdrawError.message);
          }
        }
      }

      if (errors.length > 0) {
        return { success: false, error: `Failed to process some rooms: ${errors.join(', ')}` };
      }

      await updateBiometricConsent(false);
      return {
        success: true,
        message: `Successfully purged face data across ${members.length} rooms.`,
      };
    }

    await updateBiometricConsent(false);
    return {
      success: true,
      message: 'Demo mode: Local clustering preferences and simulated vector records cleared.',
    };
  };

  const updateProfileName = async (newName: string): Promise<boolean> => {
    if (!newName.trim()) {
      setErrorMessage('Display name cannot be empty.');
      return false;
    }

    setIsLoading(true);
    setErrorMessage(null);

    if (supabase && currentUser) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: newName.trim(), updated_at: new Date().toISOString() })
        .eq('id', currentUser.id);

      if (profileError) {
        setErrorMessage(profileError.message);
        setIsLoading(false);
        return false;
      }

      // Keep auth metadata in sync with public.profiles
      await supabase.auth.updateUser({
        data: { full_name: newName.trim() },
      });
    }

    if (currentUser) {
      const updated: User = {
        ...currentUser,
        name: newName.trim(),
      };
      setCurrentUser(updated);
      if (!supabase) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    }

    setIsLoading(false);
    return true;
  };

  const updateProfileAvatar = async (
    file: File
  ): Promise<{ success: boolean; avatarUrl?: string; error?: string }> => {
    if (!file) return { success: false, error: 'No photo selected.' };

    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Please choose a valid image file (JPEG, PNG, or WebP).' };
    }

    setIsLoading(true);
    try {
      const optimizedDataUrl = await optimizeAvatarPhoto(file);

      if (supabase && currentUser) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            avatar_url: optimizedDataUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentUser.id);

        if (profileError) {
          setIsLoading(false);
          return { success: false, error: profileError.message };
        }

        await supabase.auth.updateUser({
          data: { avatar_url: optimizedDataUrl },
        });
      }

      if (currentUser) {
        const updated: User = {
          ...currentUser,
          avatarUrl: optimizedDataUrl,
        };
        setCurrentUser(updated);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      }

      setIsLoading(false);
      return { success: true, avatarUrl: optimizedDataUrl };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Failed to update profile photo.' };
    }
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
      if (!supabase) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
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
    return { success: false, error: 'No user session found.' };
  };

  return (
    <AuthContext.Provider
      value={{
        screen,
        currentUser,
        pendingEmail,
        isLoading,
        errorMessage,
        login,
        loginWithGoogle,
        signup,
        completeGoogleProfile,
        logout,
        sendPasswordReset,
        resendVerificationEmail,
        updateBiometricConsent,
        purgeAllFaceData,
        updateProfileName,
        updateProfileAvatar,
        setUserPassword,
        setScreen,
        setPendingEmail,
        clearError,
        isSupabaseConnected: !!supabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
