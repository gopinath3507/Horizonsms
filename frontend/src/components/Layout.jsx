import { useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { LOGO_URL, SCHOOL } from "@/constants/branding";
import {
    LayoutDashboard, Users, CalendarCheck2, BookOpenCheck, Receipt,
    UserCog, Wallet, LogOut, Menu, X, Sparkles
} from "lucide-react";

// Each link has its own glass accent color
const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard", color: "from-pink-500/70 to-fuchsia-500/70", dot: "bg-pink-300", glow: "shadow-pink-500/40" },
    { to: "/students", label: "Students", icon: Users, testid: "nav-students", color: "from-sky-500/70 to-cyan-500/70", dot: "bg-sky-300", glow: "shadow-sky-500/40" },
    { to: "/attendance", label: "Attendance", icon: CalendarCheck2, testid: "nav-attendance", color: "from-emerald-500/70 to-teal-500/70", dot: "bg-emerald-300", glow: "shadow-emerald-500/40" },
    { to: "/gradebook", label: "Gradebook", icon: BookOpenCheck, testid: "nav-gradebook", color: "from-amber-500/70 to-orange-500/70", dot: "bg-amber-300", glow: "shadow-amber-500/40" },
    { to: "/billing", label: "Billing", icon: Receipt, testid: "nav-billing", color: "from-rose-500/70 to-red-500/70", dot: "bg-rose-300", glow: "shadow-rose-500/40" },
    { to: "/staff", label: "Staff", icon: UserCog, adminOnly: true, testid: "nav-staff", color: "from-violet-500/70 to-purple-500/70", dot: "bg-violet-300", glow: "shadow-violet-500/40" },
    { to: "/payroll", label: "Payroll", icon: Wallet, adminOnly: true, testid: "nav-payroll", color: "from-lime-500/70 to-green-500/70", dot: "bg-lime-300", glow: "shadow-lime-500/40" },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const items = navItems.filter((i) => !i.adminOnly || user?.role === "admin");
    const handleLogout = () => { logout(); navigate("/login"); };

    return (
        <div className="min-h-screen flex bg-slate-50 font-body">
            {/* Sidebar with vibrant colorful background */}
            <aside
                className={`${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:sticky top-0 left-0 z-40 h-screen w-72 transition-transform duration-300 flex flex-col text-white overflow-hidden`}
                data-testid="sidebar"
            >
                {/* Vibrant gradient + colorful blobs base */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#3a2fa8] via-[#4A3FBF] to-[#7c3aed]" />
                <div className="absolute -top-20 -left-10 w-72 h-72 rounded-full bg-pink-500/40 blur-3xl" />
                <div className="absolute top-1/3 -right-16 w-72 h-72 rounded-full bg-cyan-400/30 blur-3xl" />
                <div className="absolute -bottom-20 -left-10 w-80 h-80 rounded-full bg-[#F39C2A]/40 blur-3xl" />
                <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full">
                    <div className="px-5 py-5 border-b border-white/15 flex items-center gap-3">
                        <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-1.5 ring-1 ring-white/30 shadow-lg">
                            <img src={LOGO_URL} alt="Horizon" className="w-10 h-10 object-contain" />
                        </div>
                        <div>
                            <div className="font-heading font-extrabold text-base leading-tight">Horizon</div>
                            <div className="text-xs text-white/80 leading-tight">Tech Play School</div>
                        </div>
                    </div>

                    <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                        {items.map((it) => (
                            <NavLink
                                key={it.to} to={it.to} onClick={() => setOpen(false)}
                                data-testid={it.testid}
                                className={({ isActive }) =>
                                    `group relative flex items-center gap-3 px-3.5 py-3 rounded-2xl font-semibold transition-all duration-300 overflow-hidden border ${
                                        isActive
                                            ? `backdrop-blur-xl border-white/40 shadow-xl ${it.glow} text-white`
                                            : "border-white/10 bg-white/[0.06] backdrop-blur-md text-white/85 hover:bg-white/15 hover:border-white/30 hover:text-white"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {/* Colorful glass tint */}
                                        <span className={`absolute inset-0 bg-gradient-to-r ${it.color} ${isActive ? "opacity-100" : "opacity-0"} group-hover:opacity-90 transition-opacity duration-300`} />
                                        <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full ${it.dot} shadow-[0_0_12px_currentColor] transition-all ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-80"}`} />
                                        <span className={`relative w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md border ${isActive ? "bg-white/30 border-white/50" : "bg-white/10 border-white/20 group-hover:bg-white/25"}`}>
                                            <it.icon className="w-4 h-4" />
                                        </span>
                                        <span className="relative tracking-tight drop-shadow">{it.label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* User card + logout (glass) */}
                    <div className="px-3 pb-3">
                        <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-3 mb-2 shadow-lg">
                            <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Signed in as</div>
                            <div className="text-white font-bold text-sm truncate" data-testid="sidebar-user-name">{user?.name}</div>
                            <div className="text-[10px] uppercase tracking-widest text-[#FFD580] font-bold mt-0.5">{user?.role}</div>
                        </div>
                        <button
                            onClick={handleLogout}
                            data-testid="logout-btn"
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#F39C2A] to-[#ff7849] hover:from-[#ff7849] hover:to-[#F39C2A] text-white font-bold transition-all shadow-lg shadow-orange-900/20 backdrop-blur"
                        >
                            <LogOut className="w-4 h-4" />Logout
                        </button>
                    </div>

                    {/* Designed by footer */}
                    <div className="relative px-4 py-3 border-t border-white/15 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/85 font-semibold tracking-wide">
                            <Sparkles className="w-3 h-3 text-[#FFD580]" />
                            <span>Designed by</span>
                            <span className="font-extrabold bg-gradient-to-r from-[#FFD580] via-pink-300 to-cyan-200 bg-clip-text text-transparent">Nextgen Gurukul</span>
                        </div>
                    </div>
                </div>
            </aside>

            {open && (
                <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
            )}

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200">
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3 gap-4">
                        <button onClick={() => setOpen(!open)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100" data-testid="mobile-menu-toggle">
                            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                        <div className="flex items-center gap-3 min-w-0">
                            <img src={LOGO_URL} alt="logo" className="w-11 h-11 object-contain shrink-0" />
                            <div className="min-w-0">
                                <div className="font-heading font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">{SCHOOL.name}</div>
                                <div className="text-xs text-slate-500 hidden sm:block">Bengaluru, Karnataka</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-sm font-semibold text-slate-900" data-testid="topbar-user">{user?.name}</span>
                                <span className="text-xs uppercase tracking-wider text-[#F39C2A] font-bold">{user?.role}</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4A3FBF] to-[#F39C2A] text-white flex items-center justify-center font-bold">
                                {user?.name?.[0]?.toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in-up">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
