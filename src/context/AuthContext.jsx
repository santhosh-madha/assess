import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsAuthModalOpen(false); // Close modal on successful login
    };

    const updateAuthUser = (updatedFields) => {
        setUser(prevUser => {
            const newUser = { ...prevUser, ...updatedFields };
            localStorage.setItem('user', JSON.stringify(newUser));
            return newUser;
        });
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
        }}>
            {children}
        </AuthContext.Provider>
    );
};
