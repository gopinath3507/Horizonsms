import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR, LOGO_URL, SCHOOL } from "@/constants/branding";
import { Users, CalendarCheck2, IndianRupee, UserCog, TrendingUp, AlertCircle, Sparkles, GraduationCap, BookOpen } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, Area, AreaChart } from "recharts";
import { useAuth } from "@/lib/auth";

// Each metric gets a unique vibrant glass color
const METRICS = [
    {
        key: "total_active_students", label: "Active Students", icon: Users,
        bg: "from-pink-500/80 via-fuchsia-500/70 to-rose-500/80",
        blob: "bg-pink-300",
        iconBg: "bg-white/25",
    },
    {
        key: "today_attendance_pct", label: "Today's Attendance", icon: CalendarCheck2,
        bg: "from-emerald-500/85 via-teal-500/75 to-green-500/85",
        blob: "bg-emerald-300",
        iconBg: "bg-white/25",
        suffix: "%",
    },
    {
        key: "total_fees_collected", label: "Fees Collected", icon: IndianRupee,
        bg: "from-orange-500/85 via-amber-500/80 to-yellow-500/80",
        blob: "bg-orange-300",
        iconBg: "bg-white/25",
        currency: true,
    },
    {
        key: "total_staff", label: "Total Staff", icon: UserCog,
        bg: "from-indigo-500/85 via-violet-500/80 to-purple-600/85",
        blob: "bg-indigo-300",
        iconBg: "bg-white/25",
    },
];

