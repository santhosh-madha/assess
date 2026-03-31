import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PropertyDetails.css';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addMonths, eachDayOfInterval } from 'date-fns';

const PropertyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Date Picker State
    const [checkInDate, setCheckInDate] = useState(new Date());
    const [checkOutDate, setCheckOutDate] = useState(new Date(new Date().getTime() + 86400000));
    const [bookedDates, setBookedDates] = useState([]);

    useEffect(() => {
        const fetchPropertyData = async () => {
            try {
                const [propRes, bookingsRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/properties/${id}`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/bookings/property/${id}`)
                ]);
                setProperty(propRes.data);

                // Compile all booked date spans into an array of excluded days
                let excluded = [];
                bookingsRes.data.forEach(booking => {
                    const days = eachDayOfInterval({
                        start: new Date(booking.checkInDate),
                        end: new Date(booking.checkOutDate)
                    });
                    excluded = [...excluded, ...days];
                });
                setBookedDates(excluded);

                setLoading(false);
            } catch (error) {
                console.error("Failed to load property details or bookings:", error);
                setLoading(false);
            }
        };
        fetchPropertyData();
    }, [id]);

    const getImageUrl = (url) => {
        if (!url) return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6";
        if (url.startsWith('http')) return url;
        return `${import.meta.env.VITE_API_URL}${url}`;
    };

    if (loading) return <div className="container" style={{padding: '100px'}}>Loading property details...</div>;
    if (!property) return <div className="container" style={{padding: '100px'}}>Property not found.</div>;

    // Combine cover photo and optional gallery photos into a single navigable array
    const allImages = [property.imageUrl, ...(property.galleryImages || [])];

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    // Calculate total days and price
    const calculateTotal = () => {
        if (!checkInDate || !checkOutDate) return null;
        let days = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        if (days <= 0) days = 1; // Minimum 1 day
        const total = days * property.pricePerNight;
        return { days, total };
    };

    const handleReserve = () => {
        // Validate overlapping dates
        if (checkInDate && checkOutDate) {
            const start = new Date(checkInDate);
            start.setHours(0,0,0,0);
            const end = new Date(checkOutDate);
            end.setHours(0,0,0,0);

            const isOverlapping = bookedDates.some(bDate => {
                const b = new Date(bDate);
                b.setHours(0,0,0,0);
                return b >= start && b < end; // checking out on the day someone checks in is allowed.
            });

            if (isOverlapping) {
                alert("It is already booked for these dates. Please adjust your check-in or check-out.");
                return;
            }
        }

        navigate(`/checkout/${property._id}`, { 
            state: { checkInDate: checkInDate.toISOString(), checkOutDate: checkOutDate.toISOString() } 
        });
    };

    const pricing = property ? calculateTotal() : null;

    return (
        <div className="property-details-page container">
            <div className="property-details-header">
                <h1>{property.title}</h1>
                <p className="location-subtitle">📍 {property.location} <span className="host-name"> • Hosted by {property?.ownerId?.username || 'Verified Owner'}</span></p>
            </div>

            <div className="property-gallery">
                <img src={getImageUrl(allImages[currentImageIndex])} alt={property.title} className="main-image" />
                
                {allImages.length > 1 && (
                    <>
                        <button className="carousel-btn left-btn" onClick={prevImage}>❮</button>
                        <button className="carousel-btn right-btn" onClick={nextImage}>❯</button>
                        <div className="image-counter">
                            {currentImageIndex + 1} / {allImages.length}
                        </div>
                        <div className="carousel-indicators">
                            {allImages.map((_, idx) => (
                                <span key={idx} className={`indicator ${idx === currentImageIndex ? 'active' : ''}`} />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="property-content-grid">
                <div className="property-description">
                    <h2>About this space</h2>
                    <p>{property.description}</p>
                    
                    <div className="amenities-section">
                        <h3>What this place offers</h3>
                        <div className="amenities-grid">
                            <span>🏠 {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}</span>
                            <span>👥 Up to {property.maxGuests} guests</span>
                            <span>🛏️ {property.bedrooms} Bedrooms</span>
                            <span>🛁 {property.bathrooms} Bathrooms</span>
                        </div>
                    </div>
                </div>

                <div className="property-booking-card glass-panel">
                    <div className="booking-price">
                        <span className="price-amount">${property.pricePerNight}</span>
                        <span className="price-label">/ night</span>
                    </div>

                    <div className="date-picker-mock">
                        <div className="date-field">
                            <label>Check In</label>
                            <DatePicker
                                selected={checkInDate}
                                onChange={(date) => setCheckInDate(date)}
                                selectsStart
                                startDate={checkInDate}
                                endDate={checkOutDate}
                                minDate={new Date()}
                                maxDate={addMonths(new Date(), 2)}
                                excludeDates={bookedDates}
                                className="native-date"
                            />
                        </div>
                        <div className="date-field">
                            <label>Check Out</label>
                            <DatePicker
                                selected={checkOutDate}
                                onChange={(date) => setCheckOutDate(date)}
                                selectsEnd
                                startDate={checkInDate}
                                endDate={checkOutDate}
                                minDate={checkInDate || new Date()}
                                maxDate={addMonths(new Date(), 2)}
                                excludeDates={bookedDates}
                                className="native-date"
                            />
                        </div>
                    </div>
                    <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '15px'}}>Check-in: 3:00 PM | Check-out: 11:00 AM (counts as 1 day)</p>

                    {pricing && (
                        <div className="dynamic-price-calculator" style={{
                            padding: '15px', 
                            background: 'var(--bg-dark)', 
                            borderRadius: '8px', 
                            marginBottom: '20px',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'var(--text-muted)'}}>
                                <span>${property.pricePerNight} x {pricing.days} night{pricing.days > 1 ? 's' : ''}</span>
                                <span>${pricing.total}</span>
                            </div>
                            <div style={{display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid var(--glass-border)', paddingTop: '10px', color: 'var(--text-main)', width: '100%'}}>
                                <span>Total before taxes</span>
                                <span>${pricing.total}</span>
                            </div>
                        </div>
                    )}

                    <button className="btn-primary reserve-btn" onClick={handleReserve} style={{width: '100%'}}>
                        Reserve Now
                    </button>
                    <p className="no-charge-text" style={{textAlign: 'center', marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)'}}>You won't be charged yet</p>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetails;
