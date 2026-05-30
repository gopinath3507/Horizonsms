import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { LOGO_URL, SCHOOL } from "@/constants/branding";
import { Loader2, GraduationCap, MapPin, Phone, Mail, Briefcase, Heart } from "lucide-react";

export default function LoginPage() {
    const { login, error, user, setError } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState("staff"); // "staff" | "parent"
    const [loginVal, setLoginVal] = useState("admin@horizonschool.com");
    const [password, setPassword] = useState("Admin@123");
    const [loading, setLoading] = useState(false);

    if (user && user !== false) {
        const target = user.role === "parent" ? "/parent" : "/dashboard";
        navigate(target, { replace: true });
    }

    const switchTab = (t) => {
        setTab(t);
        setError("");
        if (t === "parent") { setLoginVal(""); setPassword(""); }
        else { setLoginVal("admin@horizonschool.com"); setPassword("Admin@123"); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const ok = await login(loginVal, password);
        setLoading(false);
        if (ok) {
            // Determine landing based on session user
            const stored = JSON.parse(localStorage.getItem("hitps_last_role") || "null");
            navigate(stored === "parent" ? "/parent" : "/dashboard", { replace: true });
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-8 font-body">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-white to-orange-100" />
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#4A3FBF]/20 blur-3xl" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-[#F39C2A]/25 blur-3xl" />
            <div className="absolute inset-0 hero-grid-bg opacity-40" />

            <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
                <div className="text-center lg:text-left space-y-6 px-4">
                    <div className="inline-block">
                        <img src={LOGO_URL} alt="Horizon Logo" className="w-56 sm:w-64 lg:w-72 object-contain drop-shadow-2xl" data-testid="login-logo" />
                    </div>
                    <div>
                        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                            Welcome to <span className="text-[#4A3FBF]">Horizon</span>
                        </h1>
                        <p className="font-heading text-2xl sm:text-3xl font-bold text-[#F39C2A] mt-1">Tech Play School</p>
                        <p className="mt-4 text-slate-600 max-w-md mx-auto lg:mx-0">
                            A nurturing space where curious little minds blossom. Day-Care · Pre-Nursery · Nursery · LKG · UKG.
                        </p>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-start gap-2 justify-center lg:justify-start"><MapPin className="w-4 h-4 text-[#4A3FBF] mt-0.5 shrink-0" /><span>{SCHOOL.address}</span></div>
                        <div className="flex items-center gap-2 justify-center lg:justify-start"><Phone className="w-4 h-4 text-[#4A3FBF]" /><span>{SCHOOL.phone}</span></div>
                        <div className="flex items-center gap-2 justify-center lg:justify-start"><Mail className="w-4 h-4 text-[#4A3FBF]" /><span>{SCHOOL.email}</span></div>
                    </div>
                </div>

                <div className="glass-card rounded-3xl shadow-2xl border border-white/60 p-8 sm:p-10">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#4A3FBF] flex items-center justify-center">
                            <GraduationCap className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="font-heading text-2xl font-bold text-slate-900">Sign in</h2>
                            <p className="text-sm text-slate-500">Choose how you log in</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl mb-5">
                        <button type="button" onClick={() => switchTab("staff")} data-testid="tab-staff"
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === "staff" ? "bg-white text-[#4A3FBF] shadow" : "text-slate-500 hover:text-slate-700"}`}>
                            <Briefcase className="w-4 h-4" />Admin / Staff
                        </button>
                        <button type="button" onClick={() => switchTab("parent")} data-testid="tab-parent"
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === "parent" ? "bg-white text-[#F39C2A] shadow" : "text-slate-500 hover:text-slate-700"}`}>
                            <Heart className="w-4 h-4" />Parent
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                                {tab === "staff" ? "Email" : "Mobile Number"}
                            </label>
                            <input
                                type={tab === "staff" ? "email" : "tel"} required value={loginVal} onChange={(e) => setLoginVal(e.target.value)}
                                data-testid="login-email-input"
                                className="w-full bg-slate-50 border border-slate-200 focus:border-[#4A3FBF] focus:ring-2 focus:ring-[#4A3FBF]/20 rounded-xl px-4 py-3 outline-none transition-all"
                                placeholder={tab === "staff" ? "you@example.com" : "+91 9XXXXXXXXX"}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Password</label>
                            <input
                                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                data-testid="login-password-input"
                                className="w-full bg-slate-50 border border-slate-200 focus:border-[#4A3FBF] focus:ring-2 focus:ring-[#4A3FBF]/20 rounded-xl px-4 py-3 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm" data-testid="login-error">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit" disabled={loading}
                            data-testid="login-submit-btn"
                            className={`w-full text-white font-semibold rounded-xl px-6 py-3.5 transition-all shadow-lg hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2 ${tab === "staff" ? "bg-[#4A3FBF] hover:bg-[#3a3199]" : "bg-[#F39C2A] hover:bg-[#d9871e]"}`}
                        >
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : `Sign In as ${tab === "staff" ? "Admin / Staff" : "Parent"}`}
                        </button>

                        {tab === "staff" ? (
                            <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 mt-4">
                                <div className="font-semibold text-slate-700 mb-1">Default Admin (for first run)</div>
                                <div>Email: <span className="font-mono">admin@horizonschool.com</span></div>
                                <div>Password: <span className="font-mono">Admin@123</span></div>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-500 bg-orange-50 border border-orange-100 rounded-xl p-3 mt-4">
                                <div className="font-semibold text-orange-700 mb-1">Parent Access</div>
                                <div>Use the mobile number & password provided by the school admin. Each parent account is linked to their child only.</div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
