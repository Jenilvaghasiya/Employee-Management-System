import { useAuth } from "../context/AuthContext";
import "../styles/Dashboard.css";
import { useState } from "react";
import DepartmentsManager from "../components/DepartmentsManager";
import DesignationsManager from "../components/DesignationsManager";
import EmployeesManager from "../components/EmployeesManager";
import LeaveTypesManager from "../components/LeaveTypesManager";
import LeavePoliciesManager from "../components/LeavePoliciesManager";
import ApplyLeave from "../components/ApplyLeave";
import LeaveRequestsAdmin from "../components/LeaveRequestsAdmin";
import EmployeeAttendance from "../components/EmployeeAttendance";
import AdminAttendance from "../components/AdminAttendance";
import { Home, Building2, Users, CalendarCheck, ClipboardList, FilePlus, FileText, Briefcase, Layers, LogOut as LogOutIcon } from "lucide-react";

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
          {isAdmin ? (
            <>
              <button
                className={activeTab === "overview" ? "active" : ""}
                onClick={() => setActiveTab("overview")}
              >
                <Home size={18} style={{marginRight:8}} /> Dashboard
              </button>
              <button
                className={activeTab === "designations" ? "active" : ""}
                onClick={() => setActiveTab("designations")}
              >
                <Briefcase size={18} style={{marginRight:8}} /> Designation
              </button>
              <button
                className={activeTab === "attendance" ? "active" : ""}
                onClick={() => setActiveTab("attendance")}
              >
                <CalendarCheck size={18} style={{marginRight:8}} /> Attendance
              </button>
              <button
                className={activeTab === "leaves" ? "active" : ""}
                onClick={() => setActiveTab("leaves")}
              >
                <ClipboardList size={18} style={{marginRight:8}} /> Leave Requests
              </button>
              <button
                className={activeTab === "employees" ? "active" : ""}
                onClick={() => setActiveTab("employees")}
              >
                <Users size={18} style={{marginRight:8}} /> Employees
              </button>
              <button
                className={activeTab === "departments" ? "active" : ""}
                onClick={() => setActiveTab("departments")}
              >
                <Building2 size={18} style={{marginRight:8}} /> Departments
              </button>
              <button
                className={activeTab === "policies" ? "active" : ""}
                onClick={() => setActiveTab("policies")}
              >
                <FileText size={18} style={{marginRight:8}} /> Leave Policies
              </button>
              <button
                className={activeTab === "leave-types" ? "active" : ""}
                onClick={() => setActiveTab("leave-types")}
              >
                <Layers size={18} style={{marginRight:8}} /> Leave Types
              </button>
              <button onClick={handleLogout} className="logout-btn">
                <LogOutIcon size={18} style={{marginRight:8}} /> Logout
              </button>
            </>
          ) : (
            <>
              <button
                className={activeTab === "overview" ? "active" : ""}
                onClick={() => setActiveTab("overview")}
              >
                <Home size={18} style={{marginRight:8}} /> Dashboard
              </button>
              <button
                className={activeTab === "attendance" ? "active" : ""}
                onClick={() => setActiveTab("attendance")}
              >
                <CalendarCheck size={18} style={{marginRight:8}} /> Attendance
              </button>
              <button
                className={activeTab === "apply-leave" ? "active" : ""}
                onClick={() => setActiveTab("apply-leave")}
              >
                <FilePlus size={18} style={{marginRight:8}} /> Apply Leave
              </button>
              <button
                className={activeTab === "profile" ? "active" : ""}
                onClick={() => setActiveTab("profile")}
              >
                <Users size={18} style={{marginRight:8}} /> Profile
              </button>
              <button onClick={handleLogout} className="logout-btn">
                <LogOutIcon size={18} style={{marginRight:8}} /> Logout
              </button>
            </>
          )}
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

        {activeTab === "designations" && (
          <section className="dashboard-section">
            <DesignationsManager />
          </section>
        )}

        {activeTab === "employees" && (
          <section className="dashboard-section">
            <EmployeesManager />
          </section>
        )}

        {activeTab === "attendance" && (
          <section className="dashboard-section">
            {isAdmin ? (
              <AdminAttendance />
            ) : (
              <EmployeeAttendance />
            )}
          </section>
        )}

        {activeTab === "leave-types" && (
          <section className="dashboard-section">
            <LeaveTypesManager />
          </section>
        )}

        {activeTab === "policies" && (
          <section className="dashboard-section">
            <LeavePoliciesManager />
          </section>
        )}

        {activeTab === "leaves" && (
          <section className="dashboard-section">
            {isAdmin ? <LeaveRequestsAdmin /> : <ApplyLeave />}
          </section>
        )}

        {activeTab === "apply-leave" && (
          <section className="dashboard-section">
            <ApplyLeave />
          </section>
        )}

        {activeTab !== "overview" && activeTab !== "departments" && activeTab !== "designations" && activeTab !== "employees" && activeTab !== "leave-types" && activeTab !== "policies" && activeTab !== "leaves" && activeTab !== "apply-leave" && activeTab !== "attendance" && (
          <section className="dashboard-section">
            <h2 className="section-title">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className="placeholder-text">
            </p>
          </section>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
