import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { FiHome } from 'react-icons/fi';
import { ROUTES } from '../constants/routes';
import { APP_NAME } from '../constants';

interface SidebarProps {
  drawerWidth: number;
  mobileOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const navItems = [
  {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: <DashboardIcon />,
  },
];

export default function Sidebar({
  drawerWidth,
  mobileOpen,
  onClose,
  isMobile,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <FiHome size={22} />
        <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
          {APP_NAME}
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, px: 1, py: 2 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => handleNavigate(item.path)}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        slotProps={{
          root: { keepMounted: true },
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
