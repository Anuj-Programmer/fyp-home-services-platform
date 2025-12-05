import React from "react";
import { Navigate } from "react-router-dom";

function PublicRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = Date.now() >= payload.exp * 1000;

      if (isExpired) {
        // Remove expired token and user data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return children; // Let them access the public page
      }

      // Token is valid, redirect based on role
      let userObj = null;
      try {
        userObj = JSON.parse(user);
      } catch (e) {
        console.error("Invalid user data", e);
      }

      if (userObj) {
        if (userObj.isAdmin) return <Navigate to="/admin" />;
        if (userObj.role === "technician") return <Navigate to="/technician-dashboard" />;
        return <Navigate to="/home" />; // Default to home for regular users
      }
    } catch (err) {
      console.error("Invalid token", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return children;
    }
  }

  return children; // No token, show public route
}

export default PublicRoute;
