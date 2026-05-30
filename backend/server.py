from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt as pyjwt
from datetime import datetime, timezone, timedelta, date as date_cls
from typing import List, Optional, Literal, Dict, Any

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# ---------- Config ----------
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
ACCESS_TOKEN_MINUTES = 60 * 24  # 24h

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Horizon International Tech Play School - API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("horizon")


# ---------- Helpers ----------
def hash_password(pwd: str) -> str:
    return bcrypt.hashpw(pwd.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(pwd: str, hashed: str) -> bool:
    return bcrypt.checkpw(pwd.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MINUTES),
        "type": "access",
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def new_id() -> str:
    return str(uuid.uuid4())


# ---------- Models ----------
class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: Literal["admin", "staff"]
    phone: Optional[str] = None
    created_at: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class StaffCreateIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    role: Literal["staff", "admin"] = "staff"

class StaffUpdateIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[Literal["staff", "admin"]] = None
    password: Optional[str] = None

CLASS_OPTIONS = ["Day-Care", "Pre-Nursery", "Nursery", "LKG", "UKG"]

class StudentIn(BaseModel):
    name: str
    dob: Optional[str] = None  # ISO date
    gender: Optional[Literal["Male", "Female", "Other"]] = None
    class_name: str
    photo_url: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    enrollment_date: Optional[str] = None
    status: Literal["active", "inactive"] = "active"
    fee_category: str = "Standard"
    monthly_fee: float = 3000.0
    notes: Optional[str] = None

class AttendanceIn(BaseModel):
    student_id: str
    date: str  # YYYY-MM-DD
    status: Literal["present", "absent", "late"]
    note: Optional[str] = None

class AttendanceBulkIn(BaseModel):
    date: str
    class_name: Optional[str] = None
    entries: List[AttendanceIn]

class GradeWeightIn(BaseModel):
    class_name: str
    homework: float = 30.0
    exams: float = 70.0

class GradeEntryIn(BaseModel):
    student_id: str
    subject: str
    category: Literal["homework", "exam"]
    score: float
    max_score: float = 100.0
    term: str = "Term 1"

class InvoiceItem(BaseModel):
    description: str
    amount: float

class InvoiceIn(BaseModel):
    student_id: str
    items: List[InvoiceItem]
    due_date: str
    notes: Optional[str] = None

class PaymentIn(BaseModel):
    invoice_id: str
    amount: float
    method: Literal["cash", "card", "upi", "bank_transfer", "stripe"] = "cash"
    reference: Optional[str] = None

class PayrollIn(BaseModel):
    staff_id: str
    month: str  # YYYY-MM
    base_salary: float
    bonus: float = 0.0
    deductions: float = 0.0
    status: Literal["pending", "paid"] = "pending"
    paid_date: Optional[str] = None


# ---------- Auth Dependencies ----------
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------- Startup ----------
@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.students.create_index("name")
    await db.attendance.create_index([("student_id", 1), ("date", 1)], unique=True)
    await db.invoices.create_index("student_id")

    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": new_id(),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "phone": "+91 7353101553",
            "created_at": now_iso(),
        })
        logger.info(f"Seeded admin: {admin_email}")
    else:
        # Keep admin password in sync with env (idempotent)
        if not verify_password(admin_password, existing.get("password_hash", "")):
            await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
            logger.info("Updated admin password to match .env")
        # Migrate old display name to short form
        if existing.get("name") == "School Administrator":
            await db.users.update_one({"email": admin_email}, {"$set": {"name": "Admin"}})


@app.on_event("shutdown")
async def shutdown_event():
    client.close()


# ---------- Public ----------
@api.get("/")
async def root():
    return {"message": "Horizon International Tech Play School API", "version": "1.0"}

@api.get("/school/info")
async def school_info():
    return {
        "name": "Horizon International Tech Play School",
        "address": "No 46, 1st Cross, Shri Veeranjaneya Temple Road, near SLR Packagings, Thirumalapura, Bengaluru, Karnataka 560073",
        "phone": "+91 7353101553",
        "email": "horizoninternational04@gmail.com",
        "classes": CLASS_OPTIONS,
    }


