import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR, SCHOOL } from "@/constants/branding";
import { Users, CalendarCheck2, IndianRupee, UserCog, TrendingUp, AlertCircle, BookOpen, Clock, ArrowUpRight, Wallet, GraduationCap } from "lucide-react";
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, Area, AreaChart } from "recharts";
import { useAuth } from "@/lib/auth";

// Minimal modern metric cards — light, single subtle accent each
const METRICS = [
    { key: "total_active_students", label: "Active Students", icon: Users, accent: "indigo" },
    { key: "today_attendance_pct", label: "Today's Attendance", icon: CalendarCheck2, accent: "emerald", suffix: "%" },
    { key: "total_fees_billed", label: "Total Fees", icon: IndianRupee, accent: "violet", currency: true },
    { key: "total_fees_collected", label: "Paid", icon: Wallet, accent: "teal", currency: true },
    { key: "total_fees_pending", label: "Balance", icon: IndianRupee, accent: "amber", currency: true },
    { key: "total_staff", label: "Total Staff", icon: UserCog, accent: "slate" },
];

const ACCENT_MAP = {
    indigo:  { iconBg: "bg-indigo-50",  iconText: "text-indigo-600",  ring: "ring-indigo-100" },
    emerald: { iconBg: "bg-emerald-50", iconText: "text-emerald-600", ring: "ring-emerald-100" },
    violet:  { iconBg: "bg-violet-50",  iconText: "text-violet-600",  ring: "ring-violet-100" },
    teal:    { iconBg: "bg-teal-50",    iconText: "text-teal-600",    ring: "ring-teal-100" },
    amber:   { iconBg: "bg-amber-50",   iconText: "text-amber-600",   ring: "ring-amber-100" },
    slate:   { iconBg: "bg-slate-100",  iconText: "text-slate-600",   ring: "ring-slate-100" },
};

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
            {/* Welcome banner — clean, single soft accent */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Welcome back</p>
                        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Namaste, {user?.name?.split(" ")[0]}</h1>
                        <p className="mt-1.5 text-sm text-slate-500 max-w-xl">Here's how <span className="font-semibold text-slate-700">{SCHOOL.short}</span> is doing today.</p>
                    </div>

                    {/* Compact LIVE IST clock */}
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3" data-testid="live-ist-clock">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-slate-500">
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

            {/* Metric cards — minimal, modern, white */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {METRICS.map((m) => {
                    const val = stats?.[m.key] ?? 0;
                    const a = ACCENT_MAP[m.accent];
                    return (
                        <div key={m.key} className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all p-5" data-testid={`metric-${m.key}`}>
                            <div className="flex items-start justify-between">
                                <div className={`w-10 h-10 rounded-xl ${a.iconBg} ${a.iconText} flex items-center justify-center ring-4 ${a.ring}`}>
                                    <m.icon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{m.label}</div>
                                <div className="font-heading text-2xl xl:text-[1.6rem] font-bold text-slate-900 mt-1 leading-tight">
                                    {m.currency ? formatINR(val) : `${val}${m.suffix || ""}`}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center ring-4 ring-indigo-50/60">
                                <TrendingUp className="w-4.5 h-4.5" />
                            </div>
                            <div>
                                <h3 className="font-heading text-base font-semibold text-slate-900">Attendance Trend</h3>
                                <p className="text-xs text-slate-500">Last 7 days · daily present rate</p>
                            </div>
                        </div>
                        <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">LIVE</span>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={stats?.attendance_trend || []} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="attGradMin" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} domain={[0, 100]} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                            <Area type="monotone" dataKey="rate" stroke="#6366F1" strokeWidth={2.5} fill="url(#attGradMin)" dot={{ r: 3, fill: "#6366F1" }} activeDot={{ r: 5 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center ring-4 ring-violet-50/60">
                            <GraduationCap className="w-4.5 h-4.5" />
                        </div>
                        <div>
                            <h3 className="font-heading text-base font-semibold text-slate-900">Students by Class</h3>
                            <p className="text-xs text-slate-500">Active enrollment</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={stats?.students_by_class || []} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                            <XAxis dataKey="class_name" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} allowDecimals={false} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} cursor={{ fill: "#F8FAFC" }} />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={42}>
                                {(stats?.students_by_class || []).map((_, i) => (
                                    <Cell key={i} fill={CLASS_COLORS[i % CLASS_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Quick stats — minimal, monochrome with single accent each */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                    {
                        accent: "emerald", label: "Today Present",
                        value: stats?.today_present ?? 0, sub: `of ${stats?.today_total ?? 0} marked`, icon: CalendarCheck2,
                    },
                    {
                        accent: "indigo", label: "Collection Rate",
                        value: `${collectionRate}%`,
                        sub: `${formatINR(stats?.total_fees_collected)} of ${formatINR(stats?.total_fees_billed)}`, icon: Wallet,
                    },
                    {
                        accent: "violet", label: "Programs Offered",
                        value: "5 Classes", sub: "Day-Care · Pre-Nursery · Nursery · LKG · UKG", icon: BookOpen,
                    },
                ].map((q, i) => {
                    const a = ACCENT_MAP[q.accent];
                    return (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{q.label}</div>
                                    <div className="font-heading text-2xl font-bold text-slate-900 mt-1 truncate">{q.value}</div>
                                    <div className="text-xs text-slate-500 mt-1">{q.sub}</div>
                                </div>
                                <div className={`w-10 h-10 shrink-0 rounded-xl ${a.iconBg} ${a.iconText} flex items-center justify-center ring-4 ${a.ring}`}>
                                    <q.icon className="w-5 h-5" />
                                </div>
                            </div>
                            {q.accent === "indigo" && (
                                <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${collectionRate}%` }} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
