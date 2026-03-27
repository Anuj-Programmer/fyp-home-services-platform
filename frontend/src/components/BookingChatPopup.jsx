import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/lib/api";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { useSocket } from "../context/SocketContext";

const CHAT_ALLOWED_STATUSES = ["Confirmed", "Inprogress", "Completed"];

function BookingChatPopup({
  bookings = [],
  currentUserId,
  headerTitle = "Chat with Provider",
  partnerNameKey = "technicianName",
}) {
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  const eligibleBookings = useMemo(() => {
    return bookings.filter((booking) => CHAT_ALLOWED_STATUSES.includes(booking.status));
  }, [bookings]);

  // Show one chat target per user-technician pair (conversation), not per booking.
  const conversationTargets = useMemo(() => {
    const targetsByPair = new Map();

    eligibleBookings.forEach((booking) => {
      const userId = booking.userId || currentUserId;
      const technicianId = booking.technicianId;

      if (!userId || !technicianId) {
        // Fallback when booking payload misses ids.
        if (!targetsByPair.has(booking.id)) {
          targetsByPair.set(booking.id, booking);
        }
        return;
      }

      const pairKey = `${userId}_${technicianId}`;
      if (!targetsByPair.has(pairKey)) {
        targetsByPair.set(pairKey, booking);
      }
    });

    return Array.from(targetsByPair.values());
  }, [eligibleBookings, currentUserId]);

  const selectedBooking = useMemo(() => {
    return conversationTargets.find((booking) => booking.id === selectedBookingId) || null;
  }, [conversationTargets, selectedBookingId]);

  const getConversationParticipants = (booking) => {
    if (!booking) return null;
    const userId = booking.userId || currentUserId;
    const technicianId = booking.technicianId;

    if (!userId || !technicianId) return null;
    return { userId, technicianId };
  };

  useEffect(() => {
    if (!conversationTargets.length) {
      setSelectedBookingId("");
      setIsOpen(false);
      setMessages([]);
      return;
    }

    const stillValid = conversationTargets.some((booking) => booking.id === selectedBookingId);
    if (!selectedBookingId || !stillValid) {
      setSelectedBookingId(conversationTargets[0].id);
    }
  }, [conversationTargets, selectedBookingId]);

  const fetchMessages = async (bookingId) => {
    if (!bookingId) return;

    try {
      setLoadingMessages(true);
      const token = Cookies.get("token") || localStorage.getItem("token");
      if (!token) return;

      const response = await apiClient.get(`/api/chat/conversations/${bookingId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.success) {
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      const message = error.response?.data?.message || "Unable to load chat";
      toast.error(message);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !selectedBooking) return;
    setSelectedConversationId("");
    setMessages([]);

    const resolveConversation = async () => {
      try {
        const participants = getConversationParticipants(selectedBooking);
        if (!participants) return;

        const token = Cookies.get("token") || localStorage.getItem("token");
        if (!token) return;

        const response = await apiClient.post(
          "/api/chat/conversations/find-or-create",
          {
            user_id: participants.userId,
            technician_id: participants.technicianId,
            booking_id: selectedBooking.id,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const conversationId = response.data?.conversation?._id;
        if (conversationId) {
          setSelectedConversationId(conversationId);
        }
      } catch (error) {
        const message = error.response?.data?.message || "Unable to open conversation";
        toast.error(message);
      }
    };

    resolveConversation();
    setUnreadCount(0);
  }, [isOpen, selectedBooking, currentUserId]);

  useEffect(() => {
    if (!isOpen || !selectedConversationId) return;
    fetchMessages(selectedConversationId);
  }, [isOpen, selectedConversationId]);

  useEffect(() => {
    if (!socket || !selectedConversationId) return;
    socket.emit("join_room", { conversation_id: selectedConversationId });
  }, [socket, selectedConversationId]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (incomingMessage) => {
      if (!incomingMessage?.conversation_id) return;

      const isForCurrentConversation = incomingMessage.conversation_id === selectedConversationId;
      const isMine = String(incomingMessage.sender_id) === String(currentUserId);

      if (isForCurrentConversation) {
        setMessages((prev) => [...prev, incomingMessage]);
      }

      if (!isMine && (!isOpen || !isForCurrentConversation)) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleChatError = (data) => {
      if (data?.message) {
        toast.error(data.message);
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("chat:error", handleChatError);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("chat:error", handleChatError);
    };
  }, [socket, selectedConversationId, isOpen, currentUserId]);

  useEffect(() => {
    if (!isOpen) return;
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = () => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || !socket || !selectedConversationId) return;

    socket.emit("send_message", {
      conversation_id: selectedConversationId,
      booking_id: selectedBookingId || null,
      message: trimmedMessage,
    });

    setMessageText("");
  };

  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  if (!conversationTargets.length) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-70 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-color-main text-white shadow-xl hover:opacity-90 transition-opacity flex items-center justify-center"
        aria-label="Open booking chat"
      >
        <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 4h16v12H5.17L4 17.17V4zm2 2v8.34L6.83 14H18V6H6z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-2 bottom-20 sm:inset-x-auto sm:bottom-24 sm:right-6 z-70 w-auto sm:w-[92vw] sm:max-w-sm max-h-[calc(100vh-6rem)] sm:max-h-152 bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-color-main text-white flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{headerTitle}</p>
              <p className="text-[11px] opacity-90 truncate">
                {selectedBooking?.[partnerNameKey] || "Booking Chat"}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/90 hover:text-white text-lg leading-none"
              aria-label="Close chat popup"
            >
              x
            </button>
          </div>

          {conversationTargets.length > 1 && (
            <div className="px-3 pt-3">
              <select
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs text-stone-700"
              >
                {conversationTargets.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {`${booking.id.slice(-6)} - ${booking[partnerNameKey] || "Booking"}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 bg-stone-50">
            <div className="text-[11px] text-stone-500 text-center pb-1">
              Booking confirmed, you can start chatting
            </div>

            {loadingMessages ? (
              <p className="text-center text-xs text-stone-500 py-8">Loading chat...</p>
            ) : messages.length > 0 ? (
              messages.map((msg) => {
                const isMine = String(msg.sender_id) === String(currentUserId);
                return (
                  <div
                    key={msg._id || `${msg.timestamp}-${msg.message}`}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        isMine
                          ? "bg-color-main text-white rounded-br-sm"
                          : "bg-white text-stone-800 border border-stone-200 rounded-bl-sm"
                      }`}
                    >
                      {msg.booking_id && (
                        <p className={`text-[10px] mb-1 ${isMine ? "text-white/80" : "text-stone-500"}`}>
                          {`Related to Booking #${String(msg.booking_id).slice(-6)}`}
                        </p>
                      )}
                      <p className="wrap-break-word">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? "text-white/80" : "text-stone-400"}`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-xs text-stone-500 py-8">No messages yet.</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-stone-200 bg-white flex items-center gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 min-w-0 border border-stone-300 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-color-main"
            />
            <button
              onClick={handleSendMessage}
              className="shrink-0 px-3 sm:px-4 py-2 rounded-full bg-color-main text-white text-sm font-medium hover:opacity-90"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default BookingChatPopup;
