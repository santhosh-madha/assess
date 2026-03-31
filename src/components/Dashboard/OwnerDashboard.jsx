import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import './OwnerDashboard.css';

const OwnerDashboard = () => {
    const { user, token } = useContext(AuthContext);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('listings'); // 'listings', 'form', or 'reservations'
    const [ownerProperties, setOwnerProperties] = useState([]);
    const [incomingReservations, setIncomingReservations] = useState([]);
    const [analyticsData, setAnalyticsData] = useState({ earningsTrend: [], performanceData: [] });
    const [range, setRange] = useState(6);
    const [fetchingProperties, setFetchingProperties] = useState(false);
    
    // Form and Submission State
    const [editModeId, setEditModeId] = useState(null);
    const [propertyData, setPropertyData] = useState({
        title: '', description: '', pricePerNight: '', propertyType: 'villa',
        street: '', city: '', state: '', pincode: '', imageUrl: '', maxGuests: 2, bedrooms: 1, bathrooms: 1, galleryImages: []
    });
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [galleryFiles, setGalleryFiles] = useState([]);

    useEffect(() => {
        if (user && user.role === 'owner') {
            if (activeTab === 'listings') fetchMyProperties();
            if (activeTab === 'reservations') fetchIncomingReservations();
            if (activeTab === 'analytics') fetchOwnerAnalytics();
        }
    }, [user, activeTab, range]);

    const fetchMyProperties = async () => {
        setFetchingProperties(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/properties?ownerId=${user.userId}`);
            setOwnerProperties(res.data);
        } catch (error) {
            console.error("Failed to fetch owner properties:", error);
        } finally {
            setFetchingProperties(false);
        }
    };

    const fetchIncomingReservations = async () => {
        setFetchingProperties(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/bookings/owner-reservations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIncomingReservations(res.data);
        } catch (error) {
            console.error("Failed to fetch owner reservations:", error);
        } finally {
            setFetchingProperties(false);
        }
    };

    const fetchOwnerAnalytics = async () => {
        setFetchingProperties(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/bookings/owner-analytics?range=${range}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnalyticsData(res.data);
        } catch (error) {
            console.error("Failed to fetch owner analytics:", error);
        } finally {
            setFetchingProperties(false);
        }
    };

    if (!user || user.role !== 'owner') {
        return (
            <div className="container dashboard-alert">
                <h2>Unauthorized</h2>
                <p>You must be logged in as an Owner to view this dashboard.</p>
            </div>
        );
    }

    // --- Tab & Edit Mode Handling ---
    const resetForm = () => {
        setEditModeId(null);
        setPropertyData({
            title: '', description: '', pricePerNight: '', propertyType: 'villa',
            street: '', city: '', state: '', pincode: '', imageUrl: '', maxGuests: 2, bedrooms: 1, bathrooms: 1, galleryImages: []
        });
        setImageFile(null);
        setGalleryFiles([]);
        setStatus({ type: '', msg: '' });
        
        const fileInput = document.getElementById('property-image-upload');
        if(fileInput) fileInput.value = '';
        const galleryInput = document.getElementById('property-gallery-upload');
        if(galleryInput) galleryInput.value = '';
    };

    const getImageUrl = (url) => {
        if (!url) return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6";
        if (url.startsWith('http')) return url;
        return `${import.meta.env.VITE_API_URL}${url}`;
    };

    const handleCreateNewClick = () => {
        resetForm();
        setActiveTab('form');
    };

    const triggerEditMode = (property) => {
        setEditModeId(property._id);
        setPropertyData({
            title: property.title,
            description: property.description,
            pricePerNight: property.pricePerNight,
            propertyType: property.propertyType,
            street: property.street || '',
            city: property.city || '',
            state: property.state || '',
            pincode: property.pincode || '',
            imageUrl: property.imageUrl,
            maxGuests: property.maxGuests,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            galleryImages: property.galleryImages || []
        });
        setImageFile(null);
        setGalleryFiles([]);
        setStatus({ type: '', msg: '' });
        setActiveTab('form');
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this listing?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/properties/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOwnerProperties(ownerProperties.filter(p => p._id !== id));
        } catch (error) {
            console.error("Failed to delete", error);
            alert("Error deleting property");
        }
    };

    // --- Form Handling ---
    const handleChange = (e) => setPropertyData({ ...propertyData, [e.target.name]: e.target.value });
    const handleImageChange = (e) => e.target.files && e.target.files[0] && setImageFile(e.target.files[0]);
    const handleGalleryChange = (e) => {
        if (e.target.files) setGalleryFiles(Array.from(e.target.files).slice(0, 8));
    };

    const handleListProperty = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', msg: '' });

        try {
            let uploadedImageUrl = propertyData.imageUrl;
            let uploadedGalleryUrls = [...(propertyData.galleryImages || [])];

            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                const uploadRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
                });
                uploadedImageUrl = uploadRes.data.filePath; // Cloudinary returns full URL
            }

            if (galleryFiles.length > 0) {
                const galleryData = new FormData();
                galleryFiles.forEach(file => galleryData.append('gallery', file));
                const galleryRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload/multiple`, galleryData, {
                    headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
                });
                
                const newGalleryUrls = galleryRes.data.filePaths; // Cloudinary returns full URLs
                // Replace old gallery entirely if new ones are uploaded for simplicity
                uploadedGalleryUrls = newGalleryUrls; 
            }

            // We let the backend compute the string 'location' natively from these 4 fields.
            const finalData = { ...propertyData, imageUrl: uploadedImageUrl, galleryImages: uploadedGalleryUrls };

            if (editModeId) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/properties/${editModeId}`, finalData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStatus({ type: 'success', msg: 'Property updated successfully!' });
                setTimeout(() => setActiveTab('listings'), 1500);
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/properties`, finalData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStatus({ type: 'success', msg: 'Property created successfully!' });
                resetForm();
            }

        } catch (error) {
            console.error('Failed to save property:', error.response?.data || error);
            const detailedError = error.response?.data?.error || error.response?.data?.details || error.message;
            setStatus({ type: 'error', msg: `System Error: ${detailedError}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container dashboard-container">
            <h1 className="section-title">Host <span>Dashboard</span></h1>
            
            <div className="dashboard-tabs">
                <button className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>My Active Listings</button>
                <button className={`tab-btn ${activeTab === 'reservations' ? 'active' : ''}`} onClick={() => setActiveTab('reservations')}>Incoming Reservations</button>
                <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>Performance Analytics</button>
                <button className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`} onClick={handleCreateNewClick}>{editModeId ? 'Edit Listing' : 'Create New Listing'}</button>
            </div>
            
            <div className="dashboard-grid">
                <div className="dashboard-card glass-panel main-panel">
                    {activeTab === 'reservations' ? (
                        <div className="listings-view">
                            <div className="listings-header-row">
                                <h2>Incoming Renter Bookings ({incomingReservations.length})</h2>
                            </div>

                            {fetchingProperties ? (
                                <p>Loading reservations...</p>
                            ) : incomingReservations.length === 0 ? (
                                <div className="empty-state">
                                    <p>No one has booked your properties yet.</p>
                                </div>
                            ) : (
                                <div className="owner-properties-grid">
                                    {incomingReservations.map(booking => {
                                        const prop = booking.propertyId;
                                        if(!prop) return null;
                                        return (
                                            <div key={booking._id} className="owner-property-row glass-panel" style={{alignItems: 'flex-start'}}>
                                                <div className="op-image"><img src={getImageUrl(prop.imageUrl)} alt="cover" /></div>
                                                <div className="op-details">
                                                    <h4 style={{color: 'var(--accent-primary)'}}>{prop.title}</h4>
                                                    <p><strong>Renter:</strong> {booking.renterName} ({booking.renterPhone})</p>
                                                    <p><strong>Message:</strong> "{booking.specialRequests || 'None'}"</p>
                                                    
                                                    <div style={{marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', gap: '20px'}}>
                                                        <span><strong>In:</strong> {new Date(booking.checkInDate).toLocaleDateString()}</span>
                                                        <span><strong>Out:</strong> {new Date(booking.checkOutDate).toLocaleDateString()}</span>
                                                        <span><strong>Guests:</strong> {booking.guests}</span>
                                                    </div>
                                                </div>
                                                <div className="op-actions" style={{textAlign: 'right'}}>
                                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                                                        +${booking.totalAmount}
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
                                                        {booking.paymentStatus === 'paid' ? 'Paid & Confirmed' : 'Pending Payment'}
                                                    </span>

                                                    {booking.paymentStatus === 'paid' && booking.renterId && (
                                                        <button 
                                                            className="btn-outline" 
                                                            style={{ marginTop: '12px', width: '100%', fontSize: '0.8rem', padding: '8px' }}
                                                            onClick={() => navigate(`/messages?user=${booking.renterId._id}&property=${encodeURIComponent(prop.title)}`)}
                                                        >
                                                            💬 Message Renter
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'analytics' ? (
                        <div className="analytics-view">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <h2>Host Performance Insights</h2>
                                <div className="range-selector">
                                    <button className={range === 6 ? 'active' : ''} onClick={() => setRange(6)}>6 Months</button>
                                    <button className={range === 12 ? 'active' : ''} onClick={() => setRange(12)}>12 Months</button>
                                </div>
                            </div>

                            <div className="charts-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                                {/* Earnings Chart */}
                                <div className="chart-card glass-panel" style={{ padding: '20px' }}>
                                    <h4 style={{ marginBottom: '15px', color: 'var(--text-main)' }}>Earnings Trend ($)</h4>
                                    <div style={{ width: '100%', height: 250 }}>
                                        <ResponsiveContainer>
                                            <AreaChart data={analyticsData.earningsTrend}>
                                                <defs>
                                                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#00C49F" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#00C49F" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                                <XAxis dataKey="name" stroke="#718096" fontSize={12} />
                                                <YAxis stroke="#718096" fontSize={12} />
                                                <Tooltip />
                                                <Area type="monotone" dataKey="earnings" stroke="#00C49F" fillOpacity={1} fill="url(#colorEarnings)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Property Revenue Pie */}
                                <div className="chart-card glass-panel" style={{ padding: '20px' }}>
                                    <h4 style={{ marginBottom: '15px', color: 'var(--text-main)' }}>Revenue by Property</h4>
                                    <div style={{ width: '100%', height: 250 }}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie
                                                    data={analyticsData.performanceData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {[ '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8' ].map((color, index) => (
                                                        <Cell key={`cell-${index}`} fill={color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend iconType="circle" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'listings' ? (
                        <div className="listings-view">
                            <div className="listings-header-row">
                                <h2>My Properties ({ownerProperties.length})</h2>
                                <button className="btn-primary small-btn" onClick={handleCreateNewClick}>+ Add New</button>
                            </div>

                            {fetchingProperties ? (
                                <p>Loading properties...</p>
                            ) : ownerProperties.length === 0 ? (
                                <div className="empty-state">
                                    <p>You haven't listed any properties yet.</p>
                                    <button className="btn-primary" onClick={handleCreateNewClick}>Draft your first Listing</button>
                                </div>
                            ) : (
                                <div className="owner-properties-grid">
                                    {ownerProperties.map(property => (
                                        <div key={property._id} className="owner-property-row glass-panel">
                                            <div className="op-image"><img src={getImageUrl(property.imageUrl)} alt="cover" /></div>
                                            <div className="op-details">
                                                <h4>{property.title}</h4>
                                                <p className="op-loc">{property.location}</p>
                                                <p className="op-price">${property.pricePerNight} <span>/ night</span></p>
                                            </div>
                                            <div className="op-actions">
                                                <button className="btn-secondary" onClick={() => triggerEditMode(property)}>Edit</button>
                                                <button className="btn-danger" onClick={() => handleDelete(property._id)}>Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="form-view">
                            <h2>{editModeId ? 'Edit Your Listing' : 'Draft a New Listing'}</h2>
                            
                            {status.msg && (
                                <div className={`auth-error ${status.type === 'success' ? 'auth-success' : ''}`}>
                                    {status.msg}
                                </div>
                            )}

                            <form onSubmit={handleListProperty} className="listing-form">
                                <div className="form-group row">
                                    <div className="half">
                                        <label>Property Title</label>
                                        <input type="text" name="title" value={propertyData.title} onChange={handleChange} required />
                                    </div>
                                    <div className="half">
                                        <label>Street / House No.</label>
                                        <input type="text" name="street" value={propertyData.street} onChange={handleChange} required placeholder="123 Ocean Drive" />
                                    </div>
                                </div>

                                <div className="form-group row">
                                    <div className="third">
                                        <label>City</label>
                                        <input type="text" name="city" value={propertyData.city} onChange={handleChange} required placeholder="Montauk" />
                                    </div>
                                    <div className="third">
                                        <label>State</label>
                                        <input type="text" name="state" value={propertyData.state} onChange={handleChange} required placeholder="NY" />
                                    </div>
                                    <div className="third">
                                        <label>Pincode / Zip</label>
                                        <input type="text" name="pincode" value={propertyData.pincode} onChange={handleChange} required placeholder="11954" />
                                    </div>
                                </div>

                                <div className="form-group row">
                                    <div className="third">
                                        <label>Price Per Night ($)</label>
                                        <input type="number" name="pricePerNight" value={propertyData.pricePerNight} onChange={handleChange} required min="1" />
                                    </div>
                                    <div className="third">
                                        <label>Property Type</label>
                                        <select name="propertyType" value={propertyData.propertyType} onChange={handleChange}>
                                            <option value="villa">Villa</option>
                                            <option value="apartment">Apartment</option>
                                            <option value="house">House</option>
                                            <option value="cabin">Cabin</option>
                                        </select>
                                    </div>
                                    <div className="third">
                                        <label>Max Guests</label>
                                        <input type="number" name="maxGuests" value={propertyData.maxGuests} onChange={handleChange} min="1" />
                                    </div>
                                </div>

                                <div className="form-group row">
                                    <div className="half">
                                        <label>Bedrooms</label>
                                        <input type="number" name="bedrooms" value={propertyData.bedrooms} onChange={handleChange} min="1" />
                                    </div>
                                    <div className="half">
                                        <label>Bathrooms</label>
                                        <input type="number" name="bathrooms" value={propertyData.bathrooms} onChange={handleChange} min="1" />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Cover Photo</label>
                                    {editModeId && propertyData.imageUrl && <p style={{fontSize: '0.8rem', color: 'var(--accent-primary)', marginBottom: '8px'}}>Current photo is saved. Upload a new one below to overwrite.</p>}
                                    <input type="file" id="property-image-upload" accept="image/*" onChange={handleImageChange} required={!propertyData.imageUrl} />
                                </div>

                                <div className="form-group">
                                    <label>Gallery Photos (Optional, up to 8)</label>
                                    {editModeId && propertyData.galleryImages?.length > 0 && <p style={{fontSize: '0.8rem', color: 'var(--accent-primary)', marginBottom: '8px'}}>{propertyData.galleryImages.length} images saved. Uploading here will completely replace them.</p>}
                                    <input type="file" id="property-gallery-upload" accept="image/*" multiple onChange={handleGalleryChange} />
                                    {galleryFiles.length > 0 && (
                                        <div className="gallery-preview-grid">
                                            {galleryFiles.map((file, i) => (
                                                <img 
                                                    key={i} 
                                                    src={URL.createObjectURL(file)} 
                                                    alt="preview" 
                                                    className="gallery-thumbnail" 
                                                    onLoad={(e) => URL.revokeObjectURL(e.target.src)} 
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea name="description" value={propertyData.description} onChange={handleChange} required rows="4"></textarea>
                                </div>

                                <div className="form-actions" style={{display: 'flex', gap: '15px'}}>
                                    <button type="submit" className="btn-primary auth-btn" disabled={loading} style={{flex: 1}}>
                                        {loading ? 'Saving...' : (editModeId ? 'Save Changes' : 'Publish Listing')}
                                    </button>
                                    {editModeId && (
                                        <button type="button" className="btn-secondary auth-btn" style={{flex: 1}} onClick={() => setActiveTab('listings')}>
                                            Cancel Editing
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                <div className="dashboard-sidebar">
                    <div className="dashboard-card glass-panel stats-panel">
                        <h2>Analytics</h2>
                        <div className="stat-box">
                            <span className="stat-label">Active Listings</span>
                            <span className="stat-value">{ownerProperties.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;
