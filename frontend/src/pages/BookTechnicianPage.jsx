import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { Star, ArrowLeft, CurrencyCircleDollar, Wrench, MapPin, CheckCircle, CalendarBlank, Clock, WarningCircle, EnvelopeSimple, NotePencil } from 'phosphor-react';
import Navbar from '@/blocks/Navbar';
import Footer from '@/blocks/Footer';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';
import VerifiedIcon from '@/assets/VerifiedIcon.svg';
import houseVerifiedIcon from '@/assets/houseVerifiedIcon.svg';
import HighRatedIcon from "@/assets/HighRatedIcon.svg";

function BookTechnicianPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = Cookies.get('token') || localStorage.getItem('token');

  const [technician, setTechnician] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0);
  const [checkingPendingPayments, setCheckingPendingPayments] = useState(false);
  const { socket, isConnected } = useSocket();
  const { user } = useUser();

  // Fetch technician details
  useEffect(() => {
    const fetchTechnician = async () => {
      try {
        const { data } = await apiClient.get(`/api/technicians/get-technician/${id}`);
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

  // Fetch technician reviews
  useEffect(() => {
    if (!id) return;

    const fetchTechnicianReviews = async () => {
      try {
        const response = await apiClient.get(`/api/reviews/technician/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          // Transform backend data to match frontend format
          const transformedReviews = response.data.reviews.map((review) => ({
            id: review._id,
            rating: review.rating,
            comment: review.comment,
            customer: `${review.userId?.firstName || "User"} ${review.userId?.lastName || ""}`.trim(),
          }));

          setReviews(transformedReviews);
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      }
    };

    fetchTechnicianReviews();
  }, [id, token]);

  // Check if user has any completed but unpaid bookings.
  useEffect(() => {
    const fetchPendingPayments = async () => {
      if (!token) {
        setHasPendingPayment(false);
        setPendingPaymentCount(0);
        return;
      }

      try {
        setCheckingPendingPayments(true);
        const response = await apiClient.get('/api/bookings/user-bookings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data?.success) {
          const completedUnpaidBookings = (response.data.bookings || []).filter(
            (booking) =>
              String(booking.status || '').toLowerCase() === 'completed' &&
              String(booking.paymentStatus || '').toLowerCase() !== 'paid',
          );

          setPendingPaymentCount(completedUnpaidBookings.length);
          setHasPendingPayment(completedUnpaidBookings.length > 0);
        } else {
          setHasPendingPayment(false);
          setPendingPaymentCount(0);
        }
      } catch (error) {
        console.error('Error checking pending payments:', error);
        setHasPendingPayment(false);
        setPendingPaymentCount(0);
      } finally {
        setCheckingPendingPayments(false);
      }
    };

    fetchPendingPayments();
  }, [token]);

  // Fetch booked slots from backend
  const fetchBookedSlots = async () => {
    if (!selectedDate || !id) return;
    try {
      const { data } = await apiClient.get(`/api/bookings/booked-slots/${id}/${selectedDate}`);
      setBookedSlots(data.bookedSlots || []);
      console.log('📋 Fetched booked slots:', data.bookedSlots);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      setBookedSlots([]);
    }
  };

  // Get available time slots based on selected date
  useEffect(() => {
    if (selectedDate && technician?.availability) {
      const selectedDateObj = new Date(selectedDate);
      const dayName = selectedDateObj.toLocaleString('en-US', { weekday: 'long' });
      const dayAvailability = technician.availability.find((slot) => slot.day === dayName);
      if (dayAvailability) {
        const slots = generateTimeSlots(dayAvailability.startTime, dayAvailability.endTime, dayAvailability.slotDuration);
        setAvailableSlots(slots);
        
        // Fetch booked slots for this technician on this date (initial load only)
        fetchBookedSlots();
      } else {
        setAvailableSlots([]);
        setBookedSlots([]);
        toast.error(`Technician is not available on ${dayName}s`);
      }
    }
  }, [selectedDate, technician]);

  // Listen for WebSocket notifications to refresh booked slots in real-time
  useEffect(() => {
    if (!socket || !id || !selectedDate) return;

    const handleBookingNotification = (data) => {
      console.log('📬 Received booking notification:', data);
      console.log('Current technician ID:', id);
      console.log('Notification technician ID:', data.data?.technicianId);
      
      // Ensure both IDs are strings for comparison
      const currentTechId = String(id);
      const notifTechId = String(data.data?.technicianId || '');
      
      // Refresh booked slots if the notification is for this technician
      if (notifTechId === currentTechId) {
        console.log('✅ Match! Refreshing booked slots for this technician');
        setTimeout(() => fetchBookedSlots(), 200); // Small delay to ensure backend is updated
      } else {
        console.log('❌ No match, ignoring notification');
      }
    };

    const handleSlotsUpdate = (data) => {
      console.log('🔄 Received slots update:', data);
      console.log('Current technician ID:', id);
      console.log('Update technician ID:', data.technicianId);
      
      // Ensure both IDs are strings for comparison
      const currentTechId = String(id);
      const updateTechId = String(data.technicianId || '');
      
      // Refresh booked slots if update is for current technician
      if (updateTechId === currentTechId) {
        console.log('✅ Match! Refreshing booked slots due to booking change');
        setTimeout(() => fetchBookedSlots(), 200); // Small delay to ensure backend is updated
      } else {
        console.log('❌ No match, ignoring update');
      }
    };

    socket.on('booking:notification', handleBookingNotification);
    socket.on('booking:slotsUpdate', handleSlotsUpdate);

    console.log('🎧 WebSocket listeners attached for technician:', id);

    return () => {
      socket.off('booking:notification', handleBookingNotification);
      socket.off('booking:slotsUpdate', handleSlotsUpdate);
      console.log('🔇 WebSocket listeners removed');
    };
  }, [socket, id, selectedDate]);

  // Check if a date has available slots
  const hasAvailableSlots = (dateStr) => {
    if (!technician?.availability) return false;
    const dateObj = new Date(dateStr);
    const dayName = dateObj.toLocaleString('en-US', { weekday: 'long' });
    const dayAvailability = technician.availability.find((slot) => slot.day === dayName);
    return dayAvailability ? true : false;
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
    if (hasPendingPayment) {
      toast.error('Please pay your pending completed booking before creating a new booking.');
      return;
    }

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
      
      // Validate that an address is selected
      if (!selectedAddress) {
        toast.error('Please select an address');
        setBookingLoading(false);
        return;
      }
      
      // For Locksmith service, ensure the selected address is house verified
      if (technician.serviceType === 'Locksmith' && !selectedAddress.isHouseVerified) {
        toast.error('Locksmith service requires a verified address. Please select a verified address.');
        setBookingLoading(false);
        return;
      }
      
      const bookingData = {
        technician: id,
        serviceDate: selectedDate,
        serviceTime: selectedTime,
        fee: technician.fee,
        orderNote: orderNote,
        selectedAddress: selectedAddress,
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
      const response = await apiClient.post('/api/bookings/create', bookingData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Emit WebSocket event for real-time update
      if (socket && response.data.booking) {
        socket.emit('booking:new', {
          technicianId: id,
          userId: user._id,
          bookingId: response.data.booking._id,
          serviceDate: selectedDate,
          serviceTime: selectedTime
        });
        console.log('📤 Emitted new booking event to technician:', id);
      }
      
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
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      days.push({
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        dayNumber: date.getDate(),
        fullDate: localDate.toLocaleDateString('en-CA'),
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

  // Render star rating
  const renderStars = (rating, size = 16) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            weight={star <= rating ? "fill" : "regular"}
            className={
              star <= rating
                ? "text-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen md:min-h-[calc(100vh-64px)] bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row gap-8">
          {/* Left: Big Photo & Info */}
          <div className="md:w-1/2 w-full flex flex-col items-center md:items-start">
            <div className="relative w-full rounded-3xl overflow-hidden border border-stone-300 bg-white">
              <img
                src={technician.photoUrl || 'https://via.placeholder.com/600x420?text=No+Photo'}
                alt={technician.firstName}
                className="w-full h-80 object-cover md:h-[420px]"
              />
              {/* Overlayed rating */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-5 py-3 rounded-full flex items-center gap-3 shadow-lg">
                <Star size={20} weight="fill" className="text-yellow-400" />
                <span className="font-bold text-gray-800 text-lg">{technician.averageRating?.toFixed(1) || 'No'}</span>
                <span className="text-gray-500 text-sm font-medium">({reviews.length})</span>
              </div>
            </div>
            {/* About Section */}
            <div className="w-full mt-8 bg-white rounded-2xl border border-stone-300 p-8  transition-shadow">
              <h2 className="text-2xl font-bold txt-color-primary mb-4 flex items-center gap-2">
                <div className="w-1 h-8 bg-color-main rounded-full"></div>
                About
              </h2>
              <p className="text-gray-700 mb-6 leading-relaxed text-sm">{technician.description}</p>
              {highlights.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Highlights</p>
                  <ul className="space-y-2">
                    {highlights.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-600 text-sm">
                        <span className="w-2 h-2 rounded-full bg-color-main mt-2 shrink-0"></span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {/* Reviews Section */}
            <div className="w-full mt-8 bg-white rounded-2xl border border-stone-300 p-8 ">
              <h2 className="text-2xl font-bold txt-color-primary mb-6 flex items-center gap-3">
                <CheckCircle size={26} className="text-green-500" /> 
                <span>Customer Reviews</span>
                {reviews.length > 0 && <span className="ml-auto text-base font-normal text-gray-500">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>}
              </h2>
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review, idx) => (
                    <div key={idx} className="bg-linear-to-r from-blue-50 to-transparent rounded-xl p-5 border border-blue-100 hover:border-blue-200 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating, 16)}
                        </div>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{review.rating}.0</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed mb-2">{review.comment}</p>
                      {review.customer && <p className="text-xs text-gray-500 font-medium">— {review.customer}</p>}
                    </div>
                  ))
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
                    <p className="text-gray-500 text-sm">No reviews yet. Be the first to review this technician!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Right: Booking Panel */}
          <div className="md:w-1/2 w-full flex flex-col gap-8">
            <div className="bg-white rounded-2xl border border-stone-300 p-8 flex flex-col gap-6 sticky top-24">
              {hasPendingPayment && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-amber-900 mb-1 flex items-center gap-2">
                    <WarningCircle size={18} className="text-amber-600" /> Payment Required Before New Booking
                  </h3>
                  <p className="mt-2 text-sm text-amber-800 leading-relaxed">
                    You have <span className="font-semibold">{pendingPaymentCount}</span> completed booking{pendingPaymentCount > 1 ? 's' : ''} with unpaid status.
                    Please complete payment first.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/bookings')}
                    className="mt-4 inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition"
                  >
                    Go to Bookings & Pay
                  </button>
                </div>
              )}

              {/* Technician Header */}
              <div className="border-b-2 border-gray-100 pb-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h2 className="text-3xl font-bold bg-linear-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">
                        {technician.firstName} {technician.lastName}
                      </h2>
                      <div className="flex gap-2">
                        {technician.isVerifiedTechnician && (
                          <div className="group relative">
                            <img src={VerifiedIcon} alt="Verified" className="w-6 h-6 cursor-help" />
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">Verified Technician</div>
                          </div>
                        )}
                        {technician.highRated && (
                          <div className="group relative">
                            <img src={HighRatedIcon} alt="High Rated" className="w-6 h-6 cursor-help" />
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">Highly Rated</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="inline-block bg-blue-100 text-color-main text-xs font-bold px-3 py-1.5 rounded-full">
                        {technician.serviceType}
                      </span>
                      <span className="text-sm text-gray-600 font-medium">
                        {technician.experienceYears} {technician.experienceYears === 1 ? 'year' : 'years'} exp.
                      </span>
                      {technician.location && (
                        <span className="text-sm text-gray-600 font-medium flex items-center gap-1">
                          <MapPin size={14} className="text-color-main" />
                          {technician.location.charAt(0).toUpperCase() + technician.location.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Booking Fee</p>
                  <p className="text-lg font-bold text-color-main">Rs. {technician.fee}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <CalendarBlank size={16} className="text-color-main" /> Select Date
                </label>
                <div className="flex overflow-x-auto gap-3 mb-4 pb-2 -mx-2 px-2 sm:grid sm:grid-cols-7 sm:overflow-visible">
                  {next7Days.map((day) => {
                    const dateHasSlots = hasAvailableSlots(day.fullDate);
                    return (
                      <button
                        key={day.fullDate}
                        onClick={() => dateHasSlots && setSelectedDate(day.fullDate)}
                        disabled={!dateHasSlots}
                        className={`flex flex-col items-center justify-center py-3 px-3 sm:py-4 sm:px-2 rounded-2xl border-2 font-bold transition min-w-[75px] sm:min-w-0 ${
                          selectedDate === day.fullDate
                            ? 'border-color-main bg-color-main text-white shadow-lg'
                            : dateHasSlots
                            ? 'border-gray-200 bg-white text-gray-700 hover:border-color-main'
                            : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50 hover:border-gray-200'
                        }`}
                        title={dateHasSlots ? '' : 'No available slots'}
                      >
                        <span className="text-xs mb-1.5 font-bold whitespace-nowrap">{day.dayName}</span>
                        <span className="text-xl sm:text-2xl font-bold">{day.dayNumber}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <Clock size={16} className="text-color-main" /> Select Time Slot
                </label>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {availableSlots.map((slot) => {
                      const isBooked = bookedSlots.includes(slot);
                      
                      // Check if slot is in the past (only for today)
                      const today = new Date().toISOString().split('T')[0];
                      const isPastTime = selectedDate === today && slot < new Date().toTimeString().slice(0, 5);
                      
                      return (
                        <button
                          key={slot}
                          onClick={() => !isBooked && !isPastTime && setSelectedTime(slot)}
                          disabled={isBooked || isPastTime}
                          className={`py-2.5 px-3 rounded-xl border-2 font-bold transition ${
                            isBooked || isPastTime
                              ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                              : selectedTime === slot
                              ? 'border-color-main bg-color-main text-white shadow-lg'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-color-main'
                          }`}
                          title={isBooked ? 'Already booked' : isPastTime ? 'Time passed' : ''}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                ) : selectedDate ? (
                  <div className="bg-red-50 p-5 rounded-xl border border-red-200">
                    <p className="text-red-700 text-sm font-semibold">No available slots for this date</p>
                    <p className="text-red-600 text-xs mt-1">Please select another date</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 text-center">
                    <p className="text-gray-600 text-sm font-medium">Select a date to view available time slots</p>
                  </div>
                )}
              </div>
              <button
                onClick={handleBookNow}
                disabled={
                  bookingLoading ||
                  !selectedDate ||
                  !selectedTime ||
                  hasPendingPayment ||
                  checkingPendingPayments
                }
                className={`w-full py-4 px-6 rounded-xl font-bold text-base text-white transition ${
                  bookingLoading || !selectedDate || !selectedTime || hasPendingPayment || checkingPendingPayments
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-color-main hover:bg-blue-700 btn-filled-slide'
                }`}
              >
                {checkingPendingPayments
                  ? 'Checking payment status...'
                  : hasPendingPayment
                    ? 'Pay Pending Dues First'
                    : bookingLoading
                      ? 'Processing...'
                      : 'Book Now'}
              </button>
              {hasPendingPayment && (
                <p className="text-xs text-red-600 text-center -mt-2 font-medium">
                  New booking is disabled until all completed bookings are paid.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Booking Modal */}
      {showModal && user && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full h-[90dvh] sm:h-auto sm:max-h-[90dvh] flex flex-col shadow-2xl border border-gray-200 animate-slide-up overflow-hidden">
            {/* Fixed Header */}
            <div className="px-3 py-4 sm:px-8 sm:py-6 border-b-2 border-gray-100 shrink-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Complete Booking</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-8 h  -8 flex items-center justify-center rounded-full transition"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-8 sm:py-6 space-y-6">
              {/* Booking Time */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <h3 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider flex items-center gap-2">
                  <CalendarBlank size={14} className="text-color-main" /> Booking Date & Time
                </h3>
                <p className="text-lg font-bold text-color-main">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-800"> {selectedTime}</span>
                </p>
              </div>

              {/* Select Address */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                    <MapPin size={14} className="text-color-main" /> Service Address
                  </h3>
                  <a href="/profile" className="text-xs font-bold text-color-main hover:text-blue-700 transition">Add Address</a>
                </div>
                {technician.serviceType === 'Locksmith' && (
                  <div className="mb-4 bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <p className="text-xs text-amber-800 font-semibold flex items-center gap-2">
                      <WarningCircle size={14} className="text-amber-700" /> Locksmith service requires a verified address
                    </p>
                  </div>
                )}
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {user.addressBook && user.addressBook.length > 0 ? (
                    user.addressBook
                      .filter((address) => technician.serviceType === 'Locksmith' ? address.isHouseVerified : true)
                      .map((address) => (
                      <div
                        key={address._id}
                        onClick={() => setSelectedAddress(address)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                          selectedAddress?._id === address._id
                            ? 'border-color-main bg-blue-50 shadow-sm'
                            : 'border-gray-200 bg-gray-50 hover:border-color-main'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition" style={{
                            borderColor: selectedAddress?._id === address._id ? '#003d82' : '#d1d5db'
                          }}>
                            {selectedAddress?._id === address._id && (
                              <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: '#003d82'}}></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-bold text-gray-800 text-sm capitalize">
                                {address.contactName}
                              </h4>
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium capitalize">{address.addressType}</span>
                              {address.isHouseVerified && (
                                <img src={houseVerifiedIcon} alt="Verified" className="w-4 h-4 shrink-0" title="Verified Address" />
                              )}
                            </div>
                            <p className="text-xs text-gray-700 font-medium mt-1">{address.address}</p>
                            {address.landMark && (
                              <p className="text-xs text-gray-600 mt-1">Landmark: {address.landMark}</p>
                            )}
                            <p className="text-xs text-gray-600 mt-1 font-medium">Phone: {address.phone}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                      <p className="text-xs text-gray-600 font-medium">
                        {technician.serviceType === 'Locksmith' 
                          ? 'No verified addresses found' 
                          : 'No addresses found'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Address (Read-only) */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide flex items-center gap-2">
                  <EnvelopeSimple size={14} className="text-color-main" /> Email Address
                </h3>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full border-2 border-gray-200 rounded-xl p-3 sm:p-4 text-sm text-gray-700 bg-gray-50 cursor-not-allowed font-medium"
                />
              </div>

              {/* Order Note */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide flex items-center gap-2">
                  <NotePencil size={14} className="text-color-main" /> Additional Notes
                </h3>
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="e.g., Please bring extra batteries, specific requirements..."
                  className="w-full border-2 border-gray-200 rounded-xl p-3 sm:p-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-color-main focus:border-transparent resize-none font-medium placeholder:text-gray-400"
                  rows="3"
                />
              </div>
            </div>

            {/* Fixed Footer with Button */}
            <div className="px-3 py-4 sm:px-8 sm:py-6 border-t-2 border-gray-100 bg-white shrink-0">
              <button
                onClick={handleConfirmBooking}
                disabled={bookingLoading || !selectedDate || !selectedTime || !selectedAddress}
                className={`w-full py-4 px-6 rounded-xl font-bold text-base text-white transition ${
                  bookingLoading || !selectedDate || !selectedTime || !selectedAddress
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-color-main hover:bg-blue-700'
                }`}
              >
                {bookingLoading ? 'Confirming...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BookTechnicianPage;
