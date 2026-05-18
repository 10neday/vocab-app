# คู่มือ Setup Supabase สำหรับ Vocab Keeper

คู่มือนี้จะแนะนำการตั้งค่า Supabase database ทีละขั้นตอน

---

## 📋 สิ่งที่จะได้หลังทำตามคู่มือ

- ✅ Database พร้อมใช้งาน (ตาราง words + review_logs)
- ✅ ระบบ Authentication ทำงานได้
- ✅ Row Level Security ที่แยกข้อมูลแต่ละ user
- ✅ Function สำหรับ Spaced Repetition
- ✅ Function ดึงสถิติ Dashboard
- ✅ URL + API Key สำหรับเชื่อมกับเว็บ

---

## ขั้นที่ 1: รัน Schema SQL

1. เข้า [Supabase Dashboard](https://supabase.com/dashboard) → เลือก project ของคุณ
2. คลิก **SQL Editor** (ไอคอนซ้ายมือ รูปกระดาษ)
3. คลิก **+ New query**
4. เปิดไฟล์ `supabase-schema.sql` → copy ทั้งหมด → วางใน SQL Editor
5. กด **Run** (มุมขวาล่าง) หรือ `Ctrl/Cmd + Enter`

ถ้าสำเร็จจะขึ้น `Success. No rows returned`

### ✅ ตรวจสอบว่าทำสำเร็จ

ไปที่ **Table Editor** (ไอคอนตาราง) — ต้องเห็น 2 ตาราง:
- `words`
- `review_logs`

แล้วลองรัน query นี้ใน SQL Editor:
```sql
select * from public.words;
```
ควรได้ผลลัพธ์ว่าง (ยังไม่มีข้อมูล) แต่ไม่ error

---

## ขั้นที่ 2: เปิด Email Authentication

1. คลิก **Authentication** (ไอคอนคน) → **Providers**
2. หา **Email** → ควรจะเปิดอยู่แล้วโดย default
3. ถ้ายังไม่เปิด: คลิก toggle ให้เป็น **Enabled**
4. (แนะนำสำหรับช่วงทดลอง) ปิด **Confirm email** ไว้ก่อน เพื่อไม่ต้องยืนยันอีเมล
   - หาที่: **Authentication → Sign In / Up → Confirm email** → toggle OFF

---

## ขั้นที่ 3: สมัครสมาชิกทดลอง

1. ไปที่ **Authentication → Users**
2. คลิก **Add user** → **Create new user**
3. กรอก email + password (เช่น `test@test.com` / `password123`)
4. คลิก **Create user**

### Copy User UID

หลังสร้างเสร็จ คลิกที่ user ที่สร้าง → จะเห็น **User UID** (เป็น UUID ยาวๆ)  
**Copy เก็บไว้** จะใช้ในขั้นถัดไป

---

## ขั้นที่ 4: ใส่ข้อมูลทดลอง (Optional)

ถ้าอยากมีข้อมูลตัวอย่างไว้ทดสอบ:

1. เปิดไฟล์ `supabase-seed.sql`
2. หาบรรทัด `v_user_id uuid := 'YOUR_USER_ID';`
3. เปลี่ยน `YOUR_USER_ID` เป็น User UID ที่ copy มา (อย่าลืม quote ' ')
4. Copy SQL ทั้งหมด → วางใน SQL Editor → Run

จะได้ข้อมูล 12 คำสำหรับทดสอบ

---

## ขั้นที่ 5: เก็บ API Credentials

ขั้นนี้สำคัญ! จะใช้ในการเชื่อม frontend กับ database

1. คลิก **Project Settings** (ไอคอนเฟือง มุมล่างซ้าย)
2. คลิก **API**
3. จะเห็น 2 ค่าสำคัญ:

### Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```

### anon public key
ภายใต้หัวข้อ **Project API keys** → คัดลอก `anon` `public` (ยาวมาก ขึ้นต้นด้วย `eyJ...`)

**⚠️ คำเตือน:** 
- `anon` key เปิดเผยใน frontend ได้ (ปลอดภัยเพราะมี RLS)
- `service_role` key **ห้าม**เปิดเผย เด็ดขาด (ข้ามผ่าน RLS ได้)

---

## ขั้นที่ 6: ทดสอบจาก Browser Console

วิธีง่ายๆ ก่อนเขียนโค้ดจริง — ทดสอบว่า DB ทำงานได้

1. เปิด browser → ไปหน้าไหนก็ได้ (เช่น google.com)
2. เปิด DevTools (F12) → Console
3. รันโค้ดนี้ (แก้ URL และ KEY ก่อน):

```javascript
// ใส่ค่าของคุณ
const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOi...';  // anon key

// โหลด Supabase SDK
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
document.head.appendChild(script);
await new Promise(r => script.onload = r);

// สร้าง client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ทดสอบ login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@test.com',          // ใช้ email ที่สร้างไว้
  password: 'password123'
});
console.log('Login:', data?.user?.email || error);

// ทดสอบดึงคำศัพท์
const { data: words, error: e2 } = await supabase
  .from('words')
  .select('*')
  .limit(5);
console.log('Words:', words, 'Error:', e2);
```

### ผลลัพธ์ที่ควรเห็น
- `Login: test@test.com`
- `Words: Array(5)...` (ถ้าใส่ seed data) หรือ `[]` (ถ้ายังไม่ใส่)

ถ้าได้ผลแบบนี้ = **Database พร้อมใช้งานแล้ว** ✅

---

## ขั้นที่ 7: บันทึก credentials ไว้

แนะนำให้สร้างไฟล์ `.env.local` ในโฟลเดอร์โปรเจกต์ (จะใช้ในขั้นถัดไป):

```
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
```

**⚠️ อย่า commit ไฟล์ `.env.local` ขึ้น git** เพิ่มใน `.gitignore`

---

## 🎉 เสร็จเรียบร้อย!

ตอนนี้คุณมี:
- ✅ Database พร้อมใช้
- ✅ User ทดลองสำหรับ login
- ✅ ข้อมูลตัวอย่าง (ถ้าทำขั้น 4)
- ✅ URL + API Key สำหรับเชื่อมกับเว็บ

### ขั้นถัดไป (Phase 2B)

ส่ง URL + anon key มาให้ผม (หรือยังไม่ส่งก็ได้ ผมจะทำเป็น placeholder ให้คุณใส่เอง) แล้วผมจะ:
1. แทนที่ `js/mock-data.js` ด้วย `js/supabase-client.js`
2. เพิ่มหน้า Login/Register
3. แก้ทุกหน้าให้เรียกข้อมูลจาก Supabase แทน mock data
4. ระบบ Spaced Repetition จะใช้ function `review_word()` ใน database (เร็วและถูกต้องกว่าคำนวณใน JS)

---

## 🆘 ปัญหาที่อาจเจอ

### `relation "words" already exists`
คุณรัน schema ซ้ำ → ก่อนรันใหม่ ให้รันคำสั่งนี้ก่อนเพื่อ reset:
```sql
drop table if exists public.review_logs cascade;
drop table if exists public.words cascade;
drop type if exists word_status cascade;
drop type if exists review_rating cascade;
```
แล้วค่อยรัน schema ใหม่

### `permission denied for schema public`
ใช้ user ที่มี role admin หรือ owner เพื่อรัน schema (default ของ Supabase ก็ได้อยู่แล้ว)

### Login จาก console ไม่ได้
- ตรวจว่า **Confirm email** ปิดอยู่หรือไม่ (Authentication → Sign In / Up)
- ตรวจว่า password ถูกต้อง
- ลอง create user ใหม่จาก Supabase Dashboard

### Query `words` ได้ผลลัพธ์ว่างทั้งที่มีข้อมูล
- เป็นเพราะ RLS — คุณยังไม่ได้ login ในตอนทดสอบ
- ต้อง login ก่อน แล้วค่อย query
