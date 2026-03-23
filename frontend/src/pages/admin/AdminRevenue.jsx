import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Navbar from "@/blocks/Navbar";
import Footer from "@/blocks/Footer";
import AdminSidebar from "./AdminSidebar";

function AdminRevenue() {
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchAdminRevenue = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("token") || localStorage.getItem("token");

      if (!token) {
        toast.error("Please login to view revenue");
        setRevenue([]);
        setTotalRevenue(0);
        return;
      }

      const response = await axios.get("/api/bookings/admin-revenue", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data.success) {
        toast.error(response.data.message || "Failed to fetch revenue data");
        setRevenue([]);
        setTotalRevenue(0);
        return;
      }

      setRevenue(response.data.revenue || []);
      setTotalRevenue(Number(response.data.totalRevenue || 0));
    } catch (error) {
      console.error("Error fetching revenue:", error);
      if (error.response?.status === 403) {
        toast.error("You do not have permission to view revenue data");
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch revenue data");
      }
      setRevenue([]);
      setTotalRevenue(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminRevenue();
  }, []);

  const formattedTotal = useMemo(
    () =>
      new Intl.NumberFormat("en-NP", {
        style: "currency",
        currency: "NPR",
        maximumFractionDigits: 0,
      }).format(totalRevenue),
    [totalRevenue]
  );

  const formatAmount = (value) =>
    new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    return new Date(dateValue).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <Navbar />
      <AdminSidebar />

      <main className="lg:ml-64 px-6 lg:px-8 pt-16 pb-16 min-h-screen bg-stone-50 space-y-8">
        <section className="space-y-4">
          <p className="text-sm font-semibold text-color-main uppercase tracking-wide">Administration</p>
          <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">Platform Revenue</h1>
          <p className="text-base text-stone-600 max-w-2xl">
            Track your platform revenue from service fees (50 NPR per transaction).
          </p>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-stone-200 p-5 sm:p-6">
          <p className="text-sm text-stone-500 mb-2">Total Platform Revenue</p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <h2 className="text-3xl sm:text-4xl font-bold txt-color-primary">{formattedTotal}</h2>
            <p className="text-sm text-stone-500">{revenue.length} payment(s) processed</p>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          <div className="p-5 rounded-2xl bg-white shadow-sm border">
            <p className="text-sm text-stone-500 mb-2">Fee per Payment</p>
            <p className="text-2xl font-semibold txt-color-primary">Rs. 50</p>
          </div>
          <div className="p-5 rounded-2xl bg-white shadow-sm border">
            <p className="text-sm text-stone-500 mb-2">Total Payments</p>
            <p className="text-2xl font-semibold txt-color-primary">{revenue.length}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white shadow-sm border">
            <p className="text-sm text-stone-500 mb-2">Average Transaction</p>
            <p className="text-2xl font-semibold txt-color-primary">
              {revenue.length > 0 ? formatAmount(revenue.reduce((sum, p) => sum + p.totalAmount, 0) / revenue.length) : "Rs. 0"}
            </p>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-stone-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">Revenue Details</h3>
            <button
              onClick={fetchAdminRevenue}
              disabled={loading}
              className="px-4 py-2 rounded-full bg-color-main text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="py-12 text-center">
                <p className="text-stone-500 text-base">Loading revenue data...</p>
              </div>
            ) : revenue.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-stone-500 text-base">No revenue recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {revenue.map((item) => (
                  <article
                    key={item.id}
                    className="border border-stone-200 rounded-2xl p-4 sm:p-5 bg-white hover:shadow-sm transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div className="space-y-1">
                        <p className="text-sm text-stone-500">Customer</p>
                        <p className="text-base font-semibold text-neutral-900">{item.customerName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-stone-500">Service Provider</p>
                        <p className="text-base font-semibold text-neutral-900">{item.technicianName}</p>
                      </div>
                      <div className="text-left sm:text-right space-y-1">
                        <p className="text-sm text-stone-500">Platform Fee</p>
                        <p className="text-xl font-bold text-color-main">{formatAmount(item.platformFee)}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-stone-500">Service Type</p>
                        <p className="font-medium text-neutral-900">{item.serviceType}</p>
                      </div>
                      <div>
                        <p className="text-stone-500">Service Date</p>
                        <p className="font-medium text-neutral-900">{formatDate(item.serviceDate)}</p>
                      </div>
                      <div>
                        <p className="text-stone-500">Total Transaction</p>
                        <p className="font-medium text-neutral-900">{formatAmount(item.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-stone-500">Payment Date</p>
                        <p className="font-medium text-neutral-900">{formatDate(item.paidAt)}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default AdminRevenue
