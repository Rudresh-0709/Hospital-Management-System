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
import DoctorPatientsPage from './pages/migration/DoctorPatientsPage';
import DoctorSchedulePage from './pages/migration/DoctorSchedulePage';
import DoctorDiagnosisPage from './pages/migration/DoctorDiagnosisPage';
import DoctorPrescriptionPage from './pages/migration/DoctorPrescriptionPage';
import DoctorNewPrescriptionPage from './pages/migration/DoctorNewPrescriptionPage';
import AdminDashboardPage from './pages/migration/AdminDashboardPage';
import PatientDashboardPage from './pages/migration/PatientDashboardPage';
import AdminPharmacyPage from './pages/migration/AdminPharmacyPage';
import AdminNurseAllocatePage from './pages/migration/AdminNurseAllocatePage';
import AdminAiDashboardPage from './pages/migration/AdminAiDashboardPage';
import PatientAiDashboardPage from './pages/migration/PatientAiDashboardPage';
import ChatSettingsPage from './pages/migration/ChatSettingsPage';
import VideoChatPage from './pages/migration/VideoChatPage';
import AppointmentBookPage from './pages/migration/AppointmentBookPage';
import ChatPage from './pages/migration/ChatPage';
import AdminNursePage from './pages/migration/AdminNursePage';
import AdminNewEquipmentPage from './pages/migration/AdminNewEquipmentPage';
import AdminUpdateEquipmentPage from './pages/migration/AdminUpdateEquipmentPage';
import NurseAllocationFormPage from './pages/migration/NurseAllocationFormPage';
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
      <Route
        path="/appointmentbook"
        element={(
          <ProtectedRoute allowedRoles={['patient']}>
            <AppointmentBookPage />
          </ProtectedRoute>
        )}
      />
      <Route path="/portal" element={<MigrationHome />} />
      <Route path="/auth" element={<AuthMigrationPage />} />
      <Route path="/login/admin" element={<AdminLoginPage />} />
      <Route path="/adminlogin" element={<AdminLoginPage />} />
      <Route path="/login/doctor" element={<DoctorLoginPage />} />
      <Route path="/doctorlogin" element={<DoctorLoginPage />} />
      <Route path="/login/patient" element={<PatientLoginPage />} />
      <Route path="/patientlogin" element={<PatientLoginPage />} />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute>
            <MigrationDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/patients"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPatientsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/patient"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPatientsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/admit"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAdmitPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/discharge"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDischargePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/patienthistory"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPatientHistoryPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/newvisitor"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminNewVisitorPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/visit-history"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminVisitHistoryPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/visitqr"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminVisitQrPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/newdoctor"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminNewDoctorPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/newstaff"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminNewStaffPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/equipment"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminEquipmentPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/dashboard"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/pharmacy"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPharmacyPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/nurseallocate"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminNurseAllocatePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/ai"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAiDashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/nurse"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminNursePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/equipment/newequipment"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminNewEquipmentPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/equipment/updateequipment"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUpdateEquipmentPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/nurse/allocation-form"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <NurseAllocationFormPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/doctor/visitnavigation"
        element={(
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorVisitNavigationPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/doctor/appointmentapprove"
        element={(
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorAppointmentApprovePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/doctor/dashboard"
        element={(
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/doctor/patients"
        element={(
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorPatientsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/doctor/schedule"
        element={(
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorSchedulePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/doctoradmin"
        element={(
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/doctor/diagnosis"
        element={(
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDiagnosisPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/doctoradmin/diagnosis"
        element={(
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDiagnosisPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/doctor/prescription"
        element={(
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorPrescriptionPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/doctoradmin/prescription"
        element={(
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorPrescriptionPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/doctor/newprescription"
        element={(
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorNewPrescriptionPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/doctoradmin/newprescription"
        element={(
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorNewPrescriptionPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/patient/dashboard"
        element={(
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/patientdashboard"
        element={(
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/patient/ai"
        element={(
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientAiDashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/chat/setting"
        element={(
          <ProtectedRoute>
            <ChatSettingsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/chat"
        element={(
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/video-chat"
        element={(
          <ProtectedRoute>
            <VideoChatPage />
          </ProtectedRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;


