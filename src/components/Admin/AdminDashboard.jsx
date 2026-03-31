import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user, token, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('overview');
    const [overviewData, setOverviewData] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [propertiesList, setPropertiesList] = useState([]);
    const [bookingsList, setBookingsList] = useState([]);
    const [analyticsData, setAnalyticsData] = useState({ trendData: [], distData: [] });
    const [range, setRange] = useState(6);
    
    // User Drill-down State
    const [selectedUser, setSelectedUser] = useState(null); // The basic user from list
    const [userActivity, setUserActivity] = useState(null); // Detailed data
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isEditingUser, setIsEditingUser] = useState(false);
    const [editUserData, setEditUserData] = useState({ firstName: '', lastName: '', email: '', phone: '', username: '' });
    const [savingUser, setSavingUser] = useState(false);

    // Property Drill-down State
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [propertyActivity, setPropertyActivity] = useState(null);
    const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/admin');
            return;
        }
        fetchAllData();
    }, [user, navigate, range]); // Re-fetch on range change

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [overviewReq, usersReq, propsReq, bookingsReq, analyticsReq] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/admin/overview`, config),
                axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, config),
                axios.get(`${import.meta.env.VITE_API_URL}/api/admin/properties`, config),
                axios.get(`${import.meta.env.VITE_API_URL}/api/admin/bookings`, config),
                axios.get(`${import.meta.env.VITE_API_URL}/api/admin/analytics?range=${range}`, config),
            ]);
            setOverviewData(overviewReq.data);
            setUsersList(usersReq.data);
            setPropertiesList(propsReq.data);
            setBookingsList(bookingsReq.data);
            setAnalyticsData(analyticsReq.data);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this user? All their associated properties will also be deleted.")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setUsersList(usersList.filter(u => u._id !== id));
            alert("User deleted.");
        } catch (error) {
            alert("Error deleting user.");
        }
    };

    const handleDeleteProperty = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this property?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/properties/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setPropertiesList(propertiesList.filter(p => p._id !== id));
            alert("Property deleted.");
        } catch (error) {
            alert("Error deleting property.");
        }
    };

    const handleViewUser = async (userObj) => {
        setSelectedUser(userObj);
        setIsUserModalOpen(true);
        setUserActivity(null);
        setIsEditingUser(false);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users/${userObj._id}/activity`, config);
            setUserActivity(res.data.activity);
            setEditUserData({
                firstName: res.data.user.firstName || '',
                lastName: res.data.user.lastName || '',
                email: res.data.user.email || '',
                phone: res.data.user.phone || '',
                username: res.data.user.username || ''
            });
        } catch (error) {
            console.error("Error fetching user detail", error);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setSavingUser(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/users/${selectedUser._id}`, editUserData, config);
            alert("User updated successfully.");
            setIsEditingUser(false);
            fetchAllData(); // Refresh main list
        } catch (error) {
            alert("Error updating user.");
        } finally {
            setSavingUser(false);
        }
    };

    const handleViewProperty = async (propObj) => {
        setSelectedProperty(propObj);
        setIsPropertyModalOpen(true);
        setPropertyActivity(null);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/properties/${propObj._id}/activity`, config);
            setPropertyActivity(res.data.activity);
        } catch (error) {
            console.error("Error fetching property detail", error);
        }
    };

    const handleAdminLogout = () => {
        logout();
        navigate('/');
    };

    if (loading) return <div className="admin-loading" style={{padding: '100px', textAlign: 'center'}}>Loading Secured Admin Data...</div>;

    return (
        <div className="admin-dashboard-layout">
            <aside className="admin-sidebar glass-panel">
                <div className="admin-sidebar-header">
                    <h2>ECHO-LOOM</h2>
                    <span className="admin-badge">MASTER ADMIN</span>
                </div>
                <nav className="admin-nav">
                    <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
                    <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>Analytics</button>
                    <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Users</button>
                    <button className={activeTab === 'properties' ? 'active' : ''} onClick={() => setActiveTab('properties')}>Mod Queue</button>
                    <button className={activeTab === 'bookings' ? 'active' : ''} onClick={() => setActiveTab('bookings')}>Bookings</button>
                </nav>
                <div className="admin-sidebar-footer">
                    <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{user?.email}</p>
                    <button onClick={handleAdminLogout} className="btn-secondary" style={{width: '100%', marginTop: '10px'}}>Log Out Vault</button>
                </div>
            </aside>

            <main className="admin-main-content">
                {activeTab === 'overview' && overviewData && (
                    <div className="admin-overview">
                        <h1 style={{marginBottom:'20px'}}>Platform Command Center</h1>
                        <div className="metrics-grid">
                            <div className="metric-card glass-panel clickable-card" onClick={() => setActiveTab('users')}>
                                <h3>Total Renters</h3>
                                <p className="metric-number">{overviewData.renters}</p>
                            </div>
                            <div className="metric-card glass-panel clickable-card" onClick={() => setActiveTab('users')}>
                                <h3>Total Owners</h3>
                                <p className="metric-number">{overviewData.owners}</p>
                            </div>
                            <div className="metric-card glass-panel clickable-card" onClick={() => setActiveTab('properties')}>
                                <h3>Total Properties</h3>
                                <p className="metric-number">{overviewData.properties}</p>
                            </div>
                            <div className="metric-card glass-panel clickable-card" onClick={() => setActiveTab('bookings')} style={{borderColor: 'var(--accent-secondary)'}}>
                                <h3>Active Bookings</h3>
                                <p className="metric-number" style={{color: 'var(--accent-secondary)'}}>{overviewData.activeBookings}</p>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'analytics' && (
                    <div className="admin-analytics-view">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h1>Platform Performance Insights</h1>
                            <div className="range-selector">
                                <button className={range === 6 ? 'active' : ''} onClick={() => setRange(6)}>6 Months</button>
                                <button className={range === 12 ? 'active' : ''} onClick={() => setRange(12)}>12 Months</button>
                            </div>
                        </div>

                        <div className="charts-grid">
                            {/* Revenue Chart */}
                            <div className="chart-card glass-panel">
                                <h3>Monthly Revenue ($)</h3>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <AreaChart data={analyticsData.trendData}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--accent-secondary)" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                            <XAxis dataKey="name" stroke="#718096" fontSize={12} />
                                            <YAxis stroke="#718096" fontSize={12} />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="revenue" stroke="var(--accent-secondary)" fillOpacity={1} fill="url(#colorRevenue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Bookings Chart */}
                            <div className="chart-card glass-panel">
                                <h3>Total Bookings (Volume)</h3>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={analyticsData.trendData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                            <XAxis dataKey="name" stroke="#718096" fontSize={12} />
                                            <YAxis stroke="#718096" fontSize={12} />
                                            <Tooltip />
                                            <Bar dataKey="bookings" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Property Distribution */}
                            <div className="chart-card glass-panel">
                                <h3>Property Type Distribution</h3>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={analyticsData.distData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {[ '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8' ].map((color, index) => (
                                                    <Cell key={`cell-${index}`} fill={color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="admin-table-section">
                        <h1 style={{marginBottom:'20px'}}>User Management Module</h1>
                        <div className="table-responsive glass-panel">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersList.map(u => (
                                        <tr key={u._id}>
                                            <td className="clickable-name" onClick={() => handleViewUser(u)}>{u.username}</td>
                                            <td>{u.email}</td>
                                            <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                                            <td>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(u._id); }} className="action-btn delete-btn">BAN / DELETE</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {usersList.length === 0 && <tr><td colSpan="4">No users found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'properties' && (
                    <div className="admin-table-section">
                        <h1 style={{marginBottom:'20px'}}>Global Content Moderation</h1>
                        <div className="table-responsive glass-panel">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Listing Title</th>
                                        <th>Owner Email</th>
                                        <th>Price/Night</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {propertiesList.map(p => (
                                        <tr key={p._id}>
                                            <td style={{maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                                <span onClick={() => handleViewProperty(p)} className="clickable-name">{p.title}</span>
                                            </td>
                                            <td>{p.ownerId?.email || 'Unknown'}</td>
                                            <td>${p.pricePerNight}</td>
                                            <td>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteProperty(p._id); }} className="action-btn delete-btn">REMOVE TRASH</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {propertiesList.length === 0 && <tr><td colSpan="4">No properties listed.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'bookings' && (
                    <div className="admin-table-section">
                        <h1 style={{marginBottom:'20px'}}>Global Booking Tracking</h1>
                        <div className="table-responsive glass-panel">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Property Listing</th>
                                        <th>Owner (Host)</th>
                                        <th>Renter (Guest)</th>
                                        <th>Stay Duration</th>
                                        <th>Revenue ($)</th>
                                        <th>Payment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookingsList.map(b => (
                                        <tr key={b._id}>
                                            <td style={{maxWidth: '200px'}}>
                                                <span onClick={() => handleViewProperty(b.propertyId)} className="clickable-name">{b.propertyId?.title || 'Deleted Property'}</span>
                                            </td>
                                            <td>
                                                <span onClick={() => handleViewUser(b.propertyId?.ownerId)} className="clickable-name">{b.propertyId?.ownerId?.email || 'Unknown Owner'}</span>
                                            </td>
                                            <td>
                                                <span onClick={() => handleViewUser(b.renterId)} className="clickable-name">{b.renterId?.email || 'Unknown Renter'}</span>
                                            </td>
                                            <td style={{fontSize: '0.8rem'}}>
                                                {new Date(b.checkInDate).toLocaleDateString()} <br/> {new Date(b.checkOutDate).toLocaleDateString()}
                                            </td>
                                            <td style={{fontWeight: 800, color: '#10b981'}}>${b.totalAmount}</td>
                                            <td>
                                                <span className={`status-badge ${b.paymentStatus || 'paid'}`}>
                                                    {b.paymentStatus || 'Paid'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {bookingsList.length === 0 && <tr><td colSpan="4">No active bookings found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* --- User Detail Modal --- */}
            {isUserModalOpen && selectedUser && (
                <div className="admin-modal-overlay" onClick={() => setIsUserModalOpen(false)}>
                    <div className="admin-modal-content glass-panel" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setIsUserModalOpen(false)}>&times;</button>
                        
                        <div className="modal-header">
                            <div className="user-initials">{selectedUser.username.charAt(0).toUpperCase()}</div>
                            <div className="header-text">
                                <h2>{selectedUser.username} <span className={`role-badge ${selectedUser.role}`}>{selectedUser.role}</span></h2>
                                <p>{selectedUser.email}</p>
                            </div>
                        </div>

                        {/* Lifetime Stats */}
                        {userActivity && (
                            <div className="lifetime-stats-banner">
                                <div className="stat-item">
                                    <label>{selectedUser.role === 'owner' ? 'Lifetime Revenue' : 'Lifetime Spend'}</label>
                                    <div className="val">${selectedUser.role === 'owner' ? userActivity.totalLifetimeRevenue : userActivity.totalLifetimeSpend}</div>
                                </div>
                                <div className="stat-item">
                                    <label>Total Bookings</label>
                                    <div className="val">{userActivity.bookings?.length || 0}</div>
                                </div>
                                {selectedUser.role === 'owner' && (
                                    <div className="stat-item">
                                        <label>Active Listings</label>
                                        <div className="val">{userActivity.properties?.length || 0}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="modal-body-tabs">
                            <div className="tab-switcher">
                                <button className={!isEditingUser ? 'active' : ''} onClick={() => setIsEditingUser(false)}>Activity History</button>
                                <button className={isEditingUser ? 'active' : ''} onClick={() => setIsEditingUser(true)}>Edit Profile</button>
                            </div>

                            {!isEditingUser ? (
                                <div className="activity-tab">
                                    {selectedUser.role === 'owner' ? (
                                        <div className="owner-drilldown">
                                            <h4>Managed Properties</h4>
                                            <div className="drill-list">
                                                {userActivity?.properties?.map(p => (
                                                    <div key={p._id} className="drill-item">
                                                        <span>{p.title}</span>
                                                        <span className="price">${p.pricePerNight}/night</span>
                                                    </div>
                                                ))}
                                                {userActivity?.properties?.length === 0 && <p>No properties listed.</p>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="renter-drilldown">
                                            <h4>Booking History</h4>
                                            <div className="drill-list">
                                                {userActivity?.bookings?.map(b => (
                                                    <div key={b._id} className="drill-item">
                                                        <div>
                                                            <strong>{b.propertyId?.title}</strong>
                                                            <div style={{fontSize:'0.7rem'}}>{new Date(b.checkInDate).toLocaleDateString()} - {new Date(b.checkOutDate).toLocaleDateString()}</div>
                                                        </div>
                                                        <span className="price">${b.totalAmount}</span>
                                                    </div>
                                                ))}
                                                {userActivity?.bookings?.length === 0 && <p>No bookings found.</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <form className="edit-user-form" onSubmit={handleUpdateUser}>
                                    <div className="form-row">
                                        <div className="input-field">
                                            <label>First Name</label>
                                            <input type="text" value={editUserData.firstName} onChange={e => setEditUserData({...editUserData, firstName: e.target.value})} />
                                        </div>
                                        <div className="input-field">
                                            <label>Last Name</label>
                                        </div>
                                        <input type="text" value={editUserData.lastName} onChange={e => setEditUserData({...editUserData, lastName: e.target.value})} />
                                    </div>
                                    <div className="input-field">
                                        <label>Email Address</label>
                                        <input type="email" value={editUserData.email} onChange={e => setEditUserData({...editUserData, email: e.target.value})} required />
                                    </div>
                                    <div className="input-field">
                                        <label>Phone Number</label>
                                        <input type="text" value={editUserData.phone} onChange={e => setEditUserData({...editUserData, phone: e.target.value})} />
                                    </div>
                                    <button type="submit" className="btn-primary" disabled={savingUser}>
                                        {savingUser ? 'Syncing...' : 'Save User Changes'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- Property Detail Modal --- */}
            {isPropertyModalOpen && selectedProperty && (
                <div className="admin-modal-overlay" onClick={() => setIsPropertyModalOpen(false)}>
                    <div className="admin-modal-content glass-panel" style={{maxWidth: '700px'}} onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setIsPropertyModalOpen(false)}>&times;</button>
                        
                        <div className="modal-header">
                            <div className="user-initials" style={{borderRadius: '12px'}}><img src={selectedProperty.imageUrl} style={{width:'100%', height:'100%', borderRadius:'12px', objectFit:'cover'}} alt="p"/></div>
                            <div className="header-text">
                                <h2 style={{fontSize:'1.2rem'}}>{selectedProperty.title}</h2>
                                <p>{selectedProperty.location}</p>
                                <p style={{fontSize:'0.8rem', color:'var(--accent-primary)'}}>Owned by: {selectedProperty.ownerId?.email}</p>
                            </div>
                        </div>

                        {/* Property Lifetime Stats */}
                        {propertyActivity && (
                            <div className="lifetime-stats-banner">
                                <div className="stat-item">
                                    <label>Generated Revenue</label>
                                    <div className="val">${propertyActivity.totalRevenue}</div>
                                </div>
                                <div className="stat-item">
                                    <label>Total Bookings</label>
                                    <div className="val">{propertyActivity.totalStays}</div>
                                </div>
                                <div className="stat-item">
                                    <label>Price / Night</label>
                                    <div className="val">${selectedProperty.pricePerNight}</div>
                                </div>
                            </div>
                        )}

                        <div className="drilldown-body">
                            <h4>Recent Occupancy Activity</h4>
                            <div className="drill-list" style={{marginTop: '15px'}}>
                                {propertyActivity?.bookings?.map(b => (
                                    <div key={b._id} className="drill-item" style={{borderLeft: '4px solid var(--accent-primary)'}}>
                                        <div>
                                            <strong>{b.renterId?.username || 'System Guest'}</strong>
                                            <div style={{fontSize: '0.75rem', color: '#718096'}}>
                                                {new Date(b.checkInDate).toLocaleDateString()} - {new Date(b.checkOutDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div style={{textAlign: 'right'}}>
                                            <div className="price">${b.totalAmount}</div>
                                            <div style={{fontSize: '0.65rem', color: '#10b981', fontWeight: 800}}>PAID</div>
                                        </div>
                                    </div>
                                ))}
                                {propertyActivity?.bookings?.length === 0 && <p style={{textAlign:'center', padding:'20px', color:'#94a3b8'}}>No booking history found for this property.</p>}
                            </div>
                            
                            <div style={{marginTop: '30px', borderTop: '1px solid #edf2f7', paddingTop: '20px', textAlign: 'right'}}>
                                <button className="btn-danger" onClick={() => { handleDeleteProperty(selectedProperty._id); setIsPropertyModalOpen(false); }}>
                                    PERMANENTLY FLUSH LISTING
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
