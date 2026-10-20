export type AuthScreen =
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'check-email'
  | 'home'
  | 'dashboard'
  | 'room-area'
  | 'profile'
  | 'create-room'
  | 'join-room'
  | 'complete-profile';

export interface User {
  id: string;
  name: string;
  email: string;
  /**
   * User preference for anonymous AI face clustering (3-level matching).
   * No mandatory face registration or selfie enrollment required.
   */
  biometricConsent: boolean;
  faceClusteringEnabled?: boolean;
  profileCompleted?: boolean;
  enrolledAt?: string;
  providers?: string[];
  hasPassword?: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  biometricConsent: boolean;
}

export interface AuthContextType {
  screen: AuthScreen;
  setScreen: (screen: AuthScreen) => void;
  currentUser: User | null;
  pendingEmail: string;
  setPendingEmail: (email: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
  clearError: () => void;
  login: (data: LoginFormData) => Promise<boolean>;
  loginWithGoogle: (isSignup?: boolean) => Promise<boolean>;
  completeGoogleProfile: (fullName: string, biometricConsent: boolean) => Promise<boolean>;
  signup: (data: SignupFormData) => Promise<boolean>;
  logout: () => Promise<void> | void;
  sendPasswordReset: (email: string) => Promise<boolean>;
  resendVerificationEmail: () => Promise<boolean>;
  updateBiometricConsent: (consent: boolean) => Promise<{ success: boolean; error?: string }>;
  purgeAllFaceData: () => Promise<{ success: boolean; error?: string; message?: string }>;
  updateProfileName: (newName: string) => Promise<boolean>;
  setUserPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  isSupabaseConnected: boolean;
}
