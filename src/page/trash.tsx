import React from "react";
import Sidebar from "../common/sidebar";

const Trash: React.FC = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ marginLeft: "260px", flex: 1, padding: "2rem" }}>
        <h1>Trash</h1>
        <p>Deleted items are stored here</p>
      </main>
    </div>
  );
};

export default Trash;
