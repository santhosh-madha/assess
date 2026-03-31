import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-page container">
      <section className="about-hero glass-panel animate-fade-in">
        <h1 className="section-title">The <span>EchoLoom</span> Story</h1>
        <p className="subtitle">Redefining modern property rentals through trust, transparency, and technology.</p>
      </section>

      <div className="about-grid">
        <section className="about-card glass-panel">
          <h2>Our Mission</h2>
          <p>
            EchoLoom was born from a simple idea: that finding a place to call home—even for a few days—should be as seamless as 
            sending a message. We bridge the gap between property owners and travelers by building a community rooted in 
            verification and high-fidelity communication.
          </p>
        </section>

        <section className="about-card glass-panel">
          <h2>Why EchoLoom?</h2>
          <ul className="about-list">
            <li>✨ <strong>Curated Spaces:</strong> Hand-picked properties that meet our premium standards.</li>
            <li>🔒 <strong>Direct Trust:</strong> Real-time messaging with hosts ensures clarity and security.</li>
            <li>📱 <strong>Mobile First:</strong> Manage your bookings or your listings from anywhere, on any device.</li>
            <li>💳 <strong>Secure Payments:</strong> Integrated Stripe processing for a worry-free checkout experience.</li>
          </ul>
        </section>
      </div>

      <section className="about-values glass-panel">
        <h2>Driven by Transparency</h2>
        <div className="values-row">
            <div className="value-item">
                <span className="value-icon">🤝</span>
                <h3>Trust</h3>
                <p>Verifying every host and guest for a safe community experience.</p>
            </div>
            <div className="value-item">
                <span className="value-icon">⚡</span>
                <h3>Speed</h3>
                <p>Instant availability and rapid messaging keep you moving.</p>
            </div>
            <div className="value-item">
                <span className="value-icon">💎</span>
                <h3>Quality</h3>
                <p>Only the most stunning properties make it onto the Loom.</p>
            </div>
        </div>
      </section>
    </div>
  );
};

export default About;