# ---------- Auth ----------
@api.post("/auth/login", response_model=TokenOut)
async def login(data: LoginIn):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], user["email"], user["role"])
    user_out = UserOut(
        id=user["id"], email=user["email"], name=user["name"],
        role=user["role"], phone=user.get("phone"), created_at=user.get("created_at")
    )
    return TokenOut(access_token=token, user=user_out)

@api.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return UserOut(**user)


# ---------- Staff Management (Admin) ----------
@api.get("/staff", response_model=List[UserOut])
async def list_staff(_: dict = Depends(require_admin)):
    cur = db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1)
    return [UserOut(**u) async for u in cur]

@api.post("/staff", response_model=UserOut)
async def create_staff(data: StaffCreateIn, _: dict = Depends(require_admin)):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already exists")
    doc = {
        "id": new_id(), "email": email, "password_hash": hash_password(data.password),
        "name": data.name, "role": data.role, "phone": data.phone, "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    return UserOut(id=doc["id"], email=doc["email"], name=doc["name"], role=doc["role"], phone=doc["phone"], created_at=doc["created_at"])

@api.patch("/staff/{staff_id}", response_model=UserOut)
async def update_staff(staff_id: str, data: StaffUpdateIn, _: dict = Depends(require_admin)):
    updates: Dict[str, Any] = {}
    if data.name is not None: updates["name"] = data.name
    if data.phone is not None: updates["phone"] = data.phone
    if data.role is not None: updates["role"] = data.role
    if data.password: updates["password_hash"] = hash_password(data.password)
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")
    res = await db.users.update_one({"id": staff_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Staff not found")
    u = await db.users.find_one({"id": staff_id}, {"_id": 0, "password_hash": 0})
    return UserOut(**u)

@api.delete("/staff/{staff_id}")
async def delete_staff(staff_id: str, admin: dict = Depends(require_admin)):
    if staff_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    res = await db.users.delete_one({"id": staff_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {"ok": True}


# ---------- Students ----------
@api.get("/students")
async def list_students(class_name: Optional[str] = None, status_filter: Optional[str] = None, _: dict = Depends(get_current_user)):
    q: Dict[str, Any] = {}
    if class_name: q["class_name"] = class_name
    if status_filter: q["status"] = status_filter
    students = [s async for s in db.students.find(q, {"_id": 0}).sort("name", 1)]
    # Aggregate billing per student
    pipeline = [{"$group": {"_id": "$student_id", "total_billed": {"$sum": "$total"}, "total_paid": {"$sum": "$amount_paid"}}}]
    bill_map: Dict[str, Dict[str, float]] = {}
    async for r in db.invoices.aggregate(pipeline):
        bill_map[r["_id"]] = {"total_billed": float(r.get("total_billed", 0) or 0), "total_paid": float(r.get("total_paid", 0) or 0)}
    for s in students:
        b = bill_map.get(s["id"], {"total_billed": 0.0, "total_paid": 0.0})
        s["total_billed"] = round(b["total_billed"], 2)
        s["total_paid"] = round(b["total_paid"], 2)
        s["balance"] = round(b["total_billed"] - b["total_paid"], 2)
    return students

@api.post("/students")
async def create_student(data: StudentIn, _: dict = Depends(get_current_user)):
    doc = data.model_dump()
    doc["id"] = new_id()
    doc["created_at"] = now_iso()
    if not doc.get("enrollment_date"):
        doc["enrollment_date"] = datetime.now(timezone.utc).date().isoformat()
    await db.students.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/students/{student_id}")
async def get_student(student_id: str, _: dict = Depends(get_current_user)):
    s = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
    return s

@api.patch("/students/{student_id}")
async def update_student(student_id: str, data: StudentIn, _: dict = Depends(get_current_user)):
    res = await db.students.update_one({"id": student_id}, {"$set": data.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    s = await db.students.find_one({"id": student_id}, {"_id": 0})
    return s

@api.delete("/students/{student_id}")
async def delete_student(student_id: str, _: dict = Depends(require_admin)):
    res = await db.students.delete_one({"id": student_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"ok": True}


# ---------- Attendance ----------
@api.get("/attendance")
async def list_attendance(date: Optional[str] = None, student_id: Optional[str] = None, class_name: Optional[str] = None, _: dict = Depends(get_current_user)):
    q: Dict[str, Any] = {}
    if date: q["date"] = date
    if student_id: q["student_id"] = student_id
    if class_name:
        # filter by class via student lookup
        student_ids = [s["id"] async for s in db.students.find({"class_name": class_name}, {"id": 1, "_id": 0})]
        q["student_id"] = {"$in": student_ids}
    cur = db.attendance.find(q, {"_id": 0})
    return [a async for a in cur]

@api.post("/attendance/bulk")
async def bulk_attendance(data: AttendanceBulkIn, user: dict = Depends(get_current_user)):
    saved = []
    triggered_warnings = []
    for e in data.entries:
        doc = {
            "id": new_id(),
            "student_id": e.student_id,
            "date": e.date,
            "status": e.status,
            "note": e.note,
            "marked_by": user["id"],
            "marked_at": now_iso(),
        }
        await db.attendance.update_one(
            {"student_id": e.student_id, "date": e.date},
            {"$set": doc},
            upsert=True,
        )
        saved.append(doc)
        # MOCK SMS/Email trigger when absent/late
        if e.status in ("absent", "late"):
            student = await db.students.find_one({"id": e.student_id}, {"_id": 0})
            if student and student.get("parent_phone"):
                msg = f"[MOCK SMS to {student.get('parent_phone')}] Dear {student.get('parent_name','Parent')}, your child {student.get('name')} was marked {e.status.upper()} on {e.date}. - Horizon International Tech Play School"
                logger.info(msg)
                triggered_warnings.append({"student_id": e.student_id, "channel": "sms", "to": student.get("parent_phone"), "message": msg})
    return {"saved_count": len(saved), "warnings_triggered": triggered_warnings}

@api.get("/attendance/summary")
async def attendance_summary(_: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().isoformat()
    total_students = await db.students.count_documents({"status": "active"})
    today_records = await db.attendance.count_documents({"date": today})
    today_present = await db.attendance.count_documents({"date": today, "status": "present"})
    today_absent = await db.attendance.count_documents({"date": today, "status": "absent"})
    today_late = await db.attendance.count_documents({"date": today, "status": "late"})
    # 7-day avg
    seven_days_ago = (datetime.now(timezone.utc).date() - timedelta(days=7)).isoformat()
    pipeline = [
        {"$match": {"date": {"$gte": seven_days_ago, "$lte": today}}},
        {"$group": {"_id": "$date", "present": {"$sum": {"$cond": [{"$eq": ["$status", "present"]}, 1, 0]}}, "total": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    daily = []
    async for d in db.attendance.aggregate(pipeline):
        rate = (d["present"] / d["total"] * 100) if d["total"] else 0
        daily.append({"date": d["_id"], "present": d["present"], "total": d["total"], "rate": round(rate, 1)})
    avg_rate = round(sum(d["rate"] for d in daily) / len(daily), 1) if daily else 0
    return {
        "total_active_students": total_students,
        "today": {"date": today, "records": today_records, "present": today_present, "absent": today_absent, "late": today_late},
        "weekly_daily": daily,
        "average_daily_attendance_pct": avg_rate,
    }


# ---------- Gradebook ----------
@api.get("/grades/weights/{class_name}")
async def get_weights(class_name: str, _: dict = Depends(get_current_user)):
    doc = await db.grade_weights.find_one({"class_name": class_name}, {"_id": 0})
    if not doc:
        return {"class_name": class_name, "homework": 30.0, "exams": 70.0}
    return doc

@api.post("/grades/weights")
async def set_weights(data: GradeWeightIn, _: dict = Depends(get_current_user)):
    if abs(data.homework + data.exams - 100.0) > 0.01:
        raise HTTPException(status_code=400, detail="Weights must sum to 100")
    await db.grade_weights.update_one(
        {"class_name": data.class_name},
        {"$set": data.model_dump()},
        upsert=True,
    )
    return data

@api.post("/grades")
async def add_grade(data: GradeEntryIn, user: dict = Depends(get_current_user)):
    doc = data.model_dump()
    doc["id"] = new_id()
    doc["recorded_by"] = user["id"]
    doc["recorded_at"] = now_iso()
    await db.grades.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/grades")
async def list_grades(student_id: Optional[str] = None, _: dict = Depends(get_current_user)):
    q: Dict[str, Any] = {}
    if student_id: q["student_id"] = student_id
    cur = db.grades.find(q, {"_id": 0})
    return [g async for g in cur]

@api.delete("/grades/{grade_id}")
async def delete_grade(grade_id: str, _: dict = Depends(get_current_user)):
    res = await db.grades.delete_one({"id": grade_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Grade not found")
    return {"ok": True}

def letter_grade(pct: float) -> str:
    if pct >= 90: return "A+"
    if pct >= 80: return "A"
    if pct >= 70: return "B"
    if pct >= 60: return "C"
    if pct >= 50: return "D"
    return "F"

@api.get("/grades/report/{student_id}")
async def grade_report(student_id: str, _: dict = Depends(get_current_user)):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    grades = [g async for g in db.grades.find({"student_id": student_id}, {"_id": 0})]
    weights_doc = await db.grade_weights.find_one({"class_name": student["class_name"]}, {"_id": 0}) or {"homework": 30.0, "exams": 70.0}
    # Group by subject
    subjects: Dict[str, Dict[str, list]] = {}
    for g in grades:
        s = subjects.setdefault(g["subject"], {"homework": [], "exam": []})
        s[g["category"]].append((g["score"], g["max_score"]))
    report = []
    for subj, cats in subjects.items():
        hw_pct = (sum(s for s, _ in cats["homework"]) / sum(m for _, m in cats["homework"]) * 100) if cats["homework"] else 0
        ex_pct = (sum(s for s, _ in cats["exam"]) / sum(m for _, m in cats["exam"]) * 100) if cats["exam"] else 0
        final_pct = (hw_pct * weights_doc["homework"] / 100) + (ex_pct * weights_doc["exams"] / 100)
        report.append({
            "subject": subj, "homework_pct": round(hw_pct, 1), "exam_pct": round(ex_pct, 1),
            "final_pct": round(final_pct, 1), "letter": letter_grade(final_pct),
        })
    overall = round(sum(r["final_pct"] for r in report) / len(report), 1) if report else 0
    return {
        "student": student, "weights": weights_doc, "subjects": report,
        "overall_pct": overall, "overall_letter": letter_grade(overall),
    }


# ---------- Billing ----------
@api.post("/invoices")
async def create_invoice(data: InvoiceIn, _: dict = Depends(require_admin)):
    student = await db.students.find_one({"id": data.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    total = sum(item.amount for item in data.items)
    # invoice number
    count = await db.invoices.count_documents({})
    invoice_no = f"HITPS-{datetime.now(timezone.utc).year}-{count + 1:05d}"
    doc = {
        "id": new_id(),
        "invoice_no": invoice_no,
        "student_id": data.student_id,
        "student_name": student["name"],
        "class_name": student.get("class_name"),
        "items": [i.model_dump() for i in data.items],
        "total": total,
        "amount_paid": 0.0,
        "due_date": data.due_date,
        "issued_date": datetime.now(timezone.utc).date().isoformat(),
        "status": "pending",
        "notes": data.notes,
        "created_at": now_iso(),
    }
    await db.invoices.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/invoices")
async def list_invoices(student_id: Optional[str] = None, status_filter: Optional[str] = None, _: dict = Depends(get_current_user)):
    q: Dict[str, Any] = {}
    if student_id: q["student_id"] = student_id
    if status_filter: q["status"] = status_filter
    cur = db.invoices.find(q, {"_id": 0}).sort("created_at", -1)
    return [i async for i in cur]

@api.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str, _: dict = Depends(get_current_user)):
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    payments = [p async for p in db.payments.find({"invoice_id": invoice_id}, {"_id": 0})]
    return {**inv, "payments": payments}

@api.post("/payments")
async def record_payment(data: PaymentIn, _: dict = Depends(require_admin)):
    inv = await db.invoices.find_one({"id": data.invoice_id})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    pay = {
        "id": new_id(),
        "invoice_id": data.invoice_id,
        "amount": data.amount,
        "method": data.method,
        "reference": data.reference or (f"STRIPE-MOCK-{new_id()[:8]}" if data.method == "stripe" else None),
        "paid_at": now_iso(),
    }
    await db.payments.insert_one(pay)
    new_paid = inv.get("amount_paid", 0.0) + data.amount
    new_status = "paid" if new_paid >= inv["total"] else "partial"
    await db.invoices.update_one({"id": data.invoice_id}, {"$set": {"amount_paid": new_paid, "status": new_status}})
    pay.pop("_id", None)
    return pay

@api.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, _: dict = Depends(require_admin)):
    await db.payments.delete_many({"invoice_id": invoice_id})
    res = await db.invoices.delete_one({"id": invoice_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"ok": True}


# ---------- Payroll ----------
@api.get("/payroll")
async def list_payroll(_: dict = Depends(require_admin)):
    cur = db.payroll.find({}, {"_id": 0}).sort("month", -1)
    return [p async for p in cur]

@api.post("/payroll")
async def create_payroll(data: PayrollIn, _: dict = Depends(require_admin)):
    staff = await db.users.find_one({"id": data.staff_id})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    doc = data.model_dump()
    doc["id"] = new_id()
    doc["staff_name"] = staff["name"]
    doc["net_salary"] = data.base_salary + data.bonus - data.deductions
    doc["created_at"] = now_iso()
    await db.payroll.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.patch("/payroll/{payroll_id}/mark-paid")
async def mark_payroll_paid(payroll_id: str, _: dict = Depends(require_admin)):
    res = await db.payroll.update_one({"id": payroll_id}, {"$set": {"status": "paid", "paid_date": datetime.now(timezone.utc).date().isoformat()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payroll not found")
    return {"ok": True}

@api.delete("/payroll/{payroll_id}")
async def delete_payroll(payroll_id: str, _: dict = Depends(require_admin)):
    res = await db.payroll.delete_one({"id": payroll_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payroll not found")
    return {"ok": True}


# ---------- Dashboard ----------
@api.get("/dashboard/stats")
async def dashboard_stats(_: dict = Depends(get_current_user)):
    total_students = await db.students.count_documents({"status": "active"})
    total_staff = await db.users.count_documents({"role": "staff"})
    today = datetime.now(timezone.utc).date().isoformat()
    today_present = await db.attendance.count_documents({"date": today, "status": "present"})
    today_total = await db.attendance.count_documents({"date": today})
    attendance_pct = round(today_present / today_total * 100, 1) if today_total else 0

    # fees aggregate
    total_billed = 0.0
    total_collected = 0.0
    total_pending = 0.0
    async for inv in db.invoices.find({}, {"_id": 0, "total": 1, "amount_paid": 1, "status": 1}):
        total_billed += inv.get("total", 0.0)
        total_collected += inv.get("amount_paid", 0.0)
        total_pending += max(0.0, inv.get("total", 0.0) - inv.get("amount_paid", 0.0))

    # class distribution
    pipeline = [{"$match": {"status": "active"}}, {"$group": {"_id": "$class_name", "count": {"$sum": 1}}}]
    by_class = [{"class_name": r["_id"], "count": r["count"]} async for r in db.students.aggregate(pipeline)]

    # 7-day attendance trend
    seven_days_ago = (datetime.now(timezone.utc).date() - timedelta(days=7)).isoformat()
    trend_pipeline = [
        {"$match": {"date": {"$gte": seven_days_ago, "$lte": today}}},
        {"$group": {"_id": "$date", "present": {"$sum": {"$cond": [{"$eq": ["$status", "present"]}, 1, 0]}}, "total": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    trend = []
    async for d in db.attendance.aggregate(trend_pipeline):
        rate = (d["present"] / d["total"] * 100) if d["total"] else 0
        trend.append({"date": d["_id"], "rate": round(rate, 1)})

    return {
        "total_active_students": total_students,
        "total_staff": total_staff,
        "today_attendance_pct": attendance_pct,
        "today_present": today_present,
        "today_total": today_total,
        "total_fees_billed": round(total_billed, 2),
        "total_fees_collected": round(total_collected, 2),
        "total_fees_pending": round(total_pending, 2),
        "students_by_class": by_class,
        "attendance_trend": trend,
    }


# ---------- Mount ----------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
