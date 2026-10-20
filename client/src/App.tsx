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
import { CompleteProfileScreen } from './screens/CompleteProfileScreen';
import { Navbar } from './components/Navbar';

const AuthRouter: React.FC = () => {
  const { screen, setScreen } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8F5EF] flex flex-col justify-between">
      {/* Responsive Global Navigation Bar */}
      <Navbar currentScreen={screen} onSelectScreen={setScreen} />

      {/* Screen Render */}
      <main className="flex-1 flex flex-col justify-center">
        {screen === 'login' && <LoginScreen />}
        {screen === 'signup' && <SignupScreen />}
        {screen === 'complete-profile' && <CompleteProfileScreen />}
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
