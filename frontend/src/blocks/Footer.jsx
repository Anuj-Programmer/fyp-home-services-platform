import React from 'react'
import { Link } from 'react-router-dom'
import Cookies from "js-cookie";
import Logo from "../assets/LogoLight.svg"

function Footer() {
  const token = Cookies.get("token") || localStorage.getItem("token");
  const isAuthenticated = Boolean(token);

  let isAdmin = false;
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      isAdmin = Boolean(JSON.parse(storedUser)?.isAdmin);
    } catch (error) {
      console.error("Invalid user data in storage", error);
    }
  }

  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to={isAdmin ? "/admin" : isAuthenticated ? "/home" : "/"}>
          <img src={Logo} alt="HomeCare Logo" className="h-8" />
        </Link>
        <p className="text-gray-400 text-sm">
          © 2026 HomeCare. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
