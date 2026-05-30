import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { CLASS_OPTIONS, SUBJECTS } from "@/constants/branding";
import { Plus, Trash2, BookOpen, X, Sparkles } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function HomeworkPage() {
    const today = new Date().toISOString().slice(0, 10);
    const [items, setItems] = useState([]);
    const [filterClass, setFilterClass] = useState("");
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ class_name: "Nursery", subject: "Activity", title: "", description: "", date: today });

    const load = async () => {
        try {
            const url = filterClass ? `/homework?class_name=${encodeURIComponent(filterClass)}` : "/homework";
            const { data } = await api.get(url); setItems(data);
        } catch (e) { toast.error(formatApiError(e)); }
    };
    useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filterClass]);

    const submit = async (e) => {
        e.preventDefault();
        try { await api.post("/homework", form); toast.success("Posted"); setOpen(false); load(); }
        catch (e) { toast.error(formatApiError(e)); }
    };

    const del = async (id) => {
        if (!window.confirm("Delete this homework?")) return;
        try { await api.delete(`/homework/${id}`); load(); } catch (e) { toast.error(formatApiError(e)); }
    };

    return (
        <div className="space-y-6" data-testid="homework-page">
            <Toaster position="top-right" richColors />
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="font-heading text-3xl font-extrabold text-slate-900">Homework & Activities</h2>
                    <p className="text-slate-500 mt-1">Post daily activities & homework — parents see it on their portal.</p>
                </div>
                <button onClick={() => setOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm" data-testid="add-homework-btn">
                    <Plus className="w-4 h-4" />Post Homework
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3">
                <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5" data-testid="hw-class-filter">
                    <option value="">All Classes</option>
                    {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="space-y-3">
                {items.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center text-slate-500">
                        <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />No homework posted yet.
                    </div>
                )}
                {items.map((h) => (
                    <div key={h.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 hover:border-amber-200 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-heading font-bold text-slate-900">{h.title}</span>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">{h.class_name}</span>
                                <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-bold uppercase tracking-wider">{h.subject}</span>
                            </div>
                            {h.description && <div className="text-sm text-slate-600 mt-1 whitespace-pre-line">{h.description}</div>}
                            <div className="text-xs text-slate-500 mt-1">Date: {h.date}</div>
                        </div>
                        <button onClick={() => del(h.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-600" /></button>
                    </div>
                ))}
            </div>

            {open && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
                    <div className="bg-white rounded-3xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="font-heading text-xl font-bold">Post Homework / Activity</h3>
                            <button onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={submit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Class</label>
                                    <select required value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                                        {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Subject / Activity</label>
                                    <select required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                                        {[...SUBJECTS, "Activity", "Craft", "Singing", "Story Time"].map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Title</label>
                                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5" placeholder="e.g. Trace the letter A" />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Description</label>
                                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5" placeholder="Details for parents…" />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Date</label>
                                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5" />
                            </div>
                            <button type="submit" className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold">Post</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
