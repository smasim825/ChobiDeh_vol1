import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RoomAreaScreen } from '../screens/RoomAreaScreen';
import { CreateRoomScreen } from '../screens/CreateRoomScreen';
import { JoinRoomScreen } from '../screens/JoinRoomScreen';
import App from '../App';

describe('ChobiDeh Home & Room Suite', () => {
  it('renders HomeScreen with top bar, greeting, and memory room cards', () => {
    render(
      <AuthProvider>
        <HomeScreen />
      </AuthProvider>
    );

    // Hero title
    expect(screen.getByRole('heading', { name: /ready for your next memory\?/i })).toBeInTheDocument();

    // AI Banner
    expect(screen.getByText(/3-level ai clustering active/i)).toBeInTheDocument();

    // Memory Rooms
    expect(screen.getAllByText("Cox's Bazar Trip")[0]).toBeInTheDocument();
    expect(screen.getAllByText("University Memories")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Sylhet Weekend")[0]).toBeInTheDocument();

    // Action buttons
    expect(screen.getByRole('button', { name: /create a room/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join a room/i })).toBeInTheDocument();
  });

  it('renders ProfileScreen with user details, metrics, and on-device vault settings', () => {
    render(
      <AuthProvider>
        <ProfileScreen />
      </AuthProvider>
    );

    expect(screen.getByRole('heading', { name: /chobideh/i })).toBeInTheDocument();
    expect(screen.getByText(/profile & settings/i)).toBeInTheDocument();
    expect(screen.getByText(/on-device photo vault/i)).toBeInTheDocument();
    expect(screen.getByText(/biometrics local & safe/i)).toBeInTheDocument();
    expect(screen.getByText(/active rooms/i)).toBeInTheDocument();
    expect(screen.getByText(/3-level ai face clustering/i)).toBeInTheDocument();
  });

  it('renders RoomAreaScreen with room metadata, member stack, and photo gallery', () => {
    render(
      <AuthProvider>
        <RoomAreaScreen />
      </AuthProvider>
    );

    expect(screen.getByRole('heading', { name: /cox's bazar winter escape/i })).toBeInTheDocument();
    expect(screen.getByText(/end-to-end vault/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /person collections/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload photos/i })).toBeInTheDocument();
    expect(screen.getByText(/gallery/i)).toBeInTheDocument();
  });

  it('renders CreateRoomScreen with form fields and preset selectors', () => {
    render(
      <AuthProvider>
        <CreateRoomScreen />
      </AuthProvider>
    );

    expect(screen.getByRole('heading', { name: /create a room/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create shared room/i })).toBeInTheDocument();
  });

  it('renders JoinRoomScreen with 6-character room key inputs and paste code action', () => {
    render(
      <AuthProvider>
        <JoinRoomScreen />
      </AuthProvider>
    );

    expect(screen.getByRole('heading', { name: /join a room/i })).toBeInTheDocument();
    expect(screen.getByText(/room access key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /paste cb-9821/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join room/i })).toBeInTheDocument();
  });

  it('navigates to Profile, Room Area, Create Room, and Join Room from the switcher in App', () => {
    render(<App />);

    // Click Profile tab
    const profileTab = screen.getByRole('button', { name: /profile/i });
    fireEvent.click(profileTab);
    expect(screen.getByText(/profile & settings/i)).toBeInTheDocument();

    // Click Room Area tab
    const roomTab = screen.getByRole('button', { name: /room area/i });
    fireEvent.click(roomTab);
    expect(screen.getByRole('heading', { name: /cox's bazar winter escape/i })).toBeInTheDocument();

    // Click Create Room tab
    const createRoomTab = screen.getByRole('button', { name: /create room/i });
    fireEvent.click(createRoomTab);
    expect(screen.getByRole('heading', { name: /create a room/i })).toBeInTheDocument();

    // Click Join Room tab
    const joinRoomTab = screen.getByRole('button', { name: /join room/i });
    fireEvent.click(joinRoomTab);
    expect(screen.getByRole('heading', { name: /join a room/i })).toBeInTheDocument();
  });
});
