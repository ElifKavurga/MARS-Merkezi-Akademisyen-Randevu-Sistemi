import { Box, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export default function NotFoundPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 2,
      }}
    >
      <Typography variant="h1" color="text.secondary" sx={{ fontWeight: 700 }}>
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        Sayfa bulunamadı
      </Typography>
      <Button component={RouterLink} to={ROUTES.DASHBOARD} variant="contained">
        Dashboard&apos;a Dön
      </Button>
    </Box>
  );
}
