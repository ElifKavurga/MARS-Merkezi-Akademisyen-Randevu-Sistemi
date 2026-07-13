import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { APP_NAME, APP_FULL_NAME } from '../constants';

interface HeaderProps {
  drawerWidth: number;
  onMenuClick: () => void;
}

export default function Header({ drawerWidth, onMenuClick }: HeaderProps) {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { md: 'none' } }}
          aria-label="menüyü aç"
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="h1" noWrap sx={{ fontWeight: 600 }}>
            {APP_NAME}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            {APP_FULL_NAME}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
