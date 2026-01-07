import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/blocks/Navbar";
import Footer from "@/blocks/Footer";
import TechnicianCard from "@/blocks/TechnicianCard";
import { FunnelSimple, MagnifyingGlass, MapPin } from "phosphor-react";
import "../css/landingPage.css";
import axios from "axios";

const categories = [
  { id: "all", label: "All services" },
  { id: "carpentry", label: "Carpentry" },
  { id: "plumbing", label: "Plumbing" },
  { id: "electrical", label: "Electrical" },
  { id: "bathroom_remodeling", label: "Bathroom Remodeling" },
  { id: "repairs", label: "Appliance Repair" },
  { id: "locksmith", label: "Locksmith" },
];

function Services() {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");

  // Mapping of category IDs to service types
  const categoryMapping = {
    all: null,
    carpentry: "Carpentry",
    plumbing: "Plumbing",
    electrical: "Electrical",
    bathroom_remodeling: "Bathroom Remodeling",
    repairs: "Appliance Repair",
    locksmith: "Locksmith"
  };

  // Fetch active technicians
  useEffect(() => {
      const fetchActiveTechnicians = async () => {
        try {
          setLoading(true);
          // Get user from localStorage and extract address
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          const address = user.address;
          let url = "/api/technicians/get-active-technicians";
          if (address && ["lalitpur", "bakhtapur", "kathmandu"].includes(address)) {
            url += `?address=${address}`;
          }
          const response = await axios.get(url);
          if (response.data && response.data.success) {
            setTechnicians(response.data.technicians);
          }
        } catch (error) {
          console.error("Error fetching active technicians:", error);
          setTechnicians([]);
        } finally {
          setLoading(false);
        }
      };

      fetchActiveTechnicians();
    }, []);

  // Filter technicians based on selected category, search query, and location
  const filteredTechnicians = technicians.filter((tech) => {
    const serviceTypeMatch =
      selectedCategory === "all" || tech.serviceType === categoryMapping[selectedCategory];
    
    const searchMatch =
      !searchQuery ||
      tech.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const locationMatch =
      !locationQuery ||
      (tech.location && tech.location.toLowerCase().includes(locationQuery.toLowerCase()));

    return serviceTypeMatch && searchMatch && locationMatch;
  });
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

          {/* <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-4 w-full lg:w-[380px]">
            <div className="text-sm font-semibold text-stone-500 uppercase tracking-wide">
              Quick search
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border rounded-xl bg-white">
              <MagnifyingGlass size={18} className="text-stone-400" />
              <input
                type="text"
                className="flex-1 text-sm focus:outline-none"
                placeholder="Try “water heater repair”"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border rounded-xl bg-white">
              <MapPin size={18} className="text-stone-400" />
              <input
                type="text"
                className="flex-1 text-sm focus:outline-none"
                placeholder="Kathmandu • Change location"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
            </div>
            <button className="w-full px-4 py-3 bg-color-main text-white rounded-xl font-semibold btn-filled-slide">
              Search technicians
            </button>
          </div> */}
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
            
          </div>

          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                  selectedCategory === category.id
                    ? "bg-color-main text-white border-color-main"
                    : "text-stone-600 border-stone-300 hover:border-color-main"
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
            {/* <button className="text-sm text-color-main hover:underline">
              See all {technicians.length}
            </button> */}
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-stone-500">Loading technicians...</p>
            </div>
          ) : filteredTechnicians.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredTechnicians.map((pro) => (
                <TechnicianCard key={pro._id || pro.id} pro={pro} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-stone-500">No technicians available at the moment</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default Services;
