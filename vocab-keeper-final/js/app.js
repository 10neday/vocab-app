// ================================================================
// Vocab Keeper - Main App (Supabase-backed)
// ================================================================

let currentUser = null;
let currentPage = 'library';

// ----------------------------------------------------------------
// AUTH GUARD - ต้อง login ก่อน
// ----------------------------------------------------------------
(async function init() {
  currentUser = await requireAuth();
  if (!currentUser) return;
  console.log('Logged in as:', currentUser.email);
  initTheme();
  showPage('library');
})();

// ----------------------------------------------------------------
// THEME
// ----------------------------------------------------------------
const THEME_KEY = 'vk-theme';
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.querySelector('#themeBtn i');
  if (icon) icon.className = theme === 'dark' ? 'lucide lucide-sun' : 'lucide lucide-moon';
  if (currentPage === 'dashboard') renderDashboard();
}
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
}
document.getElementById('themeBtn').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

// ----------------------------------------------------------------
// LOGOUT
// ----------------------------------------------------------------
document.getElementById('logoutBtn').addEventListener('click', async () => {
  if (confirm('Sign out?')) {
    await signOut();
  }
});

// ----------------------------------------------------------------
// NAVIGATION
// ----------------------------------------------------------------
function showPage(name) {
  currentPage = name;
  document.querySelectorAll('.page').forEach((p) => {
    p.hidden = p.dataset.page !== name;
  });
  document.querySelectorAll('.nav-item').forEach((b) => {
    b.classList.toggle('active', b.dataset.nav === name);
  });
  if (name === 'library') renderLibrary();
  if (name === 'dashboard') renderDashboard();
  if (name === 'review') startReview();
  if (name === 'game') startGame();
  if (name === 'add') resetAddForm();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
document.querySelectorAll('[data-nav]').forEach((btn) => {
  btn.addEventListener('click', () => showPage(btn.dataset.nav));
});

// ----------------------------------------------------------------
// TOAST
// ----------------------------------------------------------------
function toast(msg, icon = 'check-circle') {
  const wrap = document.getElementById('toast');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<i class="lucide lucide-${icon}"></i> ${msg}`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}
function toastError(e) {
  console.error(e);
  toast(e.message || 'เกิดข้อผิดพลาด', 'circle-alert');
}

// ----------------------------------------------------------------
// TTS
// ----------------------------------------------------------------
function speak(text, lang = 'en-US') {
  if (!('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}
document.querySelectorAll('.speak-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const el = document.querySelector(btn.dataset.speak);
    if (el && el.value) speak(el.value);
  });
});

// ================================================================
// ADD PAGE
// ================================================================
let addForm = { word: '', meaning: '', pos: '', freq: 0, example: '', tags: [], status: 'Learning' };

function resetAddForm() {
  addForm = { word: '', meaning: '', pos: '', freq: 0, example: '', tags: [], status: 'Learning' };
  document.getElementById('f-word').value = '';
  document.getElementById('f-meaning').value = '';
  document.getElementById('f-example').value = '';
  document.getElementById('exCount').textContent = '0';
  document.querySelectorAll('#f-pos .chip').forEach((c) => c.classList.remove('active'));
  setStars('#f-freq', 0);
  renderTagsList('#f-tags', addForm.tags);
  document.querySelectorAll('#f-status .status-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.value === 'Learning');
  });
}

document.querySelectorAll('#f-pos .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#f-pos .chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    addForm.pos = chip.dataset.value;
  });
});

function setStars(selector, n) {
  const wrap = document.querySelector(selector);
  if (!wrap) return;
  wrap.dataset.value = n;
  wrap.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('active', i < n));
}
document.querySelectorAll('#f-freq .star').forEach((star, idx) => {
  star.addEventListener('click', () => {
    addForm.freq = idx + 1;
    setStars('#f-freq', idx + 1);
  });
});

document.getElementById('f-example').addEventListener('input', (e) => {
  document.getElementById('exCount').textContent = e.target.value.length;
});

// Tags (generic - used by both Add form and Edit modal)
function renderTagsList(containerSel, tags) {
  const container = document.querySelector(containerSel);
  const tagList = container.querySelector('.tag-list');
  tagList.innerHTML = tags
    .map((t, i) => `<span class="tag-pill">${escapeHtml(t)}<button type="button" data-rm="${i}"><i class="lucide lucide-x"></i></button></span>`)
    .join('');
  tagList.querySelectorAll('[data-rm]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      tags.splice(+btn.dataset.rm, 1);
      renderTagsList(containerSel, tags);
    });
  });
}

function setupTagInput(containerSel, tagsRef) {
  const container = document.querySelector(containerSel);
  const input = container.querySelector('.tag-input');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.value.trim();
      if (val && !tagsRef().includes(val)) {
        tagsRef().push(val);
        renderTagsList(containerSel, tagsRef());
      }
      input.value = '';
    }
  });
  container.addEventListener('click', (e) => {
    if (e.target.closest('.tag-pill')) return;
    input.focus();
  });
}
setupTagInput('#f-tags', () => addForm.tags);

document.querySelectorAll('#f-status .status-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#f-status .status-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    addForm.status = btn.dataset.value;
  });
});

document.getElementById('clearForm').addEventListener('click', resetAddForm);
document.getElementById('saveWord').addEventListener('click', async () => {
  const word = document.getElementById('f-word').value.trim();
  const meaning = document.getElementById('f-meaning').value.trim();
  const example = document.getElementById('f-example').value.trim();
  if (!word || !meaning || !addForm.pos || !addForm.freq) {
    toast('กรุณากรอกข้อมูลที่จำเป็นให้ครบ', 'circle-alert');
    return;
  }
  const btn = document.getElementById('saveWord');
  btn.disabled = true;
  btn.innerHTML = '<i class="lucide lucide-loader-2" style="animation:spin 1s linear infinite"></i> Saving...';
  try {
    await api.createWord({
      word, meaning_th: meaning, pos: addForm.pos,
      example, tags: addForm.tags,
      toeic_frequency: addForm.freq, status: addForm.status,
    });
    toast(`เพิ่มคำว่า "${word}" แล้ว`, 'check-circle');
    resetAddForm();
    showPage('library');
  } catch (e) {
    if (e.message?.includes('duplicate')) {
      toast('คำนี้มีอยู่แล้ว', 'circle-alert');
    } else {
      toastError(e);
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="lucide lucide-save"></i> Save Vocabulary';
  }
});

// ================================================================
// LIBRARY PAGE
// ================================================================
let libFilter = 'all';
let libSearch = '';
let searchTimeout = null;

document.getElementById('searchInput').addEventListener('input', (e) => {
  libSearch = e.target.value;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(renderLibrary, 250);
});

document.querySelectorAll('#filterChips .filter-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#filterChips .filter-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    libFilter = chip.dataset.filter;
    renderLibrary();
  });
});

function statusForUI(w) {
  if (w.next_review && new Date(w.next_review) < new Date() && w.status !== 'Mastered') return 'Review';
  return w.status;
}

function renderFreqStars(n) {
  return Array.from({ length: 3 }, (_, i) => `<i class="lucide lucide-star${i < n ? '' : ' dim'}"></i>`).join('');
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

async function renderLibrary() {
  const container = document.getElementById('wordList');
  const empty = document.getElementById('emptyLibrary');
  const loading = document.getElementById('libraryLoading');
  loading.hidden = false;
  empty.hidden = true;
  container.innerHTML = '';

  try {
    const list = await api.listWords({ search: libSearch, filter: libFilter });
    loading.hidden = true;
    empty.hidden = list.length !== 0;

    container.innerHTML = list.map((w) => {
      const s = statusForUI(w);
      const statusBadge =
        s === 'Mastered'   ? `<span class="wc-status Mastered"><i class="lucide lucide-circle-check"></i> Mastered</span>` :
        s === 'Review'     ? `<span class="wc-status Review"><i class="lucide lucide-clock"></i> Need Review</span>` :
                             `<span class="wc-status Learning"><i class="lucide lucide-book-open"></i> Learning</span>`;
      const firstTag = w.tags && w.tags[0];
      return `
        <article class="word-card" data-id="${w.id}">
          <div class="wc-row">
            <div>
              <div class="wc-word">${escapeHtml(w.word)}
                <button class="wc-speak" data-speak-word="${escapeHtml(w.word)}"><i class="lucide lucide-volume-2"></i></button>
              </div>
              <div class="wc-meaning" lang="th">${escapeHtml(w.meaning_th)}</div>
              <div class="wc-pos">${escapeHtml(w.pos || '')}</div>
            </div>
            <div style="display:flex; gap:6px; align-items:flex-start; flex-direction:column;">
              ${statusBadge}
              <div class="wc-actions">
                <button class="wc-action edit" data-edit="${w.id}"><i class="lucide lucide-pencil"></i><span>Edit</span></button>
                <button class="wc-action delete" data-del="${w.id}"><i class="lucide lucide-trash-2"></i><span>Delete</span></button>
              </div>
            </div>
          </div>
          ${w.example ? `<div class="wc-divider"></div>
          <div class="wc-bottom">
            <div class="wc-example">${escapeHtml(w.example)}</div>
            <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
              ${firstTag ? `<span class="wc-tag">${escapeHtml(firstTag)}</span>` : ''}
              <div class="wc-stars">${renderFreqStars(w.toeic_frequency)}</div>
            </div>
          </div>` : ''}
        </article>
      `;
    }).join('');

    container.querySelectorAll('[data-speak-word]').forEach((b) => {
      b.addEventListener('click', () => speak(b.dataset.speakWord));
    });
    container.querySelectorAll('[data-del]').forEach((b) => {
      b.addEventListener('click', () => deleteWord(b.dataset.del));
    });
    container.querySelectorAll('[data-edit]').forEach((b) => {
      b.addEventListener('click', () => openEditModal(b.dataset.edit));
    });
  } catch (e) {
    loading.hidden = true;
    toastError(e);
  }
}

async function deleteWord(id) {
  if (!confirm('ลบคำนี้?')) return;
  try {
    await api.deleteWord(id);
    toast('ลบคำเรียบร้อย', 'trash-2');
    renderLibrary();
  } catch (e) { toastError(e); }
}

// ================================================================
// EDIT MODAL
// ================================================================
let editForm = { id: null, word: '', meaning: '', pos: '', freq: 0, example: '', tags: [], status: 'Learning' };
setupTagInput('#e-tags', () => editForm.tags);

document.querySelectorAll('#e-pos .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#e-pos .chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    editForm.pos = chip.dataset.value;
  });
});
document.querySelectorAll('#e-freq .star').forEach((star, idx) => {
  star.addEventListener('click', () => {
    editForm.freq = idx + 1;
    setStars('#e-freq', idx + 1);
  });
});
document.querySelectorAll('#e-status .status-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#e-status .status-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    editForm.status = btn.dataset.value;
  });
});

async function openEditModal(id) {
  try {
    const w = await api.getWord(id);
    editForm = {
      id: w.id, word: w.word, meaning: w.meaning_th, pos: w.pos || '',
      freq: w.toeic_frequency || 0, example: w.example || '',
      tags: [...(w.tags || [])], status: w.status,
    };
    document.getElementById('e-word').value = w.word;
    document.getElementById('e-meaning').value = w.meaning_th;
    document.getElementById('e-example').value = w.example || '';
    document.querySelectorAll('#e-pos .chip').forEach((c) => {
      c.classList.toggle('active', c.dataset.value === w.pos);
    });
    setStars('#e-freq', w.toeic_frequency || 0);
    renderTagsList('#e-tags', editForm.tags);
    document.querySelectorAll('#e-status .status-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.value === w.status);
    });
    document.getElementById('editModal').hidden = false;
  } catch (e) { toastError(e); }
}
function closeEditModal() { document.getElementById('editModal').hidden = true; }
document.getElementById('closeEdit').addEventListener('click', closeEditModal);
document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
document.getElementById('editModal').addEventListener('click', (e) => {
  if (e.target.id === 'editModal') closeEditModal();
});

document.getElementById('saveEdit').addEventListener('click', async () => {
  const word = document.getElementById('e-word').value.trim();
  const meaning = document.getElementById('e-meaning').value.trim();
  const example = document.getElementById('e-example').value.trim();
  if (!word || !meaning) {
    toast('กรุณากรอกข้อมูลที่จำเป็น', 'circle-alert');
    return;
  }
  const btn = document.getElementById('saveEdit');
  btn.disabled = true;
  try {
    await api.updateWord(editForm.id, {
      word, meaning_th: meaning, pos: editForm.pos,
      example, tags: editForm.tags,
      toeic_frequency: editForm.freq, status: editForm.status,
    });
    toast('บันทึกแล้ว', 'check-circle');
    closeEditModal();
    renderLibrary();
  } catch (e) { toastError(e); }
  finally { btn.disabled = false; }
});

// ================================================================
// DASHBOARD PAGE
// ================================================================
async function renderDashboard() {
  const loading = document.getElementById('dashLoading');
  const content = document.getElementById('dashboardContent');
  loading.hidden = false;
  content.style.opacity = '0.4';

  try {
    const stats = await api.getDashboardStats();
    const attention = await api.listAttention(3);

    const total = stats?.total || 0;
    const learning = stats?.learning || 0;
    const mastered = stats?.mastered || 0;
    const notRem = stats?.not_remembered || 0;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-week').textContent = stats?.added_this_week || 0;
    document.getElementById('stat-learning').textContent = learning;
    document.getElementById('stat-learning-pct').textContent = pct(learning, total);
    document.getElementById('stat-mastered').textContent = mastered;
    document.getElementById('stat-mastered-pct').textContent = pct(mastered, total);
    document.getElementById('stat-not-rem').textContent = notRem;
    document.getElementById('stat-not-rem-pct').textContent = pct(notRem, total);

    // Donut
    const review = stats?.review || 0;
    const notStarted = Math.max(total - learning - mastered - review, 0);
    const segments = [
      { label: 'Learning', value: learning, color: getColor('--brand') },
      { label: 'Mastered', value: mastered, color: getColor('--green') },
      { label: 'Not Remembered', value: notRem, color: getColor('--red') },
      { label: 'Not Started', value: notStarted, color: getColor('--border-strong') },
    ];
    drawDonut('donutChart', segments);
    document.getElementById('donut-total').textContent = total;
    document.getElementById('donutLegend').innerHTML = segments
      .map((s) => `
        <div class="legend-item">
          <span class="legend-dot" style="background:${s.color}"></span>
          <span class="legend-label">${s.label}</span>
          <span class="legend-value">${s.value} (${pct(s.value, total)}%)</span>
        </div>`)
      .join('');

    // Ring + streak
    const goal = 30;
    const reviewsToday = stats?.reviews_today || 0;
    drawRing('ringChart', reviewsToday, goal);
    document.getElementById('ring-done').textContent = reviewsToday;
    document.getElementById('ring-goal').textContent = goal;
    document.getElementById('streak-days').textContent = stats?.streak_days || 0;

    // Weekdays
    const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const today = (new Date().getDay() + 6) % 7;
    document.getElementById('weekdays').innerHTML = weekdays
      .map((d, i) => {
        const cls = i < today ? 'done' : i === today ? 'today' : '';
        const icon = i < today ? '<i class="lucide lucide-check"></i>' : '';
        return `<div class="weekday ${cls}"><div class="day-dot">${icon}</div><span>${d}</span></div>`;
      }).join('');

    // Tag bars
    const tagItems = (stats?.tags_breakdown || [])
      .map((t) => ({ label: t.tag, value: t.count }))
      .slice(0, 6);
    drawBars('tagBarChart', tagItems);

    // Needs Attention
    document.getElementById('attentionList').innerHTML = attention.length === 0
      ? '<p class="muted small center" style="padding:16px;">ไม่มีคำที่ต้องดูแลเป็นพิเศษ 🎉</p>'
      : attention.map((w) => {
          const mastery = pct(w.correct_count, w.correct_count + w.wrong_count) || 0;
          const overdue = w.next_review && new Date(w.next_review) < new Date();
          return `
            <div class="attention-item">
              <div class="att-main">
                <div class="att-word">${escapeHtml(w.word)} <span class="att-pos">${escapeHtml(w.pos || '')}</span></div>
                <div class="att-meaning" lang="th">${escapeHtml(w.meaning_th)}</div>
              </div>
              <div class="att-right">
                ${overdue
                  ? `<div class="att-status overdue"><span class="dot"></span> Overdue review</div>
                     <div class="att-meta">Due to review</div>`
                  : `<div class="att-status wrong"><span class="dot"></span> Wrong ${w.wrong_count} times</div>
                     <div class="att-meta">Low mastery (${mastery}%)</div>`}
              </div>
            </div>`;
        }).join('');
  } catch (e) {
    toastError(e);
  } finally {
    loading.hidden = true;
    content.style.opacity = '1';
  }
}
function pct(a, b) { return b === 0 ? 0 : Math.round((a / b) * 100); }
function getColor(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

// ================================================================
// REVIEW (Flashcard) PAGE
// ================================================================
let reviewQueue = [];
let reviewIdx = 0;
let reviewRevealed = false;

async function startReview() {
  const loading = document.getElementById('reviewLoading');
  const content = document.getElementById('reviewContent');
  loading.hidden = false;
  content.style.opacity = '0.3';
  try {
    let due = await api.listDueWords(50);
    if (due.length === 0) {
      // ไม่มีคำที่ต้องทบทวน — ใช้ทั้งหมด
      due = await api.listWords();
    }
    reviewQueue = due;
    reviewIdx = 0;
    renderFlashcard();
  } catch (e) { toastError(e); }
  finally {
    loading.hidden = true;
    content.style.opacity = '1';
  }
}

function renderFlashcard() {
  if (!reviewQueue.length) {
    document.getElementById('fc-word').textContent = 'ไม่มีคำที่ต้องทบทวน 🎉';
    document.getElementById('fc-pos').textContent = '';
    document.getElementById('fc-freq').innerHTML = '';
    document.getElementById('revealBlock').hidden = true;
    document.getElementById('rv-current').textContent = 0;
    document.getElementById('rv-total').textContent = 0;
    document.getElementById('rv-progress').style.width = '0%';
    return;
  }
  const w = reviewQueue[reviewIdx];
  reviewRevealed = false;
  document.getElementById('fc-pos').textContent = w.pos || '—';
  document.getElementById('fc-word').textContent = w.word;
  document.getElementById('fc-meaning').hidden = true;
  document.getElementById('revealBlock').hidden = false;
  document.getElementById('fc-meaning-text').textContent = w.meaning_th;
  document.getElementById('fc-example').textContent = w.example || '';
  document.getElementById('fc-freq').innerHTML =
    Array.from({ length: 3 }, (_, i) => `<i class="lucide lucide-star${i < w.toeic_frequency ? '' : ' dim'}"></i>`).join('') +
    '<div class="freq-label">TOEIC Frequency</div>';
  document.getElementById('rv-current').textContent = reviewIdx + 1;
  document.getElementById('rv-total').textContent = reviewQueue.length;
  document.getElementById('rv-progress').style.width = `${((reviewIdx + 1) / reviewQueue.length) * 100}%`;
}

document.getElementById('showMeaningBtn').addEventListener('click', () => {
  reviewRevealed = true;
  document.getElementById('fc-meaning').hidden = false;
  document.getElementById('revealBlock').hidden = true;
  const w = reviewQueue[reviewIdx];
  if (w) speak(w.word);
});

document.getElementById('prevBtn').addEventListener('click', () => {
  if (reviewIdx > 0) { reviewIdx--; renderFlashcard(); }
});
document.getElementById('nextBtn').addEventListener('click', () => {
  if (reviewIdx < reviewQueue.length - 1) { reviewIdx++; renderFlashcard(); }
  else toast('จบรอบทบทวนแล้ว!', 'party-popper');
});
document.getElementById('shuffleBtn').addEventListener('click', () => {
  reviewQueue.sort(() => Math.random() - 0.5);
  reviewIdx = 0;
  renderFlashcard();
  toast('สลับคำใหม่แล้ว', 'shuffle');
});

document.querySelectorAll('.rate-btn').forEach((btn) => {
  btn.addEventListener('click', () => applyRating(btn.dataset.rate));
});

async function applyRating(rating) {
  const w = reviewQueue[reviewIdx];
  if (!w) return;
  try {
    // เรียก RPC ใน DB คำนวณ SRS ที่ฝั่ง Postgres
    const updated = await api.reviewWord(w.id, rating);
    reviewQueue[reviewIdx] = updated;
    toast(`บันทึก: ${rating}`, 'check-circle');
    if (reviewIdx < reviewQueue.length - 1) {
      reviewIdx++;
      renderFlashcard();
    } else {
      toast('จบรอบทบทวนแล้ว! 🎉', 'party-popper');
    }
  } catch (e) { toastError(e); }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (currentPage !== 'review') return;
  if (e.target.matches('input, textarea')) return;
  if (e.code === 'Space') {
    e.preventDefault();
    if (!reviewRevealed) document.getElementById('showMeaningBtn').click();
  } else if (e.key === 'ArrowLeft') document.getElementById('prevBtn').click();
  else if (e.key === 'ArrowRight') document.getElementById('nextBtn').click();
  else if (reviewRevealed && ['1', '2', '3', '4'].includes(e.key)) {
    const map = { 1: 'forgot', 2: 'hard', 3: 'easy', 4: 'mastered' };
    applyRating(map[e.key]);
  }
});

// ================================================================
// GAME PAGE
// ================================================================
let gameQueue = [];
let gameWordsPool = [];
let gameIdx = 0;
let gameScore = 0;
let gameTimer = null;

async function startGame() {
  const loading = document.getElementById('gameLoading');
  const content = document.getElementById('gameContent');
  loading.hidden = false;
  content.style.opacity = '0.3';
  try {
    const all = await api.listWords();
    if (all.length < 2) {
      document.getElementById('g-question').textContent = 'ต้องมีคำอย่างน้อย 2 คำเพื่อเล่นเกม';
      document.getElementById('g-options').innerHTML = '';
      loading.hidden = true;
      content.style.opacity = '1';
      return;
    }
    gameWordsPool = all;
    gameQueue = [...all].sort(() => Math.random() - 0.5).slice(0, Math.min(20, all.length));
    gameIdx = 0;
    gameScore = 0;
    document.getElementById('g-total').textContent = gameQueue.length;
    renderGameQuestion();
  } catch (e) { toastError(e); }
  finally {
    loading.hidden = true;
    content.style.opacity = '1';
  }
}

function renderGameQuestion() {
  if (gameTimer) { clearTimeout(gameTimer); gameTimer = null; }
  const correct = gameQueue[gameIdx];
  const others = gameWordsPool.filter((w) => w.id !== correct.id);
  const distractors = others.sort(() => Math.random() - 0.5).slice(0, 1);
  const options = [correct, ...distractors].sort(() => Math.random() - 0.5);

  document.getElementById('g-question').textContent = correct.meaning_th;
  document.getElementById('g-current').textContent = gameIdx + 1;
  document.getElementById('g-score').textContent = gameScore;
  document.getElementById('g-progress').style.width = `${((gameIdx + 1) / gameQueue.length) * 100}%`;
  document.getElementById('g-result').hidden = true;
  document.getElementById('g-next').hidden = true;

  const letters = ['A', 'B', 'C', 'D'];
  document.getElementById('g-options').innerHTML = options
    .map((o, i) => `
      <button class="game-option" data-id="${o.id}">
        <span class="opt-letter">${letters[i]}</span>
        <span class="opt-text">${escapeHtml(o.word)}</span>
      </button>`).join('');

  document.querySelectorAll('.game-option').forEach((btn) => {
    btn.addEventListener('click', () => handleGameAnswer(btn, correct));
  });

  document.getElementById('g-speak').onclick = () => speak(correct.meaning_th, 'th-TH');
}

function handleGameAnswer(btn, correct) {
  const chosenId = btn.dataset.id;
  const isRight = chosenId === correct.id;
  document.querySelectorAll('.game-option').forEach((b) => {
    b.disabled = true;
    if (b.dataset.id === correct.id) b.classList.add('correct');
    else if (b.dataset.id === chosenId) b.classList.add('wrong');
  });
  const resultBox = document.getElementById('g-result');
  resultBox.hidden = false;
  if (isRight) {
    gameScore++;
    resultBox.className = 'game-result correct';
    resultBox.innerHTML = `
      <div class="badge"><i class="lucide lucide-check"></i></div>
      <div class="game-result-text"><strong>Correct!</strong><small>"${escapeHtml(correct.word)}" means ${escapeHtml(correct.meaning_th)}</small></div>`;
  } else {
    resultBox.className = 'game-result wrong';
    resultBox.innerHTML = `
      <div class="badge"><i class="lucide lucide-x"></i></div>
      <div class="game-result-text"><strong>Incorrect</strong><small>The correct answer is "${escapeHtml(correct.word)}" — ${escapeHtml(correct.meaning_th)}</small></div>`;
  }
  document.getElementById('g-score').textContent = gameScore;
  document.getElementById('g-next').hidden = false;
  gameTimer = setTimeout(() => nextGameQuestion(), 2500);
}

document.getElementById('g-next').addEventListener('click', nextGameQuestion);
function nextGameQuestion() {
  if (gameTimer) { clearTimeout(gameTimer); gameTimer = null; }
  if (gameIdx < gameQueue.length - 1) {
    gameIdx++;
    renderGameQuestion();
  } else {
    toast(`จบเกม! คะแนน ${gameScore}/${gameQueue.length}`, 'party-popper');
    startGame();
  }
}
