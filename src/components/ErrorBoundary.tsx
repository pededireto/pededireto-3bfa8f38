import React from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="text-center max-w-md space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Algo correu mal</h1>
            <p className="text-muted-foreground">
              Ocorreu um erro inesperado. Tenta recarregar a página.
            </p>
            <p className="text-xs text-destructive font-mono break-all">
              {this.state.error?.message}
            </p>
            <Button onClick={this.handleReset}>Voltar ao início</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
