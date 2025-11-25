import React from 'react';
import { motion } from 'framer-motion';
import { FileText, CreditCard, BookOpen, Coffee, ArrowRight, ShieldCheck, Clock, MapPin, Video } from 'lucide-react';
import './PatientResources.css';

const PatientResources = () => {
    return (
        <section className="resources-section" id="resources">
            <div className="resources-header">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    Patient Resources
                </motion.h2>
                <div className="resources-underline"></div>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    Everything you need to manage your health journey with us.
                </motion.p>
            </div>

            <div className="bento-grid">
                {/* ITEM 1: PATIENT PORTAL (Large) */}
                <motion.div
                    className="bento-item span-2 row-span-2 item-primary"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="bento-icon">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h3 className="bento-title">Patient Portal</h3>
                        <p className="bento-desc">
                            Access your medical records, view test results, and manage appointments securely online. Your health data, at your fingertips.
                        </p>
                    </div>
                    <div className="arrow-link">
                        Login to Portal <ArrowRight size={16} />
                    </div>
                    <FileText size={180} className="bento-bg-icon" />
                </motion.div>

                {/* ITEM 2: BILLING */}
                <motion.div
                    className="bento-item"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <div className="bento-icon" style={{ color: '#10b981' }}>
                        <CreditCard size={24} />
                    </div>
                    <h3 className="bento-title">Pay Bill Online</h3>
                    <p className="bento-desc">Secure, fast, and paperless billing options.</p>
                    <CreditCard size={120} className="bento-bg-icon" />
                </motion.div>

                {/* ITEM 3: INSURANCE */}
                <motion.div
                    className="bento-item"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="bento-icon" style={{ color: '#8b5cf6' }}>
                        <ShieldCheck size={24} />
                    </div>
                    <h3 className="bento-title">Insurance Info</h3>
                    <p className="bento-desc">View accepted plans and coverage details.</p>
                    <ShieldCheck size={120} className="bento-bg-icon" />
                </motion.div>

                {/* ITEM 4: VISITOR INFO (Wide) */}
                <motion.div
                    className="bento-item span-2"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <div className="bento-icon" style={{ color: '#f59e0b' }}>
                        <Coffee size={24} />
                    </div>
                    <h3 className="bento-title">Visitor Information</h3>
                    <p className="bento-desc">Visiting hours, parking maps, and cafeteria menus to make your visit comfortable.</p>
                    <Coffee size={140} className="bento-bg-icon" />
                </motion.div>

                {/* ITEM 5: HEALTH LIBRARY */}
                <motion.div
                    className="bento-item"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <div className="bento-icon" style={{ color: '#ef4444' }}>
                        <BookOpen size={24} />
                    </div>
                    <h3 className="bento-title">Health Library</h3>
                    <p className="bento-desc">Expert articles and symptom checkers.</p>
                    <BookOpen size={120} className="bento-bg-icon" />
                </motion.div>

                {/* ITEM 6: LOCATIONS */}
                <motion.div
                    className="bento-item"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <div className="bento-icon" style={{ color: '#3b82f6' }}>
                        <MapPin size={24} />
                    </div>
                    <h3 className="bento-title">Find Locations</h3>
                    <p className="bento-desc">Clinics, labs, and pharmacy directions.</p>
                    <MapPin size={120} className="bento-bg-icon" />
                </motion.div>

                {/* ITEM 7: TELEHEALTH (New Unique Item) */}
                <motion.div
                    className="bento-item span-2 item-accent"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    <div className="bento-icon">
                        <Video size={24} />
                    </div>
                    <div>
                        <h3 className="bento-title">24/7 Virtual Care</h3>
                        <p className="bento-desc">
                            Connect with a doctor from the comfort of your home. Video consultations available on-demand.
                        </p>
                    </div>
                    <div className="arrow-link">
                        Start Consultation <ArrowRight size={16} />
                    </div>
                    <Video size={140} className="bento-bg-icon" />
                </motion.div>
            </div>
        </section>
    );
};

export default PatientResources;
