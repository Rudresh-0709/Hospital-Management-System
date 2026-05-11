import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Hero.css';
import { HoverBorderGradient } from "./ui/hover-border-gradient";

const Hero = () => {
    const navigate = useNavigate();
    const { authenticated, loading, user } = useAuth();

    const handleBookAppointment = (e) => {
        e.preventDefault();
        if (authenticated) {
            if (user?.role === 'admin') {
                navigate('/admin/dashboard');
            } else if (user?.role === 'doctor') {
                navigate('/doctor/dashboard');
            } else {
                navigate('/appointmentbook');
            }
        } else {
            navigate('/patientlogin');
        }
    };

    return (
        <div className="hero-container">
            <video className="hero-video" autoPlay loop muted playsInline>
                <source src="/background.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <div className="hero-overlay"></div>
            <div className="hero-fade-bottom"></div>

            <div className="hero-inner">
                <div className="hero-content">
                    <motion.h1
                        className="hero-title"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    >
                        THE FUTURE <br />
                        OF CARE IS <br />

                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
                        >
                            HERE.
                        </motion.span>
                    </motion.h1 >
                    <motion.p
                        className="hero-subtitle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
                    >
                        Where advanced AI meets human compassion.
                    </motion.p>
                    <motion.div
                        className="hero-buttons"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 1 }}
                    >
                        <button onClick={handleBookAppointment} className="btn-primary" disabled={loading}>
                            BOOK APPOINTMENT
                        </button>
                        <HoverBorderGradient
                            containerClassName="rounded-full"
                            as="a"
                            href="#services"
                            className="btn-glass-gradient"
                        >
                            <span>EXPLORE SERVICES →</span>
                        </HoverBorderGradient>
                    </motion.div>
                </div >
            </div>
        </div >
    );
};

export default Hero;
