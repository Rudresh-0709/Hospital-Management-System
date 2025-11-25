import React, { useEffect, useRef } from 'react';
import Core, { damp } from 'smooothy';
import './DoctorsSection.css';

// Import images
import DrAnyaSharma from '../assets/doctor_anya_sharma_1764053235891.png';
import DrMarcusThorne from '../assets/doctor_marcus_thorne_1764053250892.png';
import DrLiWei from '../assets/doctor_li_wei_1764053264739.png';
import DrSarahJenkins from '../assets/doctor_sarah_jenkins_1764053988216.png';
import DrJamesWilson from '../assets/doctor_james_wilson_1764054010971.png';
import DrEmilyChen from '../assets/doctor_emily_chen_1764054025471.png';
import DrMichaelRoss from '../assets/doctor_michael_ross_1764054042588.png';
import DrVikram from '../assets/doctor_vikram.png'
import DrRajesh from '../assets/doctor_rajesh.png'
import DrPriya from '../assets/doctor_priya.png'
import DrArjun from '../assets/doctor_arjun.png'
import DrMeera from '../assets/doctor_meera.png'
import DrAnanya from '../assets/doctor_ananya.png'
import DrRohan from '../assets/doctor_rohan.png'
import DrKavita from '../assets/doctor_kavita.png'
import DrSanjay from '../assets/doctor_sanjay.png'
import DrMandeep from '../assets/doctor_mandeep.png'

const doctors = [
    {
        name: "Dr. Anya Sharma",
        specialty: "Cardiology",
        image: DrAnyaSharma,
        description: "Expert in interventional cardiology with 15 years of experience."
    },
    {
        name: "Dr. Marcus Thorne",
        specialty: "Neurology",
        image: DrMarcusThorne,
        description: "Specializing in neurodegenerative disorders and brain health."
    },
    {
        name: "Dr. Li Wei",
        specialty: "Pediatrics",
        image: DrLiWei,
        description: "Dedicated to compassionate care for children of all ages."
    },
    {
        name: "Dr. Sarah Jenkins",
        specialty: "Dermatology",
        image: DrSarahJenkins,
        description: "Board-certified dermatologist focusing on skin cancer prevention."
    },
    {
        name: "Dr. James Wilson",
        specialty: "Orthopedics",
        image: DrJamesWilson,
        description: "Sports medicine specialist helping athletes recover faster."
    },
    {
        name: "Dr. Emily Chen",
        specialty: "Ophthalmology",
        image: DrEmilyChen,
        description: "Expert surgeon specializing in retinal disorders."
    },
    {
        name: "Dr. Michael Ross",
        specialty: "Oncology",
        image: DrMichaelRoss,
        description: "Leading research in immunotherapy treatments."
    },
    // New Indian Doctors (reusing images for now)
    {
        name: "Dr. Vikram Singh",
        specialty: "Cardiology",
        image: DrVikram, // Placeholder
        description: "Renowned cardiologist specializing in heart failure management."
    },
    {
        name: "Dr. Rajesh Koothrappali",
        specialty: "ENT",
        image: DrRajesh, // Placeholder
        description: "Specialist in Ear, Nose, and Throat disorders."
    },
    {
        name: "Dr. Priya Patel",
        specialty: "Gynecology",
        image: DrPriya, // Placeholder
        description: "Compassionate care for women's health and wellness."
    },
    {
        name: "Dr. Arjun Reddy",
        specialty: "General Surgery",
        image: DrArjun, // Placeholder
        description: "Expert in minimally invasive surgical procedures."
    },
    {
        name: "Dr. Meera Iyer",
        specialty: "Psychiatry",
        image: DrMeera, // Placeholder
        description: "Helping patients achieve mental well-being and balance."
    },
        {
        name: "Dr. Ananya Radhakrishnan",
        specialty: "Endocrinology",
        image: DrAnanya, // Placeholder
        description: "Expert in diabetes management and hormonal disorders."
    },
    {
        name: "Dr. Rohan Malhotra",
        specialty: "Gastroenterology",
        image: DrRohan, // Placeholder
        description: "Specializing in digestive health and advanced endoscopy."
    },
    {
        name: "Dr. Kavita Rao",
        specialty: "Rheumatology",
        image: DrKavita, // Placeholder
        description: "Dedicated to treating arthritis and autoimmune conditions."
    },
    {
        name: "Dr. Sanjay Verma",
        specialty: "Urology",
        image: DrSanjay, // Placeholder
        description: "Expert in kidney stones and men's health issues."
    },
    {
        name: "Dr. Mandeep",
        specialty: "Pulmonology",
        image: DrMandeep, // Placeholder
        description: "Focusing on asthma, COPD, and respiratory care."
    }
];

function DoctorsSection() {
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!wrapperRef.current) return;

        let smooth = 0;

        const slider = new Core(wrapperRef.current, {
            infinite: true,
            snap: true,
            dragSensitivity: 0.005,
            lerpFactor: 0.1, // Smooth interpolation
            wheel: false,       // disable auto-scroll on hover
            scrollInput: false, // prevent scroll wheel from controlling the slider

            onUpdate: ({ speed, deltaTime, parallaxValues }) => {
                const cards = document.querySelectorAll(".parallax-card");

                smooth = damp(smooth, speed, 5, deltaTime);

                cards.forEach((card, i) => {
                    const verticalOffset = parallaxValues[i] * -40;

                    // Keep Smooothy’s internal transform
                    const base = card.style.transform.replace(/translateY\([^)]*\)/, "");

                    // Add our parallax movement on top
                    card.style.transform = `${base} translateY(${verticalOffset}px)`;
                });
            }
        });

        let animationId;
        function animate() {
            slider.update();
            animationId = requestAnimationFrame(animate);
        }
        animate();

        return () => {
            cancelAnimationFrame(animationId);
            slider.destroy();
        };
    }, []);

    return (
        <section className="doctors-section" id="doctors">
            <div className="doctors-header">
                <h2>World-Class Experts Leading Your Care</h2>
                <p>Browse our team of board-certified specialists</p>
            </div>

            <div className="slider-wrapper" ref={wrapperRef} data-slider>
                {doctors.map((doc, idx) => (
                    <div className="slide" key={idx}>
                        <div className="slide-inner">
                            <div className="doctor-card parallax-card">
                                <div className="card-image-wrapper">
                                    <img className="doctor-image" src={doc.image} alt={doc.name} />
                                </div>
                                <div className="card-content">
                                    <h3>{doc.name}</h3>
                                    <p className="specialty">{doc.specialty}</p>
                                    <p className="description">{doc.description}</p>
                                    <button className="view-profile-btn">View Profile</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="view-all-container">
                <button className="view-all-btn">View All Doctors</button>
            </div>
        </section>
    );
}

export default DoctorsSection;
