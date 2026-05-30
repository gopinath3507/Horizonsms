import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { formatINR, SCHOOL } from "@/constants/branding";
import { useAuth } from "@/lib/auth";
import { CalendarCheck2, Check, X as XIcon, Clock, Wallet, BookOpen, IndianRupee, AlertCircle, Receipt, Sparkles } from "lucide-react";
import { Toaster, toast } from "sonner";

const STATUS_BADGE = {
    present: { label: "Present", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Check },
    absent: { label: "Absent", color: "bg-rose-100 text-rose-700 border-rose-200", icon: XIcon },
    late: { label: "Late", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
};

export default function ParentDashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [err, setErr] = useState("");
    const [tab, setTab] = useState("attendance");

    useEffect(() => {
        api.get("/parent/me/summary")
            .then(({ data }) => setData(data))
            .catch((e) => { setErr(formatApiError(e)); toast.error(formatApiError(e)); });
    }, []);

    if (err) return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-6 rounded-2xl flex items-center gap-3 max-w-xl">
            <AlertCircle className="w-5 h-5" /><div><div className="font-bold">Unable to load child information</div><div className="text-sm">{err}</div></div>
        </div>
    );
    if (!data) return <div className="text-slate-500">Loading your child's portal…</div>;

    const { student, attendance, attendance_stats, billing, homework } = data;

    return (
        <div className="space-y-6" data-testid="parent-dashboard">
            <Toaster position="top-right" richColors />

            {/* Greeting banner */}
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Parent Portal</p>
                <h1 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 mt-2 leading-tight">Namaste, {user?.name?.split(" ")[0]}</h1>
                <p className="mt-2 text-sm text-slate-600">Follow {student.name}'s daily routine at {SCHOOL.short}.</p>
            </div>

            {/* Child profile card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-heading text-2xl font-bold">
                    {student.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-heading text-2xl font-bold text-slate-900" data-testid="child-name">{student.name}</div>
                    <div className="text-sm text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span><span className="font-semibold text-slate-700">Class:</span> {student.class_name}</span>
                        {student.dob && <span><span className="font-semibold text-slate-700">DOB:</span> {student.dob}</span>}
                        {student.gender && <span><span className="font-semibold text-slate-700">Gender:</span> {student.gender}</span>}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Enrollment</div>
                    <div className="font-bold text-slate-900">{student.enrollment_date || "—"}</div>
                    <div className="text-xs text-emerald-600 font-bold uppercase">{student.status}</div>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard accent="emerald" label="Attendance" value={`${attendance_stats.present_pct}%`} sub={`${attendance_stats.present} present / ${attendance_stats.total} days`} icon={CalendarCheck2} />
                <StatCard accent="violet" label="Total Fees" value={formatINR(billing.total_billed)} sub={`Across ${billing.invoices.length} invoice(s)`} icon={IndianRupee} />
                <StatCard accent="teal" label="Paid" value={formatINR(billing.total_paid)} sub="Settled by parents" icon={Wallet} />
                <StatCard accent="amber" label="Balance" value={formatINR(billing.balance)} sub={billing.balance > 0 ? "Pending payment" : "All clear"} icon={IndianRupee} />
            </div>

            {/* Tabs */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 px-3 flex">
                    {[
                        { id: "attendance", label: "Attendance", icon: CalendarCheck2 },
                        { id: "fees", label: "Fees & Invoices", icon: Receipt },
                        { id: "homework", label: "Homework & Activities", icon: BookOpen },
                    ].map((t) => (
                        <button key={t.id} onClick={() => setTab(t.id)} data-testid={`parent-tab-${t.id}`}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors relative ${tab === t.id ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}>
                            <t.icon className="w-4 h-4" />
                            <span>{t.label}</span>
                            {tab === t.id && <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-indigo-500 rounded-full" />}
                        </button>
                    ))}
                </div>

                <div className="p-5 sm:p-6">
                    {tab === "attendance" && (
                        <div data-testid="parent-attendance-panel">
                            <div className="flex flex-wrap gap-3 mb-4">
                                {Object.entries(STATUS_BADGE).map(([k, v]) => (
                                    <div key={k} className={`px-3 py-1.5 rounded-full border ${v.color} text-xs font-bold flex items-center gap-1.5`}>
                                        <v.icon className="w-3.5 h-3.5" /> {v.label}: {attendance_stats[k]}
                                    </div>
                                ))}
                            </div>
                            {attendance.length === 0 ? (
                                <div className="py-10 text-center text-slate-500">No attendance recorded yet for your child.</div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-700">
                                            <tr><th className="text-left py-2.5 px-4 font-bold">Date</th><th className="text-left py-2.5 px-4 font-bold">Status</th><th className="text-left py-2.5 px-4 font-bold">Note</th></tr>
                                        </thead>
                                        <tbody>
                                            {attendance.map((a) => {
                                                const b = STATUS_BADGE[a.status] || STATUS_BADGE.present;
                                                return (
                                                    <tr key={a.id} className="border-t border-slate-100">
                                                        <td className="py-2.5 px-4 font-mono text-slate-700">{a.date}</td>
                                                        <td className="py-2.5 px-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${b.color}`}><b.icon className="w-3.5 h-3.5" />{b.label}</span></td>
                                                        <td className="py-2.5 px-4 text-slate-500">{a.note || "—"}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === "fees" && (
                        <div data-testid="parent-fees-panel">
                            {billing.invoices.length === 0 ? (
                                <div className="py-10 text-center text-slate-500">No invoices issued yet.</div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-700">
                                            <tr>
                                                <th className="text-left py-2.5 px-4 font-bold">Invoice #</th>
                                                <th className="text-left py-2.5 px-4 font-bold">Issued</th>
                                                <th className="text-left py-2.5 px-4 font-bold">Due</th>
                                                <th className="text-right py-2.5 px-4 font-bold">Total</th>
                                                <th className="text-right py-2.5 px-4 font-bold">Paid</th>
                                                <th className="text-right py-2.5 px-4 font-bold">Balance</th>
                                                <th className="text-left py-2.5 px-4 font-bold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {billing.invoices.map((inv) => (
                                                <tr key={inv.id} className="border-t border-slate-100">
                                                    <td className="py-2.5 px-4 font-mono font-bold text-xs">{inv.invoice_no}</td>
                                                    <td className="py-2.5 px-4">{inv.issued_date}</td>
                                                    <td className="py-2.5 px-4">{inv.due_date}</td>
                                                    <td className="py-2.5 px-4 text-right font-bold">{formatINR(inv.total)}</td>
                                                    <td className="py-2.5 px-4 text-right text-emerald-700 font-semibold">{formatINR(inv.amount_paid)}</td>
                                                    <td className="py-2.5 px-4 text-right font-bold text-rose-600">{formatINR(inv.total - inv.amount_paid)}</td>
                                                    <td className="py-2.5 px-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${inv.status === "paid" ? "bg-emerald-50 text-emerald-700" : inv.status === "partial" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>{inv.status}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === "homework" && (
                        <div data-testid="parent-homework-panel">
                            {homework.length === 0 ? (
                                <div className="py-10 text-center text-slate-500">No homework or activities posted yet for {student.class_name}.</div>
                            ) : (
                                <div className="space-y-3">
                                    {homework.map((h) => (
                                        <div key={h.id} className="rounded-xl border border-slate-200 p-4 flex items-start gap-4 hover:border-indigo-200 transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-heading font-bold text-slate-900">{h.title}</span>
                                                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">{h.subject}</span>
                                                </div>
                                                {h.description && <div className="text-sm text-slate-600 mt-1 whitespace-pre-line">{h.description}</div>}
                                                <div className="text-xs text-slate-500 mt-1">Posted for: {h.date}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ accent, label, value, sub, icon: Icon }) {
    const map = {
        emerald: { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200/70" },
        violet:  { bg: "bg-violet-100",  text: "text-violet-700",  ring: "ring-violet-200/70" },
        teal:    { bg: "bg-teal-100",    text: "text-teal-700",    ring: "ring-teal-200/70" },
        amber:   { bg: "bg-amber-100",   text: "text-amber-700",   ring: "ring-amber-200/70" },
    };
    const a = map[accent];
    return (
        <div className={`${a.bg} ring-1 ${a.ring} border border-white/40 rounded-2xl p-5`}>
            <div className={`w-10 h-10 rounded-xl bg-white/70 ${a.text} flex items-center justify-center shadow-sm`}><Icon className="w-5 h-5" /></div>
            <div className="mt-4">
                <div className={`text-[11px] font-bold uppercase tracking-[0.14em] ${a.text}`}>{label}</div>
                <div className="font-heading text-2xl font-bold text-slate-900 mt-1 leading-tight">{value}</div>
                <div className={`text-xs ${a.text}/80 mt-1`}>{sub}</div>
            </div>
        </div>
    );
}
