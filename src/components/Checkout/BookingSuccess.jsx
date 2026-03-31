import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Checkout.css';

const BookingSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'

    useEffect(() => {
        // Stripe aggressively appends payment_intent to the URL when redirecting back!
        const queryParams = new URLSearchParams(location.search);
        const paymentIntentId = queryParams.get('payment_intent');

        if (!paymentIntentId) {
            setStatus('error');
            return;
        }

        const confirmBooking = async () => {
            try {
                const token = localStorage.getItem('token');
                await axios.post(`${import.meta.env.VITE_API_URL}/api/bookings/confirm`, {
                    paymentIntentId
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStatus('success');
            } catch (error) {
                console.error('Failed to confirm booking to database:', error);
                setStatus('error'); // Even if backend failed, Stripe charged it. But we should flag it.
            }
        };

        confirmBooking();
    }, [location]);

    return (
        <div className="checkout-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh'}}>
            <div className="checkout-card glass-panel" style={{textAlign: 'center', padding: '60px', maxWidth: '600px'}}>
                {status === 'processing' && (
                    <>
                        <h2>Verifying Payment...</h2>
                        <p>Please wait while we confirm your transaction securely.</p>
                    </>
                )}
                
                {status === 'success' && (
                    <>
                        <div style={{fontSize: '4rem', marginBottom: '20px'}}>🎉</div>
                        <h2 style={{color: 'var(--accent-primary)', fontSize: '2.5rem', marginBottom: '20px'}}>Booking Successful!</h2>
                        <p style={{fontSize: '1.2rem', marginBottom: '30px', color: 'var(--text-main)'}}>
                            Your payment has been fully confirmed and your dates are permanently locked in! The host has been notified.
                        </p>
                        <button className="btn-primary" onClick={() => navigate('/renter-dashboard')}>
                            Go to My Trips
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{fontSize: '4rem', marginBottom: '20px'}}>⚠️</div>
                        <h2 style={{color: '#ef4444'}}>Verification Issue</h2>
                        <p style={{marginBottom: '30px'}}>
                            We couldn't verify this payment intent automatically. 
                            If you were charged, please contact support.
                        </p>
                        <button className="btn-secondary" onClick={() => navigate('/')}>
                            Return to Homepage
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default BookingSuccess;
