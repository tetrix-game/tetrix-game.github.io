/**
 * Login/Register Overlay
 * Provides UI for user authentication
 */

import { TextField, Button } from '@mui/material';
import { useState } from 'react';

import { useAuth } from '../AuthProvider/AuthContext';
import { Overlay } from '../Overlay';
import './LoginOverlay.css';

interface LoginOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({ isOpen, onClose }) => {
  const { login, register, forgotPassword, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setValidationError('');
    setSuccessMessage('');
    clearError();

    // Forgot password mode
    if (mode === 'forgot') {
      if (!email) {
        setValidationError('Email is required');
        return;
      }
      setIsSubmitting(true);
      try {
        const response = await forgotPassword(email);
        setSuccessMessage(response.message);
        setEmail('');
      } catch {
        // Error handled by AuthProvider
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Login/Register validation
    if (!email || !password) {
      setValidationError('Email and password are required');
      return;
    }

    if (mode === 'register') {
      if (!username) {
        setValidationError('Username is required');
        return;
      }

      if (username.length < 3 || username.length > 20) {
        setValidationError('Username must be 3-20 characters');
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setValidationError('Username can only contain letters, numbers, and underscores');
        return;
      }

      if (password.length < 8) {
        setValidationError('Password must be at least 8 characters');
        return;
      }

      if (!/[A-Z]/.test(password)) {
        setValidationError('Password must contain at least one uppercase letter');
        return;
      }

      if (!/[a-z]/.test(password)) {
        setValidationError('Password must contain at least one lowercase letter');
        return;
      }

      if (!/[0-9]/.test(password)) {
        setValidationError('Password must contain at least one number');
        return;
      }

      if (password !== confirmPassword) {
        setValidationError('Passwords do not match');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(username, email, password);
      }

      // Success - close overlay and reset form
      onClose();
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setMode('login');
    } catch {
      // Error handled by AuthProvider, will show in UI
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (): void => {
    if (mode === 'login') {
      setMode('register');
    } else {
      setMode('login');
    }
    setValidationError('');
    setSuccessMessage('');
    clearError();
    setConfirmPassword('');
  };

  const showForgotPassword = (): void => {
    setMode('forgot');
    setValidationError('');
    setSuccessMessage('');
    clearError();
  };

  const backToLogin = (): void => {
    setMode('login');
    setValidationError('');
    setSuccessMessage('');
    clearError();
  };

  const handleClose = (): void => {
    if (!isSubmitting) {
      onClose();
      // Reset form on close
      setTimeout(() => {
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setMode('login');
        setValidationError('');
        setSuccessMessage('');
        clearError();
      }, 300); // Wait for overlay close animation
    }
  };

  return (
    <Overlay
      isOpen={isOpen}
      onEscapeKey={handleClose}
      onBackdropClick={handleClose}
      className="login-overlay"
      contentClassName="login-content"
      ariaLabel={((): string => {
        if (mode === 'login') return 'Login';
        if (mode === 'register') return 'Register';
        return 'Forgot Password';
      })()}
    >
      <div className="login-container">
        <h2>
          {mode === 'login' && 'Login'}
          {mode === 'register' && 'Create Account'}
          {mode === 'forgot' && 'Reset Password'}
        </h2>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'register' && (
            <TextField
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              autoComplete="username"
              disabled={isSubmitting}
              sx={{ marginBottom: 2 }}
            />
          )}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            autoComplete="email"
            disabled={isSubmitting}
            sx={{ marginBottom: 2 }}
          />

          {mode !== 'forgot' && (
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={isSubmitting}
              sx={{ marginBottom: 2 }}
            />
          )}

          {mode === 'register' && (
            <TextField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              autoComplete="new-password"
              disabled={isSubmitting}
              sx={{ marginBottom: 2 }}
            />
          )}

          {mode === 'register' && (
            <div className="password-requirements">
              <p>Password must contain:</p>
              <ul>
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>
          )}

          {(error || validationError) && (
            <div className="login-error">{validationError || error}</div>
          )}

          {successMessage && <div className="login-success">{successMessage}</div>}

          <div className="login-actions">
            <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth>
              {((): string => {
                if (isSubmitting) return 'Loading...';
                if (mode === 'login') return 'Login';
                if (mode === 'register') return 'Create Account';
                return 'Send Reset Link';
              })()}
            </Button>

            {mode === 'login' && (
              <>
                <Button variant="text" onClick={switchMode} disabled={isSubmitting} fullWidth>
                  Need an account? Sign up
                </Button>
                <Button
                  variant="text"
                  onClick={showForgotPassword}
                  disabled={isSubmitting}
                  fullWidth
                  sx={{ fontSize: '0.9em' }}
                >
                  Forgot password?
                </Button>
              </>
            )}

            {mode === 'register' && (
              <Button variant="text" onClick={switchMode} disabled={isSubmitting} fullWidth>
                Already have an account? Login
              </Button>
            )}

            {mode === 'forgot' && (
              <Button variant="text" onClick={backToLogin} disabled={isSubmitting} fullWidth>
                Back to login
              </Button>
            )}
          </div>
        </form>
      </div>
    </Overlay>
  );
};
