import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './AdminLogin.css';

const AdminLogin = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({ email: '', password: '', passcode: '' });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/admin-login`, credentials);
            
            const userData = {
                id: res.data.userId,
                role: res.data.role,
                email: res.data.email,
                firstName: res.data.firstName,
                lastName: res.data.lastName
            };
            
            login(userData, res.data.token);
            navigate('/admin-dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to authenticate admin.');
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-card glass-panel">
                <h2>Master Admin Access</h2>
                <p>Restricted Zone. Please authenticate.</p>
                {error && <div className="admin-error">{error}</div>}
                <form onSubmit={handleAdminLogin}>
                    <div className="form-group">
                        <label>Admin Email</label>
                        <input type="email" name="email" value={credentials.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" name="password" value={credentials.password} onChange={handleChange} required />
                    </div>
                    <div className="form-group passcode-group">
                        <label>Master Passcode</label>
                        <input type="password" name="passcode" value={credentials.passcode} onChange={handleChange} required placeholder="Enter Secret Passcode" />
                    </div>
                    <button type="submit" className="btn-primary admin-btn">Login to Command Center</button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
