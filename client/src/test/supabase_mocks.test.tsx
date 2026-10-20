import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../context/useAuth';
import { SignupScreen } from '../screens/SignupScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CreateRoomScreen } from '../screens/CreateRoomScreen';
import { JoinRoomScreen } from '../screens/JoinRoomScreen';
import { Navbar } from '../components/Navbar';
import { RequireAuth } from '../components/RouteGuards';
import { supabase } from '../lib/supabase';

// Mock Supabase
vi.mock('../lib/supabase', () => {
  const mockAuth = {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockImplementation((_callback) => {
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    }),
  };

  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  });

  const mockRpc = vi.fn();

  return {
    isSupabaseConfigured: true,
    supabase: {
      auth: mockAuth,
      from: mockFrom,
      rpc: mockRpc,
    },
  };
});

describe('Phase 6: Supabase Integration & Security Verifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('1. consent defaults to false on signup', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupScreen />
        </AuthProvider>
      </MemoryRouter>
    );

    const consentCheckbox = screen.getByRole('checkbox', {
      name: /enable 3-level ai face clustering/i,
    }) as HTMLInputElement;

    expect(consentCheckbox).toBeInTheDocument();
    expect(consentCheckbox.checked).toBe(false);
  });

  it('2. toggling consent calls the DB update and handles errors', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { message: 'Database connection failed' } }),
    });

    vi.mocked(supabase!.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    // Component to test updateBiometricConsent directly
    const TestConsentComponent = () => {
      const { updateBiometricConsent, errorMessage } = useAuth();
      return (
        <div>
          <button
            type="button"
            onClick={() => updateBiometricConsent(true)}
          >
            Toggle Consent
          </button>
          {errorMessage && <span data-testid="error">{errorMessage}</span>}
        </div>
      );
    };

    localStorage.setItem(
      'chobideh_auth_user',
      JSON.stringify({
        id: 'usr_test_1',
        name: 'Test User',
        email: 'test@example.com',
        biometricConsent: false,
        profileCompleted: true,
      })
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsentComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    const toggleBtn = screen.getByRole('button', { name: /toggle consent/i });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ face_clustering_enabled: true })
      );
      expect(screen.getByTestId('error')).toHaveTextContent(/database connection failed/i);
    });
  });

  it('3. PASSWORD_RECOVERY routes to /reset-password', async () => {
    let authCallback: any;
    vi.mocked(supabase!.auth.onAuthStateChange).mockImplementation(((cb: any) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn(), id: '1', callback: cb } } };
    }) as any);

    const ScreenTracker = () => {
      const { screen } = useAuth();
      return <div data-testid="active-screen">{screen}</div>;
    };

    render(
      <MemoryRouter>
        <AuthProvider>
          <ScreenTracker />
        </AuthProvider>
      </MemoryRouter>
    );

    // Simulate Supabase PASSWORD_RECOVERY event
    authCallback('PASSWORD_RECOVERY', { user: { id: 'usr_pwd_recover' } });

    await waitFor(() => {
      expect(screen.getByTestId('active-screen')).toHaveTextContent('reset-password');
    });
  });

  it('4. RequireAuth blocks logged-out users and preserves /join/:slug', () => {
    const LocationDisplay = () => {
      const location = useLocation();
      return (
        <div>
          <span data-testid="current-path">{location.pathname}</span>
          <span data-testid="redirect-from">
            {(location.state as any)?.from?.pathname}
          </span>
        </div>
      );
    };

    render(
      <MemoryRouter initialEntries={['/join/secret-room-123']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LocationDisplay />} />
            <Route
              path="/join/:slug"
              element={
                <RequireAuth>
                  <div>Protected Join Room</div>
                </RequireAuth>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
    expect(screen.getByTestId('redirect-from')).toHaveTextContent('/join/secret-room-123');
    expect(screen.queryByText('Protected Join Room')).not.toBeInTheDocument();
  });

  it('5. preview navbar is absent when DEV is false', () => {
    const originalDev = import.meta.env.DEV;
    try {
      (import.meta.env as any).DEV = false;

      const { container } = render(
        <Navbar currentScreen="home" onSelectScreen={() => {}} />
      );

      expect(container.firstChild).toBeNull();
    } finally {
      (import.meta.env as any).DEV = originalDev;
    }
  });

  it('6. profile write errors are surfaced', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { message: 'Row-level security violation' } }),
    });

    vi.mocked(supabase!.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    const TestProfileComponent = () => {
      const { updateProfileName, errorMessage } = useAuth();
      return (
        <div>
          <button type="button" onClick={() => updateProfileName('New Name')}>
            Update Name
          </button>
          {errorMessage && <span data-testid="error-msg">{errorMessage}</span>}
        </div>
      );
    };

    localStorage.setItem(
      'chobideh_auth_user',
      JSON.stringify({
        id: 'usr_test_profile',
        name: 'Old Name',
        email: 'test@example.com',
        biometricConsent: false,
        profileCompleted: true,
      })
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestProfileComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /update name/i }));

    await waitFor(() => {
      expect(screen.getByTestId('error-msg')).toHaveTextContent(/row-level security violation/i);
    });
  });

  it('7a. create room calls create_room RPC and shows error on failure', async () => {
    vi.mocked(supabase!.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'Rate limit exceeded on room creation' },
    } as any);

    render(
      <MemoryRouter>
        <AuthProvider>
          <CreateRoomScreen />
        </AuthProvider>
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText(/room name/i);
    fireEvent.change(nameInput, { target: { value: 'Winter Picnic' } });

    const submitCreate = screen.getByRole('button', { name: /create shared room/i });
    fireEvent.click(submitCreate);

    await waitFor(() => {
      expect(supabase!.rpc).toHaveBeenCalledWith('create_room', {
        room_name: 'Winter Picnic',
        passcode: null,
      });
      expect(screen.getByText(/rate limit exceeded on room creation/i)).toBeInTheDocument();
    });
  });

  it('7b. join room calls join_room RPC and shows error on failure', async () => {
    vi.mocked(supabase!.rpc).mockResolvedValueOnce({
      data: { success: false, error: 'Invalid room invite code or passcode.' },
      error: null,
    } as any);

    render(
      <MemoryRouter>
        <AuthProvider>
          <JoinRoomScreen />
        </AuthProvider>
      </MemoryRouter>
    );

    const slugInput = screen.getByPlaceholderText(/or room link/i);
    fireEvent.change(slugInput, { target: { value: 'bad-code' } });

    const submitJoin = screen.getByRole('button', { name: /join room/i });
    fireEvent.click(submitJoin);

    await waitFor(() => {
      expect(supabase!.rpc).toHaveBeenCalledWith('join_room', {
        slug: 'bad-code',
        passcode: null,
      });
      expect(screen.getByText(/invalid room invite code or passcode/i)).toBeInTheDocument();
    });
  });

  it('8. purge button shows an error when RPC fails and never shows purged falsely', async () => {
    vi.mocked(supabase!.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ room_id: 'room_123', role: 'owner' }],
          error: null,
        }),
      }),
    } as any);

    vi.mocked(supabase!.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'Permission denied for purge' },
    } as any);

    localStorage.setItem(
      'chobideh_auth_user',
      JSON.stringify({
        id: 'usr_purge_test',
        name: 'Purge Tester',
        email: 'purge@example.com',
        biometricConsent: false,
        profileCompleted: true,
      })
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <ProfileScreen />
        </AuthProvider>
      </MemoryRouter>
    );

    // Click Purge Room Face Clusters button
    const deleteBtn = screen.getByRole('button', { name: /purge room face clusters/i });
    fireEvent.click(deleteBtn);

    // Confirm modal opens
    expect(screen.getByText(/purge room face clusters\?/i)).toBeInTheDocument();

    // Click confirm purge button in modal
    const confirmPurgeBtn = screen.getByRole('button', { name: /confirm purge/i });
    fireEvent.click(confirmPurgeBtn);

    await waitFor(() => {
      // Must surface error, must not say success or purged
      expect(screen.getByText(/failed to purge room face data/i)).toBeInTheDocument();
      expect(screen.queryByText(/face data successfully purged/i)).not.toBeInTheDocument();
    });
  });

  it('9. member-scoped consent withdrawal calls withdraw_member_face_consent instead of room purge', async () => {
    vi.mocked(supabase!.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ room_id: 'room_member_only', role: 'member' }],
          error: null,
        }),
      }),
    } as any);

    vi.mocked(supabase!.rpc).mockResolvedValueOnce({
      data: { success: true, withdrawn_embeddings: 5 },
      error: null,
    } as any);

    // Mock update profile for biometric consent toggle
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    vi.mocked(supabase!.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ room_id: 'room_member_only', role: 'member' }],
          error: null,
        }),
      }),
    } as any).mockReturnValueOnce({
      update: mockUpdate,
    } as any);

    const MemberPurgeTester = () => {
      const { purgeAllFaceData } = useAuth();
      return (
        <button type="button" onClick={() => purgeAllFaceData()}>
          Withdraw Face Data
        </button>
      );
    };

    localStorage.setItem(
      'chobideh_auth_user',
      JSON.stringify({
        id: 'usr_member_1',
        name: 'Plain Member',
        email: 'member@example.com',
        biometricConsent: true,
        profileCompleted: true,
      })
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <MemberPurgeTester />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /withdraw face data/i }));

    await waitFor(() => {
      expect(supabase!.rpc).toHaveBeenCalledWith('withdraw_member_face_consent', {
        target_room_id: 'room_member_only',
      });
      expect(supabase!.rpc).not.toHaveBeenCalledWith('purge_room_face_data', expect.anything());
    });
  });
});
