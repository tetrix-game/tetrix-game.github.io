/**
 * Reset Password Overlay
 * Handles password reset with token from URL
 */

import { TextField, Button } from '@mui/material';
import { useState, useEffect } from 'react';

import { useAuth } from '../AuthProvider/AuthContext';
import { Overlay } from '../Overlay';
import './ResetPasswordOverlay.css';

export const ResetPasswordOverlay: React.FC = () => {
  const { resetPassword, clearError } = useAuth();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setValidationError('No reset token provided. Please check your email link.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setValidationError('');
    setSuccessMessage('');
    clearError();

    if (!token) {
      setValidationError('No reset token found');
      return;
    }

    if (!newPassword) {
      setValidationError('Password is required');
      return;
    }

    if (newPassword.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setValidationError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setValidationError('Password must contain at least one lowercase letter');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setValidationError('Password must contain at least one number');
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPassword(token, newPassword);
      setSuccessMessage(response.message);

      // Redirect to home after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch {
      // Error handled by AuthProvider
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (): void => {
    window.location.href = '/';
  };

  return (
    <Overlay
      isOpen={true}
      onEscapeKey={handleClose}
      onBackdropClick={handleClose}
      className="reset-password-overlay"
      contentClassName="reset-password-content"
      ariaLabel="Reset Password"
    >
      <div className="reset-password-container">
        <h2>Reset Your Password</h2>

        {successMessage ? (
          <div className="reset-password-success">
            <p>{successMessage}</p>
            <p>Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="reset-password-form">
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              autoComplete="new-password"
              disabled={isSubmitting || !token}
              sx={{ marginBottom: 2 }}
            />

            <TextField
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              autoComplete="new-password"
              disabled={isSubmitting || !token}
              sx={{ marginBottom: 2 }}
            />

            <div className="password-requirements">
              <p>Password must contain:</p>
              <ul>
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>

            {validationError && (
              <div className="reset-password-error">{validationError}</div>
            )}

            <div className="reset-password-actions">
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || !token}
                fullWidth
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </Button>

              <Button variant="text" onClick={handleClose} disabled={isSubmitting} fullWidth>
                Back to Home
              </Button>
            </div>
          </form>
        )}
      </div>
    </Overlay>
  );
};
