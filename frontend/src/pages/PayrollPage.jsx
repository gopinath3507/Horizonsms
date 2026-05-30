import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { formatINR } from "@/constants/branding";
import { Plus, Wallet, X, Check, Trash2 } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function PayrollPage() {
    const [rows, setRows] = useState([]);
    const [staff, setStaff] = useState([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ staff_id: "", month: new Date().toISOString().slice(0, 7), base_salary: 0, bonus: 0, deductions: 0, status: "pending" });

    const load = async () => {
        try { const { data } = await api.get("/payroll"); setRows(data); const { data: s } = await api.get("/staff"); setStaff(s); }
        catch (e) { toast.error(formatApiError(e)); }
    };
    useEffect(() => { load(); }, []);

    const create = async (e) => {
        e.preventDefault();
        try { await api.post("/payroll", form); toast.success("Payroll added"); setOpen(false); load(); }
        catch (e) { toast.error(formatApiError(e)); }
    };

    const markPaid = async (id) => { try { await api.patch(`/payroll/${id}/mark-paid`); toast.success("Marked paid"); load(); } catch (e) { toast.error(formatApiError(e)); } };
    const del = async (id) => { if (!window.confirm("Delete?")) return; try { await api.delete(`/payroll/${id}`); load(); } catch (e) { toast.error(formatApiError(e)); } };

    return (
        <div className="space-y-6" data-testid="payroll-page">
            <Toaster position="top-right" richColors />
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="font-heading text-3xl font-extrabold text-slate-900">Payroll Workflow</h2>
                    <p className="text-slate-500 mt-1">Track staff salaries, bonuses and deductions.</p>
                </div>
                <button onClick={() => setOpen(true)} className="bg-[#4A3FBF] hover:bg-[#3a3199] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg" data-testid="add-payroll-btn"><Plus className="w-4 h-4" />Add Entry</button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                        <tr>
                            <th className="text-left py-3 px-4 font-bold">Staff</th>
                            <th className="text-left py-3 px-4 font-bold">Month</th>
                            <th className="text-left py-3 px-4 font-bold">Base</th>
                            <th className="text-left py-3 px-4 font-bold">Bonus</th>
                            <th className="text-left py-3 px-4 font-bold">Deductions</th>
                            <th className="text-left py-3 px-4 font-bold">Net</th>
                            <th className="text-left py-3 px-4 font-bold">Status</th>
                            <th className="text-right py-3 px-4 font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4 font-semibold">{r.staff_name}</td>
                                <td className="py-3 px-4">{r.month}</td>
                                <td className="py-3 px-4">{formatINR(r.base_salary)}</td>
                                <td className="py-3 px-4 text-emerald-600">{formatINR(r.bonus)}</td>
                                <td className="py-3 px-4 text-red-600">{formatINR(r.deductions)}</td>
                                <td className="py-3 px-4 font-bold">{formatINR(r.net_salary)}</td>
                                <td className="py-3 px-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{r.status}</span></td>
                                <td className="py-3 px-4 text-right">
                                    {r.status === "pending" && <button onClick={() => markPaid(r.id)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 inline-flex items-center gap-1" data-testid={`mark-paid-${r.id}`}><Check className="w-3 h-3" />Mark Paid</button>}
                                    <button onClick={() => del(r.id)} className="ml-2 p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-600" /></button>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-slate-500"><Wallet className="w-12 h-12 mx-auto text-slate-300 mb-3" />No payroll entries.</td></tr>}
                    </tbody>
                </table>
            </div>

            {open && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
                    <div className="bg-white rounded-3xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="font-heading text-xl font-bold">Add Payroll</h3>
                            <button onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={create} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Staff</label>
                                <select required value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                                    <option value="">— Select —</option>
                                    {staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Month (YYYY-MM)</label>
                                <input type="month" required value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5" />
                            </div>
                            {[["base_salary", "Base Salary (₹)"], ["bonus", "Bonus (₹)"], ["deductions", "Deductions (₹)"]].map(([k, l]) => (
                                <div key={k}>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">{l}</label>
                                    <input type="number" value={form[k]} onChange={(e) => setForm({ ...form, [k]: +e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5" />
                                </div>
                            ))}
                            <button type="submit" className="w-full py-3 rounded-xl bg-[#4A3FBF] hover:bg-[#3a3199] text-white font-semibold">Save</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
