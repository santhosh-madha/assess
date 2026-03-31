import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isAuthMoving, setIsAuthMoving] = useState(null); // 'login' or 'logout' or null

    // Load initial credentials from localStorage if they exist
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (userData, jwtToken) => {
        setIsAuthMoving('login');
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsAuthModalOpen(false); // Close modal on successful login
        
        // Brief transition for UX
        setTimeout(() => setIsAuthMoving(null), 800);
    };

    const updateAuthUser = (updatedFields) => {
        setUser(prevUser => {
            const newUser = { ...prevUser, ...updatedFields };
            localStorage.setItem('user', JSON.stringify(newUser));
            return newUser;
        });
    };

    const logout = () => {
        setIsAuthMoving('logout');
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Brief transition for UX
        setTimeout(() => setIsAuthMoving(null), 800);
    };

    const toggleAuthModal = (isOpen) => {
        setIsAuthModalOpen(isOpen);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthModalOpen,
            login,
            logout,
            toggleAuthModal,
            updateAuthUser,
            isAuthMoving,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
