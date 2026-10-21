import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import App from '../App';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { CheckEmailScreen } from '../screens/CheckEmailScreen';

describe('ChobiDeh Authentication Suite', () => {
  it('renders LoginScreen with email, password inputs, and toggles password visibility', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();

    const pwdInput = screen.getByLabelText(/^password/i) as HTMLInputElement;
    expect(pwdInput).toBeInTheDocument();
    expect(pwdInput.type).toBe('password');

    const toggleBtn = screen.getByLabelText(/show password/i);
    fireEvent.click(toggleBtn);
    expect(pwdInput.type).toBe('text');

    fireEvent.click(screen.getByLabelText(/hide password/i));
    expect(pwdInput.type).toBe('password');
  });

  it('renders SignupScreen with name, email, password, and explicit biometric consent toggle', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupScreen />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();

    const consentCheckbox = screen.getByRole('checkbox', {
      name: /enable 3-level ai face clustering/i,
    }) as HTMLInputElement;
    expect(consentCheckbox).toBeInTheDocument();
    expect(consentCheckbox.checked).toBe(false);

    // Toggle consent on
    fireEvent.click(consentCheckbox);
    expect(consentCheckbox.checked).toBe(true);
  });

  it('renders ForgotPasswordScreen and allows sending a reset link', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ForgotPasswordScreen />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /forgot password\?/i })).toBeInTheDocument();
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'traveler@example.com' } });

    const sendBtn = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/verification link sent/i)).toBeInTheDocument();
    });
  });

  it('renders CheckEmailScreen with destination email and open email app link', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CheckEmailScreen />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
    expect(screen.getByText(/your email address/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open email app/i })).toHaveAttribute('href', 'mailto:');
  });

  it('allows navigating between auth screens using the switcher in App', () => {
    render(<App />);

    // Initially at Login
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();

    // Click Sign Up tab in switcher
    const signupTabs = screen.getAllByRole('button', { name: /sign up/i });
    fireEvent.click(signupTabs[0]);
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();

    // Click Forgot Password tab
    const forgotTab = screen.getByRole('button', { name: /forgot password/i });
    fireEvent.click(forgotTab);
    expect(screen.getByRole('heading', { name: /forgot password\?/i })).toBeInTheDocument();

    // Click Check Email tab
    const checkEmailTab = screen.getByRole('button', { name: /check email/i });
    fireEvent.click(checkEmailTab);
    expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
  });

  it('renders Security & Login Methods card in ProfileScreen allowing password setup', async () => {
    const { ProfileScreen } = await import('../screens/ProfileScreen');
    render(
      <MemoryRouter>
        <AuthProvider>
          <ProfileScreen />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /security & login methods/i })).toBeInTheDocument();
    expect(screen.getByText(/google account/i)).toBeInTheDocument();
    expect(screen.getByText(/account password/i)).toBeInTheDocument();

    // Click "Set a Password" button to toggle password setup form
    const setPwdBtn = screen.getByRole('button', { name: /set a password/i });
    fireEvent.click(setPwdBtn);

    expect(screen.getByLabelText(/create password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('renders Profile picture with interactive upload button and allows selecting an image', async () => {
    const { ProfileScreen } = await import('../screens/ProfileScreen');
    render(
      <MemoryRouter>
        <AuthProvider>
          <ProfileScreen />
        </AuthProvider>
      </MemoryRouter>
    );

    const uploadBtn = screen.getByRole('button', { name: /change profile photo/i });
    expect(uploadBtn).toBeInTheDocument();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput.accept).toContain('image/');
  });
});


