import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Instagram, Activity } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    return (
        <footer className="footer-section">
            <motion.div
                className="footer-container"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
            >
                {/* COLUMN 1: LOGO & CONTACT */}
                <motion.div className="footer-column" variants={itemVariants}>
                    <div className="footer-logo">
                        <Activity size={28} color="#38bdf8" />
                        <span>ModernHospital</span>
                    </div>
                    <div className="contact-info">
                        <div className="contact-item">
                            <MapPin size={18} />
                            <span>123 Health Avenue<br />New York, NY 10012</span>
                        </div>
                        <div className="contact-item">
                            <Phone size={18} />
                            <span>(555) 123-4567</span>
                        </div>
                        <div className="contact-item">
                            <Mail size={18} />
                            <span>info@modernhospital.com</span>
                        </div>
                    </div>
                </motion.div>

                {/* COLUMN 2: QUICK LINKS */}
                <motion.div className="footer-column" variants={itemVariants}>
                    <h3>Quick Links</h3>
                    <ul className="footer-links">
                        <li><a href="#">Patient Portal</a></li>
                        <li><a href="#">Find a Doctor</a></li>
                        <li><a href="#">Pay Bill Online</a></li>
                        <li><a href="#">Insurance Information</a></li>
                        <li><a href="#">Careers</a></li>
                    </ul>
                </motion.div>

                {/* COLUMN 3: SERVICES */}
                <motion.div className="footer-column" variants={itemVariants}>
                    <h3>Our Services</h3>
                    <ul className="footer-links">
                        <li><a href="#">Emergency Care</a></li>
                        <li><a href="#">Cardiology</a></li>
                        <li><a href="#">Oncology</a></li>
                        <li><a href="#">Neurology</a></li>
                        <li><a href="#">Pediatrics</a></li>
                        <li><a href="#">AI Health Assistant</a></li>
                    </ul>
                </motion.div>

                {/* COLUMN 4: STAY CONNECTED */}
                <motion.div className="footer-column" variants={itemVariants}>
                    <h3>Stay Connected</h3>
                    <p>Subscribe to our newsletter for the latest health tips and hospital news.</p>
                    <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                        <input type="email" placeholder="Your email address" className="newsletter-input" />
                        <button type="submit" className="subscribe-btn">Subscribe</button>
                    </form>
                    <div className="social-icons">
                        <a href="#" className="social-icon"><Facebook size={20} /></a>
                        <a href="#" className="social-icon"><Twitter size={20} /></a>
                        <a href="#" className="social-icon"><Linkedin size={20} /></a>
                        <a href="#" className="social-icon"><Instagram size={20} /></a>
                    </div>
                </motion.div>
            </motion.div>

            {/* BOTTOM BAR */}
            <motion.div
                className="footer-bottom"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8, duration: 0.5 }}
            >
                <p>&copy; 2024 Modern Hospital. All rights reserved.</p>
                <div className="legal-links">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Use</a>
                    <a href="#">Accessibility</a>
                </div>
            </motion.div>
        </footer>
    );
};

export default Footer;
