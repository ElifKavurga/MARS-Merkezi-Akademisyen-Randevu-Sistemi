import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';

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
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            p: 3,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Beklenmeyen bir hata oluştu
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sayfayı yenileyerek tekrar deneyebilirsiniz.
          </Typography>
          <Button variant="contained" onClick={this.handleReload}>
            Ana sayfaya dön
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
