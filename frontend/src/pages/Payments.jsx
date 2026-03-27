import React, { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Navbar from "@/blocks/Navbar";
import Footer from "@/blocks/Footer";

function Payments() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("token") || localStorage.getItem("token");

      if (!token) {
        toast.error("Please login to view your payment history");
        setPayments([]);
        setTotalPaid(0);
        return;
      }

      const response = await apiClient.get("/api/bookings/user-payments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data.success) {
        toast.error(response.data.message || "Failed to fetch payment history");
        setPayments([]);
        setTotalPaid(0);
        return;
      }

      setPayments(response.data.history || []);
      setTotalPaid(Number(response.data.totalPaid || 0));
    } catch (error) {
      console.error("Error fetching payment history:", error);
      toast.error(error.response?.data?.message || "Failed to fetch payment history");
      setPayments([]);
      setTotalPaid(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const formattedTotal = useMemo(
    () =>
      new Intl.NumberFormat("en-NP", {
        style: "currency",
        currency: "NPR",
        maximumFractionDigits: 0,
      }).format(totalPaid),
    [totalPaid]
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
          <p className="text-sm font-semibold text-color-main uppercase tracking-wide">Payments</p>
          <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">Payment History</h1>
          <p className="text-base text-stone-600 max-w-2xl">
            View your paid booking history and total amount spent.
          </p>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-stone-200 p-5 sm:p-6">
          <p className="text-sm text-stone-500 mb-2">Total Payment</p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <h2 className="text-3xl sm:text-4xl font-bold txt-color-primary">{formattedTotal}</h2>
            <p className="text-sm text-stone-500">{payments.length} payment(s)</p>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-stone-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">History</h3>
            <button
              onClick={fetchPaymentHistory}
              disabled={loading}
              className="px-4 py-2 rounded-full bg-color-main text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="py-12 text-center">
                <p className="text-stone-500 text-base">Loading payment history...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-stone-500 text-base">No payment history found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <article
                    key={payment.id}
                    className="border border-stone-200 rounded-2xl p-4 sm:p-5 bg-white hover:shadow-sm transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm text-stone-500">Technician</p>
                        <p className="text-base font-semibold text-neutral-900">{payment.technicianName}</p>
                        <p className="text-sm text-stone-600">{payment.serviceType}</p>
                      </div>

                      <div className="text-left sm:text-right space-y-1">
                        <p className="text-sm text-stone-500">Paid Amount</p>
                        <p className="text-xl font-bold text-color-main">{formatAmount(payment.amount)}</p>
                        <p className="text-xs text-stone-500">Paid on {formatDate(payment.paymentDate)}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-stone-500">Service Date</p>
                        <p className="font-medium text-neutral-900">{formatDate(payment.serviceDate)}</p>
                      </div>
                      <div>
                        <p className="text-stone-500">Service Time</p>
                        <p className="font-medium text-neutral-900">{payment.serviceTime || "-"}</p>
                      </div>
                      <div>
                        <p className="text-stone-500">Transaction ID</p>
                        <p className="font-medium text-neutral-900 break-all">{payment.transactionId || "-"}</p>
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

export default Payments;
