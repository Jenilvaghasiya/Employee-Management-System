import { useEffect, useMemo, useState } from "react";
import { attendanceService } from "../services/attendanceService";
import { useAuth } from "../context/AuthContext";

const EmployeeAttendance = () => {
  const { user } = useAuth();
  const [today, setToday] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const [t, list] = await Promise.all([
        attendanceService.getToday(),
        attendanceService.listMine(),
      ]);
      setToday(t);
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  const refreshTodayWithRetry = async () => {
    try {
      const t1 = await attendanceService.getToday();
      if (t1) {
        setToday(t1);
        return t1;
      }
      // Brief retry after 500ms in case DB is eventual
      await new Promise((r) => setTimeout(r, 500));
      const t2 = await attendanceService.getToday();
      setToday(t2);
      return t2;
    } catch (err) {
      console.error("Retry failed:", err);
      return null;
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const signIn = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await attendanceService.signIn();

      // Validate the response has the correct structure
      const rec = res?.id ? res : null;

      if (rec) {
        setToday(rec);
        setItems((prev) => {
          const arr = Array.isArray(prev) ? [...prev] : [];
          const idx = arr.findIndex((r) => r.id === rec.id);
          if (idx >= 0) {
            arr[idx] = rec;
          } else {
            arr.unshift(rec);
          }
          return arr;
        });
        setSuccess("Signed in successfully");
      } else {
        // Fallback: refresh from server
        const refreshed = await refreshTodayWithRetry();
        const list = await attendanceService.listMine();
        setItems(Array.isArray(list) ? list : []);

        if (refreshed?.sign_in_time) {
          setSuccess("Signed in successfully");
        } else {
          setError("Sign in may have failed. Please refresh.");
        }
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to sign in");
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await attendanceService.signOut();

      // Validate the response has the correct structure
      const rec = res?.id ? res : null;

      if (rec) {
        setToday(rec);
        setItems((prev) => {
          const arr = Array.isArray(prev) ? [...prev] : [];
          const idx = arr.findIndex((r) => r.id === rec.id);
          if (idx >= 0) {
            arr[idx] = rec;
          } else {
            arr.unshift(rec);
          }
          return arr;
        });
        setSuccess("Signed out successfully");
      } else {
        // Fallback: refresh from server
        const refreshed = await refreshTodayWithRetry();
        const list = await attendanceService.listMine();
        setItems(Array.isArray(list) ? list : []);

        if (refreshed?.sign_out_time) {
          setSuccess("Signed out successfully");
        } else {
          setError("Sign out may have failed. Please refresh.");
        }
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to sign out");
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d)) return "-";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const formatDateDMY = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d)) return String(iso).slice(0, 10);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}-${mm}-${yy}`;
  };

  const formatDuration = (startIso, endIso) => {
    if (!startIso || !endIso) return "-";
    const a = new Date(startIso);
    const b = new Date(endIso);
    if (isNaN(a) || isNaN(b) || b < a) return "-";
    const mins = Math.floor((b - a) / 60000);
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  const displayed = useMemo(() => {
    const arr = Array.isArray(items) ? [...items] : [];
    arr.sort((x, y) => {
      const dx = new Date(x.date || x.attendance_date);
      const dy = new Date(y.date || y.attendance_date);
      const cmp = dy - dx;
      if (cmp !== 0) return cmp;
      return (y.id || 0) - (x.id || 0);
    });
    return arr;
  }, [items]);

  const todayState = useMemo(() => {
    return {
      signedIn: !!today?.sign_in_time,
      signedOut: !!today?.sign_out_time,
      signInAt: today?.sign_in_time,
      signOutAt: today?.sign_out_time,
    };
  }, [today]);

  return (
    <section className="apply-leave-wrap">
      <div className="designations-toolbar">
        <h2>Attendance</h2>
        <div className="designations-actions">
          {!todayState.signedIn ? (
            <button
              className="btn primary"
              onClick={signIn}
              disabled={saving || loading}
            >
              {saving ? "Signing in..." : "Sign In"}
            </button>
          ) : (
            <button
              className="btn danger"
              onClick={signOut}
              disabled={saving || loading || todayState.signedOut}
            >
              {saving
                ? "Signing out..."
                : todayState.signedOut
                ? "Signed Out"
                : "Sign Out"}
            </button>
          )}
          <button className="btn refresh" onClick={fetchAll} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="dep-alert error">{error}</div>}
      {success && <div className="dep-alert success">{success}</div>}

      <div className="dep-table-card">
        <div className="dep-table-head">
          <span>
            Today:{" "}
            {todayState.signedIn
              ? `Signed in at ${formatTime(todayState.signInAt)}`
              : "Not signed in"}
          </span>
          {todayState.signedIn && (
            <span>
              {" | Status: "}
              {todayState.signedOut
                ? `Signed out at ${formatTime(todayState.signOutAt)}`
                : "Signed in"}
            </span>
          )}
          <span style={{ marginLeft: "auto" }}>Records: {items.length}</span>
        </div>
        <div className="dep-table-wrap">
          <table className="dep-table">
            <thead>
              <tr>
                <th style={{ width: "60px" }}>ID</th>
                <th>Date</th>
                <th>Sign In</th>
                <th>Sign Out</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="center">
                    Loading...
                  </td>
                </tr>
              ) : displayed.length ? (
                displayed.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{formatDateDMY(row.date || row.attendance_date)}</td>
                    <td>{formatTime(row.sign_in_time)}</td>
                    <td>{formatTime(row.sign_out_time)}</td>
                    <td>
                      {formatDuration(row.sign_in_time, row.sign_out_time)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          row.sign_in_time && row.sign_out_time
                            ? "success"
                            : "muted"
                        }`}
                      >
                        {row.sign_in_time && row.sign_out_time
                          ? "Present"
                          : row.sign_in_time
                          ? "Signed In"
                          : "—"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="center">
                    No records
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default EmployeeAttendance;
