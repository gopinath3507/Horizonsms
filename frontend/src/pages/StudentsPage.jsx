import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { CLASS_OPTIONS, FEE_CATEGORIES, formatINR } from "@/constants/branding";
import { Plus, Search, Edit3, Trash2, X, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast, Toaster } from "sonner";

const EMPTY = {
    name: "", dob: "", gender: "Male", class_name: "Nursery", photo_url: "",
    parent_name: "", parent_phone: "", parent_email: "", address: "",
    emergency_contact_name: "", emergency_contact_phone: "",
    enrollment_date: "", status: "active", fee_category: "Standard", monthly_fee: 3000, notes: "",
};

export default function StudentsPage() {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState("");
    const [filterClass, setFilterClass] = useState("");
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        try {
            const { data } = await api.get("/students");
            setStudents(data);
        } catch (e) { toast.error(formatApiError(e)); }
    };
    useEffect(() => { load(); }, []);

    const filtered = students.filter((s) =>
        (!filterClass || s.class_name === filterClass) &&
        (s.name?.toLowerCase().includes(search.toLowerCase()) || s.parent_name?.toLowerCase().includes(search.toLowerCase()))
    );

    const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
    const openEdit = (s) => { setEditing(s); setForm({ ...EMPTY, ...s }); setOpen(true); };

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editing) {
                await api.patch(`/students/${editing.id}`, form);
                toast.success("Student updated");
            } else {
                await api.post("/students", form);
                toast.success("Student enrolled");
            }
            setOpen(false); load();
        } catch (e) { toast.error(formatApiError(e)); }
        setLoading(false);
    };

    const del = async (s) => {
        if (!window.confirm(`Delete ${s.name}?`)) return;
        try { await api.delete(`/students/${s.id}`); toast.success("Deleted"); load(); }
        catch (e) { toast.error(formatApiError(e)); }
    };

    return (
        <div className="space-y-6" data-testid="students-page">
            <Toaster position="top-right" richColors />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="font-heading text-3xl font-extrabold text-slate-900">Student Information System</h2>
                    <p className="text-slate-500 mt-1">Centralized ledger of all enrolled students.</p>
                </div>
                <button onClick={openCreate} className="bg-[#4A3FBF] hover:bg-[#3a3199] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg" data-testid="add-student-btn">
                    <Plus className="w-4 h-4" /> Enroll Student
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student or parent name…" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-[#4A3FBF]" data-testid="student-search" />
                </div>
                <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none" data-testid="student-class-filter">
                    <option value="">All Classes</option>
                    {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="students-table">
                        <thead className="bg-slate-50 text-slate-700">
                            <tr>
                                <th className="text-left py-4 px-4 font-bold">Student</th>
                                <th className="text-left py-4 px-4 font-bold">Class</th>
                                <th className="text-left py-4 px-4 font-bold">Parent</th>
                                <th className="text-left py-4 px-4 font-bold">Contact</th>
                                <th className="text-left py-4 px-4 font-bold">Fee/mo</th>
                                <th className="text-left py-4 px-4 font-bold">Status</th>
                                <th className="text-right py-4 px-4 font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s) => (
                                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4A3FBF] to-[#F39C2A] flex items-center justify-center text-white font-bold">
                                                {s.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900">{s.name}</div>
                                                <div className="text-xs text-slate-500">{s.gender} • DOB: {s.dob || "—"}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4"><span className="px-2.5 py-1 rounded-full bg-indigo-50 text-[#4A3FBF] text-xs font-bold">{s.class_name}</span></td>
                                    <td className="py-3 px-4">{s.parent_name || "—"}</td>
                                    <td className="py-3 px-4 text-slate-600">{s.parent_phone || "—"}</td>
                                    <td className="py-3 px-4 font-semibold">{formatINR(s.monthly_fee)}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{s.status}</span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <button onClick={() => openEdit(s)} className="p-2 hover:bg-slate-100 rounded-lg" data-testid={`edit-student-${s.id}`}><Edit3 className="w-4 h-4 text-slate-600" /></button>
                                        {user?.role === "admin" && (
                                            <button onClick={() => del(s)} className="p-2 hover:bg-red-50 rounded-lg" data-testid={`delete-student-${s.id}`}><Trash2 className="w-4 h-4 text-red-600" /></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} className="py-12 text-center text-slate-500">
                                    <User className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                    No students yet. Click "Enroll Student" to add one.
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
                    <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()} data-testid="student-modal">
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="font-heading text-xl font-bold text-slate-900">{editing ? "Edit Student" : "Enroll Student"}</h3>
                            <button onClick={() => setOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={submit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                ["name", "Full Name", "text", true],
                                ["dob", "Date of Birth", "date"],
                                ["enrollment_date", "Enrollment Date", "date"],
                                ["parent_name", "Parent Name", "text"],
                                ["parent_phone", "Parent Phone", "tel"],
                                ["parent_email", "Parent Email", "email"],
                                ["emergency_contact_name", "Emergency Contact Name", "text"],
                                ["emergency_contact_phone", "Emergency Phone", "tel"],
                                ["monthly_fee", "Monthly Fee (₹)", "number"],
                            ].map(([key, label, type, required]) => (
                                <div key={key}>
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</label>
                                    <input type={type} required={!!required} value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: type === "number" ? +e.target.value : e.target.value })} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#4A3FBF]" data-testid={`student-input-${key}`} />
                                </div>
                            ))}
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Gender</label>
                                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#4A3FBF]">
                                    <option>Male</option><option>Female</option><option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Class</label>
                                <select value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#4A3FBF]" data-testid="student-class-select">
                                    {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Fee Category</label>
                                <select value={form.fee_category} onChange={(e) => setForm({ ...form, fee_category: e.target.value })} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#4A3FBF]">
                                    {FEE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status</label>
                                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#4A3FBF]">
                                    <option value="active">Active</option><option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Address</label>
                                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#4A3FBF]" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Notes</label>
                                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#4A3FBF]" />
                            </div>
                            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-[#4A3FBF] hover:bg-[#3a3199] text-white font-semibold shadow-lg" data-testid="student-save-btn">{loading ? "Saving…" : (editing ? "Update" : "Enroll")}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
