# Vocab Keeper — Demo (Phase 1)

แอปจดจำคำศัพท์ภาษาอังกฤษ พร้อมระบบ Spaced Repetition + Flashcard + Game
**สถานะปัจจุบัน:** Demo ใช้ Mock Data ในหน่วยความจำ (ยังไม่เชื่อมต่อ Supabase)

## โครงสร้างไฟล์

```
vocab-keeper/
├── index.html          ← หน้าหลัก รวมทุก section
├── css/
│   └── style.css       ← สไตล์ทั้งหมด + Dark mode
├── js/
│   ├── mock-data.js    ← ข้อมูลคำศัพท์ตัวอย่าง 12 คำ
│   ├── charts.js       ← Donut, Ring, Bar chart (canvas)
│   └── app.js          ← Logic ทุกหน้า
└── README.md
```

## วิธีเปิดดู Demo

**วิธีที่ 1: เปิดไฟล์ตรงๆ**
- ดับเบิลคลิก `index.html` ก็เปิดได้เลย

**วิธีที่ 2: รัน local server (แนะนำ)**
```bash
# ถ้ามี Python
python3 -m http.server 8000

# หรือถ้ามี Node.js
npx serve

# หรือใน VSCode ติดตั้ง extension "Live Server" แล้วคลิกขวา index.html → Open with Live Server
```
แล้วเปิด browser ไปที่ `http://localhost:8000`

## ฟีเจอร์ใน Demo นี้

### หน้า Add Vocabulary
- ฟอร์มเพิ่มคำศัพท์ครบทุก field
- POS chips (Noun/Verb/Adjective/Adverb)
- TOEIC Frequency 1-3 ดาว
- Tag input (Enter เพิ่ม tag, คลิก × เพื่อลบ)
- Text-to-Speech (กดไอคอนลำโพง)
- Validation ก่อนบันทึก

### หน้า Library
- รายการคำศัพท์ทั้งหมด
- ค้นหา (search ใน word, meaning, example, tag)
- Filter chips: All / Learning / Mastered / Business / TOEIC High
- ลบคำ + ออกเสียง
- แสดง status badge (Learning/Mastered/Need Review)

### หน้า Dashboard
- 4 stat cards (Total, Learning, Mastered, Not Remembered)
- Donut chart แสดง Learning Status
- Ring chart แสดง Daily Review progress
- Weekday tracker (7-day streak)
- Bar chart Words by Tag
- Needs Attention — คำที่ตอบผิดบ่อย

### หน้า Review (Flashcard)
- ระบบ Spaced Repetition เต็มรูปแบบ
- 4 ปุ่มประเมิน: Forgot (1 min) / Hard (5 min) / Easy (15 min) / Mastered (1 day)
- Previous / Next / Shuffle
- Progress bar + counter
- **Keyboard shortcuts:**
  - `Space` → Show Meaning
  - `←` / `→` → Previous/Next
  - `1` `2` `3` `4` → Forgot/Hard/Easy/Mastered

### หน้า Game (Meaning Match)
- เกมเลือกคำศัพท์ที่ตรงกับความหมาย
- คะแนนแบบ real-time
- Auto-advance หลังตอบ 2.5 วินาที
- Speak ความหมาย (ภาษาไทย)

### Dark Mode
- คลิกไอคอน Moon/Sun ที่ header ขวาบน
- บันทึก preference ใน localStorage
- ติดตาม system preference อัตโนมัติในครั้งแรก

## ขั้นตอนถัดไป (Phase 2)

หลังจากคุณดู demo แล้วโอเคกับ UI/UX ผมจะทำต่อ:
1. สร้าง Supabase project + Schema SQL
2. เปลี่ยน mock-data.js เป็นการเรียก Supabase
3. เพิ่มหน้า Login/Register
4. เพิ่ม Edit word modal
5. Deploy ขึ้น Vercel

## หมายเหตุ

- ข้อมูลจะหายเมื่อ refresh page (เพราะยังไม่ได้เชื่อม database)
- ใช้ Web Speech API ของ browser สำหรับ TTS (ฟรี ไม่ต้องใช้ API key)
- Charts วาดด้วย Canvas เอง ไม่ใช้ Chart.js เพื่อขนาดไฟล์เล็ก
