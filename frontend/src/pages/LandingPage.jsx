import React, { useRef } from "react";
import axios from "axios";
import Navbar from "@/blocks/Navbar";
import "../css/landingPage.css";
import heroicon from "../assets/HeroIcon.png";
import qualiticon from "../assets/QualityPageIcon.png";
import toast, {Toaster} from "react-hot-toast";
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
} from "phosphor-react";
import TechnicianCard from "@/blocks/TechnicianCard";


function LandingPage() {
  const servicesRef = useRef(null);

  const scrollToServices = () => {
    servicesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    // Handle contact form submission logic here
    const formData  = {
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

  const professionals = [
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
      name: "Priya Verma",
      service: "Plumbing Repair",
      price: "$30/hr",
      rating: 4.6,
      verified: false,
      image:
        "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 3,
      name: "Ramesh Patel",
      service: "Electrician",
      price: "$28/hr",
      rating: 4.9,
      verified: true,
      image:
        "https://images.unsplash.com/photo-1520975922217-3d3d6c6a4f86?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 4,
      name: "Sita Rai",
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
    <Toaster position="top-center" reverseOrder={false} />
      <Navbar />
      {/* Hero Section */}
      <section className="relative bg-linear-to-r from-blue-600 to-blue-400 text-white HeroBanner">
        <div className="container mx-auto px-6 py-32 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="lg:w-1/2">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Affordable & Reliable Home Services
            </h1>
            <p className="text-lg lg:text-xl mb-6">
              We provide top-notch cleaning, plumbing, appliance repair, and
              more, all tailored to your needs.
            </p>
            <div className="flex gap-4 flex-wrap">
              <button className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg shadow hover:shadow-lg transition">
                Become a Professional
              </button>
              <button onClick={scrollToServices} className="bg-transparent border border-white px-6 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition">
                View Services
              </button>
            </div>
          </div>
          <div className="lg:w-1/2 relative hidden lg:block">
            <img src={heroicon} alt="Hero" className="rounded-xl" />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section ref={servicesRef} className="py-24 bg-gray-50 service-section">
        <div className="container mx-auto px-6 text-center">
          <div>
            <div className="flex flex-col lg:flex-row items-center gap-10 text-left mx-auto ">
              <h2 className="text-[44px] font-bold mb-4 lg:mb-0 We-always-provide-the-best-service">
                We always provide the best service
              </h2>

              <div className="Service-text mt-4 lg:mt-0 lg:ml-10">
                <h6 className="text-[20px] font-semibold mb-2">Services</h6>

                <p className="text-[16px]">
                  While we can customize your cleaning plan to suit your needs,
                  most clients schedule regular cleaning services:
                </p>
              </div>
            </div>

            <hr className="mt-8" />
          </div>

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

        </div>
      </section>

      <section className="bg-white py-16 px-6 md:px-16 text-gray-800 rounded-t-3xl -mt-12 relative z-10">
        <h2 className="text-3xl font-bold mb-8 text-center .txt-color-primary">
          Featured Professionals
        </h2>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {professionals.map((pro) => (
            <TechnicianCard key={pro.id} pro={pro} />
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 container mx-auto px-6 flex flex-col lg:flex-row items-center gap-25">
        <div className="lg:w-1/2">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            High-Quality Service You Can Trust
          </h2>
          <p className="text-gray-600 mb-6">
            Our team of vetted professionals ensures that your home or office is
            treated with care. Satisfaction guaranteed every time.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <div className="text-blue-600">
                <Star />
              </div>
              Vetted Professionals
            </li>
            <li className="flex items-center gap-3">
              <div className="text-blue-600">
                <Star />
              </div>
              Next Day Availability
            </li>
            <li className="flex items-center gap-3">
              <div className="text-blue-600">
                <Star />
              </div>
              Affordable Prices
            </li>
          </ul>
        </div>
        <div className="lg:w-1/2">
          <img src={qualiticon} alt="About" className="rounded-xl" />
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-gray-100">
        <div className="container mx-auto px-6 lg:flex lg:gap-16">
          <div className="lg:w-1/2 mb-10 lg:mb-0">
            <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
            <p className="text-gray-600 mb-6">
              Reach out to us for inquiries or to book a service. We respond
              quickly!
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-white p-4 rounded shadow">
                <Phone className="txt-color-primary" size={24} />
                <span>+(08) 255 201 888</span>
              </div>
              <div className="flex items-center gap-4 bg-white p-4 rounded shadow">
                <Envelope className="txt-color-primary" size={24} />
                <span>Hello@procleaning.com</span>
              </div>
              <div className="flex items-center gap-4 bg-white p-4 rounded shadow">
                <MapPin className="txt-color-primary " size={24} />
                <span>7510, Brand Tower, New York, USA</span>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2">
            <form className="space-y-4 bg-white p-8 rounded-xl shadow" onSubmit={handleContactSubmit}>
              <input
                type="text"
                placeholder="Name"
                className="w-full p-3 border border-gray-300 rounded"
                name="name"
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 border border-gray-300 rounded"
                name="email"
              />
              <textarea
                placeholder="Message"
                className="w-full p-3 border border-gray-300 rounded h-32"
                name="message"
              ></textarea>
              <button type="submit" className="bg-color-main text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition" >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6 flex flex-col lg:flex-row justify-between gap-10">
          <div>
            <h3 className="text-2xl font-bold mb-4">
              <span className="text-blue-600">Pro</span>Cleaning
            </h3>
            <p className="text-gray-400">
              Stay updated with our latest cleaning tips, service updates, and
              more.
            </p>
          </div>
          <div className="flex gap-16">
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Services</li>
                <li>Our Team</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">More</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Support</li>
                <li>Privacy Policy</li>
                <li>Terms & Conditions</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="text-center mt-12 text-gray-500">
          © 2025 ProCleaning. All rights reserved.
        </div>
      </footer>
    </>
  );
}

export default LandingPage;
