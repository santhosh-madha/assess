import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import axios from 'axios';
import './Checkout.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

const CheckoutPage = () => {
    const { id: propertyId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { checkInDate: stateCheckIn, checkOutDate: stateCheckOut } = location.state || {};

    const [step, setStep] = useState(1);
    const [property, setProperty] = useState(null);
    const [clientSecret, setClientSecret] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingDetails, setBookingDetails] = useState({ nights: 1, checkIn: null, checkOut: null });
    
    // Renter Pre-Payment Form
    const [renterData, setRenterData] = useState({
        renterName: '',
        renterPhone: '',
        guests: 1,
        specialRequests: ''
    });

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Parse Dates
                const checkInDate = stateCheckIn ? new Date(stateCheckIn) : new Date();
                const checkOutDate = stateCheckOut ? new Date(stateCheckOut) : new Date(Date.now() + 86400000);
                
                const diffTime = Math.abs(checkOutDate - checkInDate);
                const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                setBookingDetails({ nights, checkIn: checkInDate, checkOut: checkOutDate });

                // Fetch Property
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/properties/${propertyId}`);
                setProperty(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load Property details:", err);
                setError("Failed to load property details. Please go back and try again.");
                setLoading(false);
            }
        };
        fetchDetails();
    }, [propertyId, stateCheckIn, stateCheckOut]);

    const handleProceedToPayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Please log in to make a booking.");
            
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/bookings/create`, {
                propertyId,
                checkInDate: bookingDetails.checkIn.toISOString(),
                checkOutDate: bookingDetails.checkOut.toISOString(),
                ...renterData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setClientSecret(response.data.clientSecret);
            setStep(2); // Move to Stripe Phase
            setLoading(false);
        } catch (err) {
            console.error("Checkout initialization failed:", err);
            setError(err.response?.data?.error || err.message || "Failed to initialize secure checkout.");
            setLoading(false);
        }
    };

    const handleFormChange = (e) => setRenterData({ ...renterData, [e.target.name]: e.target.value });

    if (loading && step === 1) return <div className="checkout-container"><p>Loading Reservation Details...</p></div>;
    if (error) return <div className="checkout-container"><p className="error-text">❌ {error}</p></div>;
    if (!property) return null;

    const totalCost = property.pricePerNight * bookingDetails.nights;

    return (
        <div className="checkout-container" style={{display: 'flex', gap: '30px', alignItems: 'flex-start'}}>
            
            {/* Left Column: Form or Stripe Engine */}
            <div className="checkout-card glass-panel" style={{flex: 2}}>
                {step === 1 ? (
                    <>
                        <h2>Step 1: Contact Details</h2>
                        <p>Please enter your information so the host can contact you.</p>
                        <form onSubmit={handleProceedToPayment} className="listing-form" style={{marginTop: '20px'}}>
                            <div className="form-group row">
                                <div className="half">
                                    <label>Full Name</label>
                                    <input type="text" name="renterName" value={renterData.renterName} onChange={handleFormChange} required placeholder="John Doe" />
                                </div>
                                <div className="half">
                                    <label>Phone Number</label>
                                    <input type="tel" name="renterPhone" value={renterData.renterPhone} onChange={handleFormChange} required placeholder="(555) 123-4567" />
                                </div>
                            </div>
                            <div className="form-group row">
                                <div className="half">
                                    <label>Number of Guests</label>
                                    <input type="number" name="guests" value={renterData.guests} onChange={handleFormChange} required min="1" max={property.maxGuests} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Special Requests (Optional)</label>
                                <textarea name="specialRequests" value={renterData.specialRequests} onChange={handleFormChange} rows="3" placeholder="Any allergies, early check-in needs, etc."></textarea>
                            </div>
                            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
                                {loading ? 'Initializing Secure Payment...' : 'Proceed to Payment'}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <h2>Step 2: Secure Payment</h2>
                        <p>Complete your booking safely through our encrypted Stripe portal.</p>
                        {clientSecret && (
                            <Elements options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#6366f1' } } }} stripe={stripePromise}>
                                <CheckoutForm />
                            </Elements>
                        )}
                        <button className="btn-secondary" style={{marginTop: '20px', width: '100%'}} onClick={() => setStep(1)} disabled={loading}>
                            🔙 Back to Contact Details
                        </button>
                    </>
                )}
            </div>

            {/* Right Column: Reservation Breakdown */}
            <div className="dashboard-sidebar glass-panel" style={{flex: 1, padding: '20px'}}>
                <img src={property.imageUrl} alt={property.title} style={{width: '100%', borderRadius: '10px', marginBottom: '15px'}} />
                <h3 style={{marginBottom: '5px', color: 'var(--text-main)'}}>{property.title}</h3>
                <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px'}}>📍 {property.location}</p>
                
                <hr style={{borderColor: 'var(--glass-border)', margin: '15px 0'}} />
                
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                    <span>Check-In</span>
                    <strong>{bookingDetails.checkIn?.toLocaleDateString()}</strong>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                    <span>Check-Out</span>
                    <strong>{bookingDetails.checkOut?.toLocaleDateString()}</strong>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                    <span>Duration</span>
                    <strong>{bookingDetails.nights} Nights</strong>
                </div>

                <hr style={{borderColor: 'var(--glass-border)', margin: '15px 0'}} />

                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'var(--text-muted)'}}>
                    <span>${property.pricePerNight} × {bookingDetails.nights} nights</span>
                    <span>${totalCost}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-primary)', marginTop: '15px'}}>
                    <span>Total (USD)</span>
                    <span>${totalCost}</span>
                </div>
            </div>

        </div>
    );
};

export default CheckoutPage;
