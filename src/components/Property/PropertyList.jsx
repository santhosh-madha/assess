import React, { useEffect, useState } from 'react';
import './PropertyList.css';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const PropertyList = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const todayRaw = new Date();
    const today = todayRaw.toISOString().split('T')[0];
    const maxDateRaw = new Date();
    maxDateRaw.setMonth(maxDateRaw.getMonth() + 2);
    const maxDate = maxDateRaw.toISOString().split('T')[0];

    // Parse URL params for initial state
    const getInitialParams = () => {
        const params = new URLSearchParams(location.search);
        return {
            location: params.get('location') || '',
            propertyType: params.get('propertyType') || 'all',
            minPrice: params.get('minPrice') || '',
            maxPrice: params.get('maxPrice') || '',
            guests: params.get('guests') || '',
            checkIn: params.get('checkIn') || '',
            checkOut: params.get('checkOut') || '',
            sortPrice: params.get('sortPrice') || 'none'
        };
    };

    const initialParams = getInitialParams();
    const [searchLocation, setSearchLocation] = useState(initialParams.location);
    const [propertyType, setPropertyType] = useState(initialParams.propertyType);
    const [minPrice, setMinPrice] = useState(initialParams.minPrice);
    const [maxPrice, setMaxPrice] = useState(initialParams.maxPrice);
    const [guests, setGuests] = useState(initialParams.guests);
    const [checkIn, setCheckIn] = useState(initialParams.checkIn);
    const [checkOut, setCheckOut] = useState(initialParams.checkOut);
    const [sortPrice, setSortPrice] = useState(initialParams.sortPrice);

    // Sync state with URL params when URL changes (e.g. from HeroSection search)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setSearchLocation(params.get('location') || '');
        setPropertyType(params.get('propertyType') || 'all');
        setMinPrice(params.get('minPrice') || '');
        setMaxPrice(params.get('maxPrice') || '');
        setGuests(params.get('guests') || '');
        setCheckIn(params.get('checkIn') || '');
        setCheckOut(params.get('checkOut') || '');
        setSortPrice(params.get('sortPrice') || 'none');
    }, [location.search]);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                // Pass the current URL query parameters to the backend
                const searchParams = new URLSearchParams(location.search);
                const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';

                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/properties${queryString}`);
                
                // Set the properties correctly parsed based on the backend query filters
                setProperties(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching properties", error);
                setLoading(false);
            }
        };

        fetchProperties();
    }, [location.search]);

    const handleApplyFilters = () => {
        const params = new URLSearchParams();
        if (searchLocation) params.append('location', searchLocation);
        if (propertyType && propertyType !== 'all') params.append('propertyType', propertyType);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (guests) params.append('guests', guests);
        if (checkIn) params.append('checkIn', checkIn);
        if (checkOut) params.append('checkOut', checkOut);
        if (sortPrice && sortPrice !== 'none') params.append('sortPrice', sortPrice);
        
        navigate({ search: params.toString() });
        setShowMobileFilters(false); // Close sidebar on mobile after applying
    };

    const handleResetFilters = () => {
        setSearchLocation('');
        setPropertyType('all');
        setMinPrice('');
        setMaxPrice('');
        setGuests('');
        setCheckIn('');
        setCheckOut('');
        setSortPrice('none');
        navigate({ search: '' });
    };

    const getImageUrl = (url) => {
        if (!url) return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6";
        if (url.startsWith('http')) return url;
        return `${import.meta.env.VITE_API_URL}${url}`;
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="property-list-container container">
            <h2 className="section-title">Explore <span>Properties</span></h2>
            
            <div className="mobile-filter-trigger">
                <button className="btn-outline" onClick={() => setShowMobileFilters(!showMobileFilters)}>
                    {showMobileFilters ? '✕ Close Filters' : '🔍 Filter Results'}
                </button>
            </div>

            <div className="explore-layout">
                {/* Left Filter Sidebar */}
                <aside className={`filter-sidebar glass-panel ${showMobileFilters ? 'active' : ''}`}>
                    <div className="sidebar-header">
                        <h3>Search Filters</h3>
                        <button className="close-sidebar" onClick={() => setShowMobileFilters(false)}>✕</button>
                    </div>
                    
                    <div className="filter-group">
                        <label>Location</label>
                        <input 
                            type="text" 
                            placeholder="e.g. New York, Brooklyn..." 
                            value={searchLocation} 
                            onChange={(e) => setSearchLocation(e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <label>Check In</label>
                        <input type="date" value={checkIn} min={today} max={maxDate} onChange={(e) => setCheckIn(e.target.value)} />
                    </div>

                    <div className="filter-group">
                        <label>Check Out</label>
                        <input type="date" value={checkOut} min={checkIn || today} max={maxDate} onChange={(e) => setCheckOut(e.target.value)} />
                    </div>

                    <div className="filter-group">
                        <label>Guests</label>
                        <input type="number" min="1" placeholder="Add guests" value={guests} onChange={(e) => setGuests(e.target.value)} />
                    </div>

                    <div className="filter-group">
                        <label>Category</label>
                        <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                            <option value="all">All Properties</option>
                            <option value="villa">Villa</option>
                            <option value="apartment">Apartment</option>
                            <option value="house">House</option>
                            <option value="cabin">Cabin</option>
                        </select>
                    </div>

                    <div className="filter-group price-group">
                        <label>Price Limit ($/night)</label>
                        <div className="price-inputs">
                            <input 
                                type="number" 
                                placeholder="Min" 
                                value={minPrice} 
                                onChange={(e) => setMinPrice(e.target.value)}
                            />
                            <span>-</span>
                            <input 
                                type="number" 
                                placeholder="Max" 
                                value={maxPrice} 
                                onChange={(e) => setMaxPrice(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>Sort By</label>
                        <select value={sortPrice} onChange={(e) => setSortPrice(e.target.value)}>
                            <option value="none">Recommended</option>
                            <option value="asc">Price: Low to High</option>
                            <option value="desc">Price: High to Low</option>
                        </select>
                    </div>

                    <div className="filter-actions">
                        <button className="btn-primary" onClick={handleApplyFilters}>Apply Filters</button>
                        <button className="btn-outline" onClick={handleResetFilters}>Reset</button>
                    </div>
                </aside>

                {/* Right Side Property Grid */}
                <div className="property-results">
                    {/* Grid Toggles & Stats */}
                    <div className="results-header">
                        <span>{properties.length} Properties Found</span>
                        <div className="view-toggles">
                            <span style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>View: </span>
                            <button className={gridSize === 'large' ? 'active' : ''} onClick={() => setGridSize('large')}>Large</button>
                            <button className={gridSize === 'medium' ? 'active' : ''} onClick={() => setGridSize('medium')}>Medium</button>
                            <button className={gridSize === 'small' ? 'active' : ''} onClick={() => setGridSize('small')}>Small</button>
                        </div>
                    </div>

                    {properties.length === 0 && !loading ? (
                        <div className="no-results">
                            <h3>No properties found.</h3>
                            <p>Try adjusting your search filters to find what you're looking for!</p>
                        </div>
                    ) : (
                        <div className={`property-grid grid-${gridSize}`}>
                            {properties.map(property => (
                                <Link to={`/property/${property._id}`} key={property._id} style={{textDecoration: 'none'}}>
                                    <div className="property-card glass-panel">
                                        <div className="property-image">
                                            <img src={getImageUrl(property.imageUrl)} alt={property.title} />
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default PropertyList;
