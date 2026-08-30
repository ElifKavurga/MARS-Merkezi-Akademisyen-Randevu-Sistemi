import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Unhandled UI error:', error, info.componentStack);
    }
  }

  private handleReload = () => {
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-surface text-on-surface">
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
            Beklenmeyen bir hata oluştu
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-sm">
            Sayfayı yenileyerek tekrar deneyebilirsiniz.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-[#0b1641] text-on-primary font-label-md text-label-md hover:bg-black transition-colors"
          >
            Ana sayfaya dön
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
