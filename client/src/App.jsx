import React from 'react';
import { useEffect } from "react";
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Stats from './components/Stats';
import DoctorsSection from './components/DoctorsSection';
import TestimonialsSection from './components/TestimonialsSection';
import Footer from './components/Footer';
import PatientResources from './components/PatientResources';
import Lenis from "@studio-freight/lenis";
import './App.css';

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => t * (2 - t), // classic ease-out
      smoothWheel: true,
      smoothTouch: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  }, []);
  return (
    <div className="App">
      <div className="navbar-spacer" style={{ height: '110px', background: "white", position: 'relative', zIndex: 1 }}></div>
      <Navbar />
      <Hero />
      <main className="main-content">
        <Features />
        <Stats />


        <DoctorsSection />
        <TestimonialsSection />
        <PatientResources />
      </main>
      <Footer />
    </div>
  );
}

export default App;
