import { useState } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import HomePage from './pages/HomePage.jsx'
import AdminPanel from './pages/admin/AdminPanel.jsx'
import RegisterEmail from './pages/register/RegisterEmail.jsx'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
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
import SearchResults from './pages/SearchResults.jsx';
import TechnicianRegisterEmail from './pages/technician/TechnicianRegisterEmail.jsx';
import TechnicianOtpPage from './pages/technician/TechnicianOtpPage.jsx';
import TechnicianRegisterInfo from './pages/technician/TechnicianRegisterInfo.jsx';
import TechnicianDashboard from './pages/technician/TechnicianDashboard.jsx'
import ManageTiming from './pages/technician/ManageTiming.jsx'
import TechnicianProfile from './pages/technician/TechnicianProfile.jsx'
import BookTechnicianPage from './pages/BookTechnicianPage.jsx'
import BookTechnicianFrontend from './pages/BookTechnicianFrontend.jsx'
import TechnicianBookings from './pages/technician/TechnicianBookings.jsx'
import TechnicianReview from './pages/technician/TechnicianReview.jsx'
import APUsers from './pages/admin/APUsers.jsx'
import APBookings from './pages/admin/APBookings.jsx'
import APTechnician from './pages/admin/APTechnician.jsx'
import AdminProfile from './pages/admin/AdminProfile.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Toaster
        position="bottom-left"
        reverseOrder={false}
        gutter={12}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#ffffff",
            color: "#1a1a1a",
            borderLeft: "5px solid #1F367F",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(31, 54, 127, 0.12), 0 2px 8px rgba(31, 54, 127, 0.08)",
            padding: "16px 20px",
            fontSize: "14px",
            fontWeight: 500,
            letterSpacing: "-0.3px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            backdropFilter: "blur(8px)",
          },
          success: {
            duration: 4000,
            style: {
              borderLeftColor: "#16a34a",
              background: "#f0fdf4",
            },
            iconTheme: {
              primary: "#16a34a",
              secondary: "#f0fdf4",
            },
          },
          error: {
            duration: 5000,
            style: {
              borderLeftColor: "#dc2626",
              background: "#fef2f2",
            },
            iconTheme: {
              primary: "#dc2626",
              secondary: "#fef2f2",
            },
          },
          warning: {
            duration: 4000,
            style: {
              borderLeftColor: "#ea580c",
              background: "#fef3c7",
            },
            iconTheme: {
              primary: "#ea580c",
              secondary: "#fef3c7",
            },
          },
          loading: {
            style: {
              borderLeftColor: "#1F367F",
              background: "#f0f4ff",
            },
            iconTheme: {
              primary: "#1F367F",
              secondary: "#f0f4ff",
            },
          },
        }}
      />
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
         <Route path="/search-results" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
         <Route path="/technician-dashboard" element={<ProtectedRoute requireTechnician><TechnicianDashboard/></ProtectedRoute>} />
         
         <Route path="/manage-timing" element={<ProtectedRoute requireTechnician><ManageTiming /></ProtectedRoute>} />
         <Route path="/technician-profile" element={<ProtectedRoute requireTechnician><TechnicianProfile /></ProtectedRoute>} />
         <Route path="/booktechnician/:id" element={<ProtectedRoute><BookTechnicianPage/></ProtectedRoute>} />
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
         <Route path="/BookTechnicianPage" element={<BookTechnicianFrontend />} />
         
         <Route path="/TechnicianBookings" element={<ProtectedRoute requireTechnician><TechnicianBookings /></ProtectedRoute>} />
         <Route path="/TechnicianReview" element={<ProtectedRoute requireTechnician><TechnicianReview/></ProtectedRoute>} />

        <Route path="/AdminUsers" element={<ProtectedRoute requireAdmin><APUsers /></ProtectedRoute>} />
        <Route path="/AdminBookings" element={<ProtectedRoute requireAdmin><APBookings /></ProtectedRoute>} />
        <Route path="/AdminTechnicians" element={<ProtectedRoute requireAdmin><APTechnician /></ProtectedRoute>} />
        <Route path="/AdminProfile" element={<ProtectedRoute ><AdminProfile /></ProtectedRoute>} />
         
         
       </Routes>
        </BrowserRouter>
      </div>
    </>
  )
}

export default App
