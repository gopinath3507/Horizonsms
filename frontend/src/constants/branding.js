export const LOGO_URL = "https://customer-assets.emergentagent.com/job_d36639f8-a3b4-44b2-9bb7-fc1d3aa4d809/artifacts/wliplyag_Logo%20nn.png";

export const SCHOOL = {
    name: "Horizon International Tech Play School",
    short: "Horizon International",
    address: "No 46, 1st Cross, Shri Veeranjaneya Temple Road, near SLR Packagings, Thirumalapura, Bengaluru, Karnataka 560073",
    phone: "+91 7353101553",
    email: "horizoninternational04@gmail.com",
};

export const CLASS_OPTIONS = ["Day-Care", "Pre-Nursery", "Nursery", "LKG", "UKG"];
export const FEE_CATEGORIES = ["Standard", "Half-Day", "Full-Day", "Sibling-Discount"];
export const SUBJECTS = ["English", "Numbers", "Rhymes", "Drawing", "General Awareness", "Activity"];

export const formatINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
