import type { FormEvent } from "react";
import { useEffect, useState } from "react";

type HealthResponse = {
  status: string;
  service: string;
};

type RegisterResponse = {
  id: number;
  email: string;
  role: string;
  created_at: string;
};

type LoginResponse = {
  message: string;
  email: string;
  role: string;
};

type ApplicationResponse = {
  id: number;
  user_id: number;
  full_name: string;
  date_of_birth: string;
  transit_id_number: string;
  eligibility_reason: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
};

type PassResponse = {
  id: number;
  application_id: number;
  user_id: number;
  pass_number: string;
  status: string;
  issued_at: string;
  expires_at: string;
};

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState("");
  const [healthLoading, setHealthLoading] = useState(true);

  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState("resident");
  const [registerMessage, setRegisterMessage] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState<LoginResponse | null>(null);

  const [applicationFullName, setApplicationFullName] = useState("");
  const [applicationDateOfBirth, setApplicationDateOfBirth] = useState("");
  const [applicationTransitIdNumber, setApplicationTransitIdNumber] =
    useState("");
  const [applicationEligibilityReason, setApplicationEligibilityReason] =
    useState("");
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applicationError, setApplicationError] = useState("");
  const [applicationLoading, setApplicationLoading] = useState(false);

  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState("");

  const [residentPasses, setResidentPasses] = useState<PassResponse[]>([]);
  const [residentPassesLoading, setResidentPassesLoading] = useState(false);
  const [residentPassesError, setResidentPassesError] = useState("");

  const [adminApplications, setAdminApplications] = useState<
    ApplicationResponse[]
  >([]);
  const [adminApplicationsLoading, setAdminApplicationsLoading] =
    useState(false);
  const [adminApplicationsError, setAdminApplicationsError] = useState("");
  const [adminReviewMessage, setAdminReviewMessage] = useState("");
  const [adminReviewError, setAdminReviewError] = useState("");
  const [adminReviewLoadingId, setAdminReviewLoadingId] = useState<
    number | null
  >(null);

  const [adminPasses, setAdminPasses] = useState<PassResponse[]>([]);
  const [adminPassesLoading, setAdminPassesLoading] = useState(false);
  const [adminPassesError, setAdminPassesError] = useState("");

  useEffect(() => {
    async function loadHealth() {
      try {
        const response = await fetch("/api/health");

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: HealthResponse = await response.json();
        setHealth(data);
      } catch (err) {
        if (err instanceof Error) {
          setHealthError(err.message);
        } else {
          setHealthError("Unknown error");
        }
      } finally {
        setHealthLoading(false);
      }
    }

    loadHealth();
  }, []);

  async function loadApplicationsForEmail(email: string) {
    setApplicationsLoading(true);
    setApplicationsError("");

    try {
      const response = await fetch(
        `/api/applications/by-email?email=${encodeURIComponent(email)}`
      );

      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || "Failed to load applications");
      }

      const data = JSON.parse(text);
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof Error) {
        setApplicationsError(err.message);
      } else {
        setApplicationsError("Unknown applications error");
      }
    } finally {
      setApplicationsLoading(false);
    }
  }

  async function loadPassesForEmail(email: string) {
    setResidentPassesLoading(true);
    setResidentPassesError("");

    try {
      const response = await fetch(
        `/api/passes/by-email?email=${encodeURIComponent(email)}`
      );

      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || "Failed to load passes");
      }

      const data = JSON.parse(text);
      setResidentPasses(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof Error) {
        setResidentPassesError(err.message);
      } else {
        setResidentPassesError("Unknown passes error");
      }
    } finally {
      setResidentPassesLoading(false);
    }
  }

  async function loadAdminApplications() {
    setAdminApplicationsLoading(true);
    setAdminApplicationsError("");

    try {
      const response = await fetch("/api/admin/applications");
      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || "Failed to load admin applications");
      }

      const data = JSON.parse(text);
      setAdminApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof Error) {
        setAdminApplicationsError(err.message);
      } else {
        setAdminApplicationsError("Unknown admin applications error");
      }
    } finally {
      setAdminApplicationsLoading(false);
    }
  }

  async function loadAdminPasses() {
    setAdminPassesLoading(true);
    setAdminPassesError("");

    try {
      const response = await fetch("/api/admin/passes");
      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || "Failed to load admin passes");
      }

      const data = JSON.parse(text);
      setAdminPasses(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof Error) {
        setAdminPassesError(err.message);
      } else {
        setAdminPassesError("Unknown admin passes error");
      }
    } finally {
      setAdminPassesLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setRegisterLoading(true);
    setRegisterMessage("");
    setRegisterError("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          role: registerRole,
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || "Registration failed");
      }

      const data: RegisterResponse = JSON.parse(text);

      setRegisterMessage(
        `Registered ${data.email} as ${data.role} successfully.`
      );
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterRole("resident");
    } catch (err) {
      if (err instanceof Error) {
        setRegisterError(err.message);
      } else {
        setRegisterError("Unknown registration error");
      }
    } finally {
      setRegisterLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoginLoading(true);
    setLoginMessage("");
    setLoginError("");

    setApplications([]);
    setResidentPasses([]);
    setAdminApplications([]);
    setAdminPasses([]);
    setApplicationMessage("");
    setApplicationError("");
    setAdminReviewMessage("");
    setAdminReviewError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || "Login failed");
      }

      const data: LoginResponse = JSON.parse(text);

      setCurrentUser(data);
      setLoginMessage(`Logged in as ${data.email} (${data.role}).`);
      setLoginPassword("");

      if (data.role === "admin") {
        await loadAdminApplications();
        await loadAdminPasses();
      } else {
        await loadApplicationsForEmail(data.email);
        await loadPassesForEmail(data.email);
      }
    } catch (err) {
      if (err instanceof Error) {
        setLoginError(err.message);
      } else {
        setLoginError("Unknown login error");
      }
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleApplicationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      setApplicationError("You must be logged in first.");
      return;
    }

    setApplicationLoading(true);
    setApplicationMessage("");
    setApplicationError("");

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: currentUser.email,
          full_name: applicationFullName,
          date_of_birth: applicationDateOfBirth,
          transit_id_number: applicationTransitIdNumber,
          eligibility_reason: applicationEligibilityReason,
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || "Application submission failed");
      }

      JSON.parse(text) as ApplicationResponse;

      setApplicationMessage("Application submitted successfully.");
      setApplicationFullName("");
      setApplicationDateOfBirth("");
      setApplicationTransitIdNumber("");
      setApplicationEligibilityReason("");

      await loadApplicationsForEmail(currentUser.email);
      await loadPassesForEmail(currentUser.email);
    } catch (err) {
      if (err instanceof Error) {
        setApplicationError(err.message);
      } else {
        setApplicationError("Unknown application error");
      }
    } finally {
      setApplicationLoading(false);
    }
  }

  async function handleReviewApplication(
    applicationId: number,
    status: "approved" | "rejected"
  ) {
    setAdminReviewLoadingId(applicationId);
    setAdminReviewMessage("");
    setAdminReviewError("");

    try {
      const response = await fetch("/api/admin/applications/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          application_id: applicationId,
          status,
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || "Application review failed");
      }

      JSON.parse(text) as ApplicationResponse;
      setAdminReviewMessage(`Application ${applicationId} marked as ${status}.`);

      await loadAdminApplications();
      await loadAdminPasses();
    } catch (err) {
      if (err instanceof Error) {
        setAdminReviewError(err.message);
      } else {
        setAdminReviewError("Unknown review error");
      }
    } finally {
      setAdminReviewLoadingId(null);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px",
        backgroundColor: "#f4f7fb",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gap: "24px",
        }}
      >
        <section
          style={{
            backgroundColor: "#ffffff",
            padding: "32px",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
          }}
        >
          <h1 style={{ marginTop: 0, marginBottom: "12px" }}>
            Reduced-Fare Transit Pass
          </h1>

          <p style={{ marginTop: 0, color: "#444" }}>
            Resident application, agency review, pass issuance, and verifier
            validation.
          </p>

          <hr style={{ margin: "24px 0" }} />

          <h2>Backend connection</h2>

          {healthLoading && <p>Checking backend health...</p>}

          {!healthLoading && healthError && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "#ffe5e5",
                color: "#8a1c1c",
              }}
            >
              <strong>Backend error:</strong> {healthError}
            </div>
          )}

          {!healthLoading && !healthError && health && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "#e8f7ec",
                color: "#14532d",
              }}
            >
              <p style={{ margin: "0 0 8px 0" }}>
                <strong>Status:</strong> {health.status}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Service:</strong> {health.service}
              </p>
            </div>
          )}
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
        >
          <section
            style={{
              backgroundColor: "#ffffff",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Register</h2>

            <form onSubmit={handleRegister}>
              <label style={{ display: "block", marginBottom: "16px" }}>
                <div style={{ marginBottom: "6px", fontWeight: 700 }}>Email</div>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                  }}
                />
              </label>

              <label style={{ display: "block", marginBottom: "16px" }}>
                <div style={{ marginBottom: "6px", fontWeight: 700 }}>
                  Password
                </div>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                  }}
                />
              </label>

              <label style={{ display: "block", marginBottom: "16px" }}>
                <div style={{ marginBottom: "6px", fontWeight: 700 }}>Role</div>
                <select
                  value={registerRole}
                  onChange={(e) => setRegisterRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                  }}
                >
                  <option value="resident">resident</option>
                  <option value="admin">admin</option>
                  <option value="verifier">verifier</option>
                </select>
              </label>

              <button
                type="submit"
                disabled={registerLoading}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#1d4ed8",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {registerLoading ? "Registering..." : "Register"}
              </button>
            </form>

            {registerMessage && (
              <p style={{ color: "#14532d", marginTop: "16px" }}>
                {registerMessage}
              </p>
            )}

            {registerError && (
              <p
                style={{
                  color: "#8a1c1c",
                  marginTop: "16px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {registerError}
              </p>
            )}
          </section>

          <section
            style={{
              backgroundColor: "#ffffff",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Login</h2>

            <form onSubmit={handleLogin}>
              <label style={{ display: "block", marginBottom: "16px" }}>
                <div style={{ marginBottom: "6px", fontWeight: 700 }}>Email</div>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                  }}
                />
              </label>

              <label style={{ display: "block", marginBottom: "16px" }}>
                <div style={{ marginBottom: "6px", fontWeight: 700 }}>
                  Password
                </div>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                  }}
                />
              </label>

              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#166534",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {loginLoading ? "Logging in..." : "Login"}
              </button>
            </form>

            {loginMessage && (
              <p style={{ color: "#14532d", marginTop: "16px" }}>
                {loginMessage}
              </p>
            )}

            {loginError && (
              <p
                style={{
                  color: "#8a1c1c",
                  marginTop: "16px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {loginError}
              </p>
            )}

            {currentUser && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "#eef6ff",
                }}
              >
                <strong>Current user</strong>
                <p style={{ margin: "8px 0 0 0" }}>
                  {currentUser.email} ({currentUser.role})
                </p>
              </div>
            )}
          </section>
        </div>

        {currentUser?.role === "resident" && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
              }}
            >
              <section
                style={{
                  backgroundColor: "#ffffff",
                  padding: "24px",
                  borderRadius: "16px",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                }}
              >
                <h2 style={{ marginTop: 0 }}>Submit Reduced-Fare Application</h2>

                <form onSubmit={handleApplicationSubmit}>
                  <label style={{ display: "block", marginBottom: "16px" }}>
                    <div style={{ marginBottom: "6px", fontWeight: 700 }}>
                      Full name
                    </div>
                    <input
                      type="text"
                      value={applicationFullName}
                      onChange={(e) => setApplicationFullName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </label>

                  <label style={{ display: "block", marginBottom: "16px" }}>
                    <div style={{ marginBottom: "6px", fontWeight: 700 }}>
                      Date of birth
                    </div>
                    <input
                      type="date"
                      value={applicationDateOfBirth}
                      onChange={(e) =>
                        setApplicationDateOfBirth(e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </label>

                  <label style={{ display: "block", marginBottom: "16px" }}>
                    <div style={{ marginBottom: "6px", fontWeight: 700 }}>
                      Transit ID number
                    </div>
                    <input
                      type="text"
                      value={applicationTransitIdNumber}
                      onChange={(e) =>
                        setApplicationTransitIdNumber(e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </label>

                  <label style={{ display: "block", marginBottom: "16px" }}>
                    <div style={{ marginBottom: "6px", fontWeight: 700 }}>
                      Eligibility reason
                    </div>
                    <textarea
                      value={applicationEligibilityReason}
                      onChange={(e) =>
                        setApplicationEligibilityReason(e.target.value)
                      }
                      rows={4}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        resize: "vertical",
                      }}
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={applicationLoading}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#7c3aed",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    {applicationLoading ? "Submitting..." : "Submit Application"}
                  </button>
                </form>

                {applicationMessage && (
                  <p style={{ color: "#14532d", marginTop: "16px" }}>
                    {applicationMessage}
                  </p>
                )}

                {applicationError && (
                  <p
                    style={{
                      color: "#8a1c1c",
                      marginTop: "16px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {applicationError}
                  </p>
                )}
              </section>

              <section
                style={{
                  backgroundColor: "#ffffff",
                  padding: "24px",
                  borderRadius: "16px",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                }}
              >
                <h2 style={{ marginTop: 0 }}>My Applications</h2>

                <button
                  type="button"
                  onClick={() => loadApplicationsForEmail(currentUser.email)}
                  disabled={applicationsLoading}
                  style={{
                    marginBottom: "16px",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#374151",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  {applicationsLoading ? "Refreshing..." : "Refresh Applications"}
                </button>

                {applicationsError && (
                  <p style={{ color: "#8a1c1c", whiteSpace: "pre-wrap" }}>
                    {applicationsError}
                  </p>
                )}

                {applicationsLoading && <p>Loading applications...</p>}

                {!applicationsLoading && applications.length === 0 && (
                  <p>No applications found yet.</p>
                )}

                {!applicationsLoading &&
                  applications.map((app) => (
                    <div
                      key={app.id}
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: "10px",
                        padding: "14px",
                        marginBottom: "12px",
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <p style={{ margin: "0 0 8px 0" }}>
                        <strong>Application ID:</strong> {app.id}
                      </p>
                      <p style={{ margin: "0 0 8px 0" }}>
                        <strong>Full name:</strong> {app.full_name}
                      </p>
                      <p style={{ margin: "0 0 8px 0" }}>
                        <strong>Date of birth:</strong> {app.date_of_birth}
                      </p>
                      <p style={{ margin: "0 0 8px 0" }}>
                        <strong>Transit ID:</strong> {app.transit_id_number}
                      </p>
                      <p style={{ margin: "0 0 8px 0" }}>
                        <strong>Eligibility:</strong> {app.eligibility_reason}
                      </p>
                      <p style={{ margin: "0 0 8px 0" }}>
                        <strong>Status:</strong> {app.status}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>Created:</strong>{" "}
                        {new Date(app.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
              </section>
            </div>

            <section
              style={{
                backgroundColor: "#ffffff",
                padding: "24px",
                borderRadius: "16px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
              }}
            >
              <h2 style={{ marginTop: 0 }}>My Passes</h2>

              <button
                type="button"
                onClick={() => loadPassesForEmail(currentUser.email)}
                disabled={residentPassesLoading}
                style={{
                  marginBottom: "16px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#374151",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {residentPassesLoading ? "Refreshing..." : "Refresh Passes"}
              </button>

              {residentPassesError && (
                <p style={{ color: "#8a1c1c", whiteSpace: "pre-wrap" }}>
                  {residentPassesError}
                </p>
              )}

              {residentPassesLoading && <p>Loading passes...</p>}

              {!residentPassesLoading && residentPasses.length === 0 && (
                <p>No passes issued yet.</p>
              )}

              {!residentPassesLoading &&
                residentPasses.map((pass) => (
                  <div
                    key={pass.id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "10px",
                      padding: "14px",
                      marginBottom: "12px",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Pass ID:</strong> {pass.id}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Application ID:</strong> {pass.application_id}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Pass Number:</strong> {pass.pass_number}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Status:</strong> {pass.status}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Issued:</strong>{" "}
                      {new Date(pass.issued_at).toLocaleString()}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Expires:</strong>{" "}
                      {new Date(pass.expires_at).toLocaleString()}
                    </p>
                  </div>
                ))}
            </section>
          </>
        )}

        {currentUser?.role === "admin" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
          >
            <section
              style={{
                backgroundColor: "#ffffff",
                padding: "24px",
                borderRadius: "16px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
              }}
            >
              <h2 style={{ marginTop: 0 }}>Admin Review Queue</h2>

              <button
                type="button"
                onClick={loadAdminApplications}
                disabled={adminApplicationsLoading}
                style={{
                  marginBottom: "16px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#374151",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {adminApplicationsLoading
                  ? "Refreshing..."
                  : "Refresh All Applications"}
              </button>

              {adminReviewMessage && (
                <p style={{ color: "#14532d", marginBottom: "16px" }}>
                  {adminReviewMessage}
                </p>
              )}

              {adminReviewError && (
                <p
                  style={{
                    color: "#8a1c1c",
                    marginBottom: "16px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {adminReviewError}
                </p>
              )}

              {adminApplicationsError && (
                <p
                  style={{
                    color: "#8a1c1c",
                    marginBottom: "16px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {adminApplicationsError}
                </p>
              )}

              {adminApplicationsLoading && <p>Loading all applications...</p>}

              {!adminApplicationsLoading && adminApplications.length === 0 && (
                <p>No applications available.</p>
              )}

              {!adminApplicationsLoading &&
                adminApplications.map((app) => (
                  <div
                    key={app.id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "10px",
                      padding: "14px",
                      marginBottom: "12px",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Application ID:</strong> {app.id}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>User ID:</strong> {app.user_id}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Full name:</strong> {app.full_name}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Date of birth:</strong> {app.date_of_birth}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Transit ID:</strong> {app.transit_id_number}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Eligibility:</strong> {app.eligibility_reason}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Status:</strong> {app.status}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Created:</strong>{" "}
                      {new Date(app.created_at).toLocaleString()}
                    </p>
                    <p style={{ margin: "0 0 12px 0" }}>
                      <strong>Reviewed:</strong>{" "}
                      {app.reviewed_at
                        ? new Date(app.reviewed_at).toLocaleString()
                        : "Not reviewed yet"}
                    </p>

                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        type="button"
                        onClick={() => handleReviewApplication(app.id, "approved")}
                        disabled={
                          adminReviewLoadingId === app.id ||
                          app.status === "approved"
                        }
                        style={{
                          padding: "10px 16px",
                          borderRadius: "8px",
                          border: "none",
                          backgroundColor: "#166534",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        {adminReviewLoadingId === app.id
                          ? "Working..."
                          : "Approve"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReviewApplication(app.id, "rejected")}
                        disabled={
                          adminReviewLoadingId === app.id ||
                          app.status === "rejected"
                        }
                        style={{
                          padding: "10px 16px",
                          borderRadius: "8px",
                          border: "none",
                          backgroundColor: "#b91c1c",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        {adminReviewLoadingId === app.id
                          ? "Working..."
                          : "Reject"}
                      </button>
                    </div>
                  </div>
                ))}
            </section>

            <section
              style={{
                backgroundColor: "#ffffff",
                padding: "24px",
                borderRadius: "16px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
              }}
            >
              <h2 style={{ marginTop: 0 }}>Issued Passes</h2>

              <button
                type="button"
                onClick={loadAdminPasses}
                disabled={adminPassesLoading}
                style={{
                  marginBottom: "16px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#374151",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {adminPassesLoading ? "Refreshing..." : "Refresh All Passes"}
              </button>

              {adminPassesError && (
                <p style={{ color: "#8a1c1c", whiteSpace: "pre-wrap" }}>
                  {adminPassesError}
                </p>
              )}

              {adminPassesLoading && <p>Loading all passes...</p>}

              {!adminPassesLoading && adminPasses.length === 0 && (
                <p>No passes issued yet.</p>
              )}

              {!adminPassesLoading &&
                adminPasses.map((pass) => (
                  <div
                    key={pass.id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "10px",
                      padding: "14px",
                      marginBottom: "12px",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Pass ID:</strong> {pass.id}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Application ID:</strong> {pass.application_id}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>User ID:</strong> {pass.user_id}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Pass Number:</strong> {pass.pass_number}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Status:</strong> {pass.status}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Issued:</strong>{" "}
                      {new Date(pass.issued_at).toLocaleString()}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Expires:</strong>{" "}
                      {new Date(pass.expires_at).toLocaleString()}
                    </p>
                  </div>
                ))}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

export default App;