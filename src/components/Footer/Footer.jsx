import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="main-footer glass-panel">
      <div className="footer-container container">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">Echo<span>Loom</span></Link>
          <p className="footer-slogan">Seamless Stays, Handcrafted for You.</p>
        </div>

        <div className="footer-nav">
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/explore">Explore Properties</Link></li>
              <li><Link to="/aboutus">About Us</Link></li>
              <li><Link to="/profile">My Account</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Customer Care</h4>
            <ul className="support-details">
              <li>✉️ <strong>Email:</strong> <a href="mailto:support.echoloom@gmail.com">support.echoloom@gmail.com</a></li>
              <li>📞 <strong>Phone:</strong> <a href="tel:+15550123499">+1 (555) 012-3499</a></li>
              <li>📍 <strong>Address:</strong> 123 Looming Heights, NY 10001</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom container">
        <p>&copy; {new Date().getFullYear()} EchoLoom Property Rentals. All rights reserved.</p>
        <div className="legal-links">
          <span>Privacy Policy</span> • <span>Terms of Service</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;