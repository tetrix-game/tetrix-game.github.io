/**
 * Login Page
 * Full-page login/register screen shown before game access
 */

import { TextField, Button, Box, Paper, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../AuthProvider/AuthContext';
import { PublicLeaderboard } from '../PublicLeaderboard';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const { login, register, forgotPassword, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect to game if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/game');
    }
  }, [isAuthenticated, navigate]);

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

      // Success - navigate to game
      navigate('/game');
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

  return (
    <div className="login-page">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#191919',
          padding: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            maxWidth: 1000,
            width: '100%',
          }}
        >
          {/* Login Form */}
          <Box sx={{ flex: 1 }}>
            <Paper
              elevation={3}
              sx={{
                padding: 4,
                backgroundColor: '#2a2a2a',
              }}
            >
              <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#fff', textAlign: 'center' }}>
                Tetrix
              </Typography>
              <Typography variant="h6" component="h2" gutterBottom sx={{ color: '#4fc3f7', textAlign: 'center', mb: 3 }}>
                {mode === 'login' && 'Login'}
                {mode === 'register' && 'Create Account'}
                {mode === 'forgot' && 'Reset Password'}
              </Typography>

              <form onSubmit={handleSubmit}>
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
                  <Box sx={{ marginBottom: 2, fontSize: '0.85em', color: '#aaa' }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>Password must contain:</Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      <li>At least 8 characters</li>
                      <li>One uppercase letter</li>
                      <li>One lowercase letter</li>
                      <li>One number</li>
                    </ul>
                  </Box>
                )}

                {(error || validationError) && (
                  <Typography sx={{ color: '#ff6b6b', mb: 2, textAlign: 'center' }}>
                    {validationError || error}
                  </Typography>
                )}

                {successMessage && (
                  <Typography sx={{ color: '#4fd1c7', mb: 2, textAlign: 'center' }}>
                    {successMessage}
                  </Typography>
                )}

                <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth sx={{ mb: 1 }}>
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
              </form>
            </Paper>
          </Box>

          {/* Leaderboard */}
          <Box sx={{ flex: 1 }}>
            <Paper
              elevation={3}
              sx={{
                padding: 4,
                backgroundColor: '#2a2a2a',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <PublicLeaderboard />
            </Paper>
          </Box>
        </Box>
      </Box>
    </div>
  );
};
