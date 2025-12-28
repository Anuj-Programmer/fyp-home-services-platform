import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/blocks/Navbar";
import Footer from "@/blocks/Footer";
import TechnicianCard from "@/blocks/TechnicianCard";
import { MagnifyingGlass, MapPin } from "phosphor-react";
import "../css/landingPage.css";
import axios from "axios";
import Cookies from "js-cookie";

const categories = [
  { id: "all", label: "All services" },
  { id: "carpentry", label: "Carpentry" },
  { id: "plumbing", label: "Plumbing" },
  { id: "electrical", label: "Electrical" },
  { id: "bathroom_remodeling", label: "Bathroom Remodeling" },
  { id: "repairs", label: "Appliance Repair" },
  { id: "locksmith", label: "Locksmith" },
];

function SearchResults() {
  const [searchParams] = useSearchParams();
  const searchQueryFromUrl = searchParams.get("search");
  const categoryFromUrl = searchParams.get("category");

  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [minRatingFilter, setMinRatingFilter] = useState("");
  const [maxFeeFilter, setMaxFeeFilter] = useState("");
  const [sortBy, setSortBy] = useState("default");

  const token = Cookies.get("token") || localStorage.getItem("token");

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

  // Fetch search results from API
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQueryFromUrl) {
        setError("No search query provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Start with basic pagination params - fetch all active technicians
        // Then filter by search term and other criteria on the frontend
        const params = {
          page: 1,
          pageSize: 100 // Get more results to filter through
        };

        // NOTE: We're NOT sending serviceType, location, minRating, maxFee to API
        // because we want to search across ALL technicians first by name/description,
        // then apply filters locally. This ensures users find what they're looking for.

        console.log("Fetching technicians with params:", params);
        console.log("Search query:", searchQueryFromUrl);

        const response = await axios.get("/api/technicians/search-technician", {
          params,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log("API response:", response.data);

        if (response.data && response.data.success) {
          console.log("Sample technician data:", response.data.data[0]); // Log first technician to see fields
          // Filter search results by the search query (name, description, location, service type)
          const filtered = response.data.data.filter((tech) => {
            const firstName = tech.firstName?.toLowerCase() || "";
            const lastName = tech.lastName?.toLowerCase() || "";
            const description = tech.description?.toLowerCase() || "";
            const location = tech.location?.toLowerCase() || "";
            const serviceType = tech.serviceType?.toLowerCase() || "";
            const searchTerm = searchQueryFromUrl.toLowerCase();
            
            const matches = 
              firstName.includes(searchTerm) ||
              lastName.includes(searchTerm) ||
              description.includes(searchTerm) ||
              location.includes(searchTerm) ||
              serviceType.includes(searchTerm) ||
              `${firstName} ${lastName}`.includes(searchTerm); // Match full name
            
            console.log(`Checking ${firstName} ${lastName} (${serviceType}, ${location}): ${matches ? "✓ MATCH" : "✗ no match"}`);
            return matches;
          });
          
          console.log(`Filtered results: ${filtered.length} technicians match search query`);
          setSearchResults(filtered);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Error fetching search results:", err);
        setError(err.response?.data?.message || "Failed to fetch search results");
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchQueryFromUrl, token]);

  // Filter results based on refine search filters (NOT the initial search query)
  const filteredTechnicians = searchResults.filter((tech) => {
    const serviceTypeMatch =
      selectedCategory === "all" || tech.serviceType === categoryMapping[selectedCategory];

    // Only filter by searchQuery if user has entered something in refine search
    const searchMatch =
      !searchQuery ||
      tech.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.description.toLowerCase().includes(searchQuery.toLowerCase());

    const locationMatch =
      !locationQuery ||
      (tech.location && tech.location.toLowerCase().includes(locationQuery.toLowerCase()));

    const ratingMatch =
      !minRatingFilter ||
      (tech.averageRating && tech.averageRating >= parseFloat(minRatingFilter));

    const feeMatch =
      !maxFeeFilter ||
      (tech.fee && tech.fee <= parseFloat(maxFeeFilter));

    return serviceTypeMatch && searchMatch && locationMatch && ratingMatch && feeMatch;
  });

  // Sort the filtered technicians based on sortBy state
  const sortedTechnicians = [...filteredTechnicians].sort((a, b) => {
    switch (sortBy) {
      case "rating_high":
        return (b.averageRating || 0) - (a.averageRating || 0);
      case "rating_low":
        return (a.averageRating || 0) - (b.averageRating || 0);
      case "fee_low":
        return (a.fee || 0) - (b.fee || 0);
      case "fee_high":
        return (b.fee || 0) - (a.fee || 0);
      case "verified":
        // Filter to ONLY show verified technicians, then sort by rating
        return (b.averageRating || 0) - (a.averageRating || 0);
      default:
        return 0;
    }
  });

  // If "verified" is selected, filter to only show verified technicians
  const displayTechnicians = sortBy === "verified" 
    ? (() => {
        const verified = sortedTechnicians.filter(tech => {
          console.log(`Checking ${tech.firstName}: isVerifiedTechnician = ${tech.isVerifiedTechnician}`);
          return tech.isVerifiedTechnician === true;
        });
        console.log(`Found ${verified.length} verified technicians out of ${sortedTechnicians.length}`);
        return verified;
      })()
    : sortedTechnicians;

  console.log("Final filtered technicians:", filteredTechnicians.length);

  return (
    <>
      <Navbar />
      <main className="px-6 lg:px-32 pt-24 pb-16 min-h-screen bg-stone-50 space-y-12">
        {/* Intro */}
        <section className="flex flex-col lg:flex-row items-start justify-between gap-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-color-main uppercase tracking-wide">
              Search Results
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">
              Results for "{searchQueryFromUrl}"
            </h1>
            <p className="text-base text-stone-600 max-w-2xl">
              Refine your search using filters below to find the perfect match for your home projects.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-4 w-full lg:w-[380px]">
            <div className="text-sm font-semibold text-stone-500 uppercase tracking-wide">
              Refine Search
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border rounded-xl bg-white">
              <MagnifyingGlass size={18} className="text-stone-400" />
              <input
                type="text"
                className="flex-1 text-sm focus:outline-none"
                placeholder="Search by name or service"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border rounded-xl bg-white">
              <MapPin size={18} className="text-stone-400" />
              <input
                type="text"
                className="flex-1 text-sm focus:outline-none"
                placeholder="Filter by location"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border rounded-xl bg-white">
              <input
                type="number"
                className="flex-1 text-sm focus:outline-none"
                placeholder="Min rating (0-5)"
                min="0"
                max="5"
                step="0.1"
                value={minRatingFilter}
                onChange={(e) => setMinRatingFilter(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border rounded-xl bg-white">
              <input
                type="number"
                className="flex-1 text-sm focus:outline-none"
                placeholder="Max fee"
                min="0"
                value={maxFeeFilter}
                onChange={(e) => setMaxFeeFilter(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Search Results */}
        <section className="space-y-6">
          <div className="flex flex-col lg:flex-row items-start gap-4 justify-between">
            <div>
              <h2 className="text-2xl font-semibold txt-color-primary">
                Search Results
                <span className="text-lg text-stone-500 font-normal ml-2">
                  ({displayTechnicians.length} found)
                </span>
              </h2>
            </div>
            <div className="w-full lg:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full lg:w-64 px-4 py-2.5 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-color-main focus:border-color-main bg-white cursor-pointer"
              >
                <option value="default">Default Order</option>
                <option value="rating_high">Highest Rated</option>
                <option value="rating_low">Lowest Rated</option>
                <option value="verified">Verified Technicians</option>
                <option value="fee_low">Lowest Fee</option>
                <option value="fee_high">Highest Fee</option>
              </select>
            </div>
          </div>

          {/* <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  selectedCategory === category.id
                    ? "bg-color-main text-white border-color-main"
                    : "text-stone-600 border-stone-300 hover:border-color-main"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div> */}
          <hr />

          {error && (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-500 font-semibold">Error: {error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-stone-500">Loading results...</p>
            </div>
          ) : displayTechnicians.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {displayTechnicians.map((pro) => (
                <TechnicianCard key={pro._id || pro.id} pro={pro} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-stone-500">
                No technicians match your search criteria. Try adjusting your filters.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default SearchResults;
