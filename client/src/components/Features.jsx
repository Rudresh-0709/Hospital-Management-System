import React from 'react';
import { CardContainer, CardBody, CardItem } from './ui/3d-card';
import { Bot, Calendar, Stethoscope, ArrowRight } from 'lucide-react';
import './Features.css';

const Features = () => {
    return (
        <section className="features-section" id="services">
            <div className="features-header">
                <h2>Healthcare Designed Around You</h2>
                <div className="features-underline"></div>
            </div>

            <div className="features-grid">
                {/* Card 1: AI Health Agent */}
                <CardContainer className="inter-var">
                    <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border">
                        <CardItem translateZ="50" className="w-full mt-4">
                            <div className="icon-wrapper gradient-1">
                                <Bot size={40} color="white" />
                            </div>
                        </CardItem>
                        <CardItem
                            as="h3"
                            translateZ="60"
                            className="card-title mt-4"
                        >
                            24/7 AI Health Agent
                        </CardItem>
                        <CardItem
                            as="p"
                            translateZ="50"
                            className="card-description mt-2"
                        >
                            Get instant answers, check symptoms, and navigate care options anytime, anywhere.
                        </CardItem>
                        <CardItem
                            translateZ={40}
                            as="a"
                            href="#"
                            className="card-link mt-4"
                        >
                            Learn More <ArrowRight size={16} />
                        </CardItem>
                    </CardBody>
                </CardContainer>

                {/* Card 2: Instant Smart Booking */}
                <CardContainer className="inter-var">
                    <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border">
                        <CardItem translateZ="50" className="w-full mt-4">
                            <div className="icon-wrapper gradient-2">
                                <Calendar size={40} color="white" />
                            </div>
                        </CardItem>
                        <CardItem
                            as="h3"
                            translateZ="60"
                            className="card-title mt-4"
                        >
                            Instant Smart Booking
                        </CardItem>
                        <CardItem
                            as="p"
                            translateZ="50"
                            className="card-description mt-2"
                        >
                            No phone tag. Our AI finds the earliest slot that fits your schedule automatically.
                        </CardItem>
                        <CardItem
                            translateZ={40}
                            as="a"
                            href="#"
                            className="card-link mt-4"
                        >
                            Book Now <ArrowRight size={16} />
                        </CardItem>
                    </CardBody>
                </CardContainer>

                {/* Card 3: Virtual Consults */}
                <CardContainer className="inter-var">
                    <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border">
                        <CardItem translateZ="50" className="w-full mt-4">
                            <div className="icon-wrapper gradient-3">
                                <Stethoscope size={40} color="white" />
                            </div>
                        </CardItem>
                        <CardItem
                            as="h3"
                            translateZ="60"
                            className="card-title mt-4"
                        >
                            Virtual Consults
                        </CardItem>
                        <CardItem
                            as="p"
                            translateZ="50"
                            className="card-description mt-2"
                        >
                            See specialists from the comfort of home via secure video conferencing.
                        </CardItem>
                        <CardItem
                            translateZ={40}
                            as="a"
                            href="#"
                            className="card-link mt-4"
                        >
                            Telehealth <ArrowRight size={16} />
                        </CardItem>
                    </CardBody>
                </CardContainer>
            </div>
        </section>
    );
};

export default Features;
