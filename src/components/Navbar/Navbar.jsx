import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, token, toggleAuthModal } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // Real-time unread count sync
  React.useEffect(() => {
    if (user && token) {
        // Fetch initial count
        const fetchInitialCount = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/unread-count`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUnreadCount(res.data.count);
            } catch (err) {
                console.error("Error fetching unread count", err);
            }
        };
        fetchInitialCount();

        // Listen for new messages via socket
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        socket.emit('join', user.userId);
        
        socket.on('message', (msg) => {
            // Only increment if we are the receiver
            if (msg.receiver === user.userId) {
                setUnreadCount(prev => prev + 1);
            }
        });

        // Listen for mark as read events (if we open them in another tab)
        socket.on('messagesRead', () => {
            fetchInitialCount();
        });

        return () => socket.disconnect();
    } else {
        setUnreadCount(0);
    }
  }, [user, token]);

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-brand">
        <Link to="/" onClick={closeMenu}>Echo<span>Loom</span></Link>
      </div>

      <div className={`navbar-menu-toggle ${menuOpen ? 'active' : ''}`} onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className={`navbar-container ${menuOpen ? 'active' : ''}`}>
        <div className="navbar-links">
          <Link to="/explore" onClick={closeMenu}>Explore</Link>
          <Link to="/aboutus" onClick={closeMenu}>About</Link>
          {user && (
            <>
              <Link to="/profile" onClick={closeMenu}>My Profile</Link>
              <Link to="/messages" className="nav-msg-link" onClick={closeMenu}>
                  Messages
                  {unreadCount > 0 && <span className="nav-unread-badge">{unreadCount}</span>}
              </Link>
            </>
          )}
          {user && user.role === 'owner' && (
            <Link to="/dashboard" onClick={closeMenu}>Host Dashboard</Link>
          )}
          {user && user.role === 'renter' && (
            <Link to="/renter-dashboard" onClick={closeMenu}>My Trips</Link>
          )}
          {user && user.role === 'admin' && (
            <Link to="/admin-dashboard" onClick={closeMenu}>Admin Panel</Link>
          )}
        </div>

        <div className="navbar-actions">
          {user ? (
            <>
              <span className="user-greeting">
                Hi, {user.firstName || user.email.split('@')[0]}
              </span>
              <button className="btn-outline" onClick={() => { logout(); closeMenu(); }}>Log Out</button>
            </>
          ) : (
            <>
              <button className="btn-outline" onClick={() => { toggleAuthModal(true); closeMenu(); }}>Log In</button>
              <button className="btn-primary" onClick={() => { toggleAuthModal(true); closeMenu(); }}>Sign Up</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;