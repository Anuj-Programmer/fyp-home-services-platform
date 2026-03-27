import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/blocks/Navbar";
import Footer from "@/blocks/Footer";
import heroicon from "../assets/HeroIcon.png";
import TechnicianCard from "@/blocks/TechnicianCard";
import plumbingIcon from "../assets/plumberIcon.svg";
import electricalIcon from "../assets/electricianIcon.svg";
import carpentryIcon from "../assets/carpenterIcon.svg";
import repairIcon from "../assets/repairIcon.svg";
import bathroomIcon from "../assets/bathroomIcon.svg";
import locksmithIcon from "../assets/icons8-through-60.png";
import {
  Calendar,
  MapPin,
  Wallet,
  CheckCircle,
  MagnifyingGlass
} from "phosphor-react";
import "../css/landingPage.css";
import { Link } from "react-router-dom";
import { apiClient } from "@/lib/api";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import { useSocket } from "@/context/SocketContext";

const heroSearchPlaceholderWords = ["Services", "Names", "Locations"];

function HomePage() {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [recommendedPros, setRecommendedPros] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const [placeholderWordIndex, setPlaceholderWordIndex] = useState(0);
  const [isDeletingPlaceholder, setIsDeletingPlaceholder] = useState(false);

  // Fetch active technicians for recommended section
  useEffect(() => {
      const fetchActiveTechnicians = async () => {
        try {
          setLoading(true);
          // Get user from localStorage and extract address
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          const address = user.address;
          let url = "/api/technicians/get-active-technicians";
          if (address && ["chitwan", "pokhara", "kathmandu"].includes(address)) {
            url += `?address=${address}`;
          }
          const response = await apiClient.get(url);
          if (response.data && response.data.success) {
            // Limit to 3 professionals for the recommended section
            setRecommendedPros(response.data.technicians.slice(0, 4));
          }
        } catch (error) {
          console.error("Error fetching active technicians:", error);
          setRecommendedPros([]);
        } finally {
          setLoading(false);
        }
      };

      fetchActiveTechnicians();
    }, []);

  // Fetch user's bookings
  const fetchUserBookings = async () => {
    try {
      const token = Cookies.get("token") || localStorage.getItem("token");
      const response = await apiClient.get("/api/bookings/user-bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data && response.data.success) {
        // Get the 2 latest bookings
        const sortedBookings = response.data.bookings.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setUpcomingBookings(sortedBookings.slice(0, 2));
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setUpcomingBookings([]);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchUserBookings();
  }, []);

  // Typewriter-style placeholder animation for hero search
  useEffect(() => {
    const currentWord = heroSearchPlaceholderWords[placeholderWordIndex];
    const typingSpeed = isDeletingPlaceholder ? 45 : 150;
    const holdDelay = 1100;
    const transitionDelay = 250;

    const timer = setTimeout(() => {
      if (!isDeletingPlaceholder && typedPlaceholder.length < currentWord.length) {
        setTypedPlaceholder(currentWord.slice(0, typedPlaceholder.length + 1));
        return;
      }

      if (!isDeletingPlaceholder && typedPlaceholder.length === currentWord.length) {
        setIsDeletingPlaceholder(true);
        return;
      }

      if (isDeletingPlaceholder && typedPlaceholder.length > 0) {
        setTypedPlaceholder(currentWord.slice(0, typedPlaceholder.length - 1));
        return;
      }

      setIsDeletingPlaceholder(false);
      setPlaceholderWordIndex((prev) => (prev + 1) % heroSearchPlaceholderWords.length);
    }, (!isDeletingPlaceholder && typedPlaceholder.length === currentWord.length)
      ? holdDelay
      : (isDeletingPlaceholder && typedPlaceholder.length === 0)
        ? transitionDelay
        : typingSpeed);

    return () => clearTimeout(timer);
  }, [typedPlaceholder, placeholderWordIndex, isDeletingPlaceholder]);

  // Listen for real-time booking updates via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleBookingNotification = (data) => {
      console.log('📬 Booking notification received:', data);
      // Refetch bookings when any booking notification is received
      fetchUserBookings();
    };

    // Subscribe to booking notifications
    socket.on('booking:notification', handleBookingNotification);

    // Cleanup listener on unmount
    return () => {
      socket.off('booking:notification', handleBookingNotification);
    };
  }, [socket]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    navigate(`/search-results?search=${encodeURIComponent(searchTerm)}`);
    setSearchTerm("");
  };

  const quickActions = [
    {
      title: "Book a Service",
      description: "Schedule a new service in just a few clicks.",
      icon: <Calendar weight="fill" />,
      onClick: () => navigate("/services"),
    },
    {
      title: "Track Booking",
      description: "See status and details of your current bookings.",
      icon: <MapPin weight="fill" />,
      onClick: () => navigate("/bookings"),
    },
    {
      title: "Payments & History",
      description: "View past services, invoices, and payments.",
      icon: <Wallet weight="fill" />,
      onClick: () => navigate("/payments"),
    },
  ];

  return (
    <>
      
      <div className="">
        <div className="relative">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(30,58,138,0.42)_0%,rgba(30,58,138,0.26)_28%,rgba(255,255,255,0.76)_58%,rgba(255,255,255,0.94)_78%,#ffffff_100%)]">

            </div>
          </div>
<Navbar />
        {/* HERO / WELCOME SECTION */}
        <section className="relative z-10 w-full px-6 lg:px-32 py-16 flex flex-col lg:flex-row items-center justify-between gap-12 rounded-2xl banner-section">
            

          {/* Left text */}
          <div className="flex-1 space-y-6 relative z-10">
            {/* <div className="flex items-center justify-between gap-4">
              <p className="text-sm sm:text-base font-medium txt-color-primary">
                Welcome back to your home services hub
              </p>

              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-red-500 border border-red-200 px-4 py-2 rounded-md hover:bg-red-50 transition"
              >
                Logout
              </button>
            </div> */}

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight txt-color-primary">
            Specialized, efficient, and thorough <br/> Home Services
            </h1>
            <p className="text-lg leading-relaxed max-w-lg txt-color-primary">
              We provide performing Home services using the least amount of
              time, energy, and money.
            </p>

            {/* Hero Search */}
            <form onSubmit={handleSearchSubmit} className="mt-4 w-full max-w-2xl">
              <div className="rounded-2xl border border-neutral-300 bg-white/95 p-2 shadow-md backdrop-blur-sm focus-within:border-color-main focus-within:ring-2 focus-within:ring-blue-100">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2">
                    <MagnifyingGlass size={20} className="shrink-0 text-stone-500" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={`Search using "${typedPlaceholder || " "}"`}
                      className="w-full min-w-0 bg-transparent text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none sm:text-base"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-color-main px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
                  >
                    Search
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right image */}
          <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
            <img
              src={heroicon}
              alt="Home dashboard"
              className="w-full max-w-md rounded-2xl object-cover"
            />
          </div>
          
        </section>

        {/* Section Divider */}
        <div className="w-full px-6 lg:px-32 py-12">
          <div className="h-px bg-linear-to-r from-transparent via-neutral-300 to-transparent"></div>
        </div>

        {/* QUICK ACTIONS + UPCOMING */}
        <section className="relative z-10 w-full px-6 lg:px-32 pt-10 pb-16 flex flex-col gap-10">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Quick Actions */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-semibold txt-color-primary">
                  Quick Actions
                </h2>
                <span className="text-xs text-stone-500">
                  Access your most used features
                </span>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                {quickActions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={item.onClick}
                    className="flex flex-col items-start gap-3 p-4 rounded-xl bg-white shadow-sm hover:shadow-md border border-neutral-100 transition text-left"
                  >
                    <div className="w-10 h-10 rounded-full icon-bg flex items-center justify-center text-white">
                      {item.icon}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold txt-color-primary">
                        {item.title}
                      </span>
                      <span className="text-xs text-stone-500">
                        {item.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Upcoming bookings */}
            <div className="w-full lg:w-[360px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-semibold txt-color-primary">
                  Upcoming Bookings
                </h2>
                <button
                  className="text-xs text-color-main hover:underline"
                  onClick={() => navigate("/bookings")}
                >
                  View all
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking._id || booking.id}
                    className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm border border-neutral-100"
                  >
                    <div className="mt-1">
                      <CheckCircle
                        size={24}
                        weight="fill"
                        className={
                          (booking.status === "completed" || booking.status === "confirmed")
                            ? "text-emerald-500"
                            : booking.status === "pending"
                            ? "text-yellow-500"
                            : (booking.status === "expired" || booking.status === "cancelled")
                            ? "text-red-500"
                            : "text-emerald-500"
                        }
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-sm font-semibold txt-color-primary">
                        {booking.technicianInfo?.servicetype}
                      </span>
                      <span className="text-xs text-stone-500">
                        {new Date(booking.serviceDate).toLocaleDateString()} • {booking.serviceTime}
                      </span>
                      <span className="text-xs text-stone-500">
                        With {booking.technicianInfo?.firstname} {booking.technicianInfo?.lastname}
                      </span>
                      <span className="inline-flex mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-stone-100 text-stone-700 capitalize">
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}

                {upcomingBookings.length === 0 && (
                  <div className="p-4 rounded-xl bg-stone-50 text-xs text-stone-500">
                    You have no upcoming bookings. Start by booking a new
                    service.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        </div>

        {/* Section Divider */}
        <div className="w-full px-6 lg:px-32 py-12">
          <div className="h-px bg-linear-to-r from-transparent via-neutral-300 to-transparent"></div>
        </div>

        {/* SERVICES SHORTCUTS */}
        <section className="w-full px-6 lg:px-32 pb-16 flex flex-col gap-8">
          <div className="flex flex-col lg:flex-row justify-between items-center lg:items-end gap-4">
            <h2 className="txt-color-primary text-2xl sm:text-3xl font-semibold text-center lg:text-left">
              Popular services for your home
            </h2>
            <p className="text-sm text-stone-500 max-w-md text-center lg:text-right">
              Pick from the most requested services and get a professional at
              your doorstep when it suits you.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 py-2 px-2 items-center justify-center mt-4">
            {[
                { id: "plumbing", title: "Plumbing", image: plumbingIcon },
                { id: "electrical", title: "Electrical", image: electricalIcon },
                { id: "carpentry", title: "Carpentry", image: carpentryIcon },
                { id: "repairs", title: "Appliance Repair", image: repairIcon },
                { id: "bathroom_remodeling", title: "Bathroom Remodeling", image: bathroomIcon },
                { id: "locksmith", title: "Locksmith", image: locksmithIcon },
            ].map((service) => (
              <div
                key={service.id}
                className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 p-4 rounded-2xl shadow-[0_8px_16px_rgba(31,54,127,0.35)] hover:shadow-[0_12px_24px_rgba(31,54,127,0.45)] transition flex flex-col items-center justify-center gap-2 bg-white cursor-pointer"
                onClick={() => navigate(`/services?category=${service.id}`)}
              >
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="w-12 h-12 object-contain"
                />
                <h3 className="text-xs sm:text-sm font-medium text-center text-gray-800">
                  {service.title}
                </h3>
              </div>
            ))}
          </div>
        </section>

        {/* Section Divider */}
        <div className="w-full px-6 lg:px-32 py-12">
          <div className="h-px bg-linear-to-r from-transparent via-neutral-300 to-transparent"></div>
        </div>

        {/* RECOMMENDED PROFESSIONALS */}
        <section className="w-full px-6 lg:px-32 pb-20 flex flex-col gap-8">
          <div className="w-full flex flex-col lg:flex-row justify-between gap-6 text-center lg:text-left items-center lg:items-end">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl sm:text-3xl font-semibold txt-color-primary">
                Recommended for you
              </h2>
              <p className="text-sm text-stone-500 max-w-lg">
                Based on your recent bookings and popular choices in your area.
                Book again with professionals you can rely on.
              </p>
            </div>
            <Link
              to="/services"
              className="text-sm font-semibold text-color-main border border-color-main px-5 py-2 rounded-md btn-transparent-slide"
            >
              View all professionals
            </Link>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {recommendedPros.slice(0, 4).map((pro) => (
              <TechnicianCard key={pro._id || pro.id} pro={pro} />
            ))}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default HomePage;
