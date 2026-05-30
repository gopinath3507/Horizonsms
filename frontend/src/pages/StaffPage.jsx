import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { Plus, Trash2, UserCog, X } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useAuth } from "@/lib/auth";

export default function StaffPage() {
    const { user } = useAuth();
    const [staff, setStaff] = useState([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ email: "", password: "", name: "", phone: "", role: "staff" });

    const load = async () => {
        try { const { data } = await api.get("/staff"); setStaff(data); }
        catch (e) { toast.error(formatApiError(e)); }
    };
    useEffect(() => { load(); }, []);

    const create = async (e) => {
        e.preventDefault();
        try { await api.post("/staff", form); toast.success("Staff added"); setOpen(false); setForm({ email: "", password: "", name: "", phone: "", role: "staff" }); load(); }
        catch (e) { toast.error(formatApiError(e)); }
    };

    const del = async (id) => {
        if (!window.confirm("Delete this staff?")) return;
        try { await api.delete(`/staff/${id}`); toast.success("Deleted"); load(); }
        catch (e) { toast.error(formatApiError(e)); }
    };

    return (
        <div className="space-y-6" data-testid="staff-page">
            <Toaster position="top-right" richColors />
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="font-heading text-3xl font-extrabold text-slate-900">Staff Management</h2>
                    <p className="text-slate-500 mt-1">Add and manage admin & staff accounts.</p>
                </div>
                <button onClick={() => setOpen(true)} className="bg-[#4A3FBF] hover:bg-[#3a3199] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg" data-testid="add-staff-btn">
                    <Plus className="w-4 h-4" />Add Staff
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                        <tr>
                            <th className="text-left py-3 px-4 font-bold">Name</th>
                            <th className="text-left py-3 px-4 font-bold">Email</th>
                            <th className="text-left py-3 px-4 font-bold">Phone</th>
                            <th className="text-left py-3 px-4 font-bold">Role</th>
                            <th className="text-right py-3 px-4 font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staff.map((s) => (
                            <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4A3FBF] to-[#F39C2A] flex items-center justify-center text-white font-bold">{s.name?.[0]?.toUpperCase()}</div>
                                        <span className="font-semibold">{s.name}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4">{s.email}</td>
                                <td className="py-3 px-4">{s.phone || "—"}</td>
                                <td className="py-3 px-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.role === "admin" ? "bg-[#F39C2A] text-white" : "bg-indigo-50 text-[#4A3FBF]"}`}>{s.role}</span></td>
                                <td className="py-3 px-4 text-right">
                                    {s.id !== user?.id && <button onClick={() => del(s.id)} className="p-2 hover:bg-red-50 rounded-lg" data-testid={`delete-staff-${s.id}`}><Trash2 className="w-4 h-4 text-red-600" /></button>}
                                </td>
                            </tr>
                        ))}
                        {staff.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-slate-500"><UserCog className="w-12 h-12 mx-auto text-slate-300 mb-3" />No staff yet.</td></tr>}
                    </tbody>
                </table>
            </div>

            {open && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
                    <div className="bg-white rounded-3xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="font-heading text-xl font-bold">Add Staff</h3>
                            <button onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={create} className="p-6 space-y-4">
                            {[["name", "Full Name", "text"], ["email", "Email", "email"], ["password", "Password", "password"], ["phone", "Phone", "tel"]].map(([k, l, t]) => (
                                <div key={k}>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">{l}</label>
                                    <input type={t} required={k !== "phone"} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5" data-testid={`staff-input-${k}`} />
                                </div>
                            ))}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Role</label>
                                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                                    <option value="staff">Staff (Teacher)</option><option value="admin">Admin</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full py-3 rounded-xl bg-[#4A3FBF] hover:bg-[#3a3199] text-white font-semibold" data-testid="staff-save-btn">Create</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
