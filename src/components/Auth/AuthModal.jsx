import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './AuthModal.css';

const AuthModal = () => {
    const { isAuthModalOpen, toggleAuthModal, login } = useContext(AuthContext);
    
    // Manage local UI state (login vs signup)
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('renter'); // Default role 'renter'
    const [confirmPassword, setConfirmPassword] = useState('');

    // --- Fresh Slate Logic: Clear form when modal opens or mode changes ---
    React.useEffect(() => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setUsername('');
        setError(null);
        setLoading(false);
    }, [isAuthModalOpen, isLoginMode]);

    if (!isAuthModalOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        if (!isLoginMode && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const url = isLoginMode 
                ? `${import.meta.env.VITE_API_URL}/api/auth/login` 
                : `${import.meta.env.VITE_API_URL}/api/auth/signup`;

            const payload = isLoginMode 
                ? { email, password, role } 
                : { username, email, password, role };

            const response = await axios.post(url, payload);

            if (isLoginMode) {
                // Successful login
                const { token, userId, role: userRole, firstName, lastName, phone } = response.data;
                login({ userId, email, role: userRole, firstName, lastName, phone }, token);
            } else {
                // Successful signup, switch back to login mode to re-authenticate
                setIsLoginMode(true);
                setError('Registration successful! Please log in.');
            }
        } catch (err) {
            console.error("Auth error", err);
            setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Authentication failed. Make sure your email/password is correct.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay">
            <div className="auth-modal glass-panel">
                <button className="auth-close" onClick={() => toggleAuthModal(false)}>&times;</button>
                
                <h2>{isLoginMode ? 'Welcome Back' : 'Create an Account'}</h2>
                <p>{isLoginMode ? 'Log in to manage your bookings and properties.' : 'Join the platform to rent or list amazing properties.'}</p>
                
                {error && <div className={`auth-error ${error.includes('successful') ? 'auth-success' : ''}`}>{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>{isLoginMode ? 'Log in as...' : 'I want to...'}</label>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                            <button 
                                type="button" 
                                style={{ flex: 1, padding: '10px', background: role === 'renter' ? 'var(--accent-primary)' : 'transparent', color: role === 'renter' ? '#fff' : 'var(--text-main)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', transition: '0.2s', fontWeight: role === 'renter' ? '600' : '400' }} 
                                onClick={() => setRole('renter')}
                            >
                                Renter
                            </button>
                            <button 
                                type="button" 
                                style={{ flex: 1, padding: '10px', background: role === 'owner' ? 'var(--accent-primary)' : 'transparent', color: role === 'owner' ? '#fff' : 'var(--text-main)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', transition: '0.2s', fontWeight: role === 'owner' ? '600' : '400' }} 
                                onClick={() => setRole('owner')}
                            >
                                Owner
                            </button>
                        </div>
                    </div>

                    {!isLoginMode && (
                        <div className="form-group">
                            <label>Username</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength="6" />
                    </div>

                    {!isLoginMode && (
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength="6" />
                        </div>
                    )}

                    <button type="submit" className="btn-primary auth-btn" disabled={loading}>
                        {loading ? 'Processing...' : (isLoginMode ? 'Log In' : 'Sign Up')}
                    </button>
                </form>

                <div className="auth-footer">
                    {isLoginMode ? (
                        <p>Don't have an account? <span onClick={() => { setIsLoginMode(false); setError(null); }}>Sign up</span></p>
                    ) : (
                        <p>Already have an account? <span onClick={() => { setIsLoginMode(true); setError(null); }}>Log in</span></p>
                    )}
                    <p style={{ marginTop: '15px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Authorized Personnel? <a href="/admin" onClick={() => toggleAuthModal(false)} style={{ color: 'var(--accent-secondary)', textDecoration: 'none', cursor: 'pointer' }}>Admin Login</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
