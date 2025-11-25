import React from 'react';
import { motion } from 'framer-motion';
import './Hero.css';
import { HoverBorderGradient } from "./ui/hover-border-gradient";

const Hero = () => {
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
                        <a href="/appointment" className="btn-primary">BOOK APPOINTMENT</a>
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
