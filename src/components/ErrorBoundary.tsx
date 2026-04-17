import * as React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let displayMessage = 'Algo salió mal. Por favor, intenta de nuevo.';
      
      try {
        // Check if it's a Firestore error JSON
        const errorData = JSON.parse(this.state.error?.message || '');
        if (errorData.error) {
          if (errorData.error.includes('Missing or insufficient permissions')) {
            displayMessage = 'No tienes permisos suficientes para realizar esta acción.';
          } else {
            displayMessage = `Causa: ${errorData.error}`;
          }
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-bg-app flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-border-subtle max-w-sm w-full space-y-6 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
              <AlertTriangle size={32} />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-black text-text-main">Error de Sistema</h1>
              <p className="text-sm text-text-muted">{displayMessage}</p>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors"
            >
              <RefreshCcw size={18} />
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
