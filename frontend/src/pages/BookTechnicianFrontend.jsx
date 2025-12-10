import React, { useState } from 'react';
import { Star, ArrowLeft, CurrencyCircleDollar, Wrench, MapPin, CheckCircle } from 'phosphor-react';
import Navbar from '@/blocks/Navbar';
import Footer from '@/blocks/Footer';
import { Toaster, toast } from 'react-hot-toast';

function BookTechnicianFrontend() {
  // Dummy technician data
  const technician = {
    photoUrl: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80',
    firstName: 'Amit',
    lastName: 'Sharma',
    serviceType: 'Plumbing',
    averageRating: 4.7,
    reviews: [
      { rating: 5, comment: 'Great work, very professional!', customer: 'Ramesh' },
      { rating: 4, comment: 'On time and polite.', customer: 'Sita' },
      { rating: 5, comment: 'Solved my problem quickly.', customer: 'Hari' },
      { rating: 5, comment: 'Highly recommended!', customer: 'Gita' },
    ],
    fee: 1200,
    experienceYears: 5,
    location: 'Kathmandu',
    description: 'Experienced plumber with 5+ years in residential and commercial plumbing.',
    highlights: [
      'Punctual and reliable',
      'Specializes in kitchen & bathroom setups',
      '24/7 emergency service available',
    ],
    availability: [
      {
        day: 'Monday',
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 60,
      },
      {
        day: 'Tuesday',
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 60,
      },
      {
        day: 'Wednesday',
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 60,
      },
      {
        day: 'Thursday',
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 60,
      },
      {
        day: 'Friday',
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 60,
      },
    ],
  };

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Generate slots when date is picked
  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedTime('');
    if (!date) {
      setAvailableSlots([]);
      return;
    }
    const selectedDateObj = new Date(date);
    const dayName = selectedDateObj.toLocaleString('en-US', { weekday: 'long' });
    const dayAvailability = technician.availability.find((slot) => slot.day === dayName);
    if (dayAvailability) {
      setAvailableSlots(
        generateTimeSlots(dayAvailability.startTime, dayAvailability.endTime, dayAvailability.slotDuration)
      );
    } else {
      setAvailableSlots([]);
      toast.error(`Technician is not available on ${dayName}s`);
    }
  };

  // Generate time slots
  const generateTimeSlots = (startTime, endTime, duration) => {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    let currentHour = startHour;
    let currentMin = startMin;
    const endTotalMin = endHour * 60 + endMin;
    while (currentHour * 60 + currentMin < endTotalMin) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push(timeStr);
      currentMin += duration;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }
    return slots;
  };

  // Dummy booking handler
  const handleBookNow = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }
    setBookingLoading(true);
    setTimeout(() => {
      toast.success('Booking confirmed! (Demo only)');
      setBookingLoading(false);
    }, 1200);
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar />
      <div className="min-h-screen md:min-h-[calc(100vh-64px)] bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row gap-8">
          {/* Left: Big Photo & Info */}
          <div className="md:w-1/2 w-full flex flex-col items-center md:items-start">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-lg bg-white">
              <img
                src={technician.photoUrl}
                alt={technician.firstName}
                className="w-full h-80 object-cover md:h-[420px]"
              />
              {/* Overlayed rating */}
              <div className="absolute bottom-4 left-4 bg-white/90 px-4 py-2 rounded-full flex items-center gap-2 shadow">
                <Star size={20} weight="fill" className="text-yellow-400" />
                <span className="font-bold text-gray-800 text-lg">{technician.averageRating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({technician.reviews.length} reviews)</span>
              </div>
            </div>
            {/* About Section */}
            <div className="w-full mt-8 bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold txt-color-primary mb-2">About</h2>
              <p className="text-gray-700 mb-3">{technician.description}</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                {technician.highlights.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
              {/* Expertise/Experience Headings */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-1">Expertise</h3>
                <p className="text-gray-600">{technician.serviceType}</p>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-gray-800 mb-1">Experience</h3>
                <p className="text-gray-600">{technician.experienceYears} years in the field</p>
              </div>
            </div>
            {/* Reviews Section */}
            <div className="w-full mt-8 bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold txt-color-primary mb-4 flex items-center gap-2">
                <CheckCircle size={22} className="text-green-500" /> Customer Reviews
              </h2>
              <div className="space-y-4">
                {technician.reviews.map((review, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Star size={16} weight="fill" className="text-yellow-400" />
                      <span className="font-semibold text-gray-700">{review.rating}</span>
                      <span className="text-gray-500 text-xs">by {review.customer}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{review.comment}</p>
                  </div>
                ))}
                {technician.reviews.length === 0 && (
                  <p className="text-gray-500">No reviews yet.</p>
                )}
              </div>
            </div>
          </div>
          {/* Right: Booking Panel */}
          <div className="md:w-1/2 w-full flex flex-col gap-8">
            <div className="bg-white rounded-xl shadow p-8 flex flex-col gap-6 sticky top-24">
              <h2 className="text-2xl font-bold txt-color-primary mb-2">Book Appointment</h2>
              {/* Info Row in Booking Panel */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3 w-full sm:w-auto">
                  <CurrencyCircleDollar size={22} className="text-color-main" />
                  <span className="font-semibold text-gray-700">Rs. {technician.fee}</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3 w-full sm:w-auto">
                  <Wrench size={22} className="text-color-main" />
                  <span className="font-semibold text-gray-700">{technician.experienceYears} years</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3 w-full sm:w-auto">
                  <MapPin size={22} className="text-color-main" />
                  <span className="font-semibold text-gray-700">{technician.location}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  min={getMinDate()}
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-color-main"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Select Time Slot</label>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 px-3 rounded-lg border-2 font-medium transition ${
                          selectedTime === slot
                            ? 'border-color-main bg-color-main text-white'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-color-main'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : selectedDate ? (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-red-600 text-sm font-medium">
                      No available slots for this date. Please select another date.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-sm">Please select a date first</p>
                  </div>
                )}
              </div>
              {selectedDate && selectedTime && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600">
                    <strong>Scheduled for:</strong>{' '}
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}{' '}
                    at {selectedTime}
                  </p>
                </div>
              )}
              <button
                onClick={handleBookNow}
                disabled={bookingLoading || !selectedDate || !selectedTime}
                className={`w-full py-4 px-6 rounded-lg font-bold text-lg text-white transition mt-2 ${
                  bookingLoading || !selectedDate || !selectedTime
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-color-main hover:bg-blue-700 btn-filled-slide'
                }`}
              >
                {bookingLoading ? 'Processing...' : 'Book Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default BookTechnicianFrontend;
