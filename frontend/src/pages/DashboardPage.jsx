import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR, SCHOOL } from "@/constants/branding";
import { Users, CalendarCheck2, IndianRupee, UserCog, TrendingUp, AlertCircle, BookOpen, Clock, Wallet, GraduationCap } from "lucide-react";
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, Area, AreaChart } from "recharts";
import { useAuth } from "@/lib/auth";

// 6 distinct plain pastel panels — each card uses ONE soft color
const METRICS = [
    { key: "total_active_students", label: "Active Students", icon: Users,        bg: "bg-indigo-100",  text: "text-indigo-700",  ring: "ring-indigo-200/70" },
    { key: "today_attendance_pct",  label: "Today's Attendance", icon: CalendarCheck2, bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200/70", suffix: "%" },
    { key: "total_fees_billed",     label: "Total Fees", icon: IndianRupee,        bg: "bg-violet-100",  text: "text-violet-700",  ring: "ring-violet-200/70",  currency: true },
    { key: "total_fees_collected",  label: "Paid", icon: Wallet,                   bg: "bg-teal-100",    text: "text-teal-700",    ring: "ring-teal-200/70",    currency: true },
    { key: "total_fees_pending",    label: "Balance", icon: IndianRupee,           bg: "bg-amber-100",   text: "text-amber-700",   ring: "ring-amber-200/70",   currency: true },
    { key: "total_staff",           label: "Total Staff", icon: UserCog,           bg: "bg-rose-100",    text: "text-rose-700",    ring: "ring-rose-200/70" },
];

const CLASS_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#0EA5E9", "#8B5CF6"];

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [err, setErr] = useState("");
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        api.get("/dashboard/stats")
            .then(({ data }) => setStats(data))
            .catch((e) => setErr(e?.response?.data?.detail || "Failed to load stats"));
    }, []);

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const istDate = new Intl.DateTimeFormat("en-IN", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata",
    }).format(now);
    const istTime = new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
    }).format(now);

    const collectionRate = stats?.total_fees_billed
        ? Math.round((stats.total_fees_collected / stats.total_fees_billed) * 100)
        : 0;

    return (
        <div className="space-y-6" data-testid="dashboard-page">
            {/* Welcome banner — light plain indigo tint */}
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6 sm:p-8" data-testid="welcome-banner">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Welcome back</p>
                        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 mt-2 leading-tight">Namaste, {user?.name?.split(" ")[0]}</h1>
                        <p className="mt-2 text-sm text-slate-600 max-w-xl">Here's how <span className="font-semibold text-slate-800">{SCHOOL.short}</span> is doing today.</p>
                    </div>

                    {/* Live IST clock - light card */}
                    <div className="flex items-center gap-3 bg-white border border-indigo-100 rounded-2xl px-5 py-3 shadow-sm" data-testid="live-ist-clock">
                        <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-indigo-700" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-bold text-slate-500">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                </span>
                                Live · IST
                            </div>
                            <div className="font-heading text-xl font-bold tabular-nums text-slate-900" data-testid="live-ist-time">{istTime}</div>
                            <div className="text-[11px] text-slate-500" data-testid="live-ist-date">{istDate}</div>
                        </div>
                    </div>
                </div>
            </div>

            {err && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4" />{err}
                </div>
            )}

            {/* 6 plain-color metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {METRICS.map((m) => {
                    const val = stats?.[m.key] ?? 0;
                    return (
                        <div key={m.key} className={`${m.bg} rounded-2xl border border-white/40 ring-1 ${m.ring} p-5 hover:-translate-y-0.5 transition-transform duration-200`} data-testid={`metric-${m.key}`}>
                            <div className={`w-10 h-10 rounded-xl bg-white/70 ${m.text} flex items-center justify-center shadow-sm`}>
                                <m.icon className="w-5 h-5" />
                            </div>
                            <div className="mt-4">
                                <div className={`text-[11px] font-bold uppercase tracking-[0.14em] ${m.text} opacity-90`}>{m.label}</div>
                                <div className="font-heading text-2xl xl:text-[1.65rem] font-bold text-slate-900 mt-1 leading-tight">
                                    {m.currency ? formatINR(val) : `${val}${m.suffix || ""}`}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts row — modern UI panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 pt-6 pb-3 flex items-center justify-between border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-heading text-base font-bold text-slate-900">Attendance Trend</h3>
                                <p className="text-xs text-slate-500">Last 7 days · daily present rate</p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            LIVE
                        </span>
                    </div>
                    <div className="p-3 sm:p-5">
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={stats?.attendance_trend || []} margin={{ top: 5, right: 12, left: -8, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="attG" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.32} />
                                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="2 4" stroke="#E2E8F0" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} domain={[0, 100]} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12, padding: "8px 10px", boxShadow: "0 8px 20px rgba(0,0,0,0.06)" }}
                                    labelStyle={{ fontWeight: 700, color: "#0F172A" }}
                                />
                                <Area type="monotone" dataKey="rate" stroke="#6366F1" strokeWidth={2.5} fill="url(#attG)" dot={{ r: 4, fill: "#fff", stroke: "#6366F1", strokeWidth: 2 }} activeDot={{ r: 6, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 pt-6 pb-3 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-heading text-base font-bold text-slate-900">Students by Class</h3>
                            <p className="text-xs text-slate-500">Active enrollment</p>
                        </div>
                    </div>
                    <div className="p-3 sm:p-5">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={stats?.students_by_class || []} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="2 4" stroke="#E2E8F0" vertical={false} />
                                <XAxis dataKey="class_name" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} allowDecimals={false} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: "#F8FAFC" }}
                                    contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12, padding: "8px 10px", boxShadow: "0 8px 20px rgba(0,0,0,0.06)" }}
                                    labelStyle={{ fontWeight: 700, color: "#0F172A" }} />
                                <Bar dataKey="count" radius={[10, 10, 0, 0]} maxBarSize={42}>
                                    {(stats?.students_by_class || []).map((_, i) => (
                                        <Cell key={i} fill={CLASS_COLORS[i % CLASS_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 3 plain-color quick stat panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Emerald */}
                <div className="bg-emerald-100 rounded-2xl border border-white/40 ring-1 ring-emerald-200/70 p-5" data-testid="qs-today-present">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">Today Present</div>
                            <div className="font-heading text-3xl font-bold text-slate-900 mt-1">{stats?.today_present ?? 0}</div>
                            <div className="text-xs text-emerald-700/80 mt-1">of {stats?.today_total ?? 0} marked</div>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-white/70 text-emerald-700 flex items-center justify-center shadow-sm">
                            <CalendarCheck2 className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                {/* Sky */}
                <div className="bg-sky-100 rounded-2xl border border-white/40 ring-1 ring-sky-200/70 p-5" data-testid="qs-collection-rate">
                    <div className="flex items-start justify-between">
                        <div className="min-w-0">
                            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-700">Collection Rate</div>
                            <div className="font-heading text-3xl font-bold text-slate-900 mt-1">{collectionRate}%</div>
                            <div className="text-xs text-sky-700/80 mt-1 truncate">{formatINR(stats?.total_fees_collected)} of {formatINR(stats?.total_fees_billed)}</div>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-white/70 text-sky-700 flex items-center justify-center shadow-sm">
                            <Wallet className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 h-1.5 bg-white/70 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${collectionRate}%` }} />
                    </div>
                </div>
                {/* Violet */}
                <div className="bg-violet-100 rounded-2xl border border-white/40 ring-1 ring-violet-200/70 p-5" data-testid="qs-programs">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-700">Programs Offered</div>
                            <div className="font-heading text-3xl font-bold text-slate-900 mt-1">5 Classes</div>
                            <div className="text-xs text-violet-700/80 mt-1">Day-Care · Pre-Nursery · Nursery · LKG · UKG</div>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-white/70 text-violet-700 flex items-center justify-center shadow-sm">
                            <BookOpen className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
