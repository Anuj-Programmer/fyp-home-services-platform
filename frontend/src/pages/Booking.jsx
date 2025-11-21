import React from "react";
import Navbar from "@/blocks/Navbar";
import Footer from "@/blocks/Footer";
import "../css/landingPage.css";

const activeBookings = [
  {
    id: "BK-2045",
    service: "Deep Cleaning",
    date: "Mon, 24 Nov • 10:00 AM",
    technician: "Amit Sharma",
    status: "Confirmed",
    address: "Lazimpat, Kathmandu",
  },
  {
    id: "BK-2042",
    service: "Plumbing Check",
    date: "Wed, 27 Nov • 8:30 AM",
    technician: "Rachin Verma",
    status: "Pending",
    address: "Jawalakhel, Lalitpur",
  },
];

const pastBookings = [
  {
    id: "BK-1988",
    service: "Electrical Inspection",
    date: "13 Nov 2025",
    technician: "Ramesh Patel",
    rating: 4.9,
    amount: "$42.00",
  },
  {
    id: "BK-1971",
    service: "Gardening Maintenance",
    date: "02 Nov 2025",
    technician: "Dib Rai",
    rating: 4.6,
    amount: "$30.00",
  },
  {
    id: "BK-1920",
    service: "Window Cleaning",
    date: "29 Oct 2025",
    technician: "Amit Sharma",
    rating: 5.0,
    amount: "$55.00",
  },
];

function Booking() {
  return (
    <>
      <Navbar />
      <main className="px-6 lg:px-32 pt-24 pb-16 min-h-screen bg-stone-50 space-y-12">
        {/* Header */}
        <section className="flex flex-col lg:flex-row items-start justify-between gap-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-color-main uppercase tracking-wide">
              Booking Center
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">
              Track every home service in one place
            </h1>
            <p className="text-base text-stone-600 max-w-2xl">
              See upcoming appointments, manage reschedules, and review your
              past services with trusted professionals.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button className="px-5 py-3 bg-color-main text-white rounded-xl font-semibold btn-filled-slide">
              Book new service
            </button>
            {/* <button className="px-5 py-3 border border-color-main text-color-main rounded-xl font-semibold btn-transparent-slide">
              Download history
            </button> */}
          </div>
        </section>

        {/* Active bookings */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold txt-color-primary">
                Upcoming & active bookings
              </h2>
              <p className="text-sm text-stone-500">
                Manage confirmed and pending visits
              </p>
            </div>
            <button className="text-sm text-color-main hover:underline">
              Need help?
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {activeBookings.map((booking) => (
              <article
                key={booking.id}
                className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-stone-500">
                      {booking.id}
                    </p>
                    <h3 className="text-lg font-semibold txt-color-primary">
                      {booking.service}
                    </h3>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      booking.status === "Confirmed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>

                <p className="text-sm text-stone-600">{booking.date}</p>
                <p className="text-sm text-stone-600">
                  {booking.address}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-neutral-900">
                    Technician: {booking.technician}
                  </span>
                  <div className="flex gap-2">
                    <button className="text-color-main font-semibold hover:underline">
                      Reschedule
                    </button>
                    <button className="text-stone-500 hover:text-red-500">
                      Cancel
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Past bookings table */}
        <section className="bg-white rounded-3xl shadow-sm border overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b">
            <div>
              <h2 className="text-xl font-semibold txt-color-primary">
                Service history
              </h2>
              <p className="text-sm text-stone-500">
                Ratings, invoices, and payment status
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <button className="px-4 py-2 border rounded-lg hover:bg-stone-50">
                This month
              </button>
              <button className="px-4 py-2 border rounded-lg hover:bg-stone-50">
                Last 6 months
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-stone-500 uppercase text-xs tracking-wide border-b">
                  <th className="px-6 py-4 font-semibold">Booking ID</th>
                  <th className="px-6 py-4 font-semibold">Service</th>
                  <th className="px-6 py-4 font-semibold">Technician</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Rating</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pastBookings.map((booking) => (
                  <tr key={booking.id} className="border-b last:border-0">
                    <td className="px-6 py-4 font-semibold text-neutral-900">
                      {booking.id}
                    </td>
                    <td className="px-6 py-4">{booking.service}</td>
                    <td className="px-6 py-4">{booking.technician}</td>
                    <td className="px-6 py-4">{booking.date}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-600">
                      {booking.rating}
                    </td>
                    <td className="px-6 py-4 font-semibold">{booking.amount}</td>
                    <td className="px-6 py-4">
                      <button className="text-color-main hover:underline">
                        View invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default Booking;
