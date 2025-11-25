import React from 'react';
import { useEffect } from "react";
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Stats from './components/Stats';
import DoctorsSection from './components/DoctorsSection';
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

        <section id="resources" style={{ padding: '4rem 0', textAlign: 'center' }}>
          <h2>Patient Resources</h2>
          <p>Information to guide your journey.</p>
          <div style={{ height: '300px', background: '#e9ecef', margin: '2rem 0', borderRadius: '8px' }}></div>
        </section>
      </main>
    </div>
  );
}

export default App;
