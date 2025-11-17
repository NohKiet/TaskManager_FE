import React, { useState, useEffect } from "react";
import Sidebar from "../common/sidebar";
import { MOCK_USERS } from "../utils/mockdata";
import type { IUser } from "../utils/interfaces";
import { canManageTeam } from "../utils/permissions";
import "./team.css";

const Team: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);

  useEffect(() => {
    setUsers(MOCK_USERS);

    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as IUser;
        setCurrentUser(user);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (fullName: string): string => {
    return fullName
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (userId: number): string => {
    const colors = [
      "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      "linear-gradient(135deg, #4299e1 0%, #3182ce 100%)",
      "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
      "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
      "linear-gradient(135deg, #f56565 0%, #e53e3e 100%)",
    ];
    return colors[userId % colors.length];
  };

  const handleToggleUserStatus = (userId: number) => {
    if (!canManageTeam(currentUser)) {
      alert("You don't have permission to manage team members");
      return;
    }

    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.user_id === userId
          ? { ...user, is_active: !user.is_active }
          : user
      )
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main className="team-main">
        <div className="team-container">
          <div className="team-header">
            <h1 className="team-title">Team</h1>
            <p className="team-subtitle">View and manage your team members</p>
          </div>

          <div className="team-grid">
            {users.map((user) => (
              <div key={user.user_id} className="team-member-card">
                <div
                  className="member-avatar"
                  style={{ background: getAvatarColor(user.user_id) }}
                >
                  <span className="member-initials">
                    {getInitials(user.full_name)}
                  </span>
                </div>
                <div className="member-info">
                  <h3 className="member-name">{user.full_name}</h3>
                  <p className="member-username">@{user.username}</p>
                  <p className="member-email">{user.email}</p>
                  <div className="member-meta">
                    <span
                      className={`member-role ${
                        user.role === "admin"
                          ? "role-leader"
                          : "role-member"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : "Employee"}
                    </span>
                    <span
                      className={`member-status ${
                        user.is_active ? "status-active" : "status-inactive"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="member-joined">
                    Joined {formatDate(user.created_at)}
                  </p>
                </div>
                {canManageTeam(currentUser) && (
                  <button
                    className="toggle-status-btn"
                    onClick={() => handleToggleUserStatus(user.user_id)}
                  >
                    {user.is_active ? "Disable" : "Activate"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Team;
