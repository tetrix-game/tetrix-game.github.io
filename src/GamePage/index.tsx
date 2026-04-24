/**
 * Game Page
 * Protected route that requires authentication
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../AuthProvider/AuthContext';
import { DraggingShape } from '../DraggingShape';
import { FullScreenButton as FullScreenFloatingActionButton } from '../FullScreenButton';
import { Header } from '../Header';
import { PersistenceListener } from '../PersistenceListener';
import { Tetrix } from '../Tetrix';
import { ToastOverlay } from '../ToastOverlay';
import { UpdateNotification } from '../UpdateNotification';
import { usePointerTracking } from '../usePointerTracking';
import { useShapePlacement } from '../useShapePlacement';
import { useUpdateNotification } from '../useUpdateNotification';

const GameContent: React.FC = () => {
  const { showUpdateNotification, handleUpdate, handleDismissUpdate } = useUpdateNotification();

  usePointerTracking();
  useShapePlacement();

  return (
    <>
      <PersistenceListener />
      <Header />
      <div className="game-container">
        <Tetrix />
      </div>
      <FullScreenFloatingActionButton />
      <DraggingShape />
      <ToastOverlay />

      {showUpdateNotification && (
        <UpdateNotification
          onUpdate={handleUpdate}
          onDismiss={handleDismissUpdate}
        />
      )}
    </>
  );
};

export const GamePage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#191919',
          color: '#fff',
        }}
      >
        Loading...
      </div>
    );
  }

  // Don't render game if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return <GameContent />;
};
