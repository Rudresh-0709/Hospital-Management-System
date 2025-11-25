import React from 'react';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import './TestimonialsSection.css';

const testimonials = [
    {
        name: "Sarah Johnson",
        role: "Patient",
        text: "The care I received at this hospital was absolutely phenomenal. From the moment I walked in, I felt welcomed and safe. Dr. Sharma explained everything so clearly.",
        rating: 5,
        initials: "SJ"
    },
    {
        name: "Michael Chen",
        role: "Recovered Patient",
        text: "I was terrified about my surgery, but the team here made it seamless. The post-op care was exceptional, and the nurses were incredibly attentive. I'm back on my feet faster than I expected!",
        rating: 5,
        initials: "MC"
    },
    {
        name: "Emily Davis",
        role: "Mother of Patient",
        text: "Bringing your child to the ER is every parent's nightmare, but Dr. Li Wei was an angel. She calmed my son down immediately and treated him with such gentleness. We are forever grateful.",
        rating: 5,
        initials: "ED"
    },
    {
        name: "Robert Wilson",
        role: "Regular Checkup",
        text: "Efficient, professional, and clean. The best hospital experience I've had in years. The digital appointment system saved me so much time.",
        rating: 4,
        initials: "RW"
    },
    {
        name: "Anita Patel",
        role: "Patient",
        text: "Dr. Priya Patel is wonderful. She listened to all my concerns without rushing me. It's rare to find a doctor who genuinely cares this much.",
        rating: 5,
        initials: "AP"
    },
    {
        name: "David Thompson",
        role: "Surgery Patient",
        text: "World-class facilities and top-notch doctors. Dr. Arjun Reddy is a master of his craft. The recovery rooms felt more like a hotel than a hospital.",
        rating: 5,
        initials: "DT"
    },
    {
        name: "Grace Lee",
        role: "Patient",
        text: "I've been managing a chronic condition for years, and the endocrinology department here has given me my life back. Thank you, Dr. Ananya!",
        rating: 5,
        initials: "GL"
    },
    {
        name: "James Anderson",
        role: "Emergency Care",
        text: "Fast response time in the emergency room. The staff was organized and calm under pressure.",
        rating: 4,
        initials: "JA"
    },
    {
        name: "Kabir Khan",
        role: "Patient",
        text: "The care I received at this hospital was absolutely phenomenal. From the moment I walked in, I felt welcomed and safe. Dr. Sharma explained everything so clearly.",
        rating: 5,
        initials: "KK"
    }
];

const TestimonialsSection = () => {
    return (
        <section className="testimonials-section">
            <div className="testimonials-header">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    Stories of Healing & Hope
                </motion.h2>
                <div className="testimonials-underline"></div>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    Hear from the people whose lives we've touched.
                </motion.p>
            </div>

            <div className="testimonials-grid">
                {testimonials.map((item, index) => (
                    <motion.div
                        className="testimonial-card"
                        key={index}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                        <div className="quote-icon-container">
                            <Quote size={40} />
                        </div>

                        <div className="rating">
                            {[...Array(item.rating)].map((_, i) => (
                                <Star key={i} size={16} className="star" />
                            ))}
                        </div>

                        <p className="testimonial-text">"{item.text}"</p>

                        <div className="testimonial-author">
                            <div className="author-avatar">
                                {item.initials}
                            </div>
                            <div className="author-info">
                                <h4>{item.name}</h4>
                                <span>{item.role}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default TestimonialsSection;
