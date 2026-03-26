
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../../blocks/Navbar";
import Footer from "../../blocks/Footer";
import AdminSidebar from "./AdminSidebar";
import { useSocket } from "../../context/SocketContext";

function APUsers() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleAdminDataChanged = (payload = {}) => {
      const changes = Array.isArray(payload.changes) ? payload.changes : [];
      if (changes.includes("users") || changes.includes("dashboard-stats")) {
        fetchUsers();
      }
    };

    socket.on("admin:dataChanged", handleAdminDataChanged);

    return () => {
      socket.off("admin:dataChanged", handleAdminDataChanged);
    };
  }, [socket]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get("token") || localStorage.getItem("token");
      const response = await axios.get("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } });
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter by tab
  let tabFilteredUsers = filteredUsers;
  if (activeTab === "House verification request") {
    // Only show users that have at least one address with pending certificate
    tabFilteredUsers = filteredUsers.filter(user => 
      user.addressBook && user.addressBook.some(addr => addr.houseCertificateStatus === "pending")
    );
  }

  // For house verification tab, we need to flatten addresses for display
  const getDisplayData = () => {
    if (activeTab === "House verification request") {
      // Create a flat list of pending addresses with user info
      const pendingAddresses = [];
      tabFilteredUsers.forEach(user => {
        user.addressBook?.forEach(address => {
          if (address.houseCertificateStatus === "pending") {
            pendingAddresses.push({
              ...address,
              userId: user._id,
              userName: `${user.firstName} ${user.lastName}`,
              userEmail: user.email,
              userPhone: user.phone
            });
          }
        });
      });
      return pendingAddresses;
    }
    return tabFilteredUsers;
  };

  const handleAddressVerification = async (status) => {
    if (!selectedAddress) return;
    
    try {
      setIsSubmitting(true);
      const token = Cookies.get("token") || localStorage.getItem("token");
      
      const response = await axios.patch(
        `/api/admin/user/${selectedAddress.userId}/address/${selectedAddress._id}/verification-status`,
        { status }, // "approved" or "rejected"
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Address ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      setIsModalOpen(false);
      setSelectedAddress(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${status} address`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete?._id) return;

    try {
      setDeletingUserId(userToDelete._id);
      const token = Cookies.get("token") || localStorage.getItem("token");

      await axios.delete(`/api/admin/users/${userToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userToDelete._id));
      toast.success("User deleted successfully");
      setUserToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
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
            <span className="font-semibold text-stone-800 text-sm">Users Management</span>
          </div>

          <section className="space-y-4 pt-4 lg:pt-8">
            <p className="text-sm font-semibold text-color-main uppercase tracking-wide">
              Admin Dashboard
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">
              Users Management
            </h1>
            <p className="text-base text-stone-500 max-w-2xl">
              Manage registered users, view their details, and monitor activities.
            </p>
          </section>

          {/* Search and Filter */}
          <section className="flex gap-4">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-color-main focus:ring-2 focus:ring-blue-100"
            />
          </section>

          {/* Filter Tabs */}
          <section className="flex gap-1 border-b border-stone-200 overflow-x-auto scrollbar-hide">
            {["All", "House verification request"].map((tab) => (
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

          {/* Users Table */}
          <section className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">{activeTab === "House verification request" ? "Address" : "User Name"}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">{activeTab === "House verification request" ? "User Name" : "Email"}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">{activeTab === "House verification request" ? "Address Type" : "Phone"}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">{activeTab === "House verification request" ? "Submitted" : "Joined Date"}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {isLoading ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-stone-500">Loading...</td></tr>
                  ) : getDisplayData().length > 0 ? (
                    getDisplayData().map((item) => (
                      <tr key={activeTab === "House verification request" ? item._id : item._id} className="hover:bg-stone-50">
                        <td className="px-6 py-4">
                          <span className="font-medium text-stone-900">
                            {activeTab === "House verification request" ? item.address : `${item.firstName} ${item.lastName}`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-stone-700">
                          {activeTab === "House verification request" ? item.userName : item.email}
                        </td>
                        <td className="px-6 py-4 text-stone-700">
                          {activeTab === "House verification request" ? (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 capitalize">
                              {item.addressType}
                            </span>
                          ) : (
                            item.phone || "N/A"
                          )}
                        </td>
                        <td className="px-6 py-4 text-stone-700">
                          {activeTab === "House verification request"
                            ? new Date(item.createdAt).toLocaleDateString()
                            : new Date(item.createdAt).toLocaleDateString()
                          }
                        </td>
                        <td className="px-6 py-4">
                          {activeTab === "House verification request" ? (
                            <button
                              onClick={() => {
                                setSelectedAddress(item);
                                setIsModalOpen(true);
                              }}
                              className="text-sm text-color-main hover:underline"
                            >
                              View Certificate
                            </button>
                          ) : (
                            <button
                              onClick={() => setUserToDelete(item)}
                              disabled={deletingUserId === item._id}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                              {deletingUserId === item._id ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-stone-500">No {activeTab === "House verification request" ? "verification requests" : "users"} found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden p-4 space-y-3">
              {isLoading ? (
                <div className="py-12 text-center">
                  <p className="text-stone-500 text-base">Loading...</p>
                </div>
              ) : getDisplayData().length > 0 ? (
                getDisplayData().map((item) => (
                  <div
                    key={activeTab === "House verification request" ? item._id : item._id}
                    className="bg-white border border-stone-200 rounded-xl p-4 space-y-3 hover:shadow-md hover:border-stone-300 transition-all duration-200"
                  >
                    {/* Name/Address */}
                    <p className="text-sm font-semibold text-neutral-900">
                      {activeTab === "House verification request" ? item.address : `${item.firstName} ${item.lastName}`}
                    </p>

                    <div className="h-px bg-stone-100" />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-stone-500 mb-0.5">{activeTab === "House verification request" ? "User" : "Email"}</p>
                        <p className="text-sm font-medium text-neutral-900 break-all">
                          {activeTab === "House verification request" ? item.userName : item.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 mb-0.5">{activeTab === "House verification request" ? "Type" : "Phone"}</p>
                        <p className="text-sm font-medium text-neutral-900">
                          {activeTab === "House verification request" ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">
                              {item.addressType}
                            </span>
                          ) : (
                            item.phone || "N/A"
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 mb-0.5">Submitted</p>
                        <p className="text-sm font-medium text-neutral-900">{new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="h-px bg-stone-100" />

                    {activeTab === "House verification request" ? (
                      <button
                        onClick={() => {
                          setSelectedAddress(item);
                          setIsModalOpen(true);
                        }}
                        className="text-sm font-semibold text-color-main hover:underline"
                      >
                        View Certificate
                      </button>
                    ) : (
                      <button
                        onClick={() => setUserToDelete(item)}
                        disabled={deletingUserId === item._id}
                        className="w-full px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {deletingUserId === item._id ? "Deleting..." : "Delete User"}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-stone-500 text-base">No {activeTab === "House verification request" ? "verification requests" : "users"} found</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Address Certificate Verification Modal */}
      {isModalOpen && selectedAddress && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4"
          onClick={() => {
            setIsModalOpen(false);
            setSelectedAddress(null);
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white text-color-primary px-6 py-4 flex items-center justify-between border-b rounded-t-2xl">
              <h2 className="text-xl sm:text-2xl font-semibold">
                Address Certificate Verification
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedAddress(null);
                }}
                className="text-stone-600 hover:text-stone-900 rounded-full p-1 transition-colors text-2xl font-light"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Address & User Info */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-2">User Name</p>
                  <p className="text-lg font-semibold text-stone-900">{selectedAddress.userName}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-2">Email</p>
                    <p className="text-base text-stone-900 break-all">{selectedAddress.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-2">Phone</p>
                    <p className="text-base text-stone-900">{selectedAddress.userPhone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-2">Address</p>
                    <p className="text-base text-stone-900">{selectedAddress.address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-2">Address Type</p>
                    <p className="text-base text-stone-900 capitalize">{selectedAddress.addressType}</p>
                  </div>
                </div>

                {selectedAddress.landMark && (
                  <div>
                    <p className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-2">Landmark</p>
                    <p className="text-base text-stone-900">{selectedAddress.landMark}</p>
                  </div>
                )}
              </div>

              {/* Certificate Image */}
              {selectedAddress.houseCertificateUrl && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-stone-600 uppercase tracking-wide">House Certificate</p>
                  <div className="bg-stone-50 rounded-lg p-4 flex items-center justify-center border-2 border-dashed border-stone-300">
                    <img
                      src={selectedAddress.houseCertificateUrl}
                      alt="House Certificate"
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
                  setSelectedAddress(null);
                }}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-stone-200 text-stone-700 font-semibold hover:bg-stone-300 transition-colors disabled:opacity-50 text-sm"
              >
                Close
              </button>
              
              <button
                onClick={() => handleAddressVerification("rejected")}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Rejecting...
                  </>
                ) : (
                  "Reject"
                )}
              </button>
              
              <button
                onClick={() => handleAddressVerification("approved")}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-color-main hover:opacity-90 text-white font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Approving...
                  </>
                ) : (
                  "Approve"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close delete user modal"
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (!deletingUserId) setUserToDelete(null);
            }}
          />

          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-stone-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-stone-900">Delete User</h2>
            <p className="text-sm text-stone-600">
              Are you sure you want to delete {userToDelete.firstName} {userToDelete.lastName}? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={Boolean(deletingUserId)}
                className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-sm font-semibold hover:bg-stone-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deletingUserId === userToDelete._id}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deletingUserId === userToDelete._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default APUsers;
