import React, { createContext, useContext, useState } from 'react'


const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(sessionStorage.getItem('token') || null);

    const login = (userData, jwtToken) => {
        setUser(userData);
        setToken(jwtToken);
        sessionStorage.setItem('token', jwtToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        sessionStorage.removeItem('token');
    };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
