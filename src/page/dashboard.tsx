import React from "react";
import Sidebar from "../common/sidebar";
import "./dashboard.css";
import { MOCK_TASKS } from "../utils/mockdata";

const Dashboard: React.FC = () => {
  // derive simple stats from mock tasks
  const today = new Date().toISOString().slice(0, 10);

  const totalCompleted = MOCK_TASKS.filter(
    (t) => t.status === "completed"
  ).length;

  const dueToday = MOCK_TASKS.filter((t) => t.due_date === today).length;

  const overdue = MOCK_TASKS.filter(
    (t) => t.due_date < today && t.status !== "completed"
  ).length;

  // priority counts
  const priorityCounts = MOCK_TASKS.reduce((acc: Record<string, number>, t) => {
    const p = (t.priority || "low").toLowerCase();
    if (p === "urgent") acc["high"] = (acc["high"] || 0) + 1;
    else acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  // upcoming: tasks sorted by due_date
  const upcoming = [...MOCK_TASKS]
    .filter((t) => !t.is_trashed)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 5);

  const recentActivity = [
    {
      id: 1,
      user: "alice",
      action: "updated",
      target: "Design new landing page",
      status: "In Progress",
    },
    {
      id: 2,
      user: "alice",
      action: "updated",
      target: "Implement user authentication",
      status: "In Progress",
    },
    {
      id: 3,
      user: "alice",
      action: "updated",
      target: "Write project documentation",
      status: "To Do",
    },
    {
      id: 4,
      user: "alice",
      action: "updated",
      target: "Fix critical bugs in payment system",
      status: "To Do",
    },
    {
      id: 5,
      user: "alice",
      action: "updated",
      target: "Review pull requests",
      status: "Completed",
    },
  ];

  // simple SVG pie segments based on priority counts
  const totalPriority = Object.values(priorityCounts).reduce(
    (s, n) => s + n,
    0
  );

  // helper to produce SVG arc lengths (simple proportional circle sectors using stroke-dasharray)
  const circleCircumference = 2 * Math.PI * 60; // r=60
  const segments = [] as { color: string; value: number; label: string }[];
  if (priorityCounts["high"])
    segments.push({
      color: "#f44336",
      value: priorityCounts["high"],
      label: `High: ${priorityCounts["high"]}`,
    });
  if (priorityCounts["medium"])
    segments.push({
      color: "#ff9800",
      value: priorityCounts["medium"],
      label: `Medium: ${priorityCounts["medium"]}`,
    });
  if (priorityCounts["low"])
    segments.push({
      color: "#2ecc71",
      value: priorityCounts["low"],
      label: `Low: ${priorityCounts["low"]}`,
    });

  let cumulative = 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h2>Welcome back, {localStorage.getItem("currentUser")}</h2>
            <p className="muted">
              Here's what's happening with your tasks today
            </p>
          </div>
        </header>

        <section className="cards-row">
          <div className="card small">
            <div className="card-title">Tasks Overdue</div>
            <div className="card-value danger">{overdue}</div>
            <div className="card-sub">Requires immediate attention</div>
          </div>

          <div className="card small">
            <div className="card-title">Due Today</div>
            <div className="card-value">{dueToday}</div>
            <div className="card-sub">Complete before midnight</div>
          </div>

          <div className="card small">
            <div className="card-title">Total Completed</div>
            <div className="card-value success">{totalCompleted}</div>
            <div className="card-sub">Great work!</div>
          </div>
        </section>

        <section className="content-grid">
          <div className="card large chart-card">
            <div className="card-heading">Tasks by Priority</div>
            <div className="chart-wrap">
              <svg width="240" height="240" viewBox="0 0 240 240">
                <defs />
                <g transform="translate(120,120)">
                  {segments.map((s) => {
                    const portion = s.value / (totalPriority || 1);
                    const dash = portion * circleCircumference;
                    const gap = circleCircumference - dash;
                    const rotation =
                      (cumulative / (totalPriority || 0 || 1)) * 360;
                    cumulative += s.value;
                    return (
                      <circle
                        key={s.label}
                        r={60}
                        cx={0}
                        cy={0}
                        fill="transparent"
                        stroke={s.color}
                        strokeWidth={60}
                        strokeDasharray={`${dash} ${gap}`}
                        transform={`rotate(${rotation})`}
                        strokeLinecap="butt"
                      />
                    );
                  })}
                </g>
              </svg>
              <div className="chart-legend">
                {segments.map((s) => (
                  <div key={s.label} className="legend-item">
                    <span
                      className="legend-swatch"
                      style={{ background: s.color }}
                    />
                    <span className="legend-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card large">
            <div className="card-heading">Upcoming Deadlines</div>
            <div className="upcoming-list">
              {upcoming.map((t) => (
                <div key={t.task_id} className="upcoming-item">
                  <div>
                    <div className="upcoming-title">{t.title || t.task_id}</div>
                    <div className="upcoming-date">{t.due_date}</div>
                  </div>
                  <div className={`badge ${t.priority}`}>{t.priority}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card recent-activity">
          <div className="card-heading">Recent Activity</div>
          <div className="activity-list">
            {recentActivity.map((a) => (
              <div key={a.id} className="activity-item">
                <div className="activity-left">
                  <span className="activity-dot" />
                  <div>
                    <div>
                      <strong>{a.user}</strong> {a.action}{" "}
                      <strong>{a.target}</strong>
                    </div>
                    <div className="muted">Changed to {a.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
