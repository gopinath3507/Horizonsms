import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;
export const API = `${BASE}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("hitps_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const formatApiError = (e) => {
    const d = e?.response?.data?.detail;
    if (!d) return e?.message || "Something went wrong";
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return d.map((x) => x?.msg || JSON.stringify(x)).join(", ");
    return JSON.stringify(d);
};
