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

    const printInvoice = () => {
        const oldTitle = document.title;
        document.title = `Invoice-${viewing?.invoice_no || ""}`;
        window.print();
        // Reset after print dialog closes
        setTimeout(() => { document.title = oldTitle; }, 1000);
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

            {/* View invoice modal — colorful professional layout */}
            {viewing && !payOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4 invoice-print-root" onClick={() => setViewing(null)}>
                    <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl invoice-print-card" onClick={(e) => e.stopPropagation()} data-testid="invoice-detail">
                        {/* Toolbar — hidden during print */}
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between no-print z-10">
                            <h3 className="font-heading text-xl font-bold">Invoice {viewing.invoice_no}</h3>
                            <div className="flex gap-2">
                                <button onClick={printInvoice} className="px-4 py-2 rounded-xl bg-[#F39C2A] hover:bg-[#d9871e] text-white text-sm font-semibold flex items-center gap-2 shadow-md" data-testid="print-invoice-btn"><Printer className="w-4 h-4" />Print / Save PDF</button>
                                {user?.role === "admin" && <button onClick={() => del(viewing.id)} className="px-3 py-2 rounded-xl bg-red-50 text-red-700 text-sm font-semibold">Delete</button>}
                                <button onClick={() => setViewing(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* PRINTABLE CONTENT */}
                        <div className="p-0">
                            {/* Top color band */}
                            <div className="relative h-6 bg-gradient-to-r from-[#4A3FBF] via-[#7c3aed] to-[#F39C2A]" />

                            {/* Header section */}
                            <div className="px-8 sm:px-12 pt-8 pb-6 bg-gradient-to-b from-indigo-50/60 to-white">
                                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <img src={LOGO_URL} alt="logo" className="w-24 h-24 object-contain shrink-0" />
                                        <div>
                                            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#4A3FBF] leading-tight">{SCHOOL.name}</h2>
                                            <p className="text-xs text-slate-600 max-w-sm mt-1 leading-relaxed">{SCHOOL.address}</p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-700">
                                                <span className="font-semibold">📞 {SCHOOL.phone}</span>
                                                <span className="font-semibold">✉ {SCHOOL.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="inline-block bg-[#4A3FBF] text-white px-5 py-2 rounded-xl font-heading text-2xl font-extrabold tracking-wider shadow-lg">INVOICE</div>
                                        <div className="font-mono text-sm text-slate-700 font-bold mt-2">#{viewing.invoice_no}</div>
                                        <div className="text-xs text-slate-500 mt-1">Issued: <span className="font-semibold text-slate-700">{viewing.issued_date}</span></div>
                                        <div className="text-xs text-slate-500">Due: <span className="font-semibold text-[#F39C2A]">{viewing.due_date}</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Bill To + Summary cards */}
                            <div className="px-8 sm:px-12 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="rounded-2xl border-l-4 border-[#4A3FBF] bg-indigo-50/70 p-5">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#4A3FBF]">Bill To</div>
                                    <div className="font-heading text-lg font-extrabold text-slate-900 mt-1">{viewing.student_name}</div>
                                    <div className="text-sm text-slate-600 mt-0.5">Class: <span className="font-semibold text-slate-800">{viewing.class_name}</span></div>
                                </div>
                                <div className="rounded-2xl border-l-4 border-[#F39C2A] bg-orange-50/70 p-5">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#F39C2A]">Amount Due</div>
                                    <div className="font-heading text-2xl font-extrabold text-slate-900 mt-1">{formatINR(viewing.total - viewing.amount_paid)}</div>
                                    <div className="text-sm text-slate-600 mt-0.5">Status: <span className={`font-bold ${viewing.status === "paid" ? "text-emerald-600" : viewing.status === "partial" ? "text-amber-600" : "text-red-600"}`}>{viewing.status.toUpperCase()}</span></div>
                                </div>
                            </div>

                            {/* Line items table */}
                            <div className="px-8 sm:px-12 mb-6">
                                <div className="overflow-hidden rounded-2xl border border-slate-200">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-[#4A3FBF] to-[#7c3aed] text-white">
                                                <th className="text-left py-3 px-5 font-bold uppercase tracking-wider text-xs">#</th>
                                                <th className="text-left py-3 px-5 font-bold uppercase tracking-wider text-xs">Description</th>
                                                <th className="text-right py-3 px-5 font-bold uppercase tracking-wider text-xs">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewing.items.map((it, i) => (
                                                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                                                    <td className="py-3 px-5 text-slate-500 font-semibold">{i + 1}</td>
                                                    <td className="py-3 px-5 text-slate-800">{it.description}</td>
                                                    <td className="py-3 px-5 text-right font-bold text-slate-900">{formatINR(it.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="px-8 sm:px-12 mb-6 flex justify-end">
                                <div className="w-full sm:w-80 space-y-2">
                                    <div className="flex justify-between text-sm text-slate-600 px-2">
                                        <span>Subtotal</span><span className="font-semibold">{formatINR(viewing.total)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-emerald-700 px-2">
                                        <span>Amount Paid</span><span className="font-semibold">- {formatINR(viewing.amount_paid)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 px-4 rounded-2xl bg-gradient-to-r from-[#4A3FBF] to-[#7c3aed] text-white shadow-lg">
                                        <span className="font-heading font-bold text-base">Balance Due</span>
                                        <span className="font-heading text-2xl font-extrabold">{formatINR(viewing.total - viewing.amount_paid)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment history */}
                            {viewing.payments?.length > 0 && (
                                <div className="px-8 sm:px-12 mb-6">
                                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Payment History</div>
                                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-emerald-50 text-emerald-800">
                                                <tr>
                                                    <th className="text-left py-2 px-4 font-bold text-xs uppercase">Date</th>
                                                    <th className="text-left py-2 px-4 font-bold text-xs uppercase">Method</th>
                                                    <th className="text-left py-2 px-4 font-bold text-xs uppercase">Reference</th>
                                                    <th className="text-right py-2 px-4 font-bold text-xs uppercase">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {viewing.payments.map((p) => (
                                                    <tr key={p.id} className="border-t border-slate-100">
                                                        <td className="py-2 px-4">{p.paid_at?.slice(0, 10)}</td>
                                                        <td className="py-2 px-4 capitalize">{p.method}</td>
                                                        <td className="py-2 px-4 text-xs text-slate-500 font-mono">{p.reference || "—"}</td>
                                                        <td className="py-2 px-4 text-right font-bold text-emerald-700">{formatINR(p.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {viewing.notes && (
                                <div className="px-8 sm:px-12 mb-6">
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">Note</div>
                                        <div className="text-sm text-amber-900">{viewing.notes}</div>
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="px-8 sm:px-12 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600">
                                <div>
                                    <div className="font-bold uppercase tracking-widest text-slate-700 mb-1">Payment Methods</div>
                                    <div>Cash · UPI · Card · Bank Transfer</div>
                                    <div className="mt-2 italic">Please mention invoice no. <span className="font-mono font-bold">{viewing.invoice_no}</span> while paying.</div>
                                </div>
                                <div className="sm:text-right">
                                    <div className="font-bold uppercase tracking-widest text-slate-700 mb-1">Authorised Signatory</div>
                                    <div className="mt-6 border-t border-slate-300 inline-block pt-1 px-8 text-slate-500">for {SCHOOL.short}</div>
                                </div>
                            </div>

                            {/* Bottom thank-you bar */}
                            <div className="mt-6 px-8 sm:px-12 py-4 text-center bg-gradient-to-r from-[#4A3FBF] via-[#7c3aed] to-[#F39C2A] text-white">
                                <div className="font-heading font-bold text-base">Thank you for choosing {SCHOOL.short} 💜</div>
                                <div className="text-xs text-white/90 mt-0.5">For queries contact {SCHOOL.email} · {SCHOOL.phone}</div>
                            </div>
                            <div className="h-3 bg-gradient-to-r from-[#F39C2A] via-[#7c3aed] to-[#4A3FBF]" />
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
