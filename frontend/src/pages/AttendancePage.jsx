import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { CLASS_OPTIONS } from "@/constants/branding";
import { Check, X as XIcon, Clock, Save, CalendarDays } from "lucide-react";
import { toast, Toaster } from "sonner";

const STATUS_LIST = [
    { value: "present", label: "Present", color: "bg-emerald-500", icon: Check },
    { value: "absent", label: "Absent", color: "bg-red-500", icon: XIcon },
    { value: "late", label: "Late", color: "bg-orange-500", icon: Clock },
];

export default function AttendancePage() {
    const today = new Date().toISOString().slice(0, 10);
    const [date, setDate] = useState(today);
    const [className, setClassName] = useState("Nursery");
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState({});
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            const studsUrl = className
                ? `/students?class_name=${encodeURIComponent(className)}&status_filter=active`
                : `/students?status_filter=active`;
            const { data: studs } = await api.get(studsUrl);
            setStudents(studs);
            const attUrl = className
                ? `/attendance?date=${date}&class_name=${encodeURIComponent(className)}`
                : `/attendance?date=${date}`;
            const { data: existing } = await api.get(attUrl);
            const m = {};
            existing.forEach((a) => { m[a.student_id] = a.status; });
            setMarks(m);
        } catch (e) { toast.error(formatApiError(e)); }
    };
    useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [date, className]);

    const setStatus = (sid, status) => setMarks((m) => ({ ...m, [sid]: status }));

    const save = async () => {
        const entries = students.filter((s) => marks[s.id]).map((s) => ({ student_id: s.id, date, status: marks[s.id] }));
        if (entries.length === 0) return toast.error("No attendance marked");
        setSaving(true);
        try {
            const { data } = await api.post("/attendance/bulk", { date, class_name: className, entries });
            toast.success(`Saved ${data.saved_count} records. ${data.warnings_triggered.length} parent alerts (mock SMS) triggered.`);
        } catch (e) { toast.error(formatApiError(e)); }
        setSaving(false);
    };

    const markAll = (status) => {
        const m = { ...marks };
        students.forEach((s) => { m[s.id] = status; });
        setMarks(m);
    };

    const counts = STATUS_LIST.reduce((a, s) => ({ ...a, [s.value]: Object.values(marks).filter((v) => v === s.value).length }), {});

    return (
        <div className="space-y-6" data-testid="attendance-page">
            <Toaster position="top-right" richColors />
            <div>
                <h2 className="font-heading text-3xl font-extrabold text-slate-900">Attendance & Engagement</h2>
                <p className="text-slate-500 mt-1">Toggle daily presence. Absent/Late students trigger parent SMS alerts (mock).</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-wrap items-end gap-4">
                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#4A3FBF]" data-testid="attendance-date" />
                </div>
                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Class</label>
                    <select value={className} onChange={(e) => setClassName(e.target.value)} className="mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#4A3FBF]" data-testid="attendance-class">
                        <option value="">All Classes</option>
                        {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                </div>
                <div className="flex items-end gap-2 ml-auto">
                    <button onClick={() => markAll("present")} className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-semibold hover:bg-emerald-200 text-sm">All Present</button>
                    <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl bg-[#4A3FBF] hover:bg-[#3a3199] text-white font-semibold shadow-lg flex items-center gap-2" data-testid="attendance-save">
                        <Save className="w-4 h-4" />{saving ? "Saving…" : "Save Attendance"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {STATUS_LIST.map((s) => (
                    <div key={s.value} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
                        <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}><s.icon className="w-5 h-5 text-white" /></div>
                        <div>
                            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{s.label}</div>
                            <div className="font-heading text-2xl font-extrabold text-slate-900">{counts[s.value] || 0}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                        <tr><th className="text-left py-3 px-4 font-bold text-slate-700">Student</th><th className="text-left py-3 px-4 font-bold text-slate-700">Mark</th></tr>
                    </thead>
                    <tbody>
                        {students.map((s) => (
                            <tr key={s.id} className="border-t border-slate-100" data-testid={`attendance-row-${s.id}`}>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4A3FBF] to-[#F39C2A] flex items-center justify-center text-white font-bold">{s.name?.[0]?.toUpperCase()}</div>
                                        <div>
                                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                                                {s.name}
                                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-[#4A3FBF] text-[10px] font-bold uppercase tracking-wider">{s.class_name}</span>
                                            </div>
                                            <div className="text-xs text-slate-500">{s.parent_name || "—"}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex gap-2 flex-wrap">
                                        {STATUS_LIST.map((st) => {
                                            const active = marks[s.id] === st.value;
                                            return (
                                                <button key={st.value} onClick={() => setStatus(s.id, st.value)}
                                                    data-testid={`mark-${s.id}-${st.value}`}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${active ? `${st.color} text-white shadow-md` : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                                    <st.icon className="w-3.5 h-3.5" />{st.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {students.length === 0 && (
                            <tr><td colSpan={2} className="py-12 text-center text-slate-500">No active students {className ? `in ${className}` : "found"}.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