const CLASS_COLORS = ["#4A3FBF", "#F39C2A", "#10B981", "#0EA5E9", "#EC4899"];

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [err, setErr] = useState("");

    useEffect(() => {
        api.get("/dashboard/stats")
            .then(({ data }) => setStats(data))
            .catch((e) => setErr(e?.response?.data?.detail || "Failed to load stats"));
    }, []);

    return (
        <div className="space-y-6 sm:space-y-8 relative" data-testid="dashboard-page">
            {/* Page-level colored backdrop blobs */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-20 right-1/4 w-[40vw] h-[40vw] rounded-full bg-violet-200/40 blur-3xl" />
                <div className="absolute top-1/2 -left-32 w-[35vw] h-[35vw] rounded-full bg-orange-200/40 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-[30vw] h-[30vw] rounded-full bg-emerald-200/30 blur-3xl" />
            </div>

            {/* Welcome Banner - vibrant multi-color */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 shadow-2xl text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-[#4A3FBF] via-[#7c3aed] to-[#F39C2A]" />
                <div className="absolute -top-20 -left-10 w-80 h-80 rounded-full bg-pink-400/40 blur-3xl" />
                <div className="absolute -bottom-10 right-1/4 w-72 h-72 rounded-full bg-cyan-300/30 blur-3xl" />
                <div className="absolute inset-0 hero-grid-bg opacity-25" />
                <div className="absolute right-6 top-6 hidden sm:block bg-white/20 backdrop-blur-2xl rounded-3xl p-4 ring-1 ring-white/30 shadow-2xl">
                    <img src={LOGO_URL} alt="logo" className="w-20 h-20 object-contain" />
                </div>
                <div className="relative max-w-2xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold uppercase tracking-widest">
                        <Sparkles className="w-3 h-3" /> Welcome back
                    </div>
                    <h1 className="font-heading text-3xl sm:text-5xl font-extrabold mt-3 leading-tight">Namaste, {user?.name?.split(" ")[0]} <span className="inline-block animate-pulse">👋</span></h1>
                    <p className="mt-3 text-white/90 text-base sm:text-lg max-w-xl">Here's how <span className="font-bold">{SCHOOL.short}</span> is doing today — every child is learning, growing and shining.</p>
                </div>
            </div>

            {err && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />{err}
                </div>
            )}

            {/* Colourful glass metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {METRICS.map((m) => {
                    const val = stats?.[m.key] ?? 0;
                    return (
                        <div key={m.key} className="relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 duration-300 group h-40" data-testid={`metric-${m.key}`}>
                            {/* Gradient base */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${m.bg}`} />
                            {/* Decorative blobs */}
                            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full ${m.blob} opacity-40 blur-2xl group-hover:scale-125 transition-transform duration-500`} />
                            <div className={`absolute -left-10 -bottom-10 w-28 h-28 rounded-full ${m.blob} opacity-25 blur-2xl`} />
                            {/* Glass overlay */}
                            <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />
                            {/* Glass border highlight */}
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/30 rounded-3xl" />

                            <div className="relative h-full p-5 flex flex-col justify-between text-white">
                                <div className={`w-12 h-12 rounded-2xl ${m.iconBg} backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center shadow-lg`}>
                                    <m.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-widest text-white/85">{m.label}</div>
                                    <div className="font-heading text-3xl sm:text-4xl font-extrabold mt-1 drop-shadow">
                                        {m.currency ? formatINR(val) : `${val}${m.suffix || ""}`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts row - glass cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative overflow-hidden rounded-3xl p-6 shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-100/90 via-white to-indigo-100/90" />
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-sky-300/30 blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-300/30 blur-3xl" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/50 rounded-3xl" />
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-heading text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-md"><TrendingUp className="w-5 h-5 text-white" /></span>
                                Attendance Trend (7 days)
                            </h3>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">LIVE</span>
                        </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={stats?.attendance_trend || []}>
                                <defs>
                                    <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#4A3FBF" stopOpacity={0.6} />
                                        <stop offset="100%" stopColor="#4A3FBF" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} />
                                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} domain={[0, 100]} />
                                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0" }} />
                                <Area type="monotone" dataKey="rate" stroke="#4A3FBF" strokeWidth={3} fill="url(#attGrad)" />
                                <Line type="monotone" dataKey="rate" stroke="#F39C2A" strokeWidth={0} dot={{ r: 5, fill: "#F39C2A", stroke: "#fff", strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl p-6 shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-100/90 via-white to-pink-100/90" />
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-orange-300/30 blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-pink-300/30 blur-3xl" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/50 rounded-3xl" />
                    <div className="relative">
                        <h3 className="font-heading text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-md"><GraduationCap className="w-5 h-5 text-white" /></span>
                            By Class
                        </h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={stats?.students_by_class || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis dataKey="class_name" tick={{ fontSize: 10, fill: "#64748B" }} />
                                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0" }} />
                                <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                                    {(stats?.students_by_class || []).map((_, i) => (
                                        <Cell key={i} fill={CLASS_COLORS[i % CLASS_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Quick stats row - colorful glass */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                    {
                        bg: "from-emerald-400 to-teal-500", blob: "bg-emerald-200",
                        label: "Today Present", value: stats?.today_present ?? 0,
                        sub: `of ${stats?.today_total ?? 0} records`, icon: CalendarCheck2,
                    },
                    {
                        bg: "from-rose-400 to-orange-500", blob: "bg-rose-200",
                        label: "Fees Pending", value: formatINR(stats?.total_fees_pending), sub: "Across all invoices", icon: IndianRupee,
                    },
                    {
                        bg: "from-violet-500 to-fuchsia-500", blob: "bg-violet-200",
                        label: "Programs Offered", value: "5 Classes", sub: "Day-Care • Pre-Nursery • Nursery • LKG • UKG", icon: BookOpen,
                    },
                ].map((q, i) => (
                    <div key={i} className="relative overflow-hidden rounded-3xl p-6 shadow-xl group hover:-translate-y-1 transition-all duration-300 text-white">
                        <div className={`absolute inset-0 bg-gradient-to-br ${q.bg}`} />
                        <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full ${q.blob} opacity-40 blur-2xl group-hover:scale-125 transition-transform`} />
                        <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/30 rounded-3xl" />
                        <div className="relative flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-xs uppercase tracking-widest font-bold text-white/90">{q.label}</div>
                                <div className="font-heading text-2xl sm:text-3xl font-extrabold mt-1 drop-shadow truncate">{q.value}</div>
                                <div className="text-xs text-white/85 mt-1">{q.sub}</div>
                            </div>
                            <div className="w-11 h-11 shrink-0 rounded-2xl bg-white/25 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center"><q.icon className="w-5 h-5" /></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
