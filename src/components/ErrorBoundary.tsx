import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.removeItem('mlsa_student_email');
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090a0f] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-[#12141c] border border-white/10 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-xl">
              !
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Application Render Notice
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              A temporary display error occurred while rendering the dashboard. You can reload the page or return to the sign in console.
            </p>
            {this.state.error?.message && (
              <pre className="p-3 rounded-lg bg-black/40 border border-white/5 text-[11px] text-rose-300 font-mono text-left overflow-x-auto">
                {this.state.error.message}
              </pre>
            )}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white text-black font-bold text-xs hover:bg-gray-200 transition cursor-pointer"
              >
                Reload Dashboard
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer border border-white/15"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
