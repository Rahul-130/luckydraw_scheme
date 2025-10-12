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
import { alpha } from '@mui/material/styles';
import MenuIcon from "@mui/icons-material/Menu";
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useThemeContext } from "../context/ThemeContext";

export default function NavBar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { pathname } = useLocation();

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
    { label: "Dashboard", path: "/dashboard", auth: true },
    { label: "Books", path: "/books", auth: true },
    { label: "Eligible Customers", path: "/eligible-customers", auth: true },
    { label: "Winners", path: "/winners", auth: true },
    { label: "Lucky Draw", path: "/lucky-draw", auth: true },
    { label: "Settings", path: "/settings", auth: true },
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
              {navItems
                .filter((item) => (token ? item.auth : !item.auth))
                .map((item) => (
                  <MenuItem
                    key={item.label}
                    onClick={() => handleNavigate(item.path)}
                    selected={pathname === item.path}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              <MenuItem onClick={token ? handleLogout : () => handleNavigate("/login")}>
                {token ? "Logout" : "Login"}
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box>
            {navItems
              .filter((item) => (token ? item.auth : !item.auth))
              .map((item) => (
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
            <Button color="inherit" onClick={token ? handleLogout : () => navigate("/login")}>
              {token ? "Logout" : "Login"}
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}