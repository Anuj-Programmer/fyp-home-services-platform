import React, { useMemo, useState } from "react";
import { apiClient } from "@/lib/api";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Navbar from "../../blocks/Navbar";
import AdminSidebar from "./AdminSidebar";

function AdminNotification() {
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    message: "",
    target: "all",
    onClickPath: "",
    type: "admin_broadcast",
  });
  const [lastResult, setLastResult] = useState(null);

  const audienceLabel = useMemo(() => {
    if (formData.target === "users") return "All Users";
    if (formData.target === "technicians") return "All Technicians";
    return "All Users and Technicians";
  }, [formData.target]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      message: "",
      target: "all",
      onClickPath: "",
      type: "admin_broadcast",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.message.trim()) {
      toast.error("Notification message is required");
      return;
    }

    try {
      setSending(true);
      const token = Cookies.get("token") || localStorage.getItem("token");

      if (!token) {
        toast.error("Please login as admin first");
        return;
      }

      const payload = {
        message: formData.message.trim(),
        target: formData.target,
        type: formData.type.trim() || "admin_broadcast",
        onClickPath: formData.onClickPath.trim(),
      };

      const { data } = await apiClient.post(
        "/api/admin/broadcast-notification",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setLastResult(data);
      toast.success(data.message || "Notification sent");
      resetForm();
    } catch (error) {
      console.error("Broadcast failed:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to send notification. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-stone-50 pt-10">
        <AdminSidebar />

        <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-12 pb-8 space-y-6 lg:space-y-8">
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
            <span className="font-semibold text-stone-800 text-sm">Admin Notifications</span>
          </div>

          <section className="space-y-3 pt-4 lg:pt-8">
            <p className="text-sm font-semibold text-color-main uppercase tracking-wide">
              Admin Dashboard
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">
              Broadcast Notifications
            </h1>
            <p className="text-base text-stone-500 max-w-2xl">
              Send announcements to users, technicians, or both. Notifications are sent in real-time and saved in database.
            </p>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-2xl border shadow-sm p-5 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Audience
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { label: "All", value: "all" },
                      { label: "Users", value: "users" },
                      { label: "Technicians", value: "technicians" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, target: option.value }))
                        }
                        className={`px-3 py-2 rounded-xl border text-sm font-medium transition ${
                          formData.target === option.value
                            ? "bg-color-main text-white border-color-main"
                            : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2" htmlFor="message">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write the notification message..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-color-main focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2" htmlFor="onClickPath">
                      Click Path (optional)
                    </label>
                    <input
                      id="onClickPath"
                      name="onClickPath"
                      value={formData.onClickPath}
                      onChange={handleChange}
                      placeholder="/bookings"
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-color-main focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2" htmlFor="type">
                      Notification Type
                    </label>
                    <input
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      placeholder="admin_broadcast"
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-color-main focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-2.5 rounded-xl bg-color-main text-white font-semibold btn-filled-slide disabled:opacity-60"
                  >
                    {sending ? "Sending..." : "Send Notification"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={sending}
                    className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-5 sm:p-6 space-y-4">
              <h2 className="text-lg font-semibold txt-color-primary">Preview</h2>
              <div className="rounded-xl border border-stone-200 p-4 bg-stone-50 space-y-2">
                <p className="text-xs uppercase tracking-wide text-stone-500">Audience</p>
                <p className="font-semibold text-stone-900">{audienceLabel}</p>
                <p className="text-xs uppercase tracking-wide text-stone-500 pt-2">Message</p>
                <p className="text-sm text-stone-700 whitespace-pre-wrap">
                  {formData.message.trim() || "Your message will appear here."}
                </p>
              </div>

              {lastResult && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-1">
                  <p className="text-sm font-semibold text-emerald-800">Last Broadcast</p>
                  <p className="text-sm text-emerald-700">
                    Users: {lastResult?.counts?.users || 0}
                  </p>
                  <p className="text-sm text-emerald-700">
                    Technicians: {lastResult?.counts?.technicians || 0}
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default AdminNotification;
