import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { Star, ArrowLeft, CurrencyCircleDollar, Wrench, MapPin, CheckCircle } from 'phosphor-react';
import Navbar from '@/blocks/Navbar';
import Footer from '@/blocks/Footer';

function BookTechnicianPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = Cookies.get('token') || localStorage.getItem('token');

  const [technician, setTechnician] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Fetch current user data
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const { data } = await axios.get('/api/users/current-user', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(data);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, [token]);

  // Fetch technician details
  useEffect(() => {
    const fetchTechnician = async () => {
      try {
        const { data } = await axios.get(`/api/technicians/get-technician/${id}`);
        setTechnician(data.technician);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching technician:', error);
        toast.error('Failed to load technician details');
        setLoading(false);
      }
    };

    if (id) {
      fetchTechnician();
    }
  }, [id]);

  // Get available time slots based on selected date
  useEffect(() => {
    if (selectedDate && technician?.availability) {
      const selectedDateObj = new Date(selectedDate);
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
    }
  }, [selectedDate, technician]);

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

  // Validate address fields
  const validateAddress = () => {
    if (!user) return false;
    const { address, detailedAddress } = user;
    
    // Check if basic address exists
    if (!address || address.trim() === '') return false;
    
    // Check if detailedAddress exists and all required fields are filled
    if (!detailedAddress) return false;
    
    const requiredFields = ['landMark', 'houseNumber', 'ward', 'district', 'province'];
    
    for (const field of requiredFields) {
      if (!detailedAddress[field] || detailedAddress[field].trim() === '') {
        return false;
      }
    }
    
    return true;
  };

  // Handle booking - validate and open modal
  const handleBookNow = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }
    if (!token) {
      toast.error('Please login to book a technician');
      navigate('/login');
      return;
    }
    if (!user) {
      toast.error('Loading user data...');
      return;
    }
    
    // Check if user has any addresses in address book
    if (!user.addressBook || user.addressBook.length === 0) {
      toast.error('Please add an address in your address book first.');
      return;
    }
    
    // Set default selected address to first one
    setSelectedAddress(user.addressBook[0]);
    // Open modal
    setShowModal(true);
  };

  // Handle confirm booking from modal
  const handleConfirmBooking = async () => {
    try {
      setBookingLoading(true);
      const bookingData = {
        technician: id,
        serviceDate: selectedDate,
        serviceTime: selectedTime,
        fee: technician.fee,
        orderNote: orderNote,
        technicianInfo: {
          firstname: technician.firstName,
          lastname: technician.lastName,
          servicetype: technician.serviceType,
          experienceYears: technician.experienceYears,
          location: technician.location,
          description: technician.description,
          email: technician.email,
        },
      };
      await axios.post('/api/bookings/create', bookingData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Booking confirmed! Check your bookings for details.');
      setShowModal(false);
      navigate('/bookings');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Generate next 7 days for calendar selector
  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        dayNumber: date.getDate(),
        fullDate: date.toISOString().split('T')[0],
      });
    }
    return days;
  };

  const next7Days = getNext7Days();

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-color-main mx-auto mb-4"></div>
            <p className="text-gray-600">Loading technician details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!technician) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Technician not found</p>
        </div>
      </>
    );
  }

  // Use highlights if available, else fallback to []
  const highlights = technician.highlights || [];
  const reviews = technician.reviews || [];

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
                src={technician.photoUrl || 'https://via.placeholder.com/600x420?text=No+Photo'}
                alt={technician.firstName}
                className="w-full h-80 object-cover md:h-[420px]"
              />
              {/* Overlayed rating */}
              <div className="absolute bottom-4 left-4 bg-white/90 px-4 py-2 rounded-full flex items-center gap-2 shadow">
                <Star size={20} weight="fill" className="text-yellow-400" />
                <span className="font-bold text-gray-800 text-lg">{technician.averageRating?.toFixed(1) || 'No'}</span>
                <span className="text-gray-500 text-sm">({reviews.length} reviews)</span>
              </div>
            </div>
            {/* About Section */}
            <div className="w-full mt-8 bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold txt-color-primary mb-2">About</h2>
              <p className="text-gray-700 mb-3">{technician.description}</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                {highlights.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
              {/* Expertise/Experience Headings */}
              {/* <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-1">Expertise</h3>
                <p className="text-gray-600">{technician.serviceType}</p>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-gray-800 mb-1">Experience</h3>
                <p className="text-gray-600">{technician.experienceYears} years in the field</p>
              </div> */}
            </div>
            {/* Reviews Section */}
            <div className="w-full mt-8 bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold txt-color-primary mb-4 flex items-center gap-2">
                <CheckCircle size={22} className="text-green-500" /> Customer Reviews
              </h2>
              <div className="space-y-4">
                {reviews.map((review, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Star size={16} weight="fill" className="text-yellow-400" />
                      <span className="font-semibold text-gray-700">{review.rating}</span>
                      {review.customer && <span className="text-gray-500 text-xs">by {review.customer}</span>}
                    </div>
                    <p className="text-gray-600 text-sm">{review.comment}</p>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-gray-500">No reviews yet.</p>
                )}
              </div>
            </div>
          </div>
          {/* Right: Booking Panel */}
          <div className="md:w-1/2 w-full flex flex-col gap-8">
            <div className="bg-white rounded-xl shadow p-8 flex flex-col gap-6 sticky top-24">
              {/* Technician Header */}
              <div className="border-b border-gray-200 pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {technician.firstName} {technician.lastName}
                  </h2>
                  {technician.isVerifiedTechnician && (
                    <CheckCircle size={24} weight="fill" className="text-blue-600" />
                  )}
                  <span className="text-gray-400 mx-1">•</span>
                  <span className="text-lg text-gray-600">{technician.serviceType}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-3">
                  <span className="text-sm">
                    {technician.experienceYears} {technician.experienceYears === 1 ? 'year' : 'years'} experience
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm">{technician.location}</span>
                </div>
                <div className="text-[16px] font-semibold text-gray-800">
                  Booking Fee: <span className="text-color-main">Rs. {technician.fee}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Booking slots</label>
                <div className="flex overflow-x-auto gap-2 mb-4 pb-2 -mx-2 px-2 sm:grid sm:grid-cols-7 sm:overflow-visible">
                  {next7Days.map((day) => (
                    <button
                      key={day.fullDate}
                      onClick={() => setSelectedDate(day.fullDate)}
                      className={`flex flex-col items-center justify-center py-3 px-3 sm:py-4 sm:px-2 rounded-3xl border-2 font-medium transition min-w-[70px] sm:min-w-0 ${
                        selectedDate === day.fullDate
                          ? 'border-color-main bg-color-main text-white shadow-lg'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-color-main'
                      }`}
                    >
                      <span className="text-xs mb-1 font-semibold whitespace-nowrap">{day.dayName}</span>
                      <span className="text-lg sm:text-xl font-bold">{day.dayNumber}</span>
                    </button>
                  ))}
                </div>
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

      {/* Booking Modal */}
      {showModal && user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full h-[90dvh] sm:h-auto sm:max-h-[90dvh] flex flex-col">
            {/* Fixed Header */}
            <div className="px-3 py-4 sm:px-6 sm:py-6 border-b border-gray-200 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Book Service</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none shrink-0"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
              {/* Booking Time */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Booking Time</h3>
                <p className="text-gray-800 text-sm sm:text-base">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}, {selectedTime}
                </p>
              </div>

              {/* Select Address */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Select Address</h3>
                  <a href="/profile" className="text-xs font-semibold text-color-main hover:underline">Add Address</a>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {user.addressBook && user.addressBook.length > 0 ? (
                    user.addressBook.map((address) => (
                      <div
                        key={address._id}
                        onClick={() => setSelectedAddress(address)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                          selectedAddress?._id === address._id
                            ? 'border-color-main bg-blue-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0" style={{
                            borderColor: selectedAddress?._id === address._id ? '#003d82' : '#d1d5db'
                          }}>
                            {selectedAddress?._id === address._id && (
                              <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: '#003d82'}}></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-800 text-sm capitalize">
                              {address.contactName} ({address.addressType})
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">{address.address}</p>
                            {address.landMark && (
                              <p className="text-xs text-gray-500">Landmark: {address.landMark}</p>
                            )}
                            <p className="text-xs text-gray-600 mt-1">{address.phone}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No addresses found</p>
                  )}
                </div>
              </div>

              {/* Email Address (Read-only) */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Email Address</h3>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg p-2 sm:p-3 text-xs sm:text-sm text-gray-700 bg-gray-50 cursor-not-allowed"
                />
              </div>

              {/* Order Note */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Order Note</h3>
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="eg: Please bring extra batteries."
                  className="w-full border border-gray-300 rounded-lg p-2 sm:p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-color-main resize-none"
                  rows="2"
                />
              </div>
            </div>

            {/* Fixed Footer with Button */}
            <div className="px-3 py-4 sm:px-6 sm:py-6 border-t border-gray-200 bg-white shrink-0">
              <button
                onClick={handleConfirmBooking}
                disabled={bookingLoading || !selectedDate || !selectedTime}
                className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-bold text-base sm:text-lg text-white transition ${
                  bookingLoading || !selectedDate || !selectedTime
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-color-main hover:bg-blue-700 btn-filled-slide'
                }`}
              >
                {bookingLoading ? 'Processing...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BookTechnicianPage;
