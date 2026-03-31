import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../Property/PropertyList.css'; // Reuse existing property card styles
import './TrendingProperties.css';

const TrendingProperties = () => {
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/properties/trending`);
                setTrending(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching trending properties", error);
                setLoading(false);
            }
        };

        fetchTrending();
    }, []);

    if (loading) return null;

    return (
        <div className="trending-container container">
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                Trending <span>Properties</span>
            </h2>
            
            <div className="property-grid">
                {trending.map(property => (
                    <Link to={`/property/${property._id}`} key={property._id} style={{textDecoration: 'none'}}>
                        <div className="property-card glass-panel">
                            <div className="property-image">
                                <img src={property.imageUrl} alt={property.title} />
                            </div>
                            <div className="property-info">
                                <div className="property-header">
                                    <h3>{property.title}</h3>
                                    <span className="property-price">${property.pricePerNight} <span>/ night</span></span>
                                </div>
                                <p className="property-location">{property.location}</p>
                                <div className="property-details">
                                    <span>{property.maxGuests} Guests</span> • 
                                    <span>{property.bedrooms} Beds</span> • 
                                    <span>{property.bathrooms} Baths</span> • 
                                    <span style={{textTransform: 'capitalize'}}> {property.propertyType}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default TrendingProperties;
