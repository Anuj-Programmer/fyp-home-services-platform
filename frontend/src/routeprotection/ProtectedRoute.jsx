import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, requireAdmin = false }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  let isAdmin = false;
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      isAdmin = Boolean(JSON.parse(storedUser)?.isAdmin);
    } catch (error) {
      console.error("Invalid user data in storage", error);
    }
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (!requireAdmin && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

export default ProtectedRoute;
