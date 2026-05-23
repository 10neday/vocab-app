// ================================================================
// Supabase Client + Auth Helpers
// ================================================================

// สร้าง Supabase client (ต้องโหลด SDK จาก CDN ก่อนใน HTML)
// หมายเหตุ: SDK UMD ลงทะเบียน global ชื่อ `supabase` ไว้แล้ว — เราจึงตั้งชื่อ client เป็น
// `supabaseClient` เพื่อไม่ให้ชน (มิฉะนั้น `const supabase` จะ throw "already declared")
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ----------------------------------------------------------------
// Auth helpers
// ----------------------------------------------------------------

async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signUp(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function sendPasswordReset(email, redirectTo) {
  const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
  return data;
}

async function updatePassword(password) {
  const { data, error } = await supabaseClient.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
  // redirect to login
  window.location.href = 'login.html';
}

async function getCurrentUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

async function getSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session;
}

// Redirect ถ้ายังไม่ login (ใช้ในหน้าหลัก)
async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session.user;
}

// Redirect ถ้า login อยู่แล้ว (ใช้ในหน้า login)
async function redirectIfAuthed() {
  const session = await getSession();
  if (session) {
    window.location.href = 'index.html';
  }
}
