import { useEffect } from "react";
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Stats from './components/Stats';
import DoctorsSection from './components/DoctorsSection';
import TestimonialsSection from './components/TestimonialsSection';
import Footer from './components/Footer';
import PatientResources from './components/PatientResources';
import Lenis from "@studio-freight/lenis";
import AuthMigrationPage from './pages/AuthMigrationPage';
import MigrationHome from './pages/migration/MigrationHome';
import AdminLoginPage from './pages/migration/AdminLoginPage';
import DoctorLoginPage from './pages/migration/DoctorLoginPage';
import PatientLoginPage from './pages/migration/PatientLoginPage';
import MigrationDashboard from './pages/migration/MigrationDashboard';
import AdminPatientsPage from './pages/migration/AdminPatientsPage';
import AdminAdmitPage from './pages/migration/AdminAdmitPage';
import AdminDischargePage from './pages/migration/AdminDischargePage';
import AdminPatientHistoryPage from './pages/migration/AdminPatientHistoryPage';
import AdminNewVisitorPage from './pages/migration/AdminNewVisitorPage';
import AdminVisitHistoryPage from './pages/migration/AdminVisitHistoryPage';
import AdminVisitQrPage from './pages/migration/AdminVisitQrPage';
import AdminNewDoctorPage from './pages/migration/AdminNewDoctorPage';
import AdminNewStaffPage from './pages/migration/AdminNewStaffPage';
import AdminEquipmentPage from './pages/migration/AdminEquipmentPage';
import DoctorVisitNavigationPage from './pages/migration/DoctorVisitNavigationPage';
import DoctorAppointmentApprovePage from './pages/migration/DoctorAppointmentApprovePage';
import DoctorDashboardPage from './pages/migration/DoctorDashboardPage';
import AdminDashboardPage from './pages/migration/AdminDashboardPage';
import PatientDashboardPage from './pages/migration/PatientDashboardPage';
import AdminPharmacyPage from './pages/migration/AdminPharmacyPage';
import AdminNurseAllocatePage from './pages/migration/AdminNurseAllocatePage';
import AdminAiDashboardPage from './pages/migration/AdminAiDashboardPage';
import ProtectedRoute from './components/migration/ProtectedRoute';
import './App.css';
import './styles/migration-ejs.css';

function HomePage() {
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/migrate" element={<MigrationHome />} />
      <Route path="/migrate/auth" element={<AuthMigrationPage />} />
      <Route path="/migrate/login/admin" element={<AdminLoginPage />} />
      <Route path="/migrate/login/doctor" element={<DoctorLoginPage />} />
      <Route path="/migrate/login/patient" element={<PatientLoginPage />} />
      <Route
        path="/migrate/dashboard"
        element={(
          <ProtectedRoute>
            <MigrationDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/admin/patients"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPatientsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/admin/admit"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAdmitPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/admin/discharge"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDischargePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/admin/patienthistory"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPatientHistoryPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/admin/newvisitor"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminNewVisitorPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/admin/visit-history"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminVisitHistoryPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/admin/visitqr"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminVisitQrPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/admin/newdoctor"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminNewDoctorPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/admin/newstaff"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminNewStaffPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/admin/equipment"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminEquipmentPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/admin/dashboard"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/admin/pharmacy"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPharmacyPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/admin/nurseallocate"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminNurseAllocatePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/admin/ai"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAiDashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/doctor/visitnavigation"
        element={(
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorVisitNavigationPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/doctor/appointmentapprove"
        element={(
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorAppointmentApprovePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/doctor/dashboard"
        element={(
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/migrate/patient/dashboard"
        element={(
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
