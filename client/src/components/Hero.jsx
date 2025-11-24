import React from 'react';
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
                    <h1 className="hero-title">
                        THE FUTURE <br />
                        OF CARE IS <br />

                        <span>HERE.</span>
                    </h1 >
                    <p className="hero-subtitle">
                        Where advanced AI meets human compassion.
                    </p>
                    <div className="hero-buttons">
                        <a href="/appointment" className="btn-primary">BOOK APPOINTMENT</a>
                        <HoverBorderGradient
                            containerClassName="rounded-full"
                            as="a"
                            href="#services"
                            className="btn-glass-gradient"
                        >
                            <span>EXPLORE SERVICES →</span>
                        </HoverBorderGradient>
                    </div>
                </div >
            </div>
        </div >
    );
};

export default Hero;
