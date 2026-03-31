import React, { useContext, useEffect } from 'react'
import {BrowserRouter as Router, Routes, Route, useLocation, useNavigate} from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import HeroSection from './components/Home/HeroSection';
import PropertyList from './components/Property/PropertyList';
import PropertyDetails from './components/Property/PropertyDetails';
import CheckoutPage from './components/Checkout/CheckoutPage';
import OwnerDashboard from './components/Dashboard/OwnerDashboard';
import UserProfile from './components/Dashboard/UserProfile';
import AuthModal from './components/Auth/AuthModal';
import { AuthProvider } from './context/AuthContext';
import './App.css';

import BookingSuccess from './components/Checkout/BookingSuccess';
import RenterDashboard from './components/Dashboard/RenterDashboard';
import TrendingProperties from './components/Home/TrendingProperties';
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';
import Inbox from './components/Chat/Inbox';
import About from './components/About/About';
import Footer from './components/Footer/Footer';
import AuthLoadingOverlay from './components/Auth/AuthLoadingOverlay';
import { AuthContext } from './context/AuthContext';

const SessionManager = () => {
    const { user, token } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const protectedRoutes = ['/dashboard', '/renter-dashboard', '/profile', '/messages', '/admin-dashboard'];
        const isPrivateRoute = protectedRoutes.some(route => location.pathname.startsWith(route));

        if (!user && !token && isPrivateRoute) {
            navigate('/');
        }
    }, [user, token, location, navigate]);

    return null;
};

const App = () => {
  const { isAuthMoving } = useContext(AuthContext);
  
  return (
    <>
        {isAuthMoving && <AuthLoadingOverlay message={isAuthMoving === 'login' ? 'Syncing Session...' : 'Clearing Vault...'} />}
      <Router>
        <SessionManager />
        <AuthModal />
        <Navbar />
        <Routes>
            <Route path="/" element={
                <>
                    <HeroSection />
                    <TrendingProperties />
                </>
            } />
            <Route path="/explore" element={<PropertyList />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/checkout/:id" element={<CheckoutPage />} />
            <Route path="/booking-success" element={<BookingSuccess />} />
            <Route path="/dashboard" element={<OwnerDashboard />} />
            <Route path="/renter-dashboard" element={<RenterDashboard />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/messages" element={<Inbox />} />
            <Route path="/aboutus" element={<About />} />
        </Routes>
        <Footer />
      </Router>
    </>
  )
}

export default App