import Navbar from '@/blocks/Navbar'
import Footer from '@/blocks/Footer'
import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import '../../css/landingPage.css'
import Cookies from 'js-cookie'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function ManageTiming() {
  const [availability, setAvailability] = useState({
    Monday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    Tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    Wednesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    Thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    Friday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    Saturday: { isAvailable: false, startTime: '10:00', endTime: '16:00' },
    Sunday: { isAvailable: false, startTime: '10:00', endTime: '16:00' },
  })

  const handleToggleDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isAvailable: !prev[day].isAvailable
      }
    }))
  }

  const handleTimeChange = (day, type, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: value
      }
    }))
  }

  const handleSaveAvailability = async () => {
    try {
      const token = localStorage.getItem('token') || Cookies.get('token')
      const user = JSON.parse(localStorage.getItem('user'))
      
      if (!token) {
        toast.error('Please log in first')
        return
      }

      const technicianId = user?.id || user?._id

      const { data } = await axios.put(
        '/api/technicians/availability',
        { availability, technicianId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      toast.success(data.message || 'Availability updated successfully')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Error updating availability')
    }
  }

  return (
    <>
      <Navbar />
      <main className="w-full px-6 lg:px-32 pt-24 pb-16 min-h-screen bg-stone-50">
        <section className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-color-main uppercase tracking-wide">
              Schedule Management
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">
              Manage your availability
            </h1>
            <p className="text-base text-stone-500">
              Set your working hours for each day of the week. Customers will only see 
              your available time slots.
            </p>
          </div>

          {/* Availability Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {DAYS.map((day) => (
              <div
                key={day}
                className="p-5 rounded-2xl bg-white shadow-sm border space-y-4"
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold txt-color-primary">{day}</h3>
                  <button
                    onClick={() => handleToggleDay(day)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      availability[day].isAvailable
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {availability[day].isAvailable ? 'Available' : 'Unavailable'}
                  </button>
                </div>

                {/* Time Inputs */}
                {availability[day].isAvailable && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex gap-3 items-center">
                      <label className="text-sm font-medium text-stone-600 w-16">
                        From:
                      </label>
                      <input
                        type="time"
                        value={availability[day].startTime}
                        onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-color-main"
                      />
                    </div>
                    <div className="flex gap-3 items-center">
                      <label className="text-sm font-medium text-stone-600 w-16">
                        To:
                      </label>
                      <input
                        type="time"
                        value={availability[day].endTime}
                        onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-color-main"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex gap-4 justify-end pt-6 border-t">
            <button className="px-6 py-3 rounded-xl border text-sm font-semibold hover:bg-stone-50 btn-transparent-slide">
              Reset to default
            </button>
            <button
              onClick={handleSaveAvailability}
              className="px-6 py-3 rounded-xl bg-color-main text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              Save changes
            </button>
          </div>

          {/* Info Box */}
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
            <h4 className="font-semibold text-blue-900">📌 Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Toggle a day to mark yourself unavailable on that day</li>
              <li>• Set your working hours in 24-hour format (e.g., 09:00 for 9 AM)</li>
              <li>• Your availability will be visible to all customers</li>
              <li>• Changes take effect immediately after saving</li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default ManageTiming
