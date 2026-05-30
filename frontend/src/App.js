import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import StudentsPage from "@/pages/StudentsPage";
import AttendancePage from "@/pages/AttendancePage";
import GradebookPage from "@/pages/GradebookPage";
import BillingPage from "@/pages/BillingPage";
import StaffPage from "@/pages/StaffPage";
import PayrollPage from "@/pages/PayrollPage";

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/students" element={<StudentsPage />} />
                        <Route path="/attendance" element={<AttendancePage />} />
                        <Route path="/gradebook" element={<GradebookPage />} />
                        <Route path="/billing" element={<BillingPage />} />
                        <Route path="/staff" element={<ProtectedRoute requireAdmin><StaffPage /></ProtectedRoute>} />
                        <Route path="/payroll" element={<ProtectedRoute requireAdmin><PayrollPage /></ProtectedRoute>} />
                    </Route>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
