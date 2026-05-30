import { useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { LOGO_URL, SCHOOL } from "@/constants/branding";
import {
    LayoutDashboard, Users, CalendarCheck2, BookOpenCheck, Receipt,
    UserCog, Wallet, LogOut, Menu, X, Sparkles, Heart, BookOpen
} from "lucide-react";

// Each link uses a single PLAIN color for its active background
const navItems = [
    { to: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard, testid: "nav-dashboard",  bg: "bg-indigo-500"  },
    { to: "/students",   label: "Students",   icon: Users,           testid: "nav-students",   bg: "bg-sky-500"     },
    { to: "/attendance", label: "Attendance", icon: CalendarCheck2,  testid: "nav-attendance", bg: "bg-emerald-500" },
    { to: "/gradebook",  label: "Gradebook",  icon: BookOpenCheck,   testid: "nav-gradebook",  bg: "bg-amber-500"   },
    { to: "/homework",   label: "Homework",   icon: BookOpen,        testid: "nav-homework",   bg: "bg-orange-500"  },
    { to: "/billing",    label: "Billing",    icon: Receipt,         testid: "nav-billing",    bg: "bg-rose-500"    },
    { to: "/staff",      label: "Staff",      icon: UserCog,         testid: "nav-staff",      bg: "bg-violet-500", adminOnly: true },
    { to: "/parents",    label: "Parents",    icon: Heart,           testid: "nav-parents",    bg: "bg-pink-500",   adminOnly: true },
    { to: "/payroll",    label: "Payroll",    icon: Wallet,          testid: "nav-payroll",    bg: "bg-teal-500",   adminOnly: true },
];

const parentNavItems = [
    { to: "/parent", label: "My Child", icon: Heart, testid: "nav-parent", bg: "bg-pink-500" },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const items = user?.role === "parent"
        ? parentNavItems
        : navItems.filter((i) => !i.adminOnly || user?.role === "admin");
    const handleLogout = () => { logout(); navigate("/login"); };

    return (
        <div className="min-h-screen flex bg-slate-50 font-body">
            {/* Sidebar - plain solid dark background */}
            <aside
                className={`${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-[#1E1B4B] text-white transition-transform duration-300 flex flex-col`}
                data-testid="sidebar"
            >
                {/* Header */}
                <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
                    <div className="bg-white rounded-2xl p-1.5 shadow-md">
                        <img src={LOGO_URL} alt="Horizon" className="w-10 h-10 object-contain" />
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-300">Branch</div>
                        <div className="font-heading font-bold text-base leading-tight tracking-wide">TIRUMALAPURA</div>
                    </div>
                </div>

                {/* Links */}
                <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                    {items.map((it) => (
                        <NavLink
                            key={it.to} to={it.to} onClick={() => setOpen(false)}
                            data-testid={it.testid}
                            className={({ isActive }) =>
                                `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                                    isActive
                                        ? `${it.bg} text-white shadow-md`
                                        : "text-white/75 hover:bg-white/10 hover:text-white"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? "bg-white/20" : "bg-white/[0.07] group-hover:bg-white/15"}`}>
                                        <it.icon className="w-4 h-4" />
                                    </span>
                                    <span className="tracking-tight">{it.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User card + logout */}
                <div className="px-3 pb-3">
                    <div className="rounded-xl bg-white/[0.07] border border-white/10 p-3 mb-2">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/55 font-bold">Signed in as</div>
                        <div className="text-white font-bold text-sm truncate" data-testid="sidebar-user-name">{user?.name}</div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-amber-300 font-bold mt-0.5">{user?.role}</div>
                    </div>
                    <button
                        onClick={handleLogout}
                        data-testid="logout-btn"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors shadow-sm"
                    >
                        <LogOut className="w-4 h-4" />Logout
                    </button>
                </div>

                {/* Designed by */}
                <div className="px-4 py-3 border-t border-white/10 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/75 font-semibold tracking-wide">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Designed by</span>
                        <span className="font-bold text-amber-300">Nextgen Gurukul</span>
                    </div>
                </div>
            </aside>

            {open && (
                <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
            )}

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-slate-200">
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3 gap-4">
                        <button onClick={() => setOpen(!open)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100" data-testid="mobile-menu-toggle">
                            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                        <div className="flex items-center gap-3 min-w-0">
                            <img src={LOGO_URL} alt="Horizon" className="w-12 h-12 object-contain shrink-0" />
                            <div className="min-w-0">
                                <div className="font-heading font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">{SCHOOL.name}</div>
                                <div className="text-xs text-slate-500 hidden sm:block">Thirumalapura, Bangalore, Karnataka</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-sm font-semibold text-slate-900" data-testid="topbar-user">{user?.name}</span>
                                <span className="text-[10px] uppercase tracking-[0.18em] text-amber-600 font-bold">{user?.role}</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">
                                {user?.name?.[0]?.toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-4 sm:pb-6 lg:pb-8 animate-fade-in-up">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
