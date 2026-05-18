# Prompt สำหรับ Claude Code

ใช้ prompt นี้ตอนเปิดโปรเจกต์ใน Claude Code

---

## 📋 Prompt ที่ 1 — เริ่มต้น Session ใหม่ (Copy ทั้งหมดด้านล่าง)

```
ผมกำลังทำเว็บแอป "Vocab Keeper" — แอปจดจำคำศัพท์ภาษาอังกฤษพร้อมระบบ Spaced Repetition

โปรเจกต์นี้สร้างโดย Vanilla JavaScript + HTML + CSS เชื่อมต่อกับ Supabase (PostgreSQL)
ทุกอย่างถูกตั้งค่าและเชื่อมต่อเรียบร้อยแล้ว — ตอนนี้ต้องการให้คุณช่วยทดสอบและพัฒนาต่อ

## โครงสร้างโปรเจกต์

```
vocab-keeper/
├── index.html                ← หน้าหลัก (5 page sections)
├── login.html                ← หน้า Login / Register
├── css/style.css             ← Styles + Dark mode + Modal
├── js/
│   ├── config.js             ← Supabase URL + anon key (ห้ามแก้ไขโดยไม่ confirm)
│   ├── supabase-client.js    ← Supabase client + auth helpers
│   ├── api.js                ← CRUD operations
│   ├── charts.js             ← Custom canvas charts
│   └── app.js                ← Logic ของทุกหน้า
├── supabase-schema.sql       ← Schema (รันแล้วใน Supabase)
├── supabase-seed.sql         ← Seed data (รันแล้ว)
├── HANDOVER.md               ← สรุปสถานะปัจจุบัน + roadmap
└── SUPABASE_SETUP.md         ← คู่มือ setup
```

## เริ่มต้นด้วย

กรุณา:
1. อ่าน `HANDOVER.md` ก่อน เพื่อเข้าใจสถานะปัจจุบัน
2. ดูโครงสร้างไฟล์ใน `js/` ทั้งหมด
3. ดู Schema ใน `supabase-schema.sql`

แล้วบอกผมว่าเข้าใจโปรเจกต์แล้ว พร้อมช่วยทำอะไรต่อบ้าง

## สิ่งที่ต้องทำต่อ (ตามลำดับความสำคัญ)

1. **ทดสอบในเครื่อง** — รัน local server และเปิด login.html
2. **แก้ bug** ถ้าเจอ
3. **Deploy ขึ้น Vercel**
4. **เพิ่มฟีเจอร์ใหม่** ตาม roadmap

ภาษาที่ใช้คุยกัน: ภาษาไทย
สไตล์การตอบ: กระชับ ตรงประเด็น มีตัวอย่างโค้ดเมื่อจำเป็น
```

---

## 📋 Prompt ที่ 2 — สำหรับทดสอบครั้งแรก

ใช้หลังจาก Claude Code อ่านโปรเจกต์เสร็จแล้ว

```
ช่วยผมทดสอบโปรเจกต์ครั้งแรก:

1. แนะนำคำสั่งรัน local server ที่เหมาะกับ OS ของผม (ผมใช้ Windows)
2. เปิดด้วย http://localhost:PORT/login.html
3. ผมจะ login แล้วบอกคุณว่าหน้าไหนใช้งานได้ / หน้าไหนมีปัญหา
4. ถ้าเจอ error ใน browser console ผมจะ paste มาให้ดู

เริ่มกันเลย
```

---

## 📋 Prompt ที่ 3 — สำหรับ Deploy ขึ้น Vercel

ใช้เมื่อทดสอบทุกอย่างเรียบร้อย พร้อม deploy

```
ผมต้องการ deploy แอปนี้ขึ้น Vercel แบบฟรี

ช่วยทำตามขั้นตอน:
1. สร้าง .gitignore ที่เหมาะสม
2. แนะนำการ commit ขึ้น GitHub
3. แนะนำการ connect Vercel กับ repo
4. ตรวจสอบว่า config.js ปลอดภัยที่จะ public หรือไม่ (anon key มี RLS ป้องกัน)
5. แนะนำ custom domain (ถ้ามี)
```

---

## 📋 Prompt ที่ 4 — Import ข้อมูลเดิมจาก Google Sheets

ใช้เมื่ออยากย้ายคำศัพท์เดิมเข้ามา

```
ผมมีไฟล์ CSV ส่งออกจาก Google Sheets เดิม มี columns:
ID, Word, MeaningTH, POS, Example, Tag, Note, frequently, Status, 
CorrectCount, WrongCount, Streak, LastReview, NextReview, CreatedAt, UpdatedAt

ช่วยผม:
1. สร้างหน้า Import ในแอป (เพิ่มใน Settings หรือทำ modal)
2. รับไฟล์ CSV → parse → แสดง preview
3. ให้ user คอนเฟิร์มแล้ว insert เข้า Supabase
4. Handle ข้อมูลที่ duplicate (skip หรือ overwrite ให้เลือก)
5. Map columns: 
   - frequently (ดาว) → toeic_frequency
   - Tag (text "Socializing") → tags array
   - Status เดิม (Mastered/Review/Learning) → keep as-is
```

---

## 📋 Prompt ที่ 5 — เพิ่มฟีเจอร์ใหม่

Template สำหรับขอฟีเจอร์ใหม่

```
ผมอยากเพิ่มฟีเจอร์: [ชื่อฟีเจอร์]

รายละเอียด: [อธิบาย]

ช่วยผม:
1. บอกว่าต้องแก้ไฟล์ไหนบ้าง
2. ต้องเพิ่ม column / table ใน Supabase หรือไม่ (ถ้าใช่ เขียน SQL ให้)
3. เขียนโค้ดให้
4. บอกวิธีทดสอบ
```

---

## 💡 Tips สำหรับทำงานกับ Claude Code

1. **เปิดโฟลเดอร์โปรเจกต์ก่อน** — ใน Claude Code: `cd vocab-keeper` แล้วเริ่ม
2. **อย่าให้แก้ทุกอย่างทีเดียว** — แบ่งงานเป็นชิ้นเล็กๆ จะได้ตรวจง่าย
3. **commit บ่อยๆ** — หลังแก้ทุกอย่างที่ใช้งานได้
4. **ใช้ Git branch** สำหรับฟีเจอร์ใหม่ — `git checkout -b feature/import-csv`
5. **ตรวจ console ทุกครั้ง** — ถ้ามี error ส่งให้ Claude Code ดู

---

## 🔑 ข้อมูลสำคัญที่ Claude Code ต้องรู้

**Supabase Project:**
- URL: `https://jwqynrapgjxcfjlccsmb.supabase.co`
- anon key: อยู่ใน `js/config.js`
- Project ref: `jwqynrapgjxcfjlccsmb`

**Database Tables:**
- `public.words` (มีคำศัพท์)
- `public.review_logs` (ประวัติทบทวน)

**Database Functions (RPC):**
- `review_word(p_word_id text, p_rating review_rating)` → returns word
- `get_dashboard_stats()` → returns json

**Auth:**
- Email/password (Email confirmation ปิดอยู่)
- Row Level Security เปิดทุกตาราง

**Stack:**
- Frontend: Vanilla JS + HTML + CSS (no framework)
- Backend: Supabase
- Charts: Custom canvas (no Chart.js)
- Icons: Lucide (CDN)
- Fonts: Plus Jakarta Sans + Sarabun (Google Fonts)
