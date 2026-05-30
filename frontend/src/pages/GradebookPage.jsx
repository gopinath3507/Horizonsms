import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { CLASS_OPTIONS, SUBJECTS } from "@/constants/branding";
import { Plus, Save, Trash2, Award } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function GradebookPage() {
    const [className, setClassName] = useState("Nursery");
    const [students, setStudents] = useState([]);
    const [studentId, setStudentId] = useState("");
    const [weights, setWeights] = useState({ class_name: "Nursery", homework: 30, exams: 70 });
    const [grades, setGrades] = useState([]);
    const [report, setReport] = useState(null);
    const [form, setForm] = useState({ subject: "English", category: "homework", score: 0, max_score: 100, term: "Term 1" });

    useEffect(() => {
        api.get(`/students?class_name=${encodeURIComponent(className)}&status_filter=active`)
            .then(({ data }) => { setStudents(data); if (data.length) setStudentId(data[0].id); else setStudentId(""); });
        api.get(`/grades/weights/${encodeURIComponent(className)}`).then(({ data }) => setWeights(data));
    }, [className]);

    const loadGrades = async () => {
        if (!studentId) { setGrades([]); setReport(null); return; }
        try {
            const { data: gs } = await api.get(`/grades?student_id=${studentId}`);
            setGrades(gs);
            const { data: rep } = await api.get(`/grades/report/${studentId}`);
            setReport(rep);
        } catch (e) { toast.error(formatApiError(e)); }
    };
    useEffect(() => { loadGrades(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [studentId]);

    const saveWeights = async () => {
        if (+weights.homework + +weights.exams !== 100) return toast.error("Weights must sum to 100");
        try { await api.post("/grades/weights", { ...weights, class_name: className }); toast.success("Weights saved"); loadGrades(); }
        catch (e) { toast.error(formatApiError(e)); }
    };

    const addGrade = async (e) => {
        e.preventDefault();
        try { await api.post("/grades", { ...form, student_id: studentId }); toast.success("Grade added"); loadGrades(); }
        catch (e) { toast.error(formatApiError(e)); }
    };

    const delGrade = async (id) => {
        try { await api.delete(`/grades/${id}`); loadGrades(); } catch (e) { toast.error(formatApiError(e)); }
    };

    return (
        <div className="space-y-6" data-testid="gradebook-page">
            <Toaster position="top-right" richColors />
            <div>
                <h2 className="font-heading text-3xl font-extrabold text-slate-900">Academic Gradebook</h2>
                <p className="text-slate-500 mt-1">Configure weighted grading tiers and auto-generate report cards.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Class</label>
                    <select value={className} onChange={(e) => setClassName(e.target.value)} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5" data-testid="gradebook-class">
                        {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Homework %</label>
                    <input type="number" value={weights.homework} onChange={(e) => setWeights({ ...weights, homework: +e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5" />
                </div>
                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Exams %</label>
                    <input type="number" value={weights.exams} onChange={(e) => setWeights({ ...weights, exams: +e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5" />
                </div>
                <div className="flex items-end">
                    <button onClick={saveWeights} className="w-full bg-[#F39C2A] hover:bg-[#d9871e] text-white font-semibold rounded-xl px-4 py-2.5 flex items-center justify-center gap-2" data-testid="save-weights">
                        <Save className="w-4 h-4" />Save Weights
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Student</label>
                <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5" data-testid="gradebook-student">
                    <option value="">— Select —</option>
                    {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            {studentId && (
                <>
                    <form onSubmit={addGrade} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 grid grid-cols-2 md:grid-cols-6 gap-3">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Subject</label>
                            <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Category</label>
                            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                <option value="homework">Homework</option><option value="exam">Exam</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Score</label>
                            <input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: +e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Max</label>
                            <input type="number" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: +e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Term</label>
                            <input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
                        </div>
                        <div className="flex items-end">
                            <button type="submit" className="w-full bg-[#4A3FBF] hover:bg-[#3a3199] text-white font-semibold rounded-xl px-4 py-2 flex items-center justify-center gap-2" data-testid="add-grade-btn"><Plus className="w-4 h-4" />Add</button>
                        </div>
                    </form>

                    {report && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4A3FBF] to-[#F39C2A] text-white flex items-center justify-center"><Award className="w-6 h-6" /></div>
                                    <div>
                                        <h3 className="font-heading text-xl font-bold">Report Card – {report.student.name}</h3>
                                        <p className="text-sm text-slate-500">Weights: Homework {report.weights.homework}% • Exams {report.weights.exams}%</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Overall</div>
                                    <div className="font-heading text-3xl font-extrabold text-[#4A3FBF]" data-testid="report-overall">{report.overall_pct}% · <span className="text-[#F39C2A]">{report.overall_letter}</span></div>
                                </div>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr><th className="text-left py-2 px-3">Subject</th><th className="text-left py-2 px-3">Homework</th><th className="text-left py-2 px-3">Exam</th><th className="text-left py-2 px-3">Final</th><th className="text-left py-2 px-3">Grade</th></tr>
                                </thead>
                                <tbody>
                                    {report.subjects.map((r) => (
                                        <tr key={r.subject} className="border-t border-slate-100">
                                            <td className="py-2 px-3 font-semibold">{r.subject}</td>
                                            <td className="py-2 px-3">{r.homework_pct}%</td>
                                            <td className="py-2 px-3">{r.exam_pct}%</td>
                                            <td className="py-2 px-3 font-bold">{r.final_pct}%</td>
                                            <td className="py-2 px-3"><span className="px-2.5 py-1 rounded-full bg-indigo-50 text-[#4A3FBF] font-bold text-xs">{r.letter}</span></td>
                                        </tr>
                                    ))}
                                    {report.subjects.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-slate-500">No grades recorded yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-slate-50 font-heading font-bold">All Grade Entries</div>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/50"><tr><th className="text-left py-2 px-4">Subject</th><th className="text-left py-2 px-4">Category</th><th className="text-left py-2 px-4">Score</th><th className="text-left py-2 px-4">Term</th><th></th></tr></thead>
                            <tbody>
                                {grades.map((g) => (
                                    <tr key={g.id} className="border-t border-slate-100">
                                        <td className="py-2 px-4">{g.subject}</td>
                                        <td className="py-2 px-4 capitalize">{g.category}</td>
                                        <td className="py-2 px-4 font-bold">{g.score} / {g.max_score}</td>
                                        <td className="py-2 px-4">{g.term}</td>
                                        <td className="py-2 px-4 text-right"><button onClick={() => delGrade(g.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-600" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
