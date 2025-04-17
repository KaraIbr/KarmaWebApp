import React, { Component } from 'react';

/**
 * Error Boundary component to catch JavaScript errors in child components
 * Prevents the entire app from crashing when an error occurs
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  // Catches errors in any child component
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  // Log error details
  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // You could log the error to an error reporting service here
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  // Reset the error state to allow retry
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    // If no error occurred, render children normally
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Fallback UI when an error occurs
    return (
      <div className="error-boundary">
        <div className="error-content">
          <h2 className="error-title">
            <i className="fas fa-exclamation-circle me-2"></i>
            Algo salió mal
          </h2>
          <p className="error-message">
            Ha ocurrido un error inesperado en la aplicación.
          </p>
          {this.props.showDetails && this.state.error && (
            <details className="error-details">
              <summary>Detalles del error</summary>
              <p>{this.state.error.toString()}</p>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}
          <div className="error-actions">
            <button 
              className="btn btn-primary me-2" 
              onClick={this.handleReset}
            >
              Intentar de nuevo
            </button>
            <button 
              className="btn btn-outline-secondary" 
              onClick={() => window.location.href = '/'}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;