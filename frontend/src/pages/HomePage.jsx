import React from 'react'
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    // Clear user session data (e.g., tokens, user info)
    localStorage.clear();
    // Redirect to login or landing page
    navigate('/');
  }
  return (
    <div>
      Home page
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}

export default HomePage
