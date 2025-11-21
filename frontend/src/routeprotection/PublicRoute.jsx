import React from "react";
import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";

function PublicRoute({ children }) {
  // Check if the user is logged in and has a 'user' role
  const token = localStorage.getItem("token");
  const author = localStorage.getItem("author");

  if (token) {
    if (author === "user") {
      // Redirect the 'user' to the home page
      return <Navigate to="/home" />;
    } else if (author === "admin") {
      // Redirect the 'admin' to the admin page
      return <Navigate to="/admin" />;
    }
  }

  // If no token or author, show the children (the route should be accessible)
  return children;
}

export default PublicRoute;