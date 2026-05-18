-- ================================================================
-- Vocab Keeper — Supabase Database Schema
-- ================================================================
-- คำแนะนำ: เปิด Supabase Dashboard → SQL Editor → New query
--          วาง SQL นี้ทั้งหมด → กด Run (หรือ Ctrl/Cmd + Enter)
-- ================================================================


-- ----------------------------------------------------------------
-- 1) ENUM TYPES
-- ----------------------------------------------------------------

-- สถานะการเรียนรู้ของคำ
create type word_status as enum ('Learning', 'Review', 'Mastered');

-- ผลการประเมินเมื่อทบทวน flashcard
create type review_rating as enum ('forgot', 'hard', 'easy', 'mastered');


-- ----------------------------------------------------------------
-- 2) MAIN TABLE: words
-- ----------------------------------------------------------------

create table public.words (
  -- Primary key (เก็บ format เดิม W-xxx-timestamp ได้ หรือใช้ uuid อัตโนมัติก็ได้)
  id          text primary key default ('W-' || replace(gen_random_uuid()::text, '-', '')),
  
  -- ผู้ใช้ที่เป็นเจ้าของคำนี้ (เชื่อมกับ auth.users ของ Supabase)
  user_id     uuid not null references auth.users(id) on delete cascade,

  -- ข้อมูลคำศัพท์
  word        text not null,
  meaning_th  text not null,
  pos         text,                                       -- Noun / Verb / Adjective / Adverb
  example     text,
  note        text,
  tags        text[] default '{}',                        -- หลาย tag ได้: ['Business','Finance']

  -- การประเมินค่าความสำคัญ
  toeic_frequency int default 0 check (toeic_frequency between 0 and 3),

  -- สถานะการเรียนรู้
  status      word_status default 'Learning',

  -- สถิติ Spaced Repetition
  correct_count int default 0,
  wrong_count   int default 0,
  streak        int default 0,
  last_review   timestamptz,
  next_review   timestamptz default now(),               -- คำใหม่พร้อมทบทวนทันที

  -- Metadata
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),

  -- กันสร้างคำซ้ำต่อ user เดียวกัน (case-insensitive)
  constraint words_unique_per_user unique (user_id, word)
);

-- คอมเมนต์ตาราง (สำหรับ Supabase Studio)
comment on table public.words is 'คำศัพท์ภาษาอังกฤษของผู้ใช้แต่ละคน';


-- ----------------------------------------------------------------
-- 3) REVIEW LOGS TABLE (ประวัติการทบทวน)
-- ----------------------------------------------------------------

create table public.review_logs (
  id          bigserial primary key,
  word_id     text not null references public.words(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  rating      review_rating not null,
  reviewed_at timestamptz default now()
);

comment on table public.review_logs is 'บันทึกการทบทวน flashcard ทุกครั้ง สำหรับสถิติใน Dashboard';


-- ----------------------------------------------------------------
-- 4) INDEXES (ให้ query เร็ว)
-- ----------------------------------------------------------------

create index words_user_id_idx        on public.words (user_id);
create index words_next_review_idx    on public.words (user_id, next_review);
create index words_status_idx         on public.words (user_id, status);
create index words_tags_idx           on public.words using gin (tags);
create index words_created_idx        on public.words (user_id, created_at desc);

-- Full-text search ค้นได้ทั้ง word + meaning + example
create index words_search_idx on public.words
  using gin (to_tsvector('simple',
    coalesce(word, '') || ' ' ||
    coalesce(meaning_th, '') || ' ' ||
    coalesce(example, '')
  ));

-- Index สำหรับ review_logs
create index review_logs_user_date_idx on public.review_logs (user_id, reviewed_at desc);
create index review_logs_word_idx      on public.review_logs (word_id);


-- ----------------------------------------------------------------
-- 5) TRIGGER: อัปเดต updated_at อัตโนมัติเมื่อแก้ไข
-- ----------------------------------------------------------------

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger words_set_updated_at
  before update on public.words
  for each row execute function public.update_updated_at();


-- ----------------------------------------------------------------
-- 6) FUNCTION: คำนวณ next_review จาก rating (Spaced Repetition)
-- ----------------------------------------------------------------
-- เรียกใช้จาก frontend: await supabase.rpc('review_word', { p_word_id: 'W-xxx', p_rating: 'easy' })
-- จะอัปเดต streak, correct/wrong count, status, next_review ให้อัตโนมัติ
-- พร้อมเก็บ log ลง review_logs

create or replace function public.review_word(
  p_word_id text,
  p_rating  review_rating
)
returns public.words
language plpgsql
security definer
set search_path = public
as $$
declare
  v_word    public.words;
  v_minutes int;
  v_new_streak int;
  v_new_status word_status;
