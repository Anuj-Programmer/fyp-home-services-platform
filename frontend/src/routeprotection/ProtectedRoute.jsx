import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, requireAdmin = false, requireTechnician = false }) {
  const token = localStorage.getItem("token");

  // Check if token exists
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Decode JWT and check expiration
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = Date.now() >= payload.exp * 1000;
    if (isExpired) {
      localStorage.removeItem("token");
      localStorage.removeItem("user"); // optional
      return <Navigate to="/login" replace />;
    }
  } catch (err) {
    console.error("Invalid token", err);
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  // Get user from localStorage
const storedUser = localStorage.getItem("user");
let role = "user"; // default

if (storedUser) {
  try {
    role = JSON.parse(storedUser)?.role || "user";
  } catch (error) {
    console.error("Invalid user data in storage", error);
  }
}

// Role-based redirects
if (requireAdmin && role !== "admin") {
  return <Navigate to="/home" replace />;
}

// Only redirect admins away if they try to access a user-only route (requireAdmin=false AND route is explicitly user-only)
// Allow admins to access general pages like /profile
if (requireAdmin === false && role === "admin") {
  // Don't redirect — admins can access shared pages like profile
}

// Example: If you want a separate technician check
if (requireTechnician && role !== "technician") {
  return <Navigate to="/technician-dashboard" replace />;
}

return children;

}

export default ProtectedRoute;
