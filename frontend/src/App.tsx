import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

type HealthResponse = {
  status: string;
  service: string;
};

type UserResponse = {
  id: number;
  email: string;
  role: string;
  created_at: string;
};

type RegisterResponse = {
  id: number;
  email: string;
  role: string;
  created_at: string;
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

type VerifyPassResponse = {
  pass_number: string;
  status: string;
  issued_at: string;
  expires_at: string;
  valid: boolean;
  message: string;
};

type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "teal"
  | "purple";

function baseInputStyle() {
  return {
    width: "100%",
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    backgroundColor: "#ffffff",
    fontSize: "14px",
    boxSizing: "border-box" as const,
  };
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  let bg = "#eef2ff";
  let color = "#3730a3";

  if (
    normalized === "approved" ||
    normalized === "active" ||
    normalized === "success" ||
    normalized === "ok"
  ) {
    bg = "#e8f7ec";
    color = "#166534";
  } else if (normalized === "pending") {
    bg = "#fff7e6";
    color = "#92400e";
  } else if (
    normalized === "rejected" ||
    normalized === "revoked" ||
    normalized === "expired" ||
    normalized === "error"
  ) {
    bg = "#ffe5e5";
    color = "#991b1b";
  }

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: "999px",
        backgroundColor: bg,
        color,
        fontSize: "12px",
        fontWeight: 700,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}

function AppShellCard({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        backgroundColor: "#ffffff",
        padding: "24px",
        borderRadius: "18px",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "22px" }}>{title}</h2>
          {subtitle && (
            <p style={{ margin: "6px 0 0 0", color: "#6b7280" }}>{subtitle}</p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function ActionButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: ButtonVariant;
}) {
  const palette: Record<ButtonVariant, { bg: string; color: string }> = {
    primary: { bg: "#1d4ed8", color: "#ffffff" },
    secondary: { bg: "#374151", color: "#ffffff" },
    success: { bg: "#166534", color: "#ffffff" },
    danger: { bg: "#b91c1c", color: "#ffffff" },
    teal: { bg: "#0f766e", color: "#ffffff" },
    purple: { bg: "#7c3aed", color: "#ffffff" },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 16px",
        borderRadius: "10px",
        border: "none",
        backgroundColor: palette[variant].bg,
        color: palette[variant].color,
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 700,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function LabeledInput({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label style={{ display: "block", marginBottom: "16px" }}>
      <div style={{ marginBottom: "6px", fontWeight: 700 }}>{label}</div>
      {children}
    </label>
  );
}

function InfoMessage({
  text,
  tone,
}: {
  text: string;
  tone: "success" | "error";
}) {
  return (
    <p
      style={{
        marginTop: "14px",
        padding: "12px 14px",
        borderRadius: "10px",
        backgroundColor: tone === "success" ? "#e8f7ec" : "#ffe5e5",
        color: tone === "success" ? "#166534" : "#991b1b",
        whiteSpace: "pre-wrap",
      }}
    >
      {text}
    </p>
  );
}

function DataCard({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "16px",
        marginBottom: "12px",
        backgroundColor: "#fafafa",
      }}
    >
      {children}
    </div>
  );
}

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

  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

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

  const [verifyPassNumber, setVerifyPassNumber] = useState("");
  const [verifyPassLoading, setVerifyPassLoading] = useState(false);
  const [verifyPassError, setVerifyPassError] = useState("");
  const [verifyPassResult, setVerifyPassResult] =
    useState<VerifyPassResponse | null>(null);

  const canVerifyPass =
    currentUser?.role === "admin" || currentUser?.role === "verifier";

  useEffect(() => {
    async function loadInitialData() {
      try {
        const healthResponse = await fetch("/api/health");
        if (!healthResponse.ok) {
          throw new Error(
            `Health request failed with status ${healthResponse.status}`
          );
        }
        const healthData: HealthResponse = await healthResponse.json();
        setHealth(healthData);
      } catch (err) {
        if (err instanceof Error) {
          setHealthError(err.message);
        } else {
          setHealthError("Unknown health error");
        }
      } finally {
        setHealthLoading(false);
      }

      try {
        const meResponse = await fetch("/api/me", {
          credentials: "include",
        });

        if (meResponse.ok) {
          const meData: UserResponse = await meResponse.json();
          setCurrentUser(meData);

          if (meData.role === "admin") {
            await Promise.all([loadAdminApplications(), loadAdminPasses()]);
          } else if (meData.role === "resident") {
            await Promise.all([loadMyApplications(), loadMyPasses()]);
          }
        }
      } catch {
        // ignore missing session
      } finally {
        setSessionLoading(false);
      }
    }

    loadInitialData();
  }, []);

  async function loadMyApplications() {
    setApplicationsLoading(true);
    setApplicationsError("");

    try {
      const response = await fetch("/api/applications/me", {
        credentials: "include",
      });

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

  async function loadMyPasses() {
    setResidentPassesLoading(true);
    setResidentPassesError("");

    try {
      const response = await fetch("/api/passes/me", {
        credentials: "include",
      });

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
      const response = await fetch("/api/admin/applications", {
        credentials: "include",
      });

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
      const response = await fetch("/api/admin/passes", {
        credentials: "include",
      });

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
    setVerifyPassNumber("");
    setVerifyPassError("");
    setVerifyPassResult(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || "Login failed");
      }

      const data: UserResponse = JSON.parse(text);

      setCurrentUser(data);
      setLoginMessage(`Logged in as ${data.email} (${data.role}).`);
      setLoginPassword("");

      if (data.role === "admin") {
        await Promise.all([loadAdminApplications(), loadAdminPasses()]);
      } else if (data.role === "resident") {
        await Promise.all([loadMyApplications(), loadMyPasses()]);
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

  async function handleLogout() {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    }

    setCurrentUser(null);
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
    setVerifyPassNumber("");
    setVerifyPassError("");
    setVerifyPassResult(null);
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
        credentials: "include",
        body: JSON.stringify({
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

      setApplicationMessage("Application submitted successfully.");
      setApplicationFullName("");
      setApplicationDateOfBirth("");
      setApplicationTransitIdNumber("");
      setApplicationEligibilityReason("");

      await Promise.all([loadMyApplications(), loadMyPasses()]);
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
        credentials: "include",
        body: JSON.stringify({
          application_id: applicationId,
          status,
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || "Application review failed");
      }

      setAdminReviewMessage(`Application ${applicationId} marked as ${status}.`);
      await Promise.all([loadAdminApplications(), loadAdminPasses()]);
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

  async function handleVerifyPass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setVerifyPassLoading(true);
    setVerifyPassError("");
    setVerifyPassResult(null);

    try {
      const response = await fetch(
        `/api/verify-pass?pass_number=${encodeURIComponent(verifyPassNumber)}`,
        {
          credentials: "include",
        }
      );

      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || "Pass verification failed");
      }

      const data: VerifyPassResponse = JSON.parse(text);
      setVerifyPassResult(data);
    } catch (err) {
      if (err instanceof Error) {
        setVerifyPassError(err.message);
      } else {
        setVerifyPassError("Unknown verifier error");
      }
    } finally {
      setVerifyPassLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px",
        background:
          "linear-gradient(180deg, #eef4ff 0%, #f8fbff 40%, #f4f7fb 100%)",
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
            padding: "28px 32px",
            borderRadius: "22px",
            boxShadow: "0 14px 40px rgba(15, 23, 42, 0.08)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "20px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: "#2563eb",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  fontSize: "12px",
                }}
              >
                Gov-tech workflow demo
              </p>
              <h1 style={{ margin: "8px 0 10px 0", fontSize: "34px" }}>
                Reduced-Fare Transit Pass
              </h1>
              <p style={{ margin: 0, color: "#6b7280", maxWidth: "720px" }}>
                Resident application, admin review, pass issuance, and verifier
                validation in one full-stack system.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {healthLoading && <span>Checking backend...</span>}
              {!healthLoading && healthError && <StatusPill status="error" />}
              {!healthLoading && !healthError && health && (
                <span
                  style={{
                    display: "inline-block",
                    padding: "8px 12px",
                    borderRadius: "999px",
                    backgroundColor: "#e8f7ec",
                    color: "#166534",
                    fontWeight: 700,
                  }}
                >
                  Backend: {health.status}
                </span>
              )}
              {currentUser && <StatusPill status={currentUser.role} />}
            </div>
          </div>
        </section>

        {sessionLoading && (
          <AppShellCard title="Checking session">
            <p style={{ margin: 0, color: "#6b7280" }}>
              Looking for an existing login cookie.
            </p>
          </AppShellCard>
        )}

        {!sessionLoading && (
          <>
            {!currentUser && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "24px",
                }}
              >
                <AppShellCard
                  title="Register"
                  subtitle="Create a resident, admin, or verifier account."
                >
                  <form onSubmit={handleRegister}>
                    <LabeledInput label="Email">
                      <input
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        style={baseInputStyle()}
                      />
                    </LabeledInput>

                    <LabeledInput label="Password">
                      <input
                        type="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        style={baseInputStyle()}
                      />
                    </LabeledInput>

                    <LabeledInput label="Role">
                      <select
                        value={registerRole}
                        onChange={(e) => setRegisterRole(e.target.value)}
                        style={baseInputStyle()}
                      >
                        <option value="resident">resident</option>
                        <option value="admin">admin</option>
                        <option value="verifier">verifier</option>
                      </select>
                    </LabeledInput>

                    <ActionButton type="submit" disabled={registerLoading}>
                      {registerLoading ? "Registering..." : "Register"}
                    </ActionButton>
                  </form>

                  {registerMessage && (
                    <InfoMessage text={registerMessage} tone="success" />
                  )}
                  {registerError && (
                    <InfoMessage text={registerError} tone="error" />
                  )}
                </AppShellCard>

                <AppShellCard
                  title="Login"
                  subtitle="Sign in and the session will survive refresh."
                >
                  <form onSubmit={handleLogin}>
                    <LabeledInput label="Email">
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        style={baseInputStyle()}
                      />
                    </LabeledInput>

                    <LabeledInput label="Password">
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        style={baseInputStyle()}
                      />
                    </LabeledInput>

                    <ActionButton
                      type="submit"
                      disabled={loginLoading}
                      variant="success"
                    >
                      {loginLoading ? "Logging in..." : "Login"}
                    </ActionButton>
                  </form>

                  {loginMessage && (
                    <InfoMessage text={loginMessage} tone="success" />
                  )}
                  {loginError && <InfoMessage text={loginError} tone="error" />}
                </AppShellCard>
              </div>
            )}

            {currentUser && (
              <AppShellCard
                title="Current session"
                subtitle={`Signed in as ${currentUser.email}`}
                actions={
                  <ActionButton onClick={handleLogout} variant="danger">
                    Logout
                  </ActionButton>
                }
              >
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <StatusPill status={currentUser.role} />
                  <span style={{ color: "#6b7280" }}>
                    Created {new Date(currentUser.created_at).toLocaleString()}
                  </span>
                </div>
              </AppShellCard>
            )}

            {currentUser?.role === "resident" && (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "24px",
                  }}
                >
                  <AppShellCard
                    title="Submit reduced-fare application"
                    subtitle="Applications attach to the authenticated resident automatically."
                  >
                    <form onSubmit={handleApplicationSubmit}>
                      <LabeledInput label="Full name">
                        <input
                          type="text"
                          value={applicationFullName}
                          onChange={(e) =>
                            setApplicationFullName(e.target.value)
                          }
                          style={baseInputStyle()}
                        />
                      </LabeledInput>

                      <LabeledInput label="Date of birth">
                        <input
                          type="date"
                          value={applicationDateOfBirth}
                          onChange={(e) =>
                            setApplicationDateOfBirth(e.target.value)
                          }
                          style={baseInputStyle()}
                        />
                      </LabeledInput>

                      <LabeledInput label="Transit ID number">
                        <input
                          type="text"
                          value={applicationTransitIdNumber}
                          onChange={(e) =>
                            setApplicationTransitIdNumber(e.target.value)
                          }
                          style={baseInputStyle()}
                        />
                      </LabeledInput>

                      <LabeledInput label="Eligibility reason">
                        <textarea
                          value={applicationEligibilityReason}
                          onChange={(e) =>
                            setApplicationEligibilityReason(e.target.value)
                          }
                          rows={4}
                          style={{ ...baseInputStyle(), resize: "vertical" }}
                        />
                      </LabeledInput>

                      <ActionButton
                        type="submit"
                        disabled={applicationLoading}
                        variant="purple"
                      >
                        {applicationLoading
                          ? "Submitting..."
                          : "Submit Application"}
                      </ActionButton>
                    </form>

                    {applicationMessage && (
                      <InfoMessage text={applicationMessage} tone="success" />
                    )}
                    {applicationError && (
                      <InfoMessage text={applicationError} tone="error" />
                    )}
                  </AppShellCard>

                  <AppShellCard
                    title="My applications"
                    subtitle="Track pending, approved, and rejected decisions."
                    actions={
                      <ActionButton
                        onClick={loadMyApplications}
                        disabled={applicationsLoading}
                        variant="secondary"
                      >
                        {applicationsLoading
                          ? "Refreshing..."
                          : "Refresh Applications"}
                      </ActionButton>
                    }
                  >
                    {applicationsError && (
                      <InfoMessage text={applicationsError} tone="error" />
                    )}

                    {applicationsLoading && (
                      <p style={{ color: "#6b7280", margin: 0 }}>
                        Loading applications...
                      </p>
                    )}

                    {!applicationsLoading && applications.length === 0 && (
                      <p style={{ color: "#6b7280", margin: 0 }}>
                        No applications found yet.
                      </p>
                    )}

                    {!applicationsLoading &&
                      applications.map((app) => (
                        <DataCard key={app.id}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: "12px",
                              alignItems: "center",
                              marginBottom: "10px",
                            }}
                          >
                            <strong>Application #{app.id}</strong>
                            <StatusPill status={app.status} />
                          </div>
                          <p style={{ margin: "0 0 8px 0" }}>
                            <strong>Name:</strong> {app.full_name}
                          </p>
                          <p style={{ margin: "0 0 8px 0" }}>
                            <strong>DOB:</strong> {app.date_of_birth}
                          </p>
                          <p style={{ margin: "0 0 8px 0" }}>
                            <strong>Transit ID:</strong> {app.transit_id_number}
                          </p>
                          <p style={{ margin: "0 0 8px 0" }}>
                            <strong>Eligibility:</strong>{" "}
                            {app.eligibility_reason}
                          </p>
                          <p style={{ margin: 0, color: "#6b7280" }}>
                            Created {new Date(app.created_at).toLocaleString()}
                          </p>
                        </DataCard>
                      ))}
                  </AppShellCard>
                </div>

                <AppShellCard
                  title="My passes"
                  subtitle="Issued automatically when an application is approved."
                  actions={
                    <ActionButton
                      onClick={loadMyPasses}
                      disabled={residentPassesLoading}
                      variant="secondary"
                    >
                      {residentPassesLoading ? "Refreshing..." : "Refresh Passes"}
                    </ActionButton>
                  }
                >
                  {residentPassesError && (
                    <InfoMessage text={residentPassesError} tone="error" />
                  )}

                  {residentPassesLoading && (
                    <p style={{ color: "#6b7280", margin: 0 }}>
                      Loading passes...
                    </p>
                  )}

                  {!residentPassesLoading && residentPasses.length === 0 && (
                    <p style={{ color: "#6b7280", margin: 0 }}>
                      No passes issued yet.
                    </p>
                  )}

                  {!residentPassesLoading &&
                    residentPasses.map((pass) => (
                      <DataCard key={pass.id}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                            alignItems: "center",
                            marginBottom: "10px",
                          }}
                        >
                          <strong>Pass #{pass.id}</strong>
                          <StatusPill status={pass.status} />
                        </div>
                        <p style={{ margin: "0 0 8px 0" }}>
                          <strong>Application ID:</strong> {pass.application_id}
                        </p>
                        <p style={{ margin: "0 0 8px 0" }}>
                          <strong>Pass Number:</strong> {pass.pass_number}
                        </p>
                        <p style={{ margin: "0 0 8px 0" }}>
                          <strong>Issued:</strong>{" "}
                          {new Date(pass.issued_at).toLocaleString()}
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>Expires:</strong>{" "}
                          {new Date(pass.expires_at).toLocaleString()}
                        </p>
                      </DataCard>
                    ))}
                </AppShellCard>
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
                <AppShellCard
                  title="Admin review queue"
                  subtitle="Approve or reject resident applications."
                  actions={
                    <ActionButton
                      onClick={loadAdminApplications}
                      disabled={adminApplicationsLoading}
                      variant="secondary"
                    >
                      {adminApplicationsLoading
                        ? "Refreshing..."
                        : "Refresh All Applications"}
                    </ActionButton>
                  }
                >
                  {adminReviewMessage && (
                    <InfoMessage text={adminReviewMessage} tone="success" />
                  )}
                  {adminReviewError && (
                    <InfoMessage text={adminReviewError} tone="error" />
                  )}
                  {adminApplicationsError && (
                    <InfoMessage text={adminApplicationsError} tone="error" />
                  )}

                  {adminApplicationsLoading && (
                    <p style={{ color: "#6b7280", margin: 0 }}>
                      Loading all applications...
                    </p>
                  )}

                  {!adminApplicationsLoading && adminApplications.length === 0 && (
                    <p style={{ color: "#6b7280", margin: 0 }}>
                      No applications available.
                    </p>
                  )}

                  {!adminApplicationsLoading &&
                    adminApplications.map((app) => (
                      <DataCard key={app.id}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                            alignItems: "center",
                            marginBottom: "10px",
                          }}
                        >
                          <strong>Application #{app.id}</strong>
                          <StatusPill status={app.status} />
                        </div>

                        <p style={{ margin: "0 0 8px 0" }}>
                          <strong>User ID:</strong> {app.user_id}
                        </p>
                        <p style={{ margin: "0 0 8px 0" }}>
                          <strong>Full name:</strong> {app.full_name}
                        </p>
                        <p style={{ margin: "0 0 8px 0" }}>
                          <strong>DOB:</strong> {app.date_of_birth}
                        </p>
                        <p style={{ margin: "0 0 8px 0" }}>
                          <strong>Transit ID:</strong> {app.transit_id_number}
                        </p>
                        <p style={{ margin: "0 0 8px 0" }}>
                          <strong>Eligibility:</strong>{" "}
                          {app.eligibility_reason}
                        </p>
                        <p style={{ margin: "0 0 8px 0", color: "#6b7280" }}>
                          Created {new Date(app.created_at).toLocaleString()}
                        </p>
                        <p style={{ margin: "0 0 14px 0", color: "#6b7280" }}>
                          Reviewed{" "}
                          {app.reviewed_at
                            ? new Date(app.reviewed_at).toLocaleString()
                            : "not yet"}
                        </p>

                        <div style={{ display: "flex", gap: "12px" }}>
                          <ActionButton
                            onClick={() =>
                              handleReviewApplication(app.id, "approved")
                            }
                            disabled={
                              adminReviewLoadingId === app.id ||
                              app.status === "approved"
                            }
                            variant="success"
                          >
                            {adminReviewLoadingId === app.id
                              ? "Working..."
                              : "Approve"}
                          </ActionButton>

                          <ActionButton
                            onClick={() =>
                              handleReviewApplication(app.id, "rejected")
                            }
                            disabled={
                              adminReviewLoadingId === app.id ||
                              app.status === "rejected"
                            }
                            variant="danger"
                          >
                            {adminReviewLoadingId === app.id
                              ? "Working..."
                              : "Reject"}
                          </ActionButton>
                        </div>
                      </DataCard>
                    ))}
                </AppShellCard>

                <AppShellCard
                  title="Issued passes"
                  subtitle="All passes currently in the system."
                  actions={
                    <ActionButton
                      onClick={loadAdminPasses}
                      disabled={adminPassesLoading}
                      variant="secondary"
                    >
                      {adminPassesLoading ? "Refreshing..." : "Refresh All Passes"}
                    </ActionButton>
                  }
                >
                  {adminPassesError && (
                    <InfoMessage text={adminPassesError} tone="error" />
                  )}

                  {adminPassesLoading && (
                    <p style={{ color: "#6b7280", margin: 0 }}>
                      Loading all passes...
                    </p>
                  )}

                  {!adminPassesLoading && adminPasses.length === 0 && (
                    <p style={{ color: "#6b7280", margin: 0 }}>
                      No passes issued yet.
                    </p>
                  )}

                  {!adminPassesLoading &&
                    adminPasses.map((pass) => (
                      <DataCard key={pass.id}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                            alignItems: "center",
                            marginBottom: "10px",
                          }}
                        >
                          <strong>Pass #{pass.id}</strong>
                          <StatusPill status={pass.status} />
                        </div>
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
                          <strong>Issued:</strong>{" "}
                          {new Date(pass.issued_at).toLocaleString()}
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>Expires:</strong>{" "}
                          {new Date(pass.expires_at).toLocaleString()}
                        </p>
                      </DataCard>
                    ))}
                </AppShellCard>
              </div>
            )}

            {canVerifyPass && (
              <AppShellCard
                title="Verifier"
                subtitle="Check whether a pass number is active and not expired."
              >
                <form onSubmit={handleVerifyPass}>
                  <LabeledInput label="Pass number">
                    <input
                      type="text"
                      value={verifyPassNumber}
                      onChange={(e) => setVerifyPassNumber(e.target.value)}
                      placeholder="Enter pass number"
                      style={baseInputStyle()}
                    />
                  </LabeledInput>

                  <ActionButton
                    type="submit"
                    disabled={verifyPassLoading}
                    variant="teal"
                  >
                    {verifyPassLoading ? "Checking..." : "Verify Pass"}
                  </ActionButton>
                </form>

                {verifyPassError && (
                  <InfoMessage text={verifyPassError} tone="error" />
                )}

                {verifyPassResult && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "16px",
                      borderRadius: "14px",
                      backgroundColor: verifyPassResult.valid
                        ? "#e8f7ec"
                        : "#ffe5e5",
                      color: verifyPassResult.valid ? "#166534" : "#991b1b",
                    }}
                  >
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Result:</strong> {verifyPassResult.message}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Pass Number:</strong> {verifyPassResult.pass_number}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Status:</strong> {verifyPassResult.status}
                    </p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      <strong>Issued:</strong>{" "}
                      {new Date(verifyPassResult.issued_at).toLocaleString()}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Expires:</strong>{" "}
                      {new Date(verifyPassResult.expires_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </AppShellCard>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default App;