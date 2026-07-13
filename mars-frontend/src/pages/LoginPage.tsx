import { Box, Button, Paper, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { APP_NAME } from '../constants';

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          width: '100%',
          maxWidth: 420,
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          {APP_NAME}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Giriş sayfası — henüz geliştirilmedi.
        </Typography>
        <Button
          component={RouterLink}
          to={ROUTES.DASHBOARD}
          variant="contained"
          fullWidth
        >
          Dashboard&apos;a Git
        </Button>
      </Paper>
    </Box>
  );
}
