import { Component, ErrorInfo, ReactNode } from 'react';
import './RantErrorBoundary.css';

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
        <div className="rant-error-boundary-container">
          <div className="rant-error-boundary-content">
            <h1 className="rant-error-boundary-title">
              Application Error
            </h1>

            <div className="rant-error-boundary-details">
              <strong>Error Details:</strong><br />
              {this.state.error?.message || 'Unknown error occurred'}
            </div>

            <p className="rant-error-boundary-message">
              The application has encountered an error and cannot continue.
              Please refresh the page to restart the application.
            </p>

            <button
              onClick={() => globalThis.location.reload()}
              className="rant-error-boundary-button"
            >
              Refresh Page
            </button>

            <div className="rant-error-boundary-footer">
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