import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { attendanceService } from "../services/attendanceService";
import { useAuth } from "../context/AuthContext";
import { Clock, Camera, UserCheck } from "lucide-react";
import * as faceapi from "face-api.js";
import { employeeService } from "../services/employeeService";

const EmployeeAttendance = () => {
  const { user, setUserFromServer } = useAuth();
  const [today, setToday] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [onLeaveToday, setOnLeaveToday] = useState(false);
  const autoSignOutTimerRef = useRef(null);
  const checkIntervalRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [enrollmentPath, setEnrollmentPath] = useState("");
  const [faceError, setFaceError] = useState("");

  const fetchAll = useCallback(async () => {
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
  }, []);

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

  // Load face-api models
  useEffect(() => {
    const load = async () => {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        setError("Failed to load AI models. Please refresh.");
      }
    };
    load();
  }, []);

  // Fetch my profile to check enrollment image path
  useEffect(() => {
    const getMe = async () => {
      try {
        const me = await employeeService.getMe();
        const p = me?.face_image_path || "";
        setEnrollmentPath(p);
      } catch (_) {
        setEnrollmentPath("");
      }
    };
    getMe();
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Calculate milliseconds until 6 PM today
  const getMillisecondsUntil6PM = () => {
    const now = new Date();
    const target = new Date();
    target.setHours(18, 0, 0, 0); // Set to 6 PM (18:00:00)

    // If it's already past 6 PM today, return null (don't set timer)
    if (now >= target) {
      return null;
    }

    return target - now;
  };

  // Perform automatic sign-out
  const performAutoSignOut = async () => {
    console.log("⏰ 6 PM reached - Auto signing out...");
    try {
      const res = await attendanceService.signOut();
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
        setSuccess("Automatically signed out at 6 PM");
      } else {
        const refreshed = await refreshTodayWithRetry();
        const list = await attendanceService.listMine();
        setItems(Array.isArray(list) ? list : []);

        if (refreshed?.sign_out_time) {
          setSuccess("Automatically signed out at 6 PM");
        }
      }
    } catch (e) {
      console.error("Auto sign-out failed:", e);
      setError("Auto sign-out failed. Please sign out manually.");
    }
  };

  // Auto sign-out timer - triggers at 6 PM if user is signed in
  useEffect(() => {
    // Clear any existing timers
    if (autoSignOutTimerRef.current) {
      clearTimeout(autoSignOutTimerRef.current);
      autoSignOutTimerRef.current = null;
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    // If user is signed in but not signed out, set the timer for 6 PM
    if (today?.sign_in_time && !today?.sign_out_time) {
      const msUntil6PM = getMillisecondsUntil6PM();

      if (msUntil6PM !== null && msUntil6PM > 0) {
        const hours = Math.floor(msUntil6PM / 3600000);
        const minutes = Math.floor((msUntil6PM % 3600000) / 60000);
        console.log(`⏰ Auto sign-out scheduled for 6 PM (in ${hours}h ${minutes}m)`);

        // Set timer for 6 PM
        autoSignOutTimerRef.current = setTimeout(performAutoSignOut, msUntil6PM);

        // Also set an interval to check every minute (as a backup)
        checkIntervalRef.current = setInterval(() => {
          const now = new Date();
          const hours = now.getHours();
          const minutes = now.getMinutes();

          // If it's 6 PM or later and user is still signed in
          if (hours >= 18 && today?.sign_in_time && !today?.sign_out_time) {
            performAutoSignOut();
            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
              checkIntervalRef.current = null;
            }
          }
        }, 60000); // Check every minute
      } else if (msUntil6PM === null) {
        console.log("⏰ Already past 6 PM today - no auto sign-out scheduled");
      }
    }

    // Cleanup timers on unmount or when dependencies change
    return () => {
      if (autoSignOutTimerRef.current) {
        clearTimeout(autoSignOutTimerRef.current);
        autoSignOutTimerRef.current = null;
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [today?.sign_in_time, today?.sign_out_time]);

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation is not supported by your browser."));
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          resolve(null);
        }
      );
    });
  };

  const captureCurrentFrameAsBlob = async () => {
    const video = webcamRef.current;
    if (!video) throw new Error("Webcam not ready");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  };

  const detectDescriptorFromVideo = async () => {
    const video = webcamRef.current;
    if (!video) throw new Error("Webcam not ready");
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!detection) return null;
    return detection.descriptor;
  };

  const detectDescriptorFromUrl = async (url) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => rej(new Error("Failed to load enrollment image"));
    });
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!detection) return null;
    return detection.descriptor;
  };

  const ENROLLMENT_BASE = "http://localhost:3000"; // uploads served at /uploads

  const handleEnroll = async () => {
    try {
      setSaving(true);
      setFaceError("");
      const blob = await captureCurrentFrameAsBlob();
      if (!blob) throw new Error("Failed to capture image");
      const file = new File([blob], "enroll.jpg", { type: "image/jpeg" });
      const res = await employeeService.faceEnroll(file);
      const p = res?.face_image_path || "";
      if (!p) throw new Error("Enrollment failed");
      setEnrollmentPath(p);
      setSuccess("Face enrolled successfully");
      setIsScanning(false);
    } catch (e) {
      setFaceError(e?.response?.data?.message || e.message || "Enrollment failed");
    } finally {
      setSaving(false);
    }
  };

  const signIn = async () => {
    if (!modelsLoaded) {
      setError("AI models not loaded yet. Please wait.");
      return;
    }
    setIsScanning(true);
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      // If not enrolled, block and ask to enroll
      if (!enrollmentPath) {
        setFaceError("Please enroll your face first");
        setSaving(false);
        return;
      }

      // Compare live vs enrolled
      const [liveDesc, baseDesc] = await Promise.all([
        detectDescriptorFromVideo(),
        detectDescriptorFromUrl(`${ENROLLMENT_BASE}${enrollmentPath}`),
      ]);
      if (!liveDesc || !baseDesc) {
        setFaceError("Face not detected. Please look at the camera.");
        setSaving(false);
        return;
      }
      const distance = faceapi.euclideanDistance(liveDesc, baseDesc);
      const THRESHOLD = 0.45;
      if (distance > THRESHOLD) {
        setFaceError(`Face does not match (d=${distance.toFixed(2)}).`);
        setSaving(false);
        return;
      }

      // On success, also send captured image for audit
      const blob = await captureCurrentFrameAsBlob();
      if (!blob) throw new Error("Failed to capture image");
      const file = new File([blob], "attendance.jpg", { type: "image/jpeg" });
      const res = await attendanceService.signIn({ image: file });
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
        setSuccess("Signed in successfully - Auto sign-out at 6 PM");
      } else {
        const refreshed = await refreshTodayWithRetry();
        const list = await attendanceService.listMine();
        setItems(Array.isArray(list) ? list : []);
        if (refreshed?.sign_in_time) {
          setSuccess("Signed in successfully - Auto sign-out at 6 PM");
        } else {
          setError("Sign in may have failed. Please refresh.");
        }
      }
      setIsScanning(false);
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to sign in";
      setError(msg);
      if (typeof msg === "string" && msg.toLowerCase().includes("leave")) {
        setOnLeaveToday(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const startWebcam = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        setError("Could not start webcam. Please grant camera permission.");
        setIsScanning(false);
      });
  };

  const stopWebcam = () => {
    if (webcamRef.current && webcamRef.current.srcObject) {
      webcamRef.current.srcObject.getTracks().forEach((track) => track.stop());
      webcamRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (isScanning) {
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => stopWebcam();
  }, [isScanning]);

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
      {isScanning && (
        <div className="webcam-modal-backdrop">
          <div className="webcam-modal-content">
            <h3>{enrollmentPath ? "Scan Face to Sign In" : "Enroll Your Face"}</h3>
            <div className="webcam-container">
              <video ref={webcamRef} autoPlay muted playsInline />
              <div className="webcam-overlay"></div>
            </div>
            <div className="designations-actions">
              <button className="btn" onClick={() => setIsScanning(false)} disabled={saving}>
                Cancel
              </button>
              {enrollmentPath ? (
                <button className="btn primary" onClick={signIn} disabled={saving || todayState.signedIn || !modelsLoaded}>
                  <Camera size={16} /> {saving ? "Scanning..." : "Scan & Sign In"}
                </button>
              ) : (
                <button className="btn primary" onClick={handleEnroll} disabled={saving || !modelsLoaded}>
                  <UserCheck size={16} /> {saving ? "Enrolling..." : "Enroll Face"}
                </button>
              )}
            </div>
            {faceError && <div className="dep-alert error small" style={{marginTop:8}}>{faceError}</div>}
          </div>
        </div>
      )}

      <div className="designations-toolbar">
        <h2>Attendance</h2>
        <div className="designations-actions">
          {!todayState.signedIn ? (
            <button
              className="btn primary"
              onClick={() => setIsScanning(true)}
              disabled={saving || loading || onLeaveToday || !modelsLoaded}
            >
              {loading ? "Loading..." : !modelsLoaded ? "Loading AI..." : "Sign In"}
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
      {onLeaveToday && (
        <div className="dep-alert warning">You are on approved leave today. Attendance sign-in is disabled.</div>
      )}
      {success && <div className="dep-alert success">{success}</div>}
      
      {todayState.signedIn && !todayState.signedOut && (
        <div className="dep-alert info">
          <Clock size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />
          <span>You will be automatically signed out at 6:00 PM if not done manually</span>
        </div>
      )}

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