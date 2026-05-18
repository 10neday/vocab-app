// ================================================================
// API Layer — รวม CRUD operations กับ Supabase
// ================================================================
// ฟังก์ชันทั้งหมดในนี้ throw exception ถ้า error
// (handler ใน app.js จะดักจับและแสดง toast)
// ================================================================

const api = {
  // ----------------------------------------------------------------
  // WORDS
  // ----------------------------------------------------------------

  // ดึงคำศัพท์ทั้งหมดของ user (เรียงตามวันที่สร้างใหม่สุดก่อน)
  async listWords({ search = '', filter = 'all' } = {}) {
    let query = supabaseClient
      .from('words')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter
    if (filter === 'Learning' || filter === 'Mastered' || filter === 'Review') {
      query = query.eq('status', filter);
    } else if (filter.startsWith('tag:')) {
      const tag = filter.slice(4);
      query = query.contains('tags', [tag]);
    } else if (filter === 'toeic-high') {
      query = query.eq('toeic_frequency', 3);
    }

    // Search (ค้นทั้ง word, meaning, example)
    if (search.trim()) {
      const s = search.trim();
      query = query.or(
        `word.ilike.%${s}%,meaning_th.ilike.%${s}%,example.ilike.%${s}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // ดึงคำเดียวตาม id
  async getWord(id) {
    const { data, error } = await supabaseClient
      .from('words').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  // เพิ่มคำใหม่
  async createWord(payload) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const insert = {
      user_id: user.id,
      word: payload.word,
      meaning_th: payload.meaning_th,
      pos: payload.pos,
      example: payload.example || null,
      tags: payload.tags || [],
      toeic_frequency: payload.toeic_frequency || 0,
      status: payload.status || 'Learning',
      // next_review = now() (ตามค่า default ใน schema)
    };

    const { data, error } = await supabaseClient
      .from('words').insert(insert).select().single();
    if (error) throw error;
    return data;
  },

  // แก้ไขคำ
  async updateWord(id, payload) {
    const { data, error } = await supabaseClient
      .from('words')
      .update(payload)
      .eq('id', id)
      .select().single();
    if (error) throw error;
    return data;
  },

  // ลบคำ
  async deleteWord(id) {
    const { error } = await supabaseClient.from('words').delete().eq('id', id);
    if (error) throw error;
  },

  // ดึงคำที่ต้องทบทวน (next_review <= now())
  async listDueWords(limit = 50) {
    const { data, error } = await supabaseClient
      .from('words')
      .select('*')
      .lte('next_review', new Date().toISOString())
      .order('next_review', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  // ดึงคำสำหรับ Game (random)
  async listForGame(limit = 20) {
    // เรียกผ่าน select แล้ว shuffle ใน JS (Supabase ไม่มี order by random ตรงๆ)
    const { data, error } = await supabaseClient
      .from('words')
      .select('*');
    if (error) throw error;
    return (data || []).sort(() => Math.random() - 0.5).slice(0, limit);
  },

  // ----------------------------------------------------------------
  // REVIEW (เรียก RPC function ใน DB — คำนวณ SRS ที่ฝั่ง DB)
  // ----------------------------------------------------------------

  async reviewWord(wordId, rating) {
    const { data, error } = await supabaseClient.rpc('review_word', {
      p_word_id: wordId,
      p_rating: rating,
    });
    if (error) throw error;
    return data;
  },

  // ----------------------------------------------------------------
  // DASHBOARD
  // ----------------------------------------------------------------

  // เรียก function รวมสถิติทั้งหมดใน query เดียว
  async getDashboardStats() {
    const { data, error } = await supabaseClient.rpc('get_dashboard_stats');
    if (error) throw error;
    return data;
  },

  // ดึงคำที่ต้องดูแลเป็นพิเศษ (ตอบผิดบ่อย / overdue)
  async listAttention(limit = 3) {
    const { data, error } = await supabaseClient
      .from('words')
      .select('*')
      .gt('wrong_count', 0)
      .order('wrong_count', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },
};
