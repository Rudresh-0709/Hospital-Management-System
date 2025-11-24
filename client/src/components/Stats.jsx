import React, { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import './Stats.css';

const Counter = ({ value, suffix = "" }) => {
    const ref = useRef(null);
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        damping: 30,
        stiffness: 100,
        duration: 2
    });
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    useEffect(() => {
        if (isInView) {
            // Parse value to number (remove commas/plus for calculation)
            const numericValue = parseInt(value.toString().replace(/,/g, '').replace(/\+/g, ''), 10);
            motionValue.set(numericValue);
        }
    }, [isInView, value, motionValue]);

    useEffect(() => {
        return springValue.on("change", (latest) => {
            if (ref.current) {
                // Format with commas if needed
                let formatted = Math.floor(latest).toLocaleString();
                // Add suffix if it was part of the original value string or passed as prop
                ref.current.textContent = formatted + suffix;
            }
        });
    }, [springValue, suffix]);

    return <span ref={ref} />;
};

const statsData = [
    { id: 1, value: 50, suffix: "+", label: "Specialized Departments" },
    { id: 2, value: 150000, suffix: "+", label: "Patients Treated Yearly" },
    { id: 3, value: 98, suffix: "%", label: "Patient Satisfaction" },
    { id: 4, value: 24, suffix: "/7", label: "Emergency Care Services" },
];

const Stats = () => {
    return (
        <section className="stats-section">
            <div className="stats-container">
                {statsData.map((stat, index) => (
                    <motion.div
                        key={stat.id}
                        className="stat-item"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                        <div className="stat-number">
                            <Counter value={stat.value} suffix={stat.suffix} />
                        </div>
                        <div className="stat-label">{stat.label}</div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Stats;
