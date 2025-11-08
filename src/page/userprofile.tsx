import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/home/sidebar";
import type { IUser } from "../utils/interfaces";
import "./userprofile.css";

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as IUser;
        setCurrentUser(user);
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!currentUser) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ marginLeft: "260px", flex: 1, padding: "2rem" }}>
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main className="profile-main">
        <div className="profile-container">
          <div className="profile-header">
            <h1 className="profile-title">Profile</h1>
            <p className="profile-subtitle">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="profile-card">
            <div className="profile-card-header">
              <div className="profile-avatar">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="profile-header-info">
                <h2 className="profile-username">{currentUser.username}</h2>
                <p className="profile-email">{currentUser.email}</p>
                <div className="profile-status-badge">
                  <span className="status-dot"></span>
                  {currentUser.is_active ? "Active" : "Inactive"}
                </div>
              </div>
            </div>

            <div className="profile-divider"></div>

            <div className="profile-details">
              <div className="profile-detail-item">
                <span className="profile-detail-label">Username:</span>
                <span className="profile-detail-value">
                  {currentUser.username}
                </span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Email:</span>
                <span className="profile-detail-value">
                  {currentUser.email}
                </span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Full Name:</span>
                <span className="profile-detail-value">
                  {currentUser.full_name}
                </span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Role:</span>
                <span className="profile-detail-value">
                  {currentUser.role === "group leader"
                    ? "Group Leader"
                    : "Member"}
                </span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Account Status:</span>
                <span className="profile-detail-value">
                  {currentUser.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Member Since:</span>
                <span className="profile-detail-value">
                  {formatDate(currentUser.created_at)}
                </span>
              </div>
            </div>

            <button className="profile-edit-button">Edit Profile</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
