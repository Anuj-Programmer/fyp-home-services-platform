import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/blocks/Navbar";
import Footer from "@/blocks/Footer";
import heroicon from "../assets/HeroIcon.png";
import TechnicianCard from "@/blocks/TechnicianCard";
import {
  Wrench,
  Lightning,
  GearSix,
  Bathtub,
  Calendar,
  MapPin,
  Wallet,
  CheckCircle,
  Key
} from "phosphor-react";
import "../css/landingPage.css";
import { Link } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
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

  const upcomingBookings = [
    {
      id: 1,
      service: "Home Cleaning",
      date: "Mon, 24 Nov • 10:00 AM",
      pro: "Amit Sharma",
      status: "Confirmed",
    },
    {
      id: 2,
      service: "Plumbing Check",
      date: "Wed, 26 Nov • 3:30 PM",
      pro: "Rachin Verma",
      status: "Pending",
    },
  ];

  const recommendedPros = [
    {
      id: 1,
      name: "Amit Sharma",
      service: "Home Cleaning",
      price: "$25/hr",
      rating: 4.8,
      verified: true,
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 2,
      name: "Ramesh Patel",
      service: "Electrician",
      price: "$28/hr",
      rating: 4.9,
      verified: true,
      image:
        "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 3,
      name: "Dib Rai",
      service: "Gardening",
      price: "$20/hr",
      rating: 4.5,
      verified: false,
      image:
        "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=600&q=80",
    },
  ];

  return (
    <>
      <Navbar />
      <div className="">
        {/* HERO / WELCOME SECTION */}
        <section className="w-full px-6 lg:px-32 py-16 flex flex-col lg:flex-row items-center justify-between gap-12 relative rounded-2xl overflow-hidden banner-section">
          <div className="absolute inset-0 bg-linear-to-r from-blue-900/10 to-transparent pointer-events-none" />

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
            Specialized, efficient, and thorough Home services
            </h1>
            <p className="text-lg leading-relaxed max-w-lg txt-color-primary">
              We provide performing Home services using the least amount of
              time, energy, and money.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-6 mt-4">
              <div className="flex flex-col">
                <span className="text-2xl font-semibold txt-color-primary">
                  4.9
                </span>
                <span className="text-xs text-stone-500">
                  Average service rating
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-semibold txt-color-primary">
                  12+
                </span>
                <span className="text-xs text-stone-500">
                  Services completed
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-semibold txt-color-primary">
                  3
                </span>
                <span className="text-xs text-stone-500">
                  Active bookings
                </span>
              </div>
            </div>
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

        {/* QUICK ACTIONS + UPCOMING */}
        <section className="w-full px-6 lg:px-32 pt-10 pb-16 flex flex-col gap-10">
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
                    key={booking.id}
                    className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm border border-neutral-100"
                  >
                    <div className="mt-1">
                      <CheckCircle
                        size={24}
                        weight="fill"
                        className={
                          booking.status === "Confirmed"
                            ? "text-emerald-500"
                            : "text-amber-500"
                        }
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-sm font-semibold txt-color-primary">
                        {booking.service}
                      </span>
                      <span className="text-xs text-stone-500">
                        {booking.date}
                      </span>
                      <span className="text-xs text-stone-500">
                        With {booking.pro}
                      </span>
                      <span className="inline-flex mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-stone-100 text-stone-700">
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
                { title: "Plumbing", icon: <Wrench weight="fill" /> },
                { title: "Electrical", icon: <Lightning weight="fill" /> },
                { title: "Carpentry", icon: <Wrench weight="fill" /> },
                { title: "Appliance Repair", icon: <GearSix weight="fill" /> },
                { title: "Bathroom Remodeling", icon: <Bathtub weight="fill" /> },
                { title: "Locksmith", icon: <Key weight="fill" /> },
            ].map((service, i) => (
              <div
                key={i}
                className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 p-4 rounded-2xl shadow-md hover:shadow-lg transition flex flex-col items-center justify-center gap-2 bg-white cursor-pointer"
                onClick={() => navigate("/services")}
              >
                <div className="w-10 h-10 flex items-center justify-center text-white rounded-full icon-bg mb-2">
                  {service.icon}
                </div>
                <h3 className="text-xs sm:text-sm font-medium text-center text-gray-800">
                  {service.title}
                </h3>
              </div>
            ))}
          </div>
        </section>

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

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {recommendedPros.map((pro) => (
              <TechnicianCard key={pro.id} pro={pro} />
            ))}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default HomePage;
