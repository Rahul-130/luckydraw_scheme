import { AppBar, Toolbar, Button, Box } from '@mui/material';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        // sessionStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Box sx={{ flexGrow: 1, display: 'flex' }}>
                    <Button color="inherit" component={Link} to="/books" sx={{ mr: 1 }}>Books</Button>
                    <Button color="inherit" component={Link} to="/eligible-customers" sx={{ mr: 1 }}>Eligible Customers</Button>
                    <Button color="inherit" component={Link} to="/winners" sx={{ mr: 1 }}>Winners</Button>
                    <Button color="inherit" component={Link} to="/lucky-draw" sx={{ mr: 1 }}>Lucky Draw</Button>
                </Box>

                {!token ? (
                    <Button color="inherit" component={Link} to="/login">Login</Button>
                ) : (
                    <>
                    <Button color="inherit" component={Link} to="/change-password" sx={{ mr: 1 }}>
                        Change Password
                    </Button>
                    <Button color="inherit" onClick={handleLogout}>Logout</Button>
                    </>
                )}
                 
            </Toolbar>
        </AppBar>
    );
}