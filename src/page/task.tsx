import React from "react";
import Sidebar from "../common/sidebar";

const Tasks: React.FC = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ marginLeft: "260px", flex: 1, padding: "2rem" }}>
        <h1>Tasks</h1>
        <p>Manage your tasks here</p>
      </main>
    </div>
  );
};

export default Tasks;
