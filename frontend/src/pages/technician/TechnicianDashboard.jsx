import Navbar from '@/blocks/Navbar'
import Footer from '@/blocks/Footer'
import { useNavigate } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import '../../css/landingPage.css'
import axios from 'axios'
import Cookies from 'js-cookie'

const stats = [
  { label: "Completed Jobs", value: 24, key: "completed" },
  { label: "Pending Requests", value: 5, key: "pending" },
  { label: "Rating", value: "4.8/5" },
  { label: "Earnings (This Month)", value: "$2,340" },
];

function TechnicianDashboard() {
  const navigate = useNavigate()
  const [upcomingJobs, setUpcomingJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [statsCounts, setStatsCounts] = useState({
    completed: 0,
    pending: 0,
  })

  // Fetch technician bookings
  useEffect(() => {
    const fetchTechnicianBookings = async () => {
      try {
        setLoading(true)
        const token = Cookies.get('token') || localStorage.getItem('token')
        const response = await axios.get('/api/bookings/technician-bookings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.data && response.data.success) {
          // Calculate stats from all bookings
          const completedCount = response.data.bookings.filter(
            (booking) => booking.status === 'completed'
          ).length
          const pendingCount = response.data.bookings.filter(
            (booking) => booking.status === 'pending'
          ).length
          
          setStatsCounts({
            completed: completedCount,
            pending: pendingCount,
          })

          // Filter only pending and confirmed bookings
          const filteredBookings = response.data.bookings.filter(
            (booking) => booking.status === 'pending' || booking.status === 'confirmed'
          )
          
          // Map to format for display
          const formattedJobs = filteredBookings.map((booking) => ({
            id: booking._id,
            title: booking.technicianInfo?.servicetype || 'Service',
            customer: `${booking.userInfo?.firstname} ${booking.userInfo?.lastname}`,
            time: `${new Date(booking.serviceDate).toLocaleDateString()} at ${booking.serviceTime}`,
            status: booking.status.charAt(0).toUpperCase() + booking.status.slice(1),
          }))
          
          setUpcomingJobs(formattedJobs)
        }
      } catch (error) {
        console.error('Error fetching technician bookings:', error)
        setUpcomingJobs([])
      } finally {
        setLoading(false)
      }
    }

    fetchTechnicianBookings()
  }, [])

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
              <button onClick={() => navigate('/TechnicianBookings')} className="px-4 py-3 rounded-xl border text-left text-sm font-semibold hover:bg-stone-50 btn-transparent-slide">
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
                {item.key === 'completed' ? statsCounts.completed : item.key === 'pending' ? statsCounts.pending : item.value}
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
              <button 
                onClick={() => navigate('/TechnicianBookings')}
                className="text-sm text-color-main hover:underline"
              >
                View all
              </button>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="py-8 text-center">
                  <p className="text-stone-500">Loading bookings...</p>
                </div>
              ) : upcomingJobs.length > 0 ? (
                upcomingJobs.map((job) => (
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
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-stone-500">No pending or confirmed bookings</p>
                </div>
              )}
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
