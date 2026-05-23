-- ================================================================
-- Vocab Keeper — Seed Data (ข้อมูลตัวอย่างสำหรับทดสอบ)
-- ================================================================
-- รันไฟล์นี้ "หลังจาก" สมัครสมาชิกในแอปแล้วเท่านั้น
-- ก่อนรัน: ไปที่ Supabase → Authentication → Users → คลิกที่ user ของคุณ
--         แล้ว copy "User UID" มาแทนค่า YOUR_USER_ID ด้านล่าง
-- ================================================================


-- 🔻 แก้ตรงนี้: วาง User UID ที่ copy มาจาก Supabase
-- ตัวอย่าง: '550e8400-e29b-41d4-a716-446655440000'
do $$
declare
  v_user_id uuid := '30a4a6d1-cbec-4e42-9f2b-fda3e4a1b4df';  -- ⚠️ เปลี่ยนตรงนี้
begin

  insert into public.words (user_id, word, meaning_th, pos, example, tags, toeic_frequency, status, correct_count, wrong_count, streak)
  values
    (v_user_id, 'allocate',    'จัดสรร, แบ่งปัน, จัดแบ่งให้',  'Verb',      'The manager will allocate the budget to different departments.', array['Business','Management'], 2, 'Learning', 3, 3, 0),
    (v_user_id, 'revenue',     'รายได้',                       'Noun',      'The company''s revenue increased by 15% in the last quarter.',   array['Business','Finance'],     2, 'Mastered', 8, 2, 5),
    (v_user_id, 'durable',     'ทนทาน, คงทน',                  'Adjective', 'This product is made from high-quality materials and is very durable.', array['Business'],          1, 'Review',   2, 1, 1),
    (v_user_id, 'negotiate',   'เจรจา, ต่อรอง',                 'Verb',      'They will negotiate the terms of the contract next week.',       array['Business','Management'], 3, 'Learning', 4, 1, 2),
    (v_user_id, 'budget',      'งบประมาณ',                     'Noun',      'We need to stick to the budget for this project.',              array['Business','Finance'],     3, 'Review',   5, 4, 0),
    (v_user_id, 'efficient',   'มีประสิทธิภาพ',                 'Adjective', 'The new system is much more efficient than the old one.',       array['Business','Management'], 3, 'Mastered', 10, 1, 7),
    (v_user_id, 'collaborate', 'ร่วมมือกัน, ทำงานร่วมกัน',       'Verb',      'Our teams collaborate closely on this initiative.',             array['Management','HR'],        2, 'Learning', 2, 1, 1),
    (v_user_id, 'launch',      'เปิดตัว, เริ่มดำเนินการ',         'Verb',      'We plan to launch the product next month.',                     array['Marketing','Business'],   3, 'Mastered', 9, 0, 9),
    (v_user_id, 'recruit',     'จัดหา, รับสมัครงาน',             'Verb',      'The company plans to recruit new engineers this quarter.',      array['HR'],                     2, 'Learning', 3, 2, 0),
    (v_user_id, 'profit',      'กำไร',                         'Noun',      'The company reported a record profit this year.',               array['Finance','Business'],     3, 'Mastered', 12, 1, 8),
    (v_user_id, 'forecast',    'พยากรณ์, คาดการณ์',              'Verb',      'Analysts forecast strong growth for next year.',                array['Finance'],                2, 'Review',   3, 2, 1),
    (v_user_id, 'promote',     'ส่งเสริม, โปรโมท',               'Verb',      'They will promote the campaign across social media.',           array['Marketing'],              2, 'Learning', 4, 2, 2);

  raise notice 'Seed data inserted successfully! ✅';
end $$;


-- ตรวจสอบว่ามีข้อมูลแล้ว
select count(*) as total_words from public.words;
select word, meaning_th, status, toeic_frequency from public.words order by created_at desc;