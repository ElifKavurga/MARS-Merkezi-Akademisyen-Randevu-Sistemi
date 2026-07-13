import { Typography, Box } from '@mui/material';

export default function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Dashboard sayfası — henüz geliştirilmedi.
      </Typography>
    </Box>
  );
}
