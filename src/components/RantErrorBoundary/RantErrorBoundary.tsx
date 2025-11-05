import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class RantErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    console.log('Error boundary caught error:', error);
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    console.log('Error boundary activated!');
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#cccccc',
          color: '#333333',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2147483647, // Maximum z-index value
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          textAlign: 'center',
          padding: '40px',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '60px',
            border: '1px solid #999999',
            maxWidth: '600px',
            width: '100%'
          }}>
            <h1 style={{
              fontSize: '24px',
              margin: '0 0 30px 0',
              color: '#666666',
              fontWeight: 'normal'
            }}>
              Application Error
            </h1>

            <div style={{
              backgroundColor: '#eeeeee',
              padding: '20px',
              border: '1px solid #dddddd',
              margin: '20px 0',
              textAlign: 'left',
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#555555'
            }}>
              <strong>Error Details:</strong><br />
              {this.state.error?.message || 'Unknown error occurred'}
            </div>

            <p style={{
              fontSize: '14px',
              color: '#777777',
              margin: '30px 0',
              lineHeight: '1.5'
            }}>
              The application has encountered an error and cannot continue.
              Please refresh the page to restart the application.
            </p>

            <button
              onClick={() => globalThis.location.reload()}
              style={{
                backgroundColor: '#e0e0e0',
                color: '#333333',
                border: '1px solid #999999',
                padding: '12px 24px',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Refresh Page
            </button>

            <div style={{
              marginTop: '40px',
              fontSize: '12px',
              color: '#aaaaaa',
              borderTop: '1px solid #dddddd',
              paddingTop: '20px'
            }}>
              If this problem persists, maybe try not clicking that button so much next time.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RantErrorBoundary;