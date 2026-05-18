# HANDOVER — Vocab Keeper

เอกสารส่งต่อสำหรับใช้งานต่อใน Claude Code หรือเครื่องมืออื่น

---

## 📦 สถานะปัจจุบัน

### ✅ เสร็จแล้ว

**Database (Supabase)**
- ✅ ตาราง `words` + `review_logs` พร้อม indexes
- ✅ Enum: `word_status`, `review_rating`
- ✅ Function: `review_word()`, `get_dashboard_stats()`, `update_updated_at()`
- ✅ Row Level Security (RLS) policies ครบ
- ✅ Seed data 12 คำสำหรับทดสอบ
- ✅ User ทดลองใน Authentication

**Frontend (HTML/CSS/JS)**
- ✅ 5 หน้าครบ: Add / Library / Dashboard / Review / Game
- ✅ ระบบ Login/Register (`login.html`)
- ✅ เชื่อมต่อ Supabase แล้วทุกหน้า
- ✅ Edit Modal สำหรับแก้ไขคำ
- ✅ Dark mode
- ✅ Loading states + Error handling
- ✅ Text-to-Speech (ภาษาอังกฤษ + ไทย)
- ✅ Keyboard shortcuts (Space, ←→, 1-4 ในหน้า Review)
- ✅ Spaced Repetition คำนวณที่ฝั่ง DB (function `review_word`)

### ⏳ ยังไม่ได้ทดสอบ

โค้ดเชื่อมต่อ Supabase **เขียนเสร็จแล้วแต่ยังไม่ได้รันทดสอบจริงในเครื่อง**  
ต้องเปิดในเครื่องคุณ + ทดสอบทีละหน้าก่อน

### 🔜 ที่เหลือ (Phase 2C+)

1. **ทดสอบทุกหน้าใน browser** ว่าเชื่อม Supabase ได้จริง
2. **แก้ bug ที่อาจเจอ** ระหว่างทดสอบ
3. **Deploy ขึ้น Vercel** (ฟรี)
4. **เพิ่มฟีเจอร์ (optional):**
   - Import CSV จาก Google Sheets
   - Export ข้อมูลเป็น CSV
   - แก้ไข tag filter ให้เปลี่ยนได้ (ตอนนี้ hard-code "Business")
   - หน้า Profile / Settings (ตั้ง daily goal, เปลี่ยน password)
   - PWA (ใช้แบบ offline ได้)

---

## 🗂️ โครงสร้างไฟล์

```
vocab-keeper/
├── index.html                ← หน้าหลักของแอป (มี 5 page section)
├── login.html                ← หน้า Login / Register
├── css/
│   └── style.css             ← Styles ทั้งหมด + Dark mode + Modal
├── js/
│   ├── config.js             ← Supabase URL + anon key
│   ├── supabase-client.js    ← สร้าง client + auth helpers
│   ├── api.js                ← CRUD operations ทั้งหมด
│   ├── charts.js             ← Donut, Ring, Bar chart (canvas)
│   └── app.js                ← Logic ของทุกหน้า
├── supabase-schema.sql       ← SQL สำหรับสร้าง database (รันแล้ว)
├── supabase-seed.sql         ← SQL สำหรับใส่ข้อมูลตัวอย่าง (รันแล้ว)
├── SUPABASE_SETUP.md         ← คู่มือ setup Supabase
├── HANDOVER.md               ← ไฟล์นี้
└── README.md                 ← README โปรเจกต์
```

---

## 🔐 Credentials & Config

**Supabase Project URL:**
```
https://jwqynrapgjxcfjlccsmb.supabase.co
```

