import React, { useRef } from "react";
import Navbar from "@/blocks/Navbar";
import Footer from "@/blocks/Footer";
import TechnicianCard from "@/blocks/TechnicianCard";
import { FunnelSimple, MagnifyingGlass, MapPin } from "phosphor-react";
import "../css/landingPage.css";

const categories = [
  { id: "all", label: "All services" },
  { id: "cleaning", label: "Cleaning" },
  { id: "plumbing", label: "Plumbing" },
  { id: "electrical", label: "Electrical" },
  { id: "gardening", label: "Gardening" },
  { id: "repairs", label: "Repairs" },
];

const technicians = [
  {
    id: 1,
    name: "Amit Sharma",
    service: "Deep Cleaning • Carpets, kitchens, appliances",
    price: "$25/hr",
    rating: 4.8,
    verified: true,
    image:
      "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 2,
    name: "Rachin Verma",
    service: "Licensed Plumber • Fixtures, leaks, heaters",
    price: "$30/hr",
    rating: 4.6,
    verified: false,
    image:
      "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3,
    name: "Ramesh Patel",
    service: "Certified Electrician • Panels, rewiring, smart home",
    price: "$28/hr",
    rating: 4.9,
    verified: true,
    image:
      "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 4,
    name: "Dib Rai",
    service: "Garden Care • Pruning, lawn, irrigation",
    price: "$20/hr",
    rating: 4.5,
    verified: false,
    image:
      "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 5,
    name: "Tashi Gurung",
    service: "Handyman • Fixtures, mounting, repairs",
    price: "$22/hr",
    rating: 4.7,
    verified: true,
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 6,
    name: "Pratima Khadka",
    service: "Move-out Cleaning • Deep clean, disinfect, organize",
    price: "$26/hr",
    rating: 4.8,
    verified: true,
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
  },
];

function Services() {
  return (
    <>
      <Navbar />
      <main className="px-6 lg:px-32 pt-24 pb-16 min-h-screen bg-stone-50 space-y-12">
        {/* Intro */}
        <section className="flex flex-col lg:flex-row items-start justify-between gap-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-color-main uppercase tracking-wide">
              Browse services
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">
              Find trusted professionals for every room and repair
            </h1>
            <p className="text-base text-stone-600 max-w-2xl">
              Filter by category, availability, or rating to get the perfect
              match for your home projects. Book in seconds, track in one place.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-4 w-full lg:w-[380px]">
            <div className="text-sm font-semibold text-stone-500 uppercase tracking-wide">
              Quick search
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border rounded-xl bg-white">
              <MagnifyingGlass size={18} className="text-stone-400" />
              <input
                type="text"
                className="flex-1 text-sm focus:outline-none"
                placeholder="Try “water heater repair”"
              />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border rounded-xl bg-white">
              <MapPin size={18} className="text-stone-400" />
              <input
                type="text"
                className="flex-1 text-sm focus:outline-none"
                placeholder="Kathmandu • Change location"
              />
            </div>
            <button className="w-full px-4 py-3 bg-color-main text-white rounded-xl font-semibold btn-filled-slide">
              Search technicians
            </button>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-white rounded-3xl shadow-sm border p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold txt-color-primary">
                Popular categories
              </h2>
              <p className="text-sm text-stone-500">
                Tap to filter the technician list
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-full text-sm">
              <FunnelSimple size={16} />
              More filters
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {categories.map((category, idx) => (
              <button
                key={category.id}
                className={`px-4 py-2 rounded-full text-sm font-semibold border ${
                  idx === 0
                    ? "bg-color-main text-white border-color-main"
                    : "text-stone-600 hover:border-color-main"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </section>

        {/* Technician cards */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold txt-color-primary">
              Recommended professionals
            </h2>
            <button className="text-sm text-color-main hover:underline">
              See all 120+
            </button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {technicians.map((pro) => (
              <TechnicianCard key={pro.id} pro={pro} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default Services;
