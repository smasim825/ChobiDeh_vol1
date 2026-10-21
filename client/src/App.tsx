import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { CheckEmailScreen } from './screens/CheckEmailScreen';
import { ResetPasswordScreen } from './screens/ResetPasswordScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { RoomAreaScreen } from './screens/RoomAreaScreen';
import { CreateRoomScreen } from './screens/CreateRoomScreen';
import { JoinRoomScreen } from './screens/JoinRoomScreen';
import { CompleteProfileScreen } from './screens/CompleteProfileScreen';
import { Navbar } from './components/Navbar';
import { RequireAuth, RequireCompletedProfile, RedirectIfAuth } from './components/RouteGuards';
import type { AuthScreen } from './types/auth';

function getScreenFromPath(pathname: string): AuthScreen {
  if (pathname === '/login') return 'login';
  if (pathname === '/signup') return 'signup';
  if (pathname === '/forgot-password') return 'forgot-password';
  if (pathname === '/check-email') return 'check-email';
  if (pathname === '/reset-password') return 'reset-password';
  if (pathname === '/complete-profile') return 'complete-profile';
  if (pathname === '/profile') return 'profile';
  if (pathname === '/rooms/new') return 'create-room';
  if (pathname.startsWith('/join')) return 'join-room';
  if (pathname.startsWith('/rooms/')) return 'room-area';
  return 'home';
}

function getPathFromScreen(screen: AuthScreen): string {
  switch (screen) {
    case 'login': return '/login';
    case 'signup': return '/signup';
    case 'forgot-password': return '/forgot-password';
    case 'check-email': return '/check-email';
    case 'reset-password': return '/reset-password';
    case 'complete-profile': return '/complete-profile';
    case 'profile': return '/profile';
    case 'create-room': return '/rooms/new';
    case 'join-room': return '/join';
    case 'room-area': return '/rooms/demo';
    case 'home': default: return '/';
  }
}

const DevNavbarWrapper: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setScreen } = useAuth();

  const currentScreen = getScreenFromPath(location.pathname);

  const handleSelectScreen = (screen: AuthScreen) => {
    setScreen(screen);
    navigate(getPathFromScreen(screen));
  };

  return <Navbar currentScreen={currentScreen} onSelectScreen={handleSelectScreen} />;
};

export const AppRoutes: React.FC = () => {
  const location = useLocation();
  const { screen, setScreen } = useAuth();

  // Sync AuthContext screen state when route changes
  useEffect(() => {
    const expectedScreen = getScreenFromPath(location.pathname);
    if (screen !== expectedScreen) {
      setScreen(expectedScreen);
    }
  }, [location.pathname, screen, setScreen]);

  return (
    <div className="min-h-screen bg-[#F8F5EF] flex flex-col justify-between">
      {/* Screen preview selector renders only in DEV */}
      <DevNavbarWrapper />

      <main className="flex-1 flex flex-col justify-center">
        <Routes>
          {/* Public / Unauthenticated routes */}
          <Route
            path="/login"
            element={
              <RedirectIfAuth>
                <LoginScreen />
              </RedirectIfAuth>
            }
          />
          <Route
            path="/signup"
            element={
              <RedirectIfAuth>
                <SignupScreen />
              </RedirectIfAuth>
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/check-email" element={<CheckEmailScreen />} />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />

          {/* Profile completion gate */}
          <Route
            path="/complete-profile"
            element={
              <RequireAuth>
                <CompleteProfileScreen />
              </RequireAuth>
            }
          />

          {/* Protected App Routes */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <RequireCompletedProfile>
                  <HomeScreen />
                </RequireCompletedProfile>
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <RequireCompletedProfile>
                  <ProfileScreen />
                </RequireCompletedProfile>
              </RequireAuth>
            }
          />
          <Route
            path="/rooms/new"
            element={
              <RequireAuth>
                <RequireCompletedProfile>
                  <CreateRoomScreen />
                </RequireCompletedProfile>
              </RequireAuth>
            }
          />
          <Route
            path="/rooms/:id"
            element={
              <RequireAuth>
                <RequireCompletedProfile>
                  <RoomAreaScreen />
                </RequireCompletedProfile>
              </RequireAuth>
            }
          />
          <Route
            path="/join"
            element={
              <RequireAuth>
                <RequireCompletedProfile>
                  <JoinRoomScreen />
                </RequireCompletedProfile>
              </RequireAuth>
            }
          />
          <Route
            path="/join/:slug"
            element={
              <RequireAuth>
                <RequireCompletedProfile>
                  <JoinRoomScreen />
                </RequireCompletedProfile>
              </RequireAuth>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
