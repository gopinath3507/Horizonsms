import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { Plus, Trash2, Users, X, Edit3, Phone } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function ParentsPage() {
    const [parents, setParents] = useState([]);
    const [students, setStudents] = useState([]);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: "", phone: "", password: "", student_id: "" });

    const load = async () => {
        try {
            const { data: p } = await api.get("/parents"); setParents(p);
            const { data: s } = await api.get("/students"); setStudents(s);
        } catch (e) { toast.error(formatApiError(e)); }
    };
    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditing(null); setForm({ name: "", phone: "", password: "", student_id: "" }); setOpen(true); };
    const openEdit = (p) => { setEditing(p); setForm({ name: p.name, phone: p.phone, password: "", student_id: p.student_id }); setOpen(true); };

    const submit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                const payload = { name: form.name, phone: form.phone, student_id: form.student_id };
                if (form.password) payload.password = form.password;
                await api.patch(`/parents/${editing.id}`, payload);
                toast.success("Parent updated");
            } else {
                await api.post("/parents", form);
                toast.success("Parent account created");
            }
            setOpen(false); load();
        } catch (e) { toast.error(formatApiError(e)); }
    };

    const del = async (id) => {
        if (!window.confirm("Delete this parent account?")) return;
        try { await api.delete(`/parents/${id}`); toast.success("Deleted"); load(); }
        catch (e) { toast.error(formatApiError(e)); }
    };

    const studentName = (sid) => students.find((s) => s.id === sid)?.name || "—";
    const studentClass = (sid) => students.find((s) => s.id === sid)?.class_name || "—";

    return (
        <div className="space-y-6" data-testid="parents-page">
            <Toaster position="top-right" richColors />
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="font-heading text-3xl font-extrabold text-slate-900">Parent Accounts</h2>
                    <p className="text-slate-500 mt-1">Create login credentials so parents can view their child's daily routine.</p>
                </div>
                <button onClick={openCreate} className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm" data-testid="add-parent-btn">
                    <Plus className="w-4 h-4" />Add Parent
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                        <tr>
                            <th className="text-left py-3 px-4 font-bold">Parent</th>
                            <th className="text-left py-3 px-4 font-bold">Mobile</th>
                            <th className="text-left py-3 px-4 font-bold">Linked Child</th>
                            <th className="text-left py-3 px-4 font-bold">Class</th>
                            <th className="text-right py-3 px-4 font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parents.map((p) => (
                            <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold">{p.name?.[0]?.toUpperCase()}</div>
                                        <span className="font-semibold text-slate-900">{p.name}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-700">{p.phone}</td>
                                <td className="py-3 px-4 font-semibold">{studentName(p.student_id)}</td>
                                <td className="py-3 px-4"><span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">{studentClass(p.student_id)}</span></td>
                                <td className="py-3 px-4 text-right">
                                    <button onClick={() => openEdit(p)} className="p-2 hover:bg-slate-100 rounded-lg" data-testid={`edit-parent-${p.id}`}><Edit3 className="w-4 h-4 text-slate-600" /></button>
                                    <button onClick={() => del(p.id)} className="p-2 hover:bg-red-50 rounded-lg" data-testid={`delete-parent-${p.id}`}><Trash2 className="w-4 h-4 text-red-600" /></button>
                                </td>
                            </tr>
                        ))}
                        {parents.length === 0 && (
                            <tr><td colSpan={5} className="py-12 text-center text-slate-500"><Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />No parent accounts yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {open && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
                    <div className="bg-white rounded-3xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="font-heading text-xl font-bold">{editing ? "Edit Parent" : "Add Parent"}</h3>
                            <button onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={submit} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Parent Name</label>
                                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5" data-testid="parent-input-name" />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Mobile Number</label>
                                <div className="relative mt-1">
                                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5" placeholder="+91 9XXXXXXXXX" data-testid="parent-input-phone" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">{editing ? "New Password (leave blank to keep)" : "Password"}</label>
                                <input type="password" required={!editing} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5" data-testid="parent-input-password" />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Linked Child</label>
                                <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5" data-testid="parent-input-student">
                                    <option value="">— Select Child —</option>
                                    {students.map((s) => <option key={s.id} value={s.id}>{s.name} • {s.class_name}</option>)}
                                </select>
                            </div>
                            <button type="submit" className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold" data-testid="parent-save-btn">{editing ? "Update" : "Create Account"}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
