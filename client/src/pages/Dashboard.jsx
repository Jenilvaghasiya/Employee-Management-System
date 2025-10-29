import { useAuth } from "../context/AuthContext";
import "../styles/Dashboard.css";
import { useState } from "react";
import DepartmentsManager from "../components/DepartmentsManager";

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>EMS</h2>
        </div>

        <nav className="sidebar-nav">
          <button
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => setActiveTab("overview")}
          >
            🏠 Overview
          </button>
          <button
            className={activeTab === "departments" ? "active" : ""}
            onClick={() => setActiveTab("departments")}
          >
            🏢 Departments
          </button>
          <button
            className={activeTab === "employees" ? "active" : ""}
            onClick={() => setActiveTab("employees")}
          >
            👥 Employees
          </button>
          <button
            className={activeTab === "attendance" ? "active" : ""}
            onClick={() => setActiveTab("attendance")}
          >
            📅 Attendance
          </button>
          <button
            className={activeTab === "leaves" ? "active" : ""}
            onClick={() => setActiveTab("leaves")}
          >
            🏖️ Leave Requests
          </button>
          <button
            className={activeTab === "policies" ? "active" : ""}
            onClick={() => setActiveTab("policies")}
          >
            📋 Leave Policies
          </button>
          <button
            className={activeTab === "designations" ? "active" : ""}
            onClick={() => setActiveTab("designations")}
          >
            💼 Designations
          </button>

          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Employee Management System</h1>
        </header>

        {activeTab === "overview" && (
          <section className="dashboard-section">
            <div className="welcome-card">
              <h2>Welcome, {user?.name}!</h2>
              <div className="user-info">
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                <p>
                  <strong>Role:</strong> {user?.role}
                </p>
                {isAdmin && <span className="admin-badge">Admin Access</span>}
              </div>
            </div>
          </section>
        )}

        {activeTab === "departments" && (
          <section className="dashboard-section">
            <DepartmentsManager />
          </section>
        )}

        {activeTab !== "overview" && activeTab !== "departments" && (
          <section className="dashboard-section">
            <h2 className="section-title">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className="placeholder-text">
              {`Here you can manage ${activeTab} data.`}
            </p>
          </section>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
