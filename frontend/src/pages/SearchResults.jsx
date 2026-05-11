import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Navbar from "@/blocks/Navbar";
import Footer from "@/blocks/Footer";
import TechnicianCard from "@/blocks/TechnicianCard";
import { MagnifyingGlass, MapPin, SlidersHorizontal, X } from "phosphor-react";
import "../css/landingPage.css";
import { apiClient } from "@/lib/api";
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
  const navigate = useNavigate();
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [newSearchTerm, setNewSearchTerm] = useState("");

  const token = Cookies.get("token") || localStorage.getItem("token");

  // Handle new search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (!newSearchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    navigate(`/search-results?search=${encodeURIComponent(newSearchTerm)}`);
    setNewSearchTerm("");
  };

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

          // Get user from localStorage and extract address
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          const userAddress = user.address;

          // Start with basic pagination params - fetch all active technicians
          // Then filter by search term and other criteria on the frontend
          const params = {
            page: 1,
            pageSize: 100 // Get more results to filter through
          };
          if (userAddress && ["chitwan", "pokhara", "kathmandu"].includes(userAddress)) {
            params.userAddress = userAddress;
          }

          console.log("Fetching technicians with params:", params);
          console.log("Search query:", searchQueryFromUrl);

          const response = await apiClient.get("/api/technicians/search-technician", {
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

  const activeFilterCount = [
    selectedCategory !== "all",
    Boolean(searchQuery),
    Boolean(locationQuery),
    Boolean(minRatingFilter),
    Boolean(maxFeeFilter),
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSelectedCategory(categoryFromUrl || "all");
    setSearchQuery("");
    setLocationQuery("");
    setMinRatingFilter("");
    setMaxFeeFilter("");
    setSortBy("default");
  };

  const renderFilterFields = () => (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5 focus-within:border-color-main focus-within:ring-2 focus-within:ring-blue-100">
          <MagnifyingGlass size={16} className="text-stone-400" />
          <input
            type="text"
            className="w-full text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none"
            placeholder="Name, service, description"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5 focus-within:border-color-main focus-within:ring-2 focus-within:ring-blue-100">
          <MapPin size={16} className="text-stone-400" />
          <input
            type="text"
            className="w-full text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none"
            placeholder="Filter by location"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-color-main focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Min rating"
            min="0"
            max="5"
            step="0.1"
            value={minRatingFilter}
            onChange={(e) => setMinRatingFilter(e.target.value)}
          />
          <input
            type="number"
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-color-main focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Max fee"
            min="0"
            value={maxFeeFilter}
            onChange={(e) => setMaxFeeFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Category</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                selectedCategory === category.id
                  ? "border-color-main bg-color-main text-white"
                  : "border-stone-300 bg-white text-stone-600 hover:border-color-main hover:txt-color-primary"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  console.log("Final filtered technicians:", filteredTechnicians.length);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-linear-to-b from-stone-50 to-white px-4 py-8 sm:px-6 lg:px-12 xl:px-20">
        <section className="mx-auto max-w-7xl space-y-8">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] txt-color-primary">Search Results</p>
            <h1 className="mt-2 text-2xl font-bold text-stone-900 sm:text-4xl">
              Results for "<span className="txt-color-primary">{searchQueryFromUrl}</span>"
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-stone-600 sm:text-base">
              Explore professionals and refine by service, location, rating, and fee to find the best fit for your work.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                {displayTechnicians.length} matches
              </span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {activeFilterCount} active filter{activeFilterCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          <section className="grid gap-6 md:grid-cols-12">
            <aside className="z-20 hidden h-fit rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:col-span-4 md:sticky md:top-24 md:block lg:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-stone-800">
                  <SlidersHorizontal size={18} weight="bold" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide">Refine Search</h2>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
                  >
                    <X size={12} weight="bold" /> Clear
                  </button>
                )}
              </div>

              {renderFilterFields()}
            </aside>

            <section className="min-w-0 space-y-5 md:col-span-8 lg:col-span-9">
              {/* New Search Bar */}
              <form onSubmit={handleSearchSubmit} className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-stone-300 px-2 py-2 focus-within:border-color-main focus-within:ring-2 focus-within:ring-blue-100">
                    <MagnifyingGlass size={16} className="shrink-0 text-stone-400" />
                    <input
                      type="text"
                      value={newSearchTerm}
                      onChange={(e) => setNewSearchTerm(e.target.value)}
                      placeholder="Search again..."
                      className="w-full min-w-0 bg-transparent text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-color-main px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
                  >
                    Search
                  </button>
                </div>
              </form>

              <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-stone-900 sm:text-2xl">
                    Search Results
                    <span className="ml-2 text-base font-normal text-stone-500">({displayTechnicians.length} found)</span>
                  </h2>
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-color-main hover:txt-color-primary md:hidden"
                  >
                    <SlidersHorizontal size={16} weight="bold" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="rounded-full bg-color-main px-2 py-0.5 text-xs text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 focus:border-color-main focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-64"
                >
                  <option value="default">Default Order</option>
                  <option value="rating_high">Highest Rated</option>
                  <option value="rating_low">Lowest Rated</option>
                  <option value="verified">Verified Technicians</option>
                  <option value="fee_low">Lowest Fee</option>
                  <option value="fee_high">Highest Fee</option>
                </select>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-semibold text-red-600">Error: {error}</p>
                </div>
              )}

              {loading ? (
                <div className="grid max-w-6xl grid-cols-[repeat(auto-fit,minmax(270px,270px))] justify-center gap-6 md:justify-start">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="h-[340px] animate-pulse rounded-2xl border border-stone-200 bg-stone-100" />
                  ))}
                </div>
              ) : displayTechnicians.length > 0 ? (
                <div className="grid max-w-6xl grid-cols-[repeat(auto-fit,minmax(270px,270px))] justify-center gap-6 md:justify-start">
                  {displayTechnicians.map((pro) => (
                    <TechnicianCard key={pro._id || pro.id} pro={pro} />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white px-6 text-center">
                  <h3 className="text-lg font-semibold text-stone-800">No matching technicians</h3>
                  <p className="mt-1 text-sm text-stone-500">
                    Try adjusting your filters or clearing them to see more results.
                  </p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={handleClearFilters}
                      className="mt-4 rounded-xl bg-color-main px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </section>
          </section>

          {mobileFiltersOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/40 md:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            >
              <aside
                className="h-full w-[88%] max-w-sm overflow-y-auto bg-white p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-stone-800">
                    <SlidersHorizontal size={18} weight="bold" />
                    <h2 className="text-sm font-semibold uppercase tracking-wide">Refine Search</h2>
                  </div>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="rounded-lg p-1 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
                    aria-label="Close filters"
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>

                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="mb-4 inline-flex items-center gap-1 rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 transition hover:border-color-main hover:txt-color-primary"
                  >
                    <X size={12} weight="bold" /> Clear all
                  </button>
                )}

                {renderFilterFields()}

                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="mt-6 w-full rounded-xl bg-color-main px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </aside>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default SearchResults;
