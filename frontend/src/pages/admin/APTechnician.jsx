
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../../blocks/Navbar";
import Footer from "../../blocks/Footer";
import AdminSidebar from "./AdminSidebar";

function APTechnician() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [technicians, setTechnicians] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalType, setModalType] = useState(null); // "account" or "certificate"
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [technicianToDelete, setTechnicianToDelete] = useState(null);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get("token") || localStorage.getItem("token");
      
      // Fetch all technicians
      const response = await axios.get("/api/admin/technicians", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const techData = response.data.technicians || [];
      setTechnicians(techData);
    } catch (error) {
      toast.error("Failed to fetch technicians");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openVerificationModal = (technician, type) => {
    // type: "account" or "certificate"
    setSelectedTechnician(technician);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleAcceptTechnician = async () => {
    if (!selectedTechnician || !modalType) return;
    
    try {
      setIsSubmitting(true);
      const token = Cookies.get("token") || localStorage.getItem("token");
      
      if (modalType === "account") {
        // Account Approval Flow
        await axios.patch(
          `/api/admin/${selectedTechnician._id}/status`,
          { status: "approved" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Technician account approved successfully");
      } else if (modalType === "certificate") {
        // Certificate Verification Flow
        await axios.patch(
          `/api/admin/technician/${selectedTechnician._id}/certificate-status`,
          { status: "approved" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Certificate approved successfully");
      }
      
      setIsModalOpen(false);
      setSelectedTechnician(null);
      setModalType(null);
      fetchTechnicians();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectTechnician = async () => {
    if (!selectedTechnician || !modalType) return;
    
    try {
      setIsSubmitting(true);
      const token = Cookies.get("token") || localStorage.getItem("token");
      
      if (modalType === "account") {
        // Account Rejection Flow
        await axios.patch(
          `/api/admin/${selectedTechnician._id}/status`,
          { status: "rejected" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Technician account rejected");
      } else if (modalType === "certificate") {
        // Certificate Rejection Flow
        await axios.patch(
          `/api/admin/technician/${selectedTechnician._id}/certificate-status`,
          { status: "rejected" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Certificate rejected");
      }
      
      setIsModalOpen(false);
      setSelectedTechnician(null);
      setModalType(null);
      fetchTechnicians();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTechnician = async () => {
    if (!technicianToDelete) return;
    
    try {
      setIsSubmitting(true);
      const token = Cookies.get("token") || localStorage.getItem("token");
      
      // Delete technician
      await axios.delete(
        `/api/admin/technicians/${technicianToDelete._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Technician deleted successfully");
      setIsDeleteModalOpen(false);
      setTechnicianToDelete(null);
      fetchTechnicians();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete technician");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTechnicians = technicians.filter((tech) =>
    `${tech.firstName} ${tech.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tech.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tech.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter by tab
  let tabFilteredTechnicians = filteredTechnicians;
  if (activeTab === "Account Pending Request") {
    tabFilteredTechnicians = filteredTechnicians.filter(tech => tech.status === "pending");
  } else if (activeTab === "Verification Request") {
    tabFilteredTechnicians = filteredTechnicians.filter(tech => tech.certificateStatus === "pending");
  } else if (activeTab === "All") {
    // In All view, exclude pending certificate verification
    tabFilteredTechnicians = filteredTechnicians.filter(tech => tech.certificateStatus !== "pending");
  }

  // Helper to determine modal type based on active tab
  const getModalType = () => {
    if (activeTab === "Account Pending Request") return "account";
    if (activeTab === "Verification Request") return "certificate";
    // For "All" tab, check status first (account takes precedence)
    if (selectedTechnician?.status === "pending") return "account";
    if (selectedTechnician?.certificateStatus === "pending") return "certificate";
    return "account";
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-stone-50 pt-10">
        <AdminSidebar />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-12 pb-8 space-y-6 lg:space-y-8">
          {/* Mobile header */}
          <div className="lg:hidden sticky top-16 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-white border-b border-stone-200 flex items-center gap-3 mb-2">
            <button
              onClick={() => window.dispatchEvent(new Event("open-admin-sidebar"))}
              className="p-2 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-semibold text-stone-800 text-sm">Technicians Management</span>
          </div>

          <section className="space-y-2 pt-4 lg:pt-8">
            <p className="text-xs sm:text-sm font-semibold text-color-main uppercase tracking-wide">
              Admin Dashboard
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold txt-color-primary">
              Technicians Management
            </h1>
            <p className="text-sm sm:text-base text-stone-500 max-w-2xl">
              Manage service technicians, verify credentials, and monitor their performance.
            </p>
          </section>

          {/* Search */}
          <section>
            <input
              type="text"
              placeholder="Search by name, email, or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-color-main focus:ring-2 focus:ring-blue-100 text-sm"
            />
          </section>

          {/* Filter Tabs */}
          <section className="flex gap-1 border-b border-stone-200 overflow-x-auto scrollbar-hide">
            {["All", "Account Pending Request", "Verification Request"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 sm:px-4 py-2.5 font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? "text-color-main border-b-2 border-color-main"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </section>

          {/* Technicians Table */}
          <section className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Technician Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Specialty</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white text-sm">
                  {isLoading ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-stone-500">Loading technicians...</td></tr>
                  ) : tabFilteredTechnicians.length > 0 ? (
                    tabFilteredTechnicians.map((tech) => (
                      <tr key={tech._id} className="hover:bg-stone-50">
                        <td className="px-6 py-4"><span className="font-medium text-stone-900">{tech.firstName} {tech.lastName}</span></td>
                        <td className="px-6 py-4 text-stone-700">{tech.serviceType}</td>
                        <td className="px-6 py-4 text-stone-700">
                          <div>{tech.email}</div>
                          <div className="text-stone-500 mt-1">{tech.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            activeTab === "Verification Request" 
                              ? "bg-blue-100 text-blue-800"
                              : tech.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            tech.certificateStatus === "pending" ? "bg-blue-100 text-blue-800" :
                            "bg-green-100 text-green-800"
                          }`}>
                            {activeTab === "Verification Request" 
                              ? "Pending Verification"
                              : tech.status === "pending" ? "Pending Account" : tech.certificateStatus === "pending" ? "Pending Verification" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {activeTab === "Account Pending Request" && tech.status === "pending" ? (
                            <button 
                              onClick={() => {
                                setSelectedTechnician(tech);
                                setModalType("account");
                                setIsModalOpen(true);
                              }}
                              className="text-sm text-color-main hover:underline">View</button>
                          ) : activeTab !== "Verification Request" ? (
                            <button 
                              onClick={() => {
                                setTechnicianToDelete(tech);
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-sm text-red-600 hover:underline">Delete</button>
                          ) : (
                            <button 
                              onClick={() => {
                                if (tech.certificateStatus === "pending") {
                                  setSelectedTechnician(tech);
                                  setModalType("certificate");
                                  setIsModalOpen(true);
                                }
                              }}
                              disabled={tech.certificateStatus !== "pending"}
                              className="text-sm text-color-main hover:underline disabled:opacity-50 disabled:cursor-not-allowed">View</button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-stone-500">No technicians found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden p-4 space-y-3">
              {isLoading ? (
                <div className="py-12 text-center">
                  <p className="text-stone-500 text-base">Loading technicians...</p>
                </div>
              ) : tabFilteredTechnicians.length > 0 ? (
                tabFilteredTechnicians.map((tech) => (
                  <div
                    key={tech._id}
                    className="bg-white border border-stone-200 rounded-xl p-4 space-y-3 hover:shadow-md hover:border-stone-300 transition-all duration-200"
                  >
                    {/* Name + Status */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-color-main uppercase tracking-wide mb-1">Technician</p>
                        <p className="text-sm font-semibold text-neutral-900">{tech.firstName} {tech.lastName}</p>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shrink-0 ${
                        activeTab === "Verification Request" 
                          ? "bg-blue-100 text-blue-800"
                          : tech.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        tech.certificateStatus === "pending" ? "bg-blue-100 text-blue-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {activeTab === "Verification Request" 
                          ? "Pending Verification"
                          : tech.status === "pending" ? "Pending Account" : tech.certificateStatus === "pending" ? "Pending Verification" : "Active"}
                      </span>
                    </div>

                    <div className="h-px bg-stone-100" />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-stone-500 mb-0.5">Specialty</p>
                        <p className="text-sm font-medium text-neutral-900">{tech.serviceType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 mb-0.5">Phone</p>
                        <p className="text-sm font-medium text-neutral-900">{tech.phone}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-stone-500 mb-0.5">Email</p>
                        <p className="text-sm font-medium text-neutral-900 break-all">{tech.email}</p>
                      </div>
                    </div>

                    <div className="h-px bg-stone-100" />

                    <div className="flex gap-3 pt-1">
                      {activeTab === "Account Pending Request" && tech.status === "pending" ? (
                        <button 
                          onClick={() => {
                            setSelectedTechnician(tech);
                            setModalType("account");
                            setIsModalOpen(true);
                          }}
                          className="text-sm font-semibold text-color-main hover:underline">View</button>
                      ) : activeTab !== "Verification Request" ? (
                        <button 
                          onClick={() => {
                            setTechnicianToDelete(tech);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-sm font-semibold text-red-600 hover:underline">Delete</button>
                      ) : (
                        <button 
                          onClick={() => {
                            if (tech.certificateStatus === "pending") {
                              setSelectedTechnician(tech);
                              setModalType("certificate");
                              setIsModalOpen(true);
                            }
                          }}
                          disabled={tech.certificateStatus !== "pending"}
                          className="text-sm font-semibold text-color-main hover:underline disabled:opacity-50 disabled:cursor-not-allowed">View</button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-stone-500 text-base">No technicians found</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Verification Modal */}
      {isModalOpen && selectedTechnician && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4"
          onClick={() => {
            setIsModalOpen(false);
            setSelectedTechnician(null);
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white text-color-primary px-6 py-4 flex items-center justify-between border-b rounded-t-2xl">
              <h2 className="text-xl sm:text-2xl font-semibold">
                {modalType === "account" ? "Account Verification" : "Certificate Verification"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedTechnician(null);
                  setModalType(null);
                }}
                className="text-stone-600 hover:text-stone-900 rounded-full p-1 transition-colors text-2xl font-light"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Technician Info */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-2">Technician Name</p>
                  <p className="text-lg font-semibold text-stone-900">{selectedTechnician.firstName} {selectedTechnician.lastName}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-2">Email</p>
                    <p className="text-base text-stone-900 break-all">{selectedTechnician.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-2">Phone</p>
                    <p className="text-base text-stone-900">{selectedTechnician.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-2">Service Type</p>
                    <p className="text-base text-stone-900">{selectedTechnician.serviceType}</p>
                  </div>
                </div>
              </div>

              {/* Account Verification Section - Show Identity Document */}
              {modalType === "account" && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-stone-600 uppercase tracking-wide">Identity Document</p>
                  <div className="bg-stone-50 rounded-lg p-4 flex items-center justify-center border-2 border-dashed border-stone-300">
                    {selectedTechnician.identityDocumentUrl ? (
                      <img
                        src={selectedTechnician.identityDocumentUrl}
                        alt="Identity Document"
                        className="max-h-96 max-w-full rounded-lg object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = '<p class="text-stone-500 text-center py-8">Document image failed to load</p>';
                        }}
                      />
                    ) : (
                      <p className="text-stone-500 text-center py-8">No identity document provided</p>
                    )}
                  </div>
                </div>
              )}

              {/* Certificate Verification Section - Show Certificate */}
              {modalType === "certificate" && selectedTechnician.certificateUrl && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-stone-600 uppercase tracking-wide">Certificate</p>
                  <div className="bg-stone-50 rounded-lg p-4 flex items-center justify-center border-2 border-dashed border-stone-300">
                    <img
                      src={selectedTechnician.certificateUrl}
                      alt="Certificate"
                      className="max-h-96 max-w-full rounded-lg object-contain"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML = '<p class="text-stone-500 text-center py-8">Certificate image failed to load</p>';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 px-6 py-4 border-t flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 justify-end">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedTechnician(null);
                  setModalType(null);
                }}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-stone-200 text-stone-700 font-semibold hover:bg-stone-300 transition-colors disabled:opacity-50 text-sm"
              >
                Close
              </button>
              
              <button
                onClick={handleRejectTechnician}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {modalType === "account" ? "Rejecting Account..." : "Rejecting Certificate..."}
                  </>
                ) : (
                  modalType === "account" ? "Reject Account" : "Reject Certificate"
                )}
              </button>
              
              <button
                onClick={handleAcceptTechnician}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-color-main hover:opacity-90 text-white font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {modalType === "account" ? "Approving Account..." : "Approving Certificate..."}
                  </>
                ) : (
                  modalType === "account" ? "Approve Account" : "Approve Certificate"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && technicianToDelete && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4"
          onClick={() => {
            setIsDeleteModalOpen(false);
            setTechnicianToDelete(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">Delete Technician</h2>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTechnicianToDelete(null);
                }}
                className="text-stone-600 hover:text-stone-900 rounded-full p-1 transition-colors text-2xl font-light"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
              </div>
              <p className="text-center text-neutral-900 font-semibold mb-2">Are you sure?</p>
              <p className="text-center text-stone-600 text-sm">
                Are you sure you want to delete <span className="font-semibold">{technicianToDelete.firstName} {technicianToDelete.lastName}</span>? This action cannot be undone.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 px-6 py-4 border-t flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTechnicianToDelete(null);
                }}
                disabled={isSubmitting}
                className="px-4 py-2 bg-stone-200 text-stone-700 font-medium rounded-lg hover:bg-stone-300 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTechnician}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default APTechnician;
