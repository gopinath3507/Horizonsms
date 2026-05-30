import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function ProtectedRoute({ children, requireAdmin = false }) {
    const { user } = useAuth();
    if (user === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-slate-500 font-medium" data-testid="loading-spinner">Loading…</div>
            </div>
        );
    }
    if (user === false) return <Navigate to="/login" replace />;
    if (requireAdmin && user.role !== "admin") return <Navigate to="/dashboard" replace />;
    return children;
}
