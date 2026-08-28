import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Search,
  X,
  ArrowRight,
  UserCheck,
  Building2,
  Boxes,
  FileCheck2,
  Layers,
  HelpCircle,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";

// Structured Demo Accounts categorized by institutional governance domain
const DEMO_ACTORS = [
  {
    category: "Governance & Property Oversight",
    icon: Building2,
    actors: [
      {
        name: "Abel Tesfaye",
        email: "abel.admin@university.edu",
        role: "Administrator",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        avatarBg: "bg-purple-600 text-white",
        desc: "System configuration, user accounts, and immutable audit logs.",
        initials: "AT",
      },
      {
        name: "Meron Alemu",
        email: "meron.pao@university.edu",
        role: "Property Administration Officer",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        avatarBg: "bg-blue-600 text-white",
        desc: "Senior approval gate for store requisitions, SIVs, returns & transfers.",
        initials: "MA",
      },
      {
        name: "Dr. Tewodros Fikru",
        email: "tewodros.dept@university.edu",
        role: "Department Head",
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
        avatarBg: "bg-indigo-600 text-white",
        desc: "Departmental requisitions, staff request approvals & unit custody.",
        initials: "TF",
      },
    ],
  },
  {
    name: "Store & Warehouse Operations",
    icon: Boxes,
    actors: [
      {
        name: "Dawit Bekele",
        email: "dawit.store@university.edu",
        role: "Store Head",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        avatarBg: "bg-emerald-600 text-white",
        desc: "Delivery receipt, Model 20 SIV creation, Model 22 issuing & FIFO deduction.",
        initials: "DB",
      },
      {
        name: "Sara Getachew",
        email: "sara.clerk@university.edu",
        role: "Stock Clerk",
        color: "bg-teal-100 text-teal-800 border-teal-200",
        avatarBg: "bg-teal-600 text-white",
        desc: "Delivery logging, storage bin/shelf allocation, and physical count lines.",
        initials: "SG",
      },
    ],
  },
  {
    category: "Inspection & Registration",
    icon: FileCheck2,
    actors: [
      {
        name: "Eng. Yonas Kebede",
        email: "yonas.tec@university.edu",
        role: "Technical Evaluation Committee",
        color: "bg-amber-100 text-amber-800 border-amber-200",
        avatarBg: "bg-amber-600 text-white",
        desc: "Specification inspection for goods receipts and return condition grading.",
        initials: "YK",
      },
      {
        name: "Hana Girma",
        email: "hana.registration@university.edu",
        role: "Property Registration Officer",
        color: "bg-cyan-100 text-cyan-800 border-cyan-200",
        avatarBg: "bg-cyan-600 text-white",
        desc: "Official Model 19 (GRN) issuance, asset tagging & User-Card registers.",
        initials: "HG",
      },
    ],
  },
  {
    category: "Finance, Governance & Security",
    icon: Layers,
    actors: [
      {
        name: "Selam Mulu",
        email: "selam.acct@university.edu",
        role: "Accountant",
        color: "bg-rose-100 text-rose-800 border-rose-200",
        avatarBg: "bg-rose-600 text-white",
        desc: "Perpetual FIFO inventory valuation, write-offs & reconciliation.",
        initials: "SM",
      },
      {
        name: "Disposal Board",
        email: "disposal.committee@university.edu",
        role: "Disposal Committee",
        color: "bg-red-100 text-red-800 border-red-200",
        avatarBg: "bg-red-600 text-white",
        desc: "Sole authority to approve retirement via Auction, Destruction, or Donation.",
        initials: "DC",
      },
      {
        name: "Girum Assefa",
        email: "girum.security@university.edu",
        role: "Campus Security Officer",
        color: "bg-orange-100 text-orange-800 border-orange-200",
        avatarBg: "bg-orange-600 text-white",
        desc: "Gate pass verification & exit clearance against finalized Model 22.",
        initials: "GA",
      },
    ],
  },
];

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function handleLogin(e) {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please enter your username and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDirectActorLogin(actorEmail) {
    setEmail(actorEmail);
    setPassword("Demo@1234");
    setError("");
    setLoading(true);
    setShowDemoModal(false);
    try {
      await login(actorEmail, "Demo@1234");
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectActor(actorEmail) {
    setEmail(actorEmail);
    setPassword("Demo@1234");
    setError("");
    setShowDemoModal(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f0f2f5] px-4 py-8 font-sans selection:bg-[#007bff] selection:text-white">
      {/* Top Branding */}
      <div className="mb-6 flex flex-col items-center text-center">
        {/* SPMS Modern Hexagonal Logo */}
        <div className="relative mb-3 flex items-center justify-center">
          <img
            src="/spms-logo.svg"
            alt="Stock Management System Logo"
            className="h-28 w-28 object-contain drop-shadow-sm transition-transform hover:scale-105 duration-200"
          />
        </div>

        {/* Portal Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-[#343a40] tracking-tight">
          Stock Management System
        </h1>
      </div>

      {/* Main Authentication Card */}
      <div className="relative w-full max-w-[460px] rounded-md border border-slate-200/80 bg-white p-7 sm:p-9 shadow-md shadow-slate-300/30">
        {/* Sub-Heading inside Card */}
        <p className="mb-6 text-center text-sm sm:text-base font-normal text-[#495057]">
          For Authorized Staff Only
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <ShieldAlert size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username / Institutional Email Field */}
          <div className="relative">
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Username"
              className="w-full rounded border border-slate-300 bg-white py-2.5 pl-3.5 pr-10 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            />
            <Mail
              size={18}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded border border-slate-300 bg-white py-2.5 pl-3.5 pr-10 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors p-0.5"
              tabIndex={-1}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Lock size={18} />}
            </button>
          </div>

          {/* Sign In Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded bg-[#007bff] hover:bg-[#0069d9] active:bg-[#0062cc] px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Sign in</span>
                </>
              )}
            </button>
          </div>

          {/* Bottom Row: Forgot Password & Demo Data Button */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-sm font-normal text-[#007bff] hover:underline"
            >
              Forgot Password ?
            </button>

            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="inline-flex items-center gap-1.5 rounded bg-[#17a2b8] hover:bg-[#138496] active:bg-[#117a8b] px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-all duration-150"
            >
              <Sparkles size={14} className="text-amber-200" />
              <span>Demo data</span>
            </button>
          </div>
        </form>
      </div>

      {/* Footer Info */}
      

      {/* ========================================================================= */}
      {/* PRETTY DEMO DATA MODAL                                                    */}
      {/* ========================================================================= */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#f8f9fa] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17a2b8] text-white shadow-sm">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    SPMS Demo Accounts Directory
                  </h2>
                  <p className="text-xs text-slate-500">
                    Select any institutional actor to test their dedicated
                    workflow permissions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Search & Credential Notice */}
            <div className="border-b border-slate-100 bg-blue-50/60 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-blue-900 font-medium">
                <ShieldCheck size={16} className="text-blue-600" />
                <span>
                  All accounts standard password:{" "}
                  <code className="rounded bg-white px-2 py-0.5 font-mono font-bold text-blue-700 border border-blue-200">
                    Demo@1234
                  </code>
                </span>
              </div>

              {/* Quick Search Input */}
              <div className="relative min-w-[220px]">
                <input
                  type="text"
                  placeholder="Search role or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#007bff] focus:outline-none"
                />
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {/* Modal Body: Actors Grid */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {DEMO_ACTORS.map((group) => {
                const filteredActors = group.actors.filter(
                  (a) =>
                    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    a.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    a.email.toLowerCase().includes(searchQuery.toLowerCase()),
                );

                if (filteredActors.length === 0) return null;

                return (
                  <div key={group.category || group.name} className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      {group.icon && (
                        <group.icon size={15} className="text-[#17a2b8]" />
                      )}
                      <span>{group.category || group.name}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredActors.map((actor) => (
                        <div
                          key={actor.email}
                          className="group relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition-all hover:border-[#17a2b8] hover:shadow-md"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-sm ${actor.avatarBg}`}
                            >
                              {actor.initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-xs font-bold text-slate-800 truncate">
                                  {actor.name}
                                </h3>
                                <span
                                  className={`rounded-full px-2 py-0.2 text-[10px] font-semibold border ${actor.color}`}
                                >
                                  {actor.role}
                                </span>
                              </div>
                              <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                                {actor.email}
                              </p>
                              <p className="text-[11px] text-slate-600 leading-snug mt-1 line-clamp-2">
                                {actor.desc}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleSelectActor(actor.email)}
                              className="rounded px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            >
                              Fill Form
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDirectActorLogin(actor.email)
                              }
                              className="inline-flex items-center gap-1 rounded bg-[#007bff] hover:bg-[#0069d9] px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors"
                            >
                              <span>Sign in</span>
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 bg-[#f8f9fa] px-6 py-3 flex items-center justify-between text-xs text-slate-500">
              <span>10 institutional roles configured for ASTU SPMS</span>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="rounded bg-slate-200 hover:bg-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FORGOT PASSWORD MODAL                                                     */}
      {/* ========================================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                <HelpCircle size={20} className="text-[#007bff]" />
                <span>Password Recovery Assistance</span>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
              <p>
                In the official university environment, password resets are
                governed by the{" "}
                <strong>ICT Directorate &amp; System Administrator</strong>.
              </p>
              <div className="rounded-xl bg-blue-50 p-3.5 border border-blue-200 text-blue-900">
                <span className="font-bold block mb-1">
                  Standard Demonstration Credentials:
                </span>
                <p className="text-xs">
                  Password for all seeded accounts is:{" "}
                  <code className="rounded bg-white px-2 py-0.5 font-mono font-bold text-blue-700 border border-blue-300">
                    Demo@1234
                  </code>
                </p>
              </div>
              <p>
                You can use the <strong>"Demo data"</strong> button in the
                bottom right corner of the login card to immediately preview and
                log into any of the 10 authorized actor accounts.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full rounded-lg bg-[#007bff] hover:bg-[#0069d9] py-2 text-xs font-semibold text-white transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
