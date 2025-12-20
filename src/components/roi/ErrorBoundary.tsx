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
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
              <p className="text-sm text-gray-400">
                An unexpected error occurred while loading the cashflow generator.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-[#0d1117] rounded-lg p-3 text-left overflow-auto max-h-32">
                <p className="text-xs text-red-400 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="border-[#2a3142] bg-[#0d1117] text-gray-300 hover:bg-[#2a3142] hover:text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
              <Button
                onClick={this.handleReset}
                className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90"
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
        <div className="bg-[#1a1f2e] border border-red-500/30 rounded-2xl p-6 text-center space-y-3">
          <div className="flex justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-white">Failed to load {name}</h3>
            <p className="text-xs text-gray-400">This section encountered an error. Please refresh the page.</p>
          </div>
        </div>
      }
    >
      {children}
    </CashflowErrorBoundary>
  );
};
