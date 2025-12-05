import { useState } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import HomePage from './pages/HomePage.jsx'
import AdminPanel from './pages/admin/AdminPanel.jsx'
import RegisterEmail from './pages/register/RegisterEmail.jsx'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import OTPpage from './pages/register/OtpPage.jsx';
import RegisterInfo from './pages/register/RegisterInfo.jsx';
import LoginPage from './pages/login/LoginPage.jsx';
import VerifyLoginOtp from './pages/login/VerifyLoginOtp.jsx';
import ProtectedRoute from './routeprotection/ProtectedRoute.jsx';
import PublicRoute from './routeprotection/PublicRoute.jsx';
import "./App.css";
import Booking from './pages/Booking.jsx';
import Profile from './pages/Profile.jsx';
import Services from './pages/Services.jsx';
import TechnicianRegisterEmail from './pages/technician/TechnicianRegisterEmail.jsx';
import TechnicianOtpPage from './pages/technician/TechnicianOtpPage.jsx';
import TechnicianRegisterInfo from './pages/technician/TechnicianRegisterInfo.jsx';
import TechnicianDashboard from './pages/technician/TechnicianDashboard.jsx'
import ManageTiming from './pages/technician/ManageTiming.jsx'
import TechnicianProfile from './pages/technician/TechnicianProfile.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className='pt-15'>
     <BrowserRouter>
       <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterEmail />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-otp"
          element={
            <PublicRoute>
              <OTPpage />
            </PublicRoute>
          }
        />
        <Route
          path="/register-details"
          element={
            <PublicRoute>
              <RegisterInfo />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-otp-login"
          element={
            <PublicRoute>
              <VerifyLoginOtp />
            </PublicRoute>
          }
        />
         <Route path="/bookings" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
         <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
         <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
         <Route path="/technician-dashboard" element={<ProtectedRoute requireTechnician><TechnicianDashboard/></ProtectedRoute>} />
         <Route path="/manage-timing" element={<ProtectedRoute requireTechnician><ManageTiming /></ProtectedRoute>} />
         <Route path="/technician-profile" element={<ProtectedRoute requireTechnician><TechnicianProfile /></ProtectedRoute>} />
         <Route
           path="/register-technician"
           element={
             <PublicRoute>
               <TechnicianRegisterEmail />
             </PublicRoute>
           }
         />
         <Route
           path="/verify-otp-technician"
           element={
             <PublicRoute>
               <TechnicianOtpPage />
             </PublicRoute>
           }
         />
         <Route
           path="/register-technician-details"
           element={
             <PublicRoute>
               <TechnicianRegisterInfo />
             </PublicRoute>
           }
         />
       </Routes>

     </BrowserRouter>
     {/* <BrowserRouter>
     <Test />
     </BrowserRouter> */}
     
    </div>
  )
}

export default App
