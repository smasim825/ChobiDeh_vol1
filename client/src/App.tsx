import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { CheckEmailScreen } from './screens/CheckEmailScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { RoomAreaScreen } from './screens/RoomAreaScreen';
import { CreateRoomScreen } from './screens/CreateRoomScreen';
import { JoinRoomScreen } from './screens/JoinRoomScreen';
import type { AuthScreen } from './types/auth';

const AuthRouter: React.FC = () => {
  const { screen, setScreen } = useAuth();

  const screens: { id: AuthScreen; label: string; icon: string }[] = [
    { id: 'login', label: 'Login', icon: 'login' },
    { id: 'signup', label: 'Sign Up', icon: 'person_add' },
    { id: 'forgot-password', label: 'Forgot Password', icon: 'lock_reset' },
    { id: 'check-email', label: 'Check Email', icon: 'mark_email_read' },
    { id: 'home', label: 'Home', icon: 'photo_library' },
    { id: 'room-area', label: 'Room Area', icon: 'meeting_room' },
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'create-room', label: 'Create Room', icon: 'add_circle' },
    { id: 'join-room', label: 'Join Room', icon: 'group_add' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F5EF] flex flex-col justify-between">
      {/* Top Demo Navigation Bar */}
      <aside
        aria-label="Screen preview selector"
        className="sticky top-0 z-50 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E6E1D8] px-3 py-2 flex items-center justify-between text-[12px] shadow-xs"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse" />
          <span className="font-bold text-[#101E1C]">ChobiDeh</span>
          <span className="hidden sm:inline text-[#6E7977]">— Archival Workspace</span>
        </div>

        {/* Screen switcher tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
          {screens.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setScreen(item.id)}
              className={`px-2.5 py-1 rounded-full font-medium transition-all flex items-center gap-1 shrink-0 ${
                screen === item.id || (item.id === 'home' && screen === 'dashboard')
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-[#3E4947] hover:bg-[#E1F1EE]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Screen Render */}
      <main className="flex-1 flex flex-col justify-center">
        {screen === 'login' && <LoginScreen />}
        {screen === 'signup' && <SignupScreen />}
        {screen === 'forgot-password' && <ForgotPasswordScreen />}
        {screen === 'check-email' && <CheckEmailScreen />}
        {(screen === 'home' || screen === 'dashboard') && <HomeScreen />}
        {screen === 'profile' && <ProfileScreen />}
        {screen === 'room-area' && <RoomAreaScreen />}
        {screen === 'create-room' && <CreateRoomScreen />}
        {screen === 'join-room' && <JoinRoomScreen />}
      </main>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AuthRouter />
    </AuthProvider>
  );
}

export default App;