**anon public key** (อยู่ใน `js/config.js` แล้ว):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3cXlucmFwZ2p4Y2ZqbGNjc21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMjY0ODMsImV4cCI6MjA5NDYwMjQ4M30.DdASuQydrnI9XsBYaF7GzegOf8XJQkl2oWOLpPIWtdk
```

---

## 🗄️ Database Schema สำคัญ

### ตาราง `words`
```
id              text (PK)            -- W-xxx (auto-generated)
user_id         uuid (FK → auth.users.id)
word            text NOT NULL
meaning_th      text NOT NULL
pos             text                  -- Noun/Verb/Adjective/Adverb
example         text
note            text
tags            text[]                -- ['Business', 'Finance']
toeic_frequency int (0-3)             -- จำนวนดาว
status          word_status           -- Learning/Review/Mastered
correct_count   int
wrong_count     int
streak          int
last_review     timestamptz
next_review     timestamptz           -- default now()
created_at      timestamptz
updated_at      timestamptz
```

### ตาราง `review_logs`
```
id           bigserial (PK)
word_id      text (FK → words.id)
user_id      uuid (FK → auth.users.id)
rating       review_rating            -- forgot/hard/easy/mastered
reviewed_at  timestamptz
```

### Functions ที่เรียกใช้จาก Frontend

**`review_word(p_word_id, p_rating)`**
- รับ word_id + rating
- คำนวณ streak, status, next_review อัตโนมัติ
- เก็บ log ลง review_logs
- คืน word ที่อัปเดตแล้ว

**`get_dashboard_stats()`**
- คืน JSON: total, learning, mastered, review, not_remembered, due_now,
  added_this_week, reviews_today, tags_breakdown, streak_days

---

## 🧪 วิธีทดสอบในเครื่อง

### 1. รัน local server
```bash
# วิธีที่ 1: Python
python3 -m http.server 8000

# วิธีที่ 2: Node.js
npx serve

# วิธีที่ 3: VSCode Live Server extension
# คลิกขวาที่ login.html → Open with Live Server
```

### 2. เปิด browser
```
http://localhost:8000/login.html
```

### 3. ทดสอบ flow
1. Sign In ด้วย user ที่สร้างไว้ใน Supabase
2. ดูหน้า Library — ควรเห็น 12 คำที่ seed ไว้
3. ลองเพิ่มคำใหม่
4. ลองแก้ไข + ลบคำ
5. ดู Dashboard — ตัวเลขควรตรง
6. ลองทบทวน Flashcard — กดประเมินดู next_review เปลี่ยนไหม
7. ลองเล่น Game

---

## 🆘 ปัญหาที่อาจเจอ + วิธีแก้

### "Failed to fetch" หรือ CORS error
- เปิดด้วย `file://` ไม่ได้ ต้องใช้ local server (ดูข้อ 1 ข้างบน)

### Login แล้วเด้งกลับมาหน้า login
- ตรวจว่า Supabase URL กับ anon key ใน `js/config.js` ถูก
- ตรวจใน Supabase Dashboard → Authentication → Users ว่ามี user จริง
- ดู browser console — ถ้ามี error อ่านดู

### หน้า Library ว่างเปล่า
- เปิด browser console → ตรวจ error
- ลอง query ใน Supabase SQL Editor:
  ```sql
  select * from words where user_id = auth.uid();
  ```
- ตรวจว่า user_id ใน seed data ตรงกับ user ที่ login

### "function review_word does not exist"
- ตรวจว่าได้รัน `supabase-schema.sql` ครบทั้งไฟล์ (ไม่ใช่แค่บางส่วน)
- ลอง list functions: `select proname from pg_proc where proname like 'review%';`

---

## 📋 สำหรับ Claude Code

ดู `CLAUDE_CODE_PROMPT.md` ในไฟล์ที่ส่งให้ — มี prompt พร้อมใช้

---

## 🚀 Roadmap หลังทดสอบเสร็จ

### Phase 3: Polish & Features
- [ ] Import CSV จาก Google Sheets เดิม
- [ ] Export ข้อมูลเป็น CSV/JSON
- [ ] หน้า Profile / Settings
- [ ] เปลี่ยน "tag:Business" filter ให้เป็น dynamic
- [ ] Word audio history (เก็บไฟล์เสียง)
- [ ] Rich example (เน้นคำในประโยค)

### Phase 4: Deploy
- [ ] Push ขึ้น GitHub
- [ ] Connect Vercel → auto deploy
- [ ] ตั้งค่า custom domain (optional)
- [ ] เปิด email confirmation (ตอนนี้ปิดไว้)
- [ ] เพิ่ม Google OAuth login

### Phase 5: Advanced
- [ ] PWA — ใช้แบบ offline ได้
- [ ] Push notification เตือนทบทวน
- [ ] Multi-language UI (TH/EN)
- [ ] Share word list ระหว่างผู้ใช้
- [ ] Leaderboard / gamification
