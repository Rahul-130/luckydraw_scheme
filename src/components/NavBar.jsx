import {
  AppBar,
  Toolbar,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  Typography,
  Drawer,
  List,
  ListItem,
  Menu,
  MenuItem,
  ListItemIcon,
  Avatar,
  ListItemButton,
  ListItemText,
  Fade,
  useTheme,
} from "@mui/material";
import { alpha } from '@mui/material/styles';
import MenuIcon from "@mui/icons-material/Menu";import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import SettingsIcon from '@mui/icons-material/Settings';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import React, { useState, Fragment } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useThemeContext } from "../context/ThemeContext";

const DrawerItem = ({ in: inProp, timeout, style, onClick, selected, sx, icon, text, textProps }) => (
  <Fade in={inProp} timeout={timeout} style={style}>
    <ListItem disablePadding>
      <ListItemButton onClick={onClick} selected={selected} sx={sx}>
        <ListItemIcon sx={{ color: 'inherit', minWidth: '40px' }}>
          {icon}
        </ListItemIcon>
        <ListItemText primary={text} primaryTypographyProps={textProps} />
      </ListItemButton>
    </ListItem>
  </Fade>
);

const getActiveStyles = (theme) => ({
  "&.Mui-selected": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  },
});

const textTypographyProps = {
  style: {
    fontFamily: 'Georgia, serif'
  }
};

export default function NavBar() {
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { pathname } = useLocation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setIsDrawerOpen(open);
  };

  const handleNavigate = (path) => {
    setAnchorElUser(null);
    navigate(path);
  };

  const handleLogout = () => {
    setAnchorElUser(null);
    logout();
    navigate("/login");
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard", auth: true, icon: <DashboardIcon /> },
    { label: "Books", path: "/books", auth: true, icon: <MenuBookIcon /> },
    { label: "Eligible Customers", path: "/eligible-customers", auth: true, icon: <PeopleIcon /> },
    { label: "Winners", path: "/winners", auth: true, icon: <EmojiEventsIcon /> },
    { label: "Lucky Draw", path: "/lucky-draw", auth: true, icon: <ConfirmationNumberIcon /> }
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Lucky Draw
        </Typography>
        {isMobile ? (
          <>
            <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              open={isDrawerOpen}
              onClose={toggleDrawer(false)}
              PaperProps={{
                sx: { backgroundColor: theme.palette.background.paper },
              }}
            >
              <Box
                sx={{ width: 250 }}
                role="presentation"
              >
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                  <IconButton onClick={toggleDrawer(false)}>
                    <CloseIcon />
                  </IconButton>
                </Box>
                {token && user && (
                  <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar src={user.avatarUrl} sx={{ width: 56, height: 56, mb: 1 }}>
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </Avatar>
                    <Typography variant="h6">{user.name || 'User Name'}</Typography>
                  </Box>
                )}
                <Box onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>

                <List>
                  {navItems
                    .map((item, index) => (
                      <DrawerItem
                        key={item.label}
                        in={isDrawerOpen}
                        timeout={500}
                        style={{ transitionDelay: isDrawerOpen ? `${index * 50}ms` : '0ms' }}
                        onClick={() => handleNavigate(item.path)}
                        selected={pathname === item.path}
                        sx={getActiveStyles(theme)}
                        icon={item.icon}
                        text={item.label}
                        textProps={textTypographyProps}
                      />
                    ))}
                    {token && (
                    <DrawerItem
                      in={isDrawerOpen}
                      timeout={500}
                      style={{ transitionDelay: isDrawerOpen ? `${navItems.length * 50}ms` : '0ms' }}
                      onClick={() => handleNavigate('/profile')}
                      selected={pathname === '/profile'}
                      sx={getActiveStyles(theme)}
                      icon={<AccountCircleIcon />}
                      text="Profile"
                      textProps={textTypographyProps}
                    />
                  )}
                  {token && (
                    <DrawerItem
                      in={isDrawerOpen}
                      timeout={500}
                      style={{ transitionDelay: isDrawerOpen ? `${navItems.length * 50}ms` : '0ms' }}
                      onClick={() => handleNavigate('/settings')}
                      selected={pathname === '/settings'}
                      sx={getActiveStyles(theme)}
                      icon={<SettingsIcon />}
                      text="Settings"
                      textProps={textTypographyProps}
                    />
                  )}
                  <DrawerItem
                    in={isDrawerOpen}
                    timeout={500}
                    style={{ transitionDelay: isDrawerOpen ? `${(navItems.length + (token ? 1 : 0)) * 50}ms` : '0ms' }}
                    onClick={token ? handleLogout : () => handleNavigate("/login")}
                    icon={token ? <LogoutIcon /> : <LoginIcon />}
                    text={token ? "Logout" : "Login"}
                    textProps={textTypographyProps}
                  />
                </List>
                </Box>
              </Box>
            </Drawer>
          </>
        ) : (
          <Box>
            {token && user ? (
              <>
                {navItems.map((item) => (
                  <Button
                    key={item.label}
                    color="inherit"
                    component={Link}
                    to={item.path}
                    sx={{
                      backgroundColor:
                        pathname === item.path
                          ? alpha(theme.palette.common.white, 0.15)
                          : "transparent",
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: 2 }}>
                  <Avatar src={user.avatarUrl} alt={user.name}>
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </Avatar>
                </IconButton>
                <Menu
                  sx={{ mt: '45px' }}
                  anchorEl={anchorElUser}
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  keepMounted
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem onClick={() => handleNavigate('/profile')}>
                    <Typography textAlign="center">Profile</Typography>
                  </MenuItem>
                  <MenuItem onClick={() => handleNavigate('/settings')}>
                    <Typography textAlign="center">Settings</Typography>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <Typography textAlign="center">Logout</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button color="inherit" onClick={() => navigate("/login")}>Login</Button>
            )}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}