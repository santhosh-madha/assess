import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  const [location, setLocation] = useState('');
  const [guests, setGuests] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const navigate = useNavigate();
  const reactLocation = useLocation();

  const todayRaw = new Date();
  const today = todayRaw.toISOString().split('T')[0];
  const maxDateRaw = new Date();
  maxDateRaw.setMonth(maxDateRaw.getMonth() + 2);
  const maxDate = maxDateRaw.toISOString().split('T')[0];

  useEffect(() => {
    const params = new URLSearchParams(reactLocation.search);
    setLocation(params.get('location') || '');
    setGuests(params.get('guests') || '');
    setCheckIn(params.get('checkIn') || '');
    setCheckOut(params.get('checkOut') || '');
  }, [reactLocation.search]);

  const handleSearch = () => {
    const queryParams = new URLSearchParams();
    if (location) queryParams.append('location', location);
    if (guests) queryParams.append('guests', guests);
    if (checkIn) queryParams.append('checkIn', checkIn);
    if (checkOut) queryParams.append('checkOut', checkOut);
    navigate(`/explore?${queryParams.toString()}`);
  };

  return (
    <div className="hero-container">
      <div className="hero-content">
        <h1 className="hero-title">
          Experience the World <br />
          <span className="text-gradient">With EchoLoom</span>
        </h1>
        <p className="hero-subtitle">
          Discover premium, handpicked homes and curated stays across the globe. Seamless booking, unforgettable memories.
        </p>

        <div className="hero-search glass-panel">
          <div className="search-field">
            <label>Location</label>
            <input type="text" placeholder="Where are you going?" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="divider"></div>
          <div className="search-field">
            <label>Check In</label>
            <input type="date" value={checkIn} min={today} max={maxDate} onChange={(e) => setCheckIn(e.target.value)} />
          </div>
          <div className="divider"></div>
          <div className="search-field">
            <label>Check Out</label>
            <input type="date" value={checkOut} min={checkIn || today} max={maxDate} onChange={(e) => setCheckOut(e.target.value)} />
          </div>
          <div className="divider"></div>
          <div className="search-field">
            <label>Guests</label>
            <input type="number" min="1" placeholder="Add guests" value={guests} onChange={(e) => setGuests(e.target.value)} />
          </div>
          <button className="btn-primary search-btn" onClick={handleSearch}>Search</button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
