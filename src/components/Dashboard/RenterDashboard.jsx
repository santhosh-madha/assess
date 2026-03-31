import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './OwnerDashboard.css'; // Reusing the identical UI grid elements

const RenterDashboard = () => {
    const { user, token } = useContext(AuthContext);
    const navigate = useNavigate();
    const [myTrips, setMyTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrips = async () => {
            if (!user || user.role !== 'renter') return;
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/bookings/my-bookings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMyTrips(res.data);
            } catch (error) {
                console.error("Failed to fetch renter trips:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrips();
    }, [user, token]);

    if (!user || user.role !== 'renter') return null;
    
    const getImageUrl = (url) => {
        if (!url) return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6";
        if (url.startsWith('http')) return url;
        return `${import.meta.env.VITE_API_URL}${url}`;
    };

    return (
        <div className="container dashboard-container">
            <h1 className="section-title">My <span>Trips</span></h1>
            
            <div className="dashboard-grid" style={{gridTemplateColumns: '1fr'}}>
                <div className="dashboard-card glass-panel main-panel">
                    <h2>Upcoming & Past Reservations</h2>

                    {loading ? (
                        <p>Loading your trips...</p>
                    ) : myTrips.length === 0 ? (
                        <div className="empty-state">
                            <p>You haven't booked any trips yet.</p>
                            <button className="btn-primary" onClick={() => navigate('/')}>Start Exploring</button>
                        </div>
                    ) : (
                        <div className="owner-properties-grid">
                            {myTrips.map(booking => {
                                const prop = booking.propertyId;
                                if(!prop) return null; // Defensive check
                                return (
                                    <div key={booking._id} className="owner-property-row glass-panel" style={{alignItems: 'flex-start'}}>
                                        <div className="op-image"><img src={getImageUrl(prop.imageUrl)} alt="cover" /></div>
                                        <div className="op-details">
                                            <h4>{prop.title}</h4>
                                            <p className="op-loc">📍 {prop.location}</p>
                                            
                                            <div style={{marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-main)'}}>
                                                <p><strong>Check-In:</strong> {new Date(booking.checkInDate).toLocaleDateString()}</p>
                                                <p><strong>Check-Out:</strong> {new Date(booking.checkOutDate).toLocaleDateString()}</p>
                                                <p><strong>Guests:</strong> {booking.guests}</p>
                                            </div>
                                        </div>
                                        <div className="op-actions" style={{textAlign: 'right'}}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)', display: 'block', marginBottom: '8px' }}>
                                                ${booking.totalAmount}
                                            </span>
                                            <span style={{ 
                                                display: 'inline-block',
                                                padding: '4px 8px', 
                                                borderRadius: '4px',
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                backgroundColor: booking.paymentStatus === 'paid' ? '#dcfce7' : '#fee2e2',
                                                color: booking.paymentStatus === 'paid' ? '#166534' : '#991b1b'
                                            }}>
                                                {booking.paymentStatus === 'paid' ? 'Confirmed' : 'Pending Payment'}
                                            </span>

                                            {booking.paymentStatus === 'paid' && prop.ownerId && (
                                                <button 
                                                    className="btn-outline" 
                                                    style={{ marginTop: '12px', width: '100%', fontSize: '0.8rem', padding: '8px' }}
                                                    onClick={() => navigate(`/messages?user=${prop.ownerId._id}`)}
                                                >
                                                    💬 Message Host
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RenterDashboard;
