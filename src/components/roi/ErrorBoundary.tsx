import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class CashflowErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CashflowErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleGoHome = () => {
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-theme-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-theme-card border border-theme-border rounded-2xl p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-theme-text">Something went wrong</h2>
              <p className="text-sm text-theme-text-muted">
                An unexpected error occurred while loading the cashflow generator.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-theme-bg-alt rounded-lg p-3 text-left overflow-auto max-h-32">
                <p className="text-xs text-red-400 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <Button
                variant="outlineDark"
                onClick={this.handleGoHome}
                className="border-theme-border text-theme-text hover:bg-theme-card-alt"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
              <Button
                onClick={this.handleReset}
                className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for simpler use
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  name?: string;
}

export const SectionErrorBoundary = ({ children, name = 'section' }: ErrorBoundaryWrapperProps) => {
  return (
    <CashflowErrorBoundary
      fallback={
        <div className="bg-theme-card border border-red-500/30 rounded-2xl p-6 text-center space-y-3">
          <div className="flex justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-theme-text">Failed to load {name}</h3>
            <p className="text-xs text-theme-text-muted">This section encountered an error. Please refresh the page.</p>
          </div>
        </div>
      }
    >
      {children}
    </CashflowErrorBoundary>
  );
};
