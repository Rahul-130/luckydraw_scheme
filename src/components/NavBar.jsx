import {
  AppBar,
  Toolbar,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate("/login");
  };

  const navItems = [
    { label: "Books", path: "/books" },
    { label: "Eligible Customers", path: "/eligible-customers" },
    { label: "Winners", path: "/winners" },
    { label: "Lucky Draw", path: "/lucky-draw" },
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Lucky Draw
        </Typography>
        {isMobile ? (
          <>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMenuOpen}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
            >
              {navItems.map((item) => (
                <MenuItem key={item.label} onClick={() => handleNavigate(item.path)}>
                  {item.label}
                </MenuItem>
              ))}
              {token && (
                <MenuItem onClick={() => handleNavigate("/change-password")}>
                  Change Password
                </MenuItem>,
                <MenuItem onClick={() => handleNavigate("/security")}>
                  Security
                </MenuItem>
              )}
              <MenuItem onClick={token ? handleLogout : () => handleNavigate("/login")}>
                {token ? "Logout" : "Login"}
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box>
            {navItems.map((item) => (
              <Button key={item.label} color="inherit" component={Link} to={item.path}>
                {item.label}
              </Button>
            ))}
            {token && <Button color="inherit" component={Link} to="/change-password">Change Password</Button>}
            {token && <Button color="inherit" component={Link} to="/security">Security</Button>}
            <Button color="inherit" onClick={token ? handleLogout : () => navigate("/login")}>
              {token ? "Logout" : "Login"}
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}