import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const token = Cookies.get("token") || localStorage.getItem("token");
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Invalid user data in storage", error);
      return null;
    }
  });
  const [loading, setLoading] = useState(() => Boolean(token) && !localStorage.getItem("user"));
  const inFlightRef = useRef(null);

  const setUserData = useCallback((nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("user");
    }
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
  }, []);

  const fetchUser = useCallback(
    async ({ force = false, silent = false } = {}) => {
      if (!token) {
        clearUser();
        setLoading(false);
        return null;
      }

      if (inFlightRef.current) {
        return inFlightRef.current;
      }

      if (!silent) {
        setLoading(true);
      }
      const request = axios
        .get("/api/users/current-user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then(({ data }) => {
          setUserData(data);
          return data;
        })
        .catch((error) => {
          console.error("Error fetching user:", error);
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              return parsedUser;
            } catch (parseError) {
              console.error("Invalid user data in storage", parseError);
            }
          }
          return null;
        })
        .finally(() => {
          inFlightRef.current = null;
          if (!silent) {
            setLoading(false);
          }
        });

      inFlightRef.current = request;
      return request;
    },
    [token, setUserData, clearUser],
  );

  const refreshUser = useCallback(async () => {
    return fetchUser({ force: true });
  }, [fetchUser]);

  useEffect(() => {
    if (!token) {
      clearUser();
      setLoading(false);
      return;
    }

    // Always sync once from backend on app load/refresh to avoid stale cached user notifications.
    fetchUser({ force: true, silent: Boolean(user) });
  }, [token, fetchUser, clearUser]);

  const value = {
    user,
    loading,
    fetchUser,
    refreshUser,
    setUserData,
    clearUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
