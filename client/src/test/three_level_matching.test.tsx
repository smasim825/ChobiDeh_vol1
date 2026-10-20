import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { RoomAreaScreen } from '../screens/RoomAreaScreen';
import { AuthContext } from '../context/AuthContextBase';
// Mock Auth Provider Wrapper
const renderWithAuth = (ui: React.ReactElement) => {
  const mockValue: any = {
    screen: 'room-area',
    setScreen: () => {},
    currentUser: { id: 'user_123', name: 'Test Member', email: 'test@example.com', biometricConsent: false },
    pendingEmail: '',
    setPendingEmail: () => {},
    isLoading: false,
    errorMessage: null,
    clearError: () => {},
    login: async () => true,
    loginWithGoogle: async () => true,
    completeGoogleProfile: async () => true,
    signup: async () => true,
    logout: async () => {},
    sendPasswordReset: async () => true,
    resendVerificationEmail: async () => true,
    updateBiometricConsent: async () => ({ success: true }),
    purgeAllFaceData: async () => ({ success: true }),
    updateProfileName: async () => true,
    setUserPassword: async () => ({ success: true }),
    isSupabaseConnected: false,
  };
  return render(
    <AuthContext.Provider value={mockValue}>
      {ui}
    </AuthContext.Provider>
  );
};

describe('Three-Level Photo Matching & Grouping System', () => {
  it('Level 1: Renders confirmed People tab and supports multi-person group photos', () => {
    renderWithAuth(<RoomAreaScreen />);

    // Check Tab
    expect(screen.getByText('People (Level 1)')).toBeDefined();

    // Check multi-person group photo badge exists
    expect(screen.getByText(/Tasnim \+ Rafiqul/i)).toBeDefined();

    // Filter by Tasnim
    const tasnimBtn = screen.getByRole('button', { name: 'Tasnim' });
    fireEvent.click(tasnimBtn);
    expect(screen.getByText(/Photos with Tasnim/i)).toBeDefined();
    expect(screen.getByText(/Tasnim \+ Rafiqul/i)).toBeDefined();

    // Filter by Rafiqul - exact same photo should appear without duplicate storage!
    const rafiqulBtn = screen.getByRole('button', { name: 'Rafiqul' });
    fireEvent.click(rafiqulBtn);
    expect(screen.getByText(/Photos with Rafiqul/i)).toBeDefined();
    expect(screen.getByText(/Tasnim \+ Rafiqul/i)).toBeDefined();
  });

  it('Level 2: Renders Review Suggestions with candidate people and allows explicit A -> B correction', () => {
    renderWithAuth(<RoomAreaScreen />);

    // Switch to Review Suggestions tab
    const suggestionsTab = screen.getByText('Review Suggestions');
    fireEvent.click(suggestionsTab);

    // Verify AI suggestion and candidate people
    expect(screen.getByText(/Suggested: Person 2 \(Rafiqul\)/i)).toBeDefined();
    expect(screen.getByText(/Closest candidates: Rafiqul/i)).toBeDefined();

    // Select alternative candidate "Samira" and correct (A -> B)
    const correctBtn = screen.getByRole('button', { name: /Correct to/i });
    fireEvent.click(correctBtn);

    // Verify confirmation toast notification
    expect(screen.getByText(/Corrected! Removed pending suggestion/i)).toBeDefined();
    expect(screen.getByText(/All suggestions reviewed!/i)).toBeDefined();
  });

  it('Level 2: Rejection does not auto-assign to another candidate and allows Undo', () => {
    renderWithAuth(<RoomAreaScreen />);

    // Switch to suggestions
    fireEvent.click(screen.getByText('Review Suggestions'));

    // Reject suggestion
    const rejectBtn = screen.getByRole('button', { name: /Reject/i });
    fireEvent.click(rejectBtn);

    // Rejection toast confirms photo stays in Level 3 Rest (Unknown Faces)
    expect(screen.getByText(/Suggestion rejected\. Photo kept in Level 3 Rest Photos/i)).toBeDefined();

    // Click Undo to rollback
    const undoBtn = screen.getByRole('button', { name: /Undo/i });
    fireEvent.click(undoBtn);

    // Suggestion restored
    expect(screen.getByText(/Undone:/i)).toBeDefined();
    expect(screen.getByText(/Suggested: Person 2 \(Rafiqul\)/i)).toBeDefined();
  });

  it('Level 3: Rest Photos organizes into Unknown Faces, No People, and Other Unassigned', () => {
    renderWithAuth(<RoomAreaScreen />);

    // Switch to Rest Photos tab
    const restTab = screen.getByText('Rest Photos');
    fireEvent.click(restTab);

    // Verify all 3 subcategory filters exist
    expect(screen.getByText('Unknown Faces')).toBeDefined();
    expect(screen.getByText('No People (Scenic)')).toBeDefined();
    expect(screen.getByText('Other Unassigned')).toBeDefined();

    // Unknown Faces shows unknown face badge
    expect(screen.getByText(/Unknown Face Detected/i)).toBeDefined();

    // Switch to No People filter
    const noPeopleBtn = screen.getByRole('button', { name: /No People/i });
    fireEvent.click(noPeopleBtn);
    expect(screen.getByText(/Scenic \/ No People/i)).toBeDefined();
    expect(screen.getByText(/Food & Dining/i)).toBeDefined();

    // Switch to Other Unassigned filter
    const otherBtn = screen.getByRole('button', { name: /Other Unassigned/i });
    fireEvent.click(otherBtn);
    expect(screen.getByText(/Low Light \/ Motion Blur/i)).toBeDefined();
  });

  it('Enforces Dual Export actions: Save to Phone (ZIP) and Export to Google Drive', () => {
    renderWithAuth(<RoomAreaScreen />);

    const savePhoneBtn = screen.getByRole('button', { name: /Save to Phone \(ZIP\)/i });
    const exportDriveBtn = screen.getByRole('button', { name: /Export to Google Drive/i });

    expect(savePhoneBtn).toBeDefined();
    expect(exportDriveBtn).toBeDefined();

    fireEvent.click(savePhoneBtn);
    expect(screen.getByText(/Starting in-browser ZIP download/i)).toBeDefined();

    fireEvent.click(exportDriveBtn);
    expect(screen.getByText(/Exporting album cloud-to-cloud directly into your Google Drive/i)).toBeDefined();
  });
});
