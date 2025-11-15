import { useState } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import HomePage from './pages/HomePage.jsx'
import RegisterEmail from './pages/register/RegisterEmail.jsx'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import OTPpage from './pages/register/OtpPage.jsx';
import RegisterInfo from './pages/register/RegisterInfo.jsx';
import LoginPage from './pages/login/LoginPage.jsx';
import VerifyLoginOtp from './pages/login/VerifyLoginOtp.jsx';
import "./App.css";


function App() {
  const [count, setCount] = useState(0)

  return (
    <div className='pt-15'>
     <BrowserRouter>
       <Routes>
         <Route path="/" element={<LandingPage />} />
         <Route path="/home" element={<HomePage />} />
         <Route path="/register" element={<RegisterEmail />} />
         <Route path="/verify-otp" element={<OTPpage />} />
         <Route path="/register-details" element={<RegisterInfo />} />
         <Route path="/login" element={<LoginPage />} />
         <Route path="/verify-otp-login" element={<VerifyLoginOtp />} />
       </Routes>
     </BrowserRouter>
     {/* <BrowserRouter>
     <Test />
     </BrowserRouter> */}
     
    </div>
  )
}

export default App
