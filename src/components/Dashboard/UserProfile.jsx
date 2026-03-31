import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './OwnerDashboard.css'; // Reusing dashboard styles for glass pane aesthetic

const UserProfile = () => {
    const { token, updateAuthUser, user } = useContext(AuthContext);
    
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFirstName(res.data.firstName || '');
                setLastName(res.data.lastName || '');
                setPhone(res.data.phone || '');
            } catch (err) {
                console.error('Error fetching profile', err);
            }
        };
        if (token) {
            fetchProfile();
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/user/profile`, 
            { firstName, lastName, phone },
            { headers: { Authorization: `Bearer ${token}` }});
            
            // Update the context so the Navbar instantly changes!
            updateAuthUser({ firstName, lastName, phone });
            
            setMessage('Profile updated successfully!');
        } catch (err) {
            setMessage('Failed to update profile.');
            console.error(err);
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    if (!user) return <div className="dashboard-container"><p>Please log in.</p></div>;

    return (
        <div className="dashboard-container section-padding">
            <h1 className="section-title">My Profile</h1>
            <p className="dashboard-subtitle">Manage your personal details</p>
            
            <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '30px', textAlign: 'left' }}>
                {message && <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '6px', background: message.includes('success') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.includes('success') ? '#10b981' : '#ef4444' }}>{message}</div>}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>First Name</label>
                        <input 
                            type="text" 
                            value={firstName} 
                            onChange={e => setFirstName(e.target.value)} 
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
                            placeholder="Optional"
                        />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>Last Name</label>
                        <input 
                            type="text" 
                            value={lastName} 
                            onChange={e => setLastName(e.target.value)} 
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
                            placeholder="Optional"
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>Phone Number</label>
                        <input 
                            type="text" 
                            value={phone} 
                            onChange={e => setPhone(e.target.value)} 
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
                            placeholder="Optional"
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>Account Email</label>
                        <input 
                            type="text" 
                            value={user.email} 
                            disabled 
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
                        {loading ? 'Saving...' : 'Save Details'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UserProfile;
