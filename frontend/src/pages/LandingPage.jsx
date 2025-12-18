import React, { useRef, useState, useEffect } from "react";
import Navbar from "@/blocks/Navbar";
import heroicon from "../assets/HeroIcon.png";
import qualiticon from "../assets/QualityPageIcon.png";
import welcomeicon from "../assets/Welcome.png";
import TechnicianCard from "@/blocks/TechnicianCard";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "../css/landingPage.css";
import {
  Wrench,
  Lightning,
  GearSix,
  Bathtub,
  Key,
  Phone,
  Envelope,
  MapPin,
  Star,
  CheckCircle,
  Clock,
  Check,
} from "phosphor-react";
import Footer from "@/blocks/Footer";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";


function LandingPage() {
  const navigate = useNavigate();
  const servicesRef = useRef(null);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch active technicians
  useEffect(() => {
    const fetchActiveTechnicians = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/technicians/get-active-technicians");
        if (response.data && response.data.success) {
          setProfessionals(response.data.technicians);
        }
      } catch (error) {
        console.error("Error fetching active technicians:", error);
        // Fallback to empty array if fetch fails
        setProfessionals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveTechnicians();
  }, []);

  const scrollToServices = () => {
    if (servicesRef.current) {
      servicesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    const formData = {
      name: e.target.name.value,
      email: e.target.email.value,
      message: e.target.message.value,
    };

    try {
      const response = await axios.post("/api/otp/contact", formData);
      if (response.data && response.data.message) {
        toast.success("Message sent successfully!");
        e.target.reset();
      }
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar/>
      <div className="">
        <section className="w-full px-6 lg:px-32 py-20 flex flex-col lg:flex-row items-center justify-between gap-12 relative rounded-2xl overflow-hidden">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-r from-blue-900/20 to-transparent pointer-events-none"></div>

          {/* Left Text Section */}
          <div className="flex-1 space-y-6 relative z-10">
            <p className="text-xl font-medium txt-color-primary">
              Quality Home Services at a fair price.
            </p>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight txt-color-primary">
              Specialized, efficient, and thorough Home services
            </h1>

            <p className="text-lg leading-relaxed max-w-lg txt-color-primary">
              We provide performing Home services using the least amount of
              time, energy, and money.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
              <Link to="/register-technician" className="bg-color-main text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md text-sm sm:text-base font-semibold btn-filled-slide text-center sm:text-left">
                Become a Professional
              </Link>
              <button
                onClick={scrollToServices}
                className="border border-color-main text-color-main btn-transparent-slide px-4 sm:px-6 py-2 sm:py-3 rounded-md text-sm sm:text-base font-semibold text-center sm:text-left"
              >
                View All Services
              </button>
            </div>
          </div>

          {/* Right Image Section */}
          <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
            <img
              src={heroicon}
              alt="Cleaning service"
              className="w-full max-w-md rounded-2xl object-cover"
            />
          </div>
        </section>

        <section
          ref={servicesRef}
          className="w-full px-6 lg:px-32 pt-24 pb-20 flex flex-col gap-10 services-section"
        >
          {/* Header Row */}
          <div className="w-full flex flex-col lg:flex-row justify-between items-start gap-10">
            {/* LEFT SIDE TITLE */}

            {/* Desktop Title (hidden on mobile) */}
            <h2 className="hidden lg:block txt-color-primary text-2xl sm:text-4xl lg:text-5xl font-semibold leading-tight max-w-xl">
              We always provide the best service
            </h2>

            {/* Mobile Title (hidden on desktop) */}
            <h2 className="lg:hidden txt-color-primary text-3xl font-semibold text-center w-full">
              Our Services
            </h2>

            {/* RIGHT SIDE DESCRIPTION */}
            <div className="flex flex-col gap-3 max-w-md">
              {/* Desktop "Services" text */}
              <h4 className="hidden lg:block text-neutral-900 text-xl font-semibold">
                Services
              </h4>

              {/* Mobile "Our Services" (if you want this repeated, optional) */}
              {/* <h4 className="lg:hidden text-neutral-900 text-xl font-semibold">
        Our Services
      </h4> */}

              {/* Desktop description */}
              <p className="hidden lg:block text-stone-500 text-base leading-6">
                While we can customize your cleaning plan to suit your needs,
                most clients schedule regular cleaning services:
              </p>

              {/* Mobile description removed completely */}
            </div>
          </div>

          {/* Divider */}
          <div className="w-full border-b border-neutral-300"></div>
          <div className="flex flex-wrap gap-6 py-4 px-2 items-center justify-center mt-10">
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
                className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 p-4 rounded-2xl shadow-md hover:shadow-lg transition flex flex-col items-center justify-center gap-2 bg-white"
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
        <section className="w-full px-6 lg:px-32 py-20 flex flex-col lg:flex-row items-center justify-between gap-10">
          {/* Text Content */}
          <div className="flex-1 flex flex-col gap-12 text-center lg:text-left  ">
            {/* Heading Block */}
            <div className="flex flex-col gap-6">
              <p className="text-base text-neutral-900 font-normal font-Lato text-center lg:text-left">
                Affordable cleaning solutions
              </p>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-semibold font-Outfit txt-color-primary leading-tight">
                High-Quality and Friendly
                <br />
                Services at Fair Prices
              </h2>
            </div>

            {/* Description */}
            <p className="text-xl text-stone-500 leading-8 max-w-lg">
              We provide comprehensive cleaning services tailored to your needs.
              From residential cleaning services
            </p>
          </div>

          {/* Images */}
          <div className="hidden lg:flex gap-6">
            <img
              src={qualiticon}
              alt="Cleaning Service 1"
              className="w-110 h-96 rounded-2xl  object-cover"
            />
          </div>
        </section>

        <section className="w-full px-6 lg:px-32 py-20 flex flex-col gap-10">
          <div className="w-full flex flex-col lg:flex-row justify-between gap-10 text-center lg:text-left items-center lg:items-start">
            {/* Left Title */}
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-semibold txt-color-primary leading-tight w-full lg:max-w-2xl hidden md:block">
              Effective Service Requires an Expert Service Team
            </h2>

            {/* Right Description */}
            <div className="flex flex-col gap-3 max-w-md w-full lg:w-auto">
              {/* Mobile text */}
              <h2 className="text-2xl font-semibold txt-color-primary block md:hidden">
                Our Service Providers
              </h2>

              <h4 className="text-xl font-semibold txt-color-primary hidden md:block text-center lg:text-left">
                Expert Team
              </h4>

              <p className="text-base text-stone-500 leading-6 hidden md:block text-center lg:text-left">
                We have professional expert service technicians ensuring
                top-notch cleanliness and hygiene for your space.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full border-b border-neutral-300"></div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {professionals.slice(0, 4).map((pro) => (
              <TechnicianCard
                key={pro._id || pro.id}
                pro={pro}
                onBookClick={() => {
                  toast.error("Please login first");
                  setTimeout(() => navigate("/login"), 1200);
                }}
              />
            ))}
          </div>
        </section>

        <section className="w-full px-6 lg:px-32 py-20 flex flex-col lg:flex-row items-start gap-16">
          {/* Image */}
          <div className="shrink-0 hidden lg:flex">
            <img
              src={welcomeicon}
              alt="Pro-Cleaning"
              className="w-115 h-96 rounded-2xl  object-cover"
            />
          </div>

          {/* Text Content */}
          <div className="flex-1 flex flex-col gap-12 text-center lg:text-left">
            {/* Heading */}
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-semibold txt-color-primary leading-tight">
                Welcome To Our
                <br />
                Home Service Company!
              </h2>
              <p className="text-base text-stone-500 leading-6">
                We make your space shine! Professional and reliable cleaning
                service company providing top-notch solutions for homes and
                businesses. Satisfaction guaranteed!
              </p>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Vetted professionals",
                "Next day availability",
                "Standard cleaning tasks",
                "Affordable Prices",
                "Best Quality",
                "Satisfaction Guaranteed",
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 bg-stone-100 rounded"
                >
                  {/* Phosphor Check Icon */}
                  <Check
                    size={20}
                    weight="bold"
                    className="txt-color-primary"
                  />

                  <span className="text-neutral-900 font-semibold text-base">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full px-6 lg:px-32 py-20 flex flex-col lg:flex-row justify-between gap-16">
          {/* Left Contact Info */}
          <div className="flex-1 flex flex-col gap-10">
            <h3 className="txt-color-primary text-4xl text-center lg:text-left">
              Find Us
            </h3>

            <div className="flex flex-col gap-6">
              {/* Contact Cards */}
              {[
                {
                  title: "Call Us",
                  value: "+(08) 255 201 888",
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 5h2l3 6-3 6H3l3-6-3-6zM14 5h2l3 6-3 6h-2l3-6-3-6z"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Email Now",
                  value: "Hello@procleaning.com",
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18V8H3v8z"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Address",
                  value: "7510, Brand Tower, New York, USA",
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                      />
                      <circle cx={12} cy={9} r={2} fill="currentColor" />
                    </svg>
                  ),
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-5 bg-neutral-50 rounded-xl shadow-sm"
                >
                  <div className="flex items-center justify-center w-14 h-14 bg-color-main rounded-full shrink-0">
                    {item.icon}
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xl font-semibold text-neutral-900">
                      {item.title}
                    </span>
                    <span className="text-base text-stone-500">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Contact Form */}
          <div className="flex-1 flex flex-col gap-10">
            <div className="flex flex-col gap-4 text-center lg:text-left">
              <span className="text-base text-neutral-900">Contact Info</span>
              <h2 className="text-4xl font-semibold txt-color-primary leading-tight">
                Keep In Touch
              </h2>
              <p className="text-base text-stone-500 leading-6">
                We prioritize responding to your inquiries promptly to ensure
                you receive the assistance you need in a timely manner.
              </p>
            </div>

            {/* Form */}
            <form
              className="flex flex-col gap-6"
              onSubmit={handleContactSubmit}
            >
              <input
                type="text"
                placeholder="Name"
                className="w-full px-5 py-4 rounded shadow-sm border border-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-950"
                name="name"
              />

              <input
                type="email"
                placeholder="Email"
                className="w-full px-5 py-4 rounded shadow-sm border border-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-950"
                name="email"
              />

              <textarea
                placeholder="Message"
                rows={6}
                className="w-full px-5 py-4 rounded shadow-sm border border-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-950 resize-none"
                name="message"
              />

              <button
                type="submit"
                className="px-6 py-3 bg-color-main text-white rounded-md font-medium btn-filled-slide hover:bg-blue-900 transition"
              >
                Send Message
              </button>
            </form>
          </div>
        </section>
        <Footer />
      </div>
    </>
  );
}

export default LandingPage;
