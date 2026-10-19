import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthScreen, User, LoginFormData, SignupFormData, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'chobideh_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screen, setScreen] = useState<AuthScreen>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>('tim.jennings@example.com');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as User;
        setCurrentUser(user);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const clearError = () => setErrorMessage(null);

  const login = async (data: LoginFormData): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 600));

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

  const signup = async (data: SignupFormData): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    await new Promise((resolve) => setTimeout(resolve, 600));

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

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
    setScreen('login');
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      setIsLoading(false);
      return false;
    }

    setPendingEmail(email);
    setIsLoading(false);
    setScreen('check-email');
    return true;
  };

  const resendVerificationEmail = async (): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsLoading(false);
    return true;
  };

  const updateBiometricConsent = (consent: boolean) => {
    if (currentUser) {
      const updated: User = {
        ...currentUser,
        biometricConsent: consent,
        enrolledAt: consent ? (currentUser.enrolledAt || new Date().toISOString()) : undefined,
      };
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
        signup,
        logout,
        sendPasswordReset,
        resendVerificationEmail,
        updateBiometricConsent,
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
