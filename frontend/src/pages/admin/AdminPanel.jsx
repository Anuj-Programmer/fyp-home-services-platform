import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Navbar from "../../blocks/Navbar";
import Footer from "../../blocks/Footer";
import AdminSidebar from "./AdminSidebar";
import "../../css/landingPage.css";
import { useSocket } from "../../context/SocketContext";

function AdminPanel() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [isLoading, setIsLoading] = useState(true);
  
  // State for dashboard data
  const [techniciansCount, setTechniciansCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [technicians, setTechnicians] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleAdminDataChanged = (payload = {}) => {
      const changes = Array.isArray(payload.changes) ? payload.changes : [];
      if (
        changes.includes("dashboard-stats") ||
        changes.includes("technicians") ||
        changes.includes("users") ||
        changes.includes("bookings") ||
        changes.includes("revenue")
      ) {
        fetchDashboardData();
      }
    };

    socket.on("admin:dataChanged", handleAdminDataChanged);

    return () => {
      socket.off("admin:dataChanged", handleAdminDataChanged);
    };
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get("token") || localStorage.getItem("token");
      
      // Fetch stats from backend
      const statsResponse = await apiClient.get("/api/admin/dashboard-stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (statsResponse.data && statsResponse.data.success) {
        setTechniciansCount(statsResponse.data.stats.totalTechnicians);
        setUsersCount(statsResponse.data.stats.totalUsers);
        setBookingsCount(statsResponse.data.stats.totalBookings);
      }
      
      // Fetch technicians using the same admin endpoint as APTechnician
      const techResponse = await apiClient.get("/api/admin/technicians", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const techData = techResponse.data.technicians || [];
      const newestTechnicians = [...techData]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);
      setTechnicians(newestTechnicians);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    { label: "Total Technicians", value: techniciansCount },
    { label: "Total Users", value: usersCount },
    { label: "Total Bookings", value: bookingsCount },
  ];

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-stone-50 pt-10">
        <AdminSidebar />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-12 pb-8 space-y-6 lg:space-y-8">
          {/* Mobile header */}
          <div className="lg:hidden sticky top-16 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-white border-b border-stone-200 flex items-center gap-3 mb-2">
            <button
              onClick={() => window.dispatchEvent(new Event("open-admin-sidebar"))}
              className="p-2 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-semibold text-stone-800 text-sm">Admin Dashboard</span>
          </div>

          <section className="space-y-4 pt-4 lg:pt-8">
            <p className="text-sm font-semibold text-color-main uppercase tracking-wide">
              Admin Dashboard
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">
              Manage your platform efficiently
            </h1>
            <p className="text-base text-stone-500 max-w-2xl">
              Monitor all activities, manage users, technicians, and bookings.
              Keep track of your platform's growth and performance.
            </p>
          </section>

          {/* Stats Cards */}
          <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.label}
                className="p-5 rounded-2xl bg-white shadow-sm border flex flex-col gap-1"
              >
                <span className="text-sm text-stone-500">{item.label}</span>
                <strong className="text-2xl font-semibold txt-color-primary">
                  {item.value}
                </strong>
              </div>
            ))}
          </section>

          {/* Content Section */}
          <section className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="p-6">
              <div className="space-y-6">
                {/* Technicians List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold txt-color-primary">
                      Recent Technicians
                    </h2>
                    <button 
                      onClick={() => navigate("/AdminTechnicians")}
                      className="text-sm text-color-main hover:underline">
                      View all
                    </button>
                  </div>
                  <div className="rounded-xl border overflow-hidden">
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-stone-50 border-b">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Technician Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Specialty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 bg-white">
                          {isLoading ? (
                            <tr><td colSpan="2" className="px-6 py-8 text-center text-stone-500">Loading technicians...</td></tr>
                          ) : technicians.length > 0 ? (
                            technicians.map((tech, index) => (
                              <tr key={tech._id || index} className="hover:bg-stone-50">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-color-main flex items-center justify-center text-white font-semibold text-sm">
                                      {(tech.firstName || tech.firstname)?.[0]}
                                      {(tech.lastName || tech.lastname)?.[0]}
                                    </div>
                                    <span className="font-medium text-stone-900">
                                      {tech.firstName || tech.firstname} {tech.lastName || tech.lastname}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-stone-700">{tech.serviceType || tech.servicetype}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="2" className="px-6 py-8 text-center text-stone-500">No technicians found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile card view */}
                    <div className="md:hidden p-3 space-y-2">
                      {isLoading ? (
                        <p className="py-8 text-center text-stone-500 text-sm">Loading technicians...</p>
                      ) : technicians.length > 0 ? (
                        technicians.map((tech, index) => (
                          <div
                            key={tech._id || index}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-stone-100 hover:bg-stone-50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-color-main flex items-center justify-center text-white font-semibold text-xs shrink-0">
                                {(tech.firstName || tech.firstname)?.[0]}
                                {(tech.lastName || tech.lastname)?.[0]}
                              </div>
                              <span className="font-medium text-stone-900 text-sm truncate">
                                {tech.firstName || tech.firstname} {tech.lastName || tech.lastname}
                              </span>
                            </div>
                            <span className="text-xs text-stone-500 shrink-0">{tech.serviceType || tech.servicetype}</span>
                          </div>
                        ))
                      ) : (
                        <p className="py-8 text-center text-stone-500 text-sm">No technicians found</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Platform Overview */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="p-6 rounded-2xl bg-white border space-y-4">
                    <h2 className="text-xl font-semibold txt-color-primary">
                      Platform Statistics
                    </h2>
                    <ul className="space-y-3 text-sm text-stone-600">
                      <li className="flex justify-between">
                        <span>• Active Technicians:</span>
                        <strong className="txt-color-primary">{techniciansCount}</strong>
                      </li>
                      <li className="flex justify-between">
                        <span>• Registered Users:</span>
                        <strong className="txt-color-primary">{usersCount}</strong>
                      </li>
                      <li className="flex justify-between">
                        <span>• Total Bookings:</span>
                        <strong className="txt-color-primary">{bookingsCount}</strong>
                      </li>
                      <li className="flex justify-between">
                        <span>• Monthly Revenue:</span>
                        <strong className="txt-color-primary">View Revenue Page →</strong>
                      </li>
                    </ul>
                  </div>

                  <div className="p-6 rounded-2xl bg-white border space-y-4">
                    <h2 className="text-xl font-semibold txt-color-primary">
                      Admin Notes
                    </h2>
                    <ul className="space-y-3 text-sm text-stone-600">
                      <li>• Review pending technician applications daily</li>
                      <li>• Monitor booking disputes and resolve within 24hrs</li>
                      <li>• Verify new user registrations for authenticity</li>
                      <li>• Update platform policies and notify users</li>
                    </ul>
                  </div>
                </div>
                </div>
            </div>
          </section>
        </main>
      </div>
  
    </>
  );
}

export default AdminPanel;