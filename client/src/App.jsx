import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Stats from './components/Stats';
import './App.css';

function App() {
  return (
    <div className="App">
      <div className="navbar-spacer" style={{ height: '150px', background: "white", position: 'relative', zIndex: 1 }}></div>
      <Navbar />
      <Hero />
      <main className="main-content">
        <Features />
        <Stats />


        <section id="doctors" style={{ padding: '4rem 0', textAlign: 'center' }}>
          <h2>Meet Our Doctors</h2>
          <p>Expert specialists ready to help.</p>
          <div style={{ height: '300px', background: '#e9ecef', margin: '2rem 0', borderRadius: '8px' }}></div>
        </section>

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
