import Navbar from '@/blocks/Navbar'
import Footer from '@/blocks/Footer'
import { useNavigate } from 'react-router-dom'
import React from 'react'
import '../../css/landingPage.css'

const stats = [
  { label: "Completed Jobs", value: 24 },
  { label: "Pending Requests", value: 5 },
  { label: "Rating", value: "4.8/5" },
  { label: "Earnings (This Month)", value: "$2,340" },
];

const upcomingJobs = [
  {
    id: 1,
    title: "Plumbing repair",
    customer: "John Doe",
    time: "Today at 2:00 PM",
    status: "Confirmed",
  },
  {
    id: 2,
    title: "Electrical inspection",
    customer: "Sarah Khan",
    time: "Tomorrow at 10:00 AM",
    status: "Confirmed",
  },
  {
    id: 3,
    title: "AC maintenance",
    customer: "Mike Johnson",
    time: "Dec 7 at 3:30 PM",
    status: "Pending confirmation",
  },
];

function TechnicianDashboard() {
  const navigate = useNavigate()

  return (
    <>
      <Navbar />
      <main className="w-full px-6 lg:px-32 pt-24 pb-16 space-y-10 min-h-screen bg-stone-50">
        <section className="flex flex-col lg:flex-row justify-between gap-6">
          <div className="flex-1 space-y-4">
            <p className="text-sm font-semibold text-color-main uppercase tracking-wide">
              Technician dashboard
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">
              Manage your work and grow your business
            </h1>
            <p className="text-base text-stone-500 max-w-2xl">
              Track your upcoming jobs, manage your availability, and build your 
              professional profile to attract more customers.
            </p>
          </div>

          <div className="w-full lg:w-80 p-5 rounded-2xl bg-white shadow-sm border">
            <p className="text-xs font-semibold text-stone-500 mb-3">
              Quick actions
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate('/technician-profile')}
                className="px-4 py-3 rounded-xl border text-left text-sm font-semibold hover:bg-stone-50 btn-transparent-slide"
              >
                Manage profile
              </button>
              {/* <button 
                onClick={() => navigate('/manage-timing')}
                className="px-4 py-3 rounded-xl border text-left text-sm font-semibold hover:bg-stone-50 btn-transparent-slide"
              >
                Manage timing
              </button> */}
              <button onClick={() => navigate('/bookings')} className="px-4 py-3 rounded-xl border text-left text-sm font-semibold hover:bg-stone-50 btn-transparent-slide">
                View Bookings
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white shadow-sm border space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold txt-color-primary">
                  Upcoming jobs
                </h2>
                <p className="text-sm text-stone-500">
                  Your scheduled service appointments
                </p>
              </div>
              <button className="text-sm text-color-main hover:underline">
                View all
              </button>
            </div>

            <div className="space-y-4">
              {upcomingJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-xl border bg-stone-50 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold txt-color-primary">
                      {job.title}
                    </h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      job.status === "Confirmed" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600">Customer: {job.customer}</p>
                  <p className="text-xs text-stone-500">{job.time}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white shadow-sm border space-y-4">
            <h2 className="text-xl font-semibold txt-color-primary">
              Tips for success
            </h2>
            <ul className="space-y-3 text-sm text-stone-600">
              <li>• Keep your profile updated with current certifications.</li>
              <li>• Respond to job requests within 2 hours for better ratings.</li>
              <li>• Maintain a 4.5+ star rating to unlock premium jobs.</li>
              <li>• Update your availability calendar regularly.</li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default TechnicianDashboard