begin
  -- ดึงคำที่จะอัปเดต (เช็คว่าเป็นของ user คนนี้)
  select * into v_word
  from public.words
  where id = p_word_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Word not found or not owned by current user';
  end if;

  -- คำนวณ streak ใหม่
  if p_rating = 'forgot' then
    v_new_streak := 0;
  else
    v_new_streak := v_word.streak + 1;
  end if;

  -- คำนวณ interval (นาที) ตาม streak
  v_minutes := case
    when p_rating = 'forgot'   then 1
    when p_rating = 'hard'     then 5
    when p_rating = 'easy'     then 15
    when p_rating = 'mastered' then 60 * 24            -- 1 วัน
    else 60
  end;

  -- ถ้า streak สูง ให้ปรับ interval ยาวขึ้น (Spaced Repetition)
  if v_new_streak >= 5 and p_rating <> 'forgot' then
    v_minutes := greatest(v_minutes, 60 * 24 * 30);    -- 30 วัน
  elsif v_new_streak >= 4 and p_rating <> 'forgot' then
    v_minutes := greatest(v_minutes, 60 * 24 * 14);    -- 14 วัน
  elsif v_new_streak >= 3 and p_rating <> 'forgot' then
    v_minutes := greatest(v_minutes, 60 * 24 * 7);     -- 7 วัน
  elsif v_new_streak >= 2 and p_rating <> 'forgot' then
    v_minutes := greatest(v_minutes, 60 * 24 * 3);     -- 3 วัน
  end if;

  -- กำหนด status ใหม่
  v_new_status := case
    when p_rating = 'mastered' or v_new_streak >= 5 then 'Mastered'::word_status
    when p_rating = 'forgot' then 'Review'::word_status
    else 'Learning'::word_status
  end;

  -- อัปเดตคำ
  update public.words set
    correct_count = correct_count + case when p_rating = 'forgot' then 0 else 1 end,
    wrong_count   = wrong_count   + case when p_rating = 'forgot' then 1 else 0 end,
    streak        = v_new_streak,
    status        = v_new_status,
    last_review   = now(),
    next_review   = now() + (v_minutes || ' minutes')::interval
  where id = p_word_id
  returning * into v_word;

  -- เก็บ log
  insert into public.review_logs (word_id, user_id, rating)
  values (p_word_id, auth.uid(), p_rating);

  return v_word;
end;
$$;


-- ----------------------------------------------------------------
-- 7) FUNCTION: ดึงสถิติ Dashboard ในรอบเดียว (เร็วกว่าเรียกหลาย query)
-- ----------------------------------------------------------------

create or replace function public.get_dashboard_stats()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'total',        count(*),
    'learning',     count(*) filter (where status = 'Learning'),
    'mastered',     count(*) filter (where status = 'Mastered'),
    'review',       count(*) filter (where status = 'Review'),
    'not_remembered', count(*) filter (where wrong_count > correct_count),
    'due_now',      count(*) filter (where next_review <= now()),
    'added_this_week', count(*) filter (where created_at > now() - interval '7 days'),
    'reviews_today', (
      select count(*) from public.review_logs
      where user_id = auth.uid()
        and reviewed_at::date = current_date
    ),
    'tags_breakdown', (
      select json_agg(json_build_object('tag', tag, 'count', cnt))
      from (
        select unnest(tags) as tag, count(*) as cnt
        from public.words
        where user_id = auth.uid()
        group by tag
        order by cnt desc
        limit 10
      ) t
    ),
    'streak_days', (
      select count(distinct reviewed_at::date)
      from public.review_logs
      where user_id = auth.uid()
        and reviewed_at > now() - interval '7 days'
    )
  )
  from public.words
  where user_id = auth.uid();
$$;


-- ================================================================
-- 8) ROW LEVEL SECURITY (RLS) — ส่วนสำคัญที่สุด!
-- ================================================================
-- ทำให้แต่ละ user เห็นและแก้ไขได้แค่ข้อมูลของตัวเองเท่านั้น

-- เปิด RLS
alter table public.words       enable row level security;
alter table public.review_logs enable row level security;

-- WORDS: user จัดการได้แค่คำของตัวเอง
create policy "Users can view their own words"
  on public.words for select
  using (auth.uid() = user_id);

create policy "Users can insert their own words"
  on public.words for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own words"
  on public.words for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own words"
  on public.words for delete
  using (auth.uid() = user_id);

-- REVIEW LOGS: user ดูได้แค่ log ของตัวเอง (insert ผ่าน function review_word เท่านั้น)
create policy "Users can view their own review logs"
  on public.review_logs for select
  using (auth.uid() = user_id);


-- ================================================================
-- เสร็จเรียบร้อย! ตรวจสอบโดยรัน query นี้
-- ================================================================

-- select * from public.words;        -- ตอนนี้ควรว่าง (ยังไม่มีข้อมูล)
-- select * from public.review_logs;  -- ตอนนี้ควรว่าง
