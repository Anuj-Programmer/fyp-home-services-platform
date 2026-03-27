import React, { useEffect, useMemo, useState } from "react";
import { apiClient } from '@/lib/api';
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Navbar from "@/blocks/Navbar";
import Footer from "@/blocks/Footer";

function TechnicianPayments() {
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const fetchEarningsHistory = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("token") || localStorage.getItem("token");

      if (!token) {
        toast.error("Please login to view your earnings");
        setEarnings([]);
        setTotalEarnings(0);
        return;
      }

      const response = await apiClient.get("/api/bookings/technician-earnings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data.success) {
        toast.error(response.data.message || "Failed to fetch earnings");
        setEarnings([]);
        setTotalEarnings(0);
        return;
      }

      setEarnings(response.data.history || []);
      setTotalEarnings(Number(response.data.totalEarnings || 0));
    } catch (error) {
      console.error("Error fetching earnings:", error);
      toast.error(error.response?.data?.message || "Failed to fetch earnings");
      setEarnings([]);
      setTotalEarnings(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsHistory();
  }, []);

  const formattedTotal = useMemo(
    () =>
      new Intl.NumberFormat("en-NP", {
        style: "currency",
        currency: "NPR",
        maximumFractionDigits: 0,
      }).format(totalEarnings),
    [totalEarnings]
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

      <main className="px-6 lg:px-32 pt-16 pb-16 min-h-screen bg-stone-50 space-y-8">
        <section className="space-y-4">
          <p className="text-sm font-semibold text-color-main uppercase tracking-wide">Earnings</p>
          <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">Payment & Earnings</h1>
          <p className="text-base text-stone-600 max-w-2xl">
            Track your completed service earnings and payment history.
          </p>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-stone-200 p-5 sm:p-6">
          <p className="text-sm text-stone-500 mb-2">Total Earnings</p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <h2 className="text-3xl sm:text-4xl font-bold txt-color-primary">{formattedTotal}</h2>
            <p className="text-sm text-stone-500">{earnings.length} payment(s) received</p>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-stone-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">Earnings History</h3>
            <button
              onClick={fetchEarningsHistory}
              disabled={loading}
              className="px-4 py-2 rounded-full bg-color-main text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="py-12 text-center">
                <p className="text-stone-500 text-base">Loading earnings history...</p>
              </div>
            ) : earnings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-stone-500 text-base">No earnings recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {earnings.map((earning) => (
                  <article
                    key={earning.id}
                    className="border border-stone-200 rounded-2xl p-4 sm:p-5 bg-white hover:shadow-sm transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm text-stone-500">Customer</p>
                        <p className="text-base font-semibold text-neutral-900">{earning.customerName}</p>
                        <p className="text-sm text-stone-600">Service Provided</p>
                      </div>

                      <div className="text-left sm:text-right space-y-1">
                        <p className="text-sm text-stone-500">Earned Amount</p>
                        <p className="text-xl font-bold text-color-main">{formatAmount(earning.amount)}</p>
                        <p className="text-xs text-stone-500">Paid on {formatDate(earning.paymentDate)}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-stone-500">Service Date</p>
                        <p className="font-medium text-neutral-900">{formatDate(earning.serviceDate)}</p>
                      </div>
                      <div>
                        <p className="text-stone-500">Service Time</p>
                        <p className="font-medium text-neutral-900">{earning.serviceTime || "-"}</p>
                      </div>
                      <div>
                        <p className="text-stone-500">Transaction ID</p>
                        <p className="font-medium text-neutral-900 break-all">{earning.transactionId || "-"}</p>
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

export default TechnicianPayments;
