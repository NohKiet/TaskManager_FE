import React from "react";
import Sidebar from "../common/sidebar";

const Dashboard: React.FC = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ marginLeft: "260px", flex: 1, padding: "2rem" }}>
        <h1>Dashboard</h1>
        <p>Welcome to TaskHub Dashboard</p>
      </main>
    </div>
  );
};

export default Dashboard;
