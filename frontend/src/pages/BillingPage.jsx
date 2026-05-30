import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { formatINR, LOGO_URL, SCHOOL } from "@/constants/branding";
import { Plus, Receipt, Printer, X, IndianRupee, CreditCard } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast, Toaster } from "sonner";

export default function BillingPage() {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [students, setStudents] = useState([]);
    const [open, setOpen] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [form, setForm] = useState({ student_id: "", items: [{ description: "Monthly Tuition Fee", amount: 3000 }], due_date: "", notes: "" });
    const [payOpen, setPayOpen] = useState(false);
    const [payForm, setPayForm] = useState({ amount: 0, method: "cash", reference: "" });

    const load = async () => {
        try {
            const { data } = await api.get("/invoices");
            setInvoices(data);
            const { data: studs } = await api.get("/students");
            setStudents(studs);
        } catch (e) { toast.error(formatApiError(e)); }
    };
    useEffect(() => { load(); }, []);

    const setItem = (i, key, val) => { const items = [...form.items]; items[i] = { ...items[i], [key]: key === "amount" ? +val : val }; setForm({ ...form, items }); };
    const addItem = () => setForm({ ...form, items: [...form.items, { description: "", amount: 0 }] });
    const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

    const create = async (e) => {
        e.preventDefault();
        try { await api.post("/invoices", form); toast.success("Invoice created"); setOpen(false); load(); }
        catch (e) { toast.error(formatApiError(e)); }
    };

    const viewInv = async (id) => {
        try { const { data } = await api.get(`/invoices/${id}`); setViewing(data); }
        catch (e) { toast.error(formatApiError(e)); }
    };

    const openPay = (inv) => { setViewing(inv); setPayForm({ amount: inv.total - (inv.amount_paid || 0), method: "cash", reference: "" }); setPayOpen(true); };

    const submitPay = async (e) => {
        e.preventDefault();
        try { await api.post("/payments", { invoice_id: viewing.id, ...payForm }); toast.success("Payment recorded"); setPayOpen(false); await viewInv(viewing.id); load(); }
        catch (e) { toast.error(formatApiError(e)); }
    };

    const del = async (id) => {
        if (!window.confirm("Delete this invoice?")) return;
        try { await api.delete(`/invoices/${id}`); toast.success("Deleted"); load(); }
        catch (e) { toast.error(formatApiError(e)); }
    };

    return (
        <div className="space-y-6" data-testid="billing-page">
            <Toaster position="top-right" richColors />
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="font-heading text-3xl font-extrabold text-slate-900">Billing & Invoicing</h2>
                    <p className="text-slate-500 mt-1">Generate digital fee bills, log payments, print or download PDFs.</p>
                </div>
                {user?.role === "admin" && (
                    <button onClick={() => setOpen(true)} className="bg-[#4A3FBF] hover:bg-[#3a3199] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg" data-testid="create-invoice-btn">
                        <Plus className="w-4 h-4" />Generate Invoice
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                        <tr>
                            <th className="text-left py-3 px-4 font-bold">Invoice #</th>
                            <th className="text-left py-3 px-4 font-bold">Student</th>
                            <th className="text-left py-3 px-4 font-bold">Class</th>
                            <th className="text-left py-3 px-4 font-bold">Total</th>
                            <th className="text-left py-3 px-4 font-bold">Paid</th>
                            <th className="text-left py-3 px-4 font-bold">Due</th>
                            <th className="text-left py-3 px-4 font-bold">Status</th>
                            <th className="text-right py-3 px-4 font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((inv) => (
                            <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4 font-mono text-xs font-bold">{inv.invoice_no}</td>
                                <td className="py-3 px-4 font-semibold">{inv.student_name}</td>
                                <td className="py-3 px-4">{inv.class_name}</td>
                                <td className="py-3 px-4 font-bold">{formatINR(inv.total)}</td>
                                <td className="py-3 px-4 text-emerald-600 font-semibold">{formatINR(inv.amount_paid)}</td>
                                <td className="py-3 px-4 text-slate-500">{inv.due_date}</td>
                                <td className="py-3 px-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${inv.status === "paid" ? "bg-emerald-50 text-emerald-700" : inv.status === "partial" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{inv.status}</span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <button onClick={() => viewInv(inv.id)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200" data-testid={`view-invoice-${inv.id}`}>View</button>
                                    {user?.role === "admin" && inv.status !== "paid" && (
                                        <button onClick={() => openPay(inv)} className="ml-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#F39C2A] text-white hover:bg-[#d9871e]" data-testid={`pay-invoice-${inv.id}`}>Pay</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {invoices.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-slate-500"><Receipt className="w-12 h-12 mx-auto text-slate-300 mb-3" />No invoices yet.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Create invoice modal */}
            {open && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="font-heading text-xl font-bold">Generate Invoice</h3>
                            <button onClick={() => setOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={create} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Student</label>
                                <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5" data-testid="invoice-student-select">
                                    <option value="">— Select —</option>
                                    {students.map((s) => <option key={s.id} value={s.id}>{s.name} • {s.class_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Due Date</label>
                                <input type="date" required value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Line Items</label>
                                    <button type="button" onClick={addItem} className="text-xs font-bold text-[#4A3FBF]">+ Add</button>
                                </div>
                                {form.items.map((it, i) => (
                                    <div key={i} className="flex gap-2 mb-2">
                                        <input value={it.description} onChange={(e) => setItem(i, "description", e.target.value)} placeholder="Description" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
                                        <input type="number" value={it.amount} onChange={(e) => setItem(i, "amount", e.target.value)} placeholder="₹" className="w-28 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
                                        {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="px-2 text-red-600"><X className="w-4 h-4" /></button>}
                                    </div>
                                ))}
                                <div className="text-right font-bold text-lg">Total: {formatINR(form.items.reduce((a, b) => a + (+b.amount || 0), 0))}</div>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Notes</label>
                                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold">Cancel</button>
                                <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#4A3FBF] hover:bg-[#3a3199] text-white font-semibold">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View invoice modal */}
            {viewing && !payOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 no-print" onClick={() => setViewing(null)}>
                    <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()} data-testid="invoice-detail">
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between no-print">
                            <h3 className="font-heading text-xl font-bold">Invoice {viewing.invoice_no}</h3>
                            <div className="flex gap-2">
                                <button onClick={() => window.print()} className="px-3 py-2 rounded-xl bg-[#F39C2A] hover:bg-[#d9871e] text-white text-sm font-semibold flex items-center gap-2"><Printer className="w-4 h-4" />Print / PDF</button>
                                {user?.role === "admin" && <button onClick={() => del(viewing.id)} className="px-3 py-2 rounded-xl bg-red-50 text-red-700 text-sm font-semibold">Delete</button>}
                                <button onClick={() => setViewing(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="flex items-start justify-between mb-6 pb-6 border-b">
                                <div className="flex items-center gap-3">
                                    <img src={LOGO_URL} alt="logo" className="w-20 h-20 object-contain" />
                                    <div>
                                        <h2 className="font-heading text-xl font-extrabold text-[#4A3FBF]">{SCHOOL.name}</h2>
                                        <p className="text-xs text-slate-500 max-w-xs">{SCHOOL.address}</p>
                                        <p className="text-xs text-slate-500">{SCHOOL.phone} • {SCHOOL.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-heading text-2xl font-extrabold">INVOICE</div>
                                    <div className="font-mono text-sm text-slate-600">{viewing.invoice_no}</div>
                                    <div className="text-xs text-slate-500 mt-2">Issued: {viewing.issued_date}</div>
                                    <div className="text-xs text-slate-500">Due: {viewing.due_date}</div>
                                </div>
                            </div>
                            <div className="mb-6">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Bill To</div>
                                <div className="font-semibold text-slate-900 mt-1">{viewing.student_name}</div>
                                <div className="text-sm text-slate-600">Class: {viewing.class_name}</div>
                            </div>
                            <table className="w-full mb-6 text-sm">
                                <thead className="bg-slate-50">
                                    <tr><th className="text-left py-2 px-3">Description</th><th className="text-right py-2 px-3">Amount</th></tr>
                                </thead>
                                <tbody>
                                    {viewing.items.map((it, i) => (
                                        <tr key={i} className="border-t border-slate-100">
                                            <td className="py-2 px-3">{it.description}</td>
                                            <td className="py-2 px-3 text-right font-semibold">{formatINR(it.amount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-t-2 border-slate-300">
                                        <td className="py-3 px-3 font-bold">Total</td>
                                        <td className="py-3 px-3 text-right font-extrabold text-lg">{formatINR(viewing.total)}</td>
                                    </tr>
                                    <tr><td className="py-1 px-3 text-slate-600">Paid</td><td className="py-1 px-3 text-right text-emerald-600 font-semibold">{formatINR(viewing.amount_paid)}</td></tr>
                                    <tr><td className="py-1 px-3 font-bold">Balance Due</td><td className="py-1 px-3 text-right font-bold text-red-600">{formatINR(viewing.total - viewing.amount_paid)}</td></tr>
                                </tbody>
                            </table>
                            {viewing.payments?.length > 0 && (
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Payment History</div>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {viewing.payments.map((p) => (
                                                <tr key={p.id} className="border-t border-slate-100"><td className="py-1.5">{p.paid_at?.slice(0, 10)}</td><td className="capitalize">{p.method}</td><td className="text-xs text-slate-500">{p.reference || "—"}</td><td className="text-right font-semibold">{formatINR(p.amount)}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {viewing.notes && <div className="mt-6 text-sm text-slate-600 italic">Note: {viewing.notes}</div>}
                            <div className="mt-8 pt-6 border-t text-center text-xs text-slate-500">Thank you for choosing {SCHOOL.short}. For queries: {SCHOOL.email}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment modal */}
            {payOpen && viewing && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPayOpen(false)}>
                    <div className="bg-white rounded-3xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="font-heading text-xl font-bold flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#F39C2A]" />Record Payment</h3>
                            <button onClick={() => setPayOpen(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={submitPay} className="p-6 space-y-4">
                            <div className="text-sm">Invoice <span className="font-bold">{viewing.invoice_no}</span> — Balance {formatINR(viewing.total - viewing.amount_paid)}</div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Amount (₹)</label>
                                <div className="relative mt-1"><IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="number" required value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: +e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5" data-testid="payment-amount" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Method</label>
                                <select value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                                    <option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option><option value="bank_transfer">Bank Transfer</option><option value="stripe">Stripe (Mock)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Reference (optional)</label>
                                <input value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5" />
                            </div>
                            <button type="submit" className="w-full py-3 rounded-xl bg-[#4A3FBF] hover:bg-[#3a3199] text-white font-semibold" data-testid="payment-submit">Record Payment</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
