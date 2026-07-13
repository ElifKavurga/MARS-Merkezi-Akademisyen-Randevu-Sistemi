import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const DRAWER_WIDTH = 260;

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header
        drawerWidth={DRAWER_WIDTH}
        onMenuClick={handleDrawerToggle}
      />
      <Sidebar
        drawerWidth={DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        onClose={handleDrawerToggle}
        isMobile={isMobile}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
