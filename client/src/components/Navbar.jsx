import React, { useState, useEffect, useRef } from 'react';
import { Phone, ChevronDown, User, Sparkles } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    useEffect(() => {
        const navbar = document.querySelector('.navbar-wrapper');

        // Start hidden
        navbar.classList.add("initial-hidden");

        // Reveal after delay
        setTimeout(() => {
            navbar.classList.remove('initial-hidden');
            navbar.classList.add('visible');
        }, 150);
    }, []);




    const lastY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentY = window.scrollY;

            if (currentY > lastY.current && currentY > 120) {
                // scrolling down
                setIsVisible(false);
            } else {
                // scrolling up
                setIsVisible(true);
            }

            lastY.current = currentY;
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);


    return (
        <div className={`navbar-wrapper ${isVisible ? 'visible' : 'hidden'}`}>

            {/* Announcement Banner */}
            <div className="announcement-banner">
                <Sparkles size={14} className="banner-icon" />
                <span>HospitalMS has now healed more than 10 million+ patients</span>
            </div>

            {/* Main Navbar */}
            <nav className="navbar">
                {/* Logo */}
                <a href="/" className="navbar-logo">
                    HospitalMS
                </a>

                {/* Center Links */}
                <ul className="navbar-links">
                    <li><a href="#services" className="nav-link">Services</a></li>
                    <li><a href="#doctors" className="nav-link">Doctors</a></li>
                    <li><a href="#resources" className="nav-link">Patient Resources</a></li>
                    <li><a href="#about" className="nav-link">About Us</a></li>
                </ul>

                {/* Right Section */}
                <div className="navbar-right">
                    {/* Emergency Contact */}
                    <div className="emergency-contact">
                        <Phone size={20} />
                        <div className="emergency-text">
                            <span className="emergency-label">Emergency</span>
                            <span className="emergency-number">911 / Hotline</span>
                        </div>
                    </div>

                    {/* Login Dropdown */}
                    <div className="login-dropdown">
                        <button className="login-btn" onClick={toggleDropdown}>
                            <User size={18} />
                            Login Portal
                            <ChevronDown size={16} />
                        </button>

                        {isDropdownOpen && (
                            <div className="dropdown-menu">
                                <a href="/adminlogin" className="dropdown-item">Admin Login</a>
                                <a href="/doctorlogin" className="dropdown-item">Doctor Login</a>
                                <a href="/patientlogin" className="dropdown-item">Patient Login</a>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Navbar;
