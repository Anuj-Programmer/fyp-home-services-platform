import React from 'react'
import { Link } from 'react-router-dom'
import Cookies from "js-cookie";
import Logo from "../assets/LogoLight.png"

function Footer() {
  const token = Cookies.get("token") || localStorage.getItem("token");
  const isAuthenticated = Boolean(token);

  return (
     <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6 flex flex-col lg:flex-row justify-between gap-10">
          <div>
            <div className='mb-7'>
            <Link to={isAuthenticated ? "/home" : "/"} >
            <img src={Logo} alt="HomeCare Logo" />
            </Link>
          </div>
            <p className="text-gray-400">
              Stay updated with our latest cleaning tips, service updates, and
              more.
            </p>
          </div>
          <div className="flex gap-16">
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Services</li>
                <li>Our Team</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">More</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Support</li>
                <li>Privacy Policy</li>
                <li>Terms & Conditions</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="text-center mt-12 text-gray-500">
          © 2025 HomeCare. All rights reserved.
        </div>
      </footer>
  )
}

export default Footer
