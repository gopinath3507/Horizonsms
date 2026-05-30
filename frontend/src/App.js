import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
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
import ParentsPage from "@/pages/ParentsPage";
import HomeworkPage from "@/pages/HomeworkPage";
import ParentDashboardPage from "@/pages/ParentDashboardPage";

function RoleHome() {
    const { user } = useAuth();
    if (!user || user === false) return <Navigate to="/login" replace />;
    return <Navigate to={user.role === "parent" ? "/parent" : "/dashboard"} replace />;
}

function RequireRole({ roles, children }) {
    const { user } = useAuth();
    if (!user || user === false) return null;
    if (!roles.includes(user.role)) return <Navigate to={user.role === "parent" ? "/parent" : "/dashboard"} replace />;
    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        {/* Staff / Admin pages */}
                        <Route path="/dashboard"  element={<RequireRole roles={["admin", "staff"]}><DashboardPage /></RequireRole>} />
                        <Route path="/students"   element={<RequireRole roles={["admin", "staff"]}><StudentsPage /></RequireRole>} />
                        <Route path="/attendance" element={<RequireRole roles={["admin", "staff"]}><AttendancePage /></RequireRole>} />
                        <Route path="/gradebook"  element={<RequireRole roles={["admin", "staff"]}><GradebookPage /></RequireRole>} />
                        <Route path="/homework"   element={<RequireRole roles={["admin", "staff"]}><HomeworkPage /></RequireRole>} />
                        <Route path="/billing"    element={<RequireRole roles={["admin", "staff"]}><BillingPage /></RequireRole>} />
                        <Route path="/staff"      element={<RequireRole roles={["admin"]}><StaffPage /></RequireRole>} />
                        <Route path="/parents"    element={<RequireRole roles={["admin"]}><ParentsPage /></RequireRole>} />
                        <Route path="/payroll"    element={<RequireRole roles={["admin"]}><PayrollPage /></RequireRole>} />
                        {/* Parent page */}
                        <Route path="/parent" element={<RequireRole roles={["parent"]}><ParentDashboardPage /></RequireRole>} />
                    </Route>
                    <Route path="/" element={<RoleHome />} />
                    <Route path="*" element={<RoleHome />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
