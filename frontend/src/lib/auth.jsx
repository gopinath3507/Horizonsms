import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, formatApiError } from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);   // null=checking, false=anon, obj=user
    const [error, setError] = useState("");

    const fetchMe = useCallback(async () => {
        const token = localStorage.getItem("hitps_token");
        if (!token) { setUser(false); return; }
        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
        } catch {
            localStorage.removeItem("hitps_token");
            setUser(false);
        }
    }, []);

    useEffect(() => { fetchMe(); }, [fetchMe]);

    const login = async (loginVal, password) => {
        setError("");
        try {
            const { data } = await api.post("/auth/login", { login: loginVal, password });
            localStorage.setItem("hitps_token", data.access_token);
            localStorage.setItem("hitps_last_role", JSON.stringify(data.user.role));
            setUser(data.user);
            return true;
        } catch (e) {
            setError(formatApiError(e));
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem("hitps_token");
        setUser(false);
    };

    return (
        <AuthCtx.Provider value={{ user, login, logout, error, setError }}>
            {children}
        </AuthCtx.Provider>
    );
}

export const useAuth = () => useContext(AuthCtx);
