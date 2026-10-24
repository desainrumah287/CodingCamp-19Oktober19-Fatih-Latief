/**
 * Life Dashboard — script.js
 *
 * Sections:
 *  1. Storage Helpers
 *  2. Theme (Light / Dark)
 *  3. Greeting, Clock & Date
 *  4. Custom Name
 *  5. Focus Timer
 *  6. To-Do List
 *  7. Quick Links
 *  8. Init
 */

/* ─────────────────────────────────────────────
   1. STORAGE HELPERS
───────────────────────────────────────────── */
const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

/* ─────────────────────────────────────────────
   2. THEME (LIGHT / DARK)
───────────────────────────────────────────── */
const themeToggleBtn = document.getElementById('theme-toggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeToggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

function initTheme() {
  const saved = storage.get('theme', 'light');
  applyTheme(saved);
}

themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  storage.set('theme', next);
});

/* ─────────────────────────────────────────────
   3. GREETING, CLOCK & DATE
───────────────────────────────────────────── */
const clockEl      = document.getElementById('clock');
const greetingEl   = document.getElementById('greeting');
const dateEl       = document.getElementById('date-display');

function getGreeting(hour, name) {
  const who = name ? `, ${name}` : '';
  if (hour >= 5  && hour < 12) return `Good Morning${who}! ☀️`;
  if (hour >= 12 && hour < 17) return `Good Afternoon${who}! 🌤️`;
  if (hour >= 17 && hour < 21) return `Good Evening${who}! 🌇`;
  return `Good Night${who}! 🌙`;
}

function updateClock() {
  const now  = new Date();
  const h    = String(now.getHours()).padStart(2, '0');
  const m    = String(now.getMinutes()).padStart(2, '0');
  const s    = String(now.getSeconds()).padStart(2, '0');

  clockEl.textContent = `${h}:${m}:${s}`;
  greetingEl.textContent = getGreeting(now.getHours(), storage.get('userName', ''));

  dateEl.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });
}

/* ─────────────────────────────────────────────
   4. CUSTOM NAME
───────────────────────────────────────────── */
const nameInput   = document.getElementById('name-input');
const saveNameBtn = document.getElementById('save-name-btn');

function initName() {
  const saved = storage.get('userName', '');
  if (saved) nameInput.value = saved;
}

saveNameBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  storage.set('userName', name);
  updateClock(); // refresh greeting immediately
  showSaveFeedback(saveNameBtn);
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveNameBtn.click();
});

function showSaveFeedback(btn) {
  const original = btn.textContent;
  btn.textContent = '✓ Saved';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
  }, 1500);
}

/* ─────────────────────────────────────────────
   5. FOCUS TIMER
───────────────────────────────────────────── */
const timerDisplay  = document.getElementById('timer-display');
const timerStatus   = document.getElementById('timer-status');
const timerStartBtn = document.getElementById('timer-start');
const timerStopBtn  = document.getElementById('timer-stop');
const timerResetBtn = document.getElementById('timer-reset');
const timerCard     = document.querySelector('.timer-card');

const TIMER_DURATION = 25 * 60; // 25 minutes in seconds
let timerSeconds  = TIMER_DURATION;
let timerInterval = null;
let timerRunning  = false;

function formatTime(total) {
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timerSeconds);
}

function startTimer() {
  if (timerRunning) return;
  if (timerSeconds === 0) return;

  timerRunning = true;
  timerCard.classList.add('timer-running');
  timerStatus.textContent = 'Focusing… 🎯';
  timerStartBtn.disabled = true;

  timerInterval = setInterval(() => {
    timerSeconds--;
    renderTimer();

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerCard.classList.remove('timer-running');
      timerStartBtn.disabled = false;
      timerStatus.textContent = '🎉 Session complete! Take a break.';
      // Browser notification (optional, gracefully falls back)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus Timer', { body: 'Session complete! Time for a break.' });
      }
    }
  }, 1000);
}

function stopTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  timerCard.classList.remove('timer-running');
  timerStartBtn.disabled = false;
  timerStatus.textContent = 'Paused — click Start to resume.';
}

function resetTimer() {
  stopTimer();
  timerSeconds = TIMER_DURATION;
  renderTimer();
  timerStatus.textContent = 'Ready to focus!';
}

timerStartBtn.addEventListener('click', startTimer);
timerStopBtn.addEventListener('click', stopTimer);
timerResetBtn.addEventListener('click', resetTimer);

// Ask notification permission early (UX: user can allow or deny)
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

/* ─────────────────────────────────────────────
   6. TO-DO LIST
───────────────────────────────────────────── */
const todoInput      = document.getElementById('todo-input');
const todoAddBtn     = document.getElementById('todo-add-btn');
const todoListEl     = document.getElementById('todo-list');
const todoWarningEl  = document.getElementById('todo-warning');
const todoCntEl      = document.getElementById('todo-count');
const clearDoneBtn   = document.getElementById('clear-done-btn');

let tasks = storage.get('tasks', []); // [{ id, text, done }]
let warningTimer = null;

/* ── helpers ── */
function saveTasks() {
  storage.set('tasks', tasks);
}

function showTodoWarning(msg) {
  todoWarningEl.textContent = msg;
  todoWarningEl.classList.remove('hidden');
  clearTimeout(warningTimer);
  warningTimer = setTimeout(() => todoWarningEl.classList.add('hidden'), 3500);
}

function updateTodoStats() {
  const total = tasks.length;
  const done  = tasks.filter(t => t.done).length;
  todoCntEl.textContent = total === 0
    ? 'No tasks yet'
    : `${done} / ${total} done`;
}

/* ── render ── */
function renderTasks() {
  todoListEl.innerHTML = '';

  if (tasks.length === 0) {
    const empty = document.createElement('li');
    empty.style.cssText = 'text-align:center;color:var(--text-muted);font-size:.875rem;padding:1rem 0;';
    empty.textContent = 'No tasks yet — add one above!';
    todoListEl.appendChild(empty);
    updateTodoStats();
    return;
  }

  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = `todo-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    // Checkbox
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'todo-check';
    check.checked = task.done;
    check.setAttribute('aria-label', `Mark "${task.text}" as done`);
    check.addEventListener('change', () => toggleTask(task.id));

    // Text (contenteditable for inline edit)
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = task.text;
    span.setAttribute('role', 'textbox');
    span.setAttribute('aria-label', `Task: ${task.text}`);

    // Double-click to edit
    span.addEventListener('dblclick', () => {
      if (task.done) return; // can't edit done tasks
      span.contentEditable = 'true';
      span.focus();
      // move cursor to end
      const range = document.createRange();
      range.selectNodeContents(span);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    span.addEventListener('blur', () => {
      span.contentEditable = 'false';
      const newText = span.textContent.trim();
      if (!newText) {
        span.textContent = task.text; // revert if empty
        return;
      }
      // duplicate check on edit
      const isDup = tasks.some(t => t.id !== task.id && t.text.toLowerCase() === newText.toLowerCase());
      if (isDup) {
        showTodoWarning(`⚠️ "${newText}" already exists in the list.`);
        span.textContent = task.text;
        return;
      }
      task.text = newText;
      span.setAttribute('aria-label', `Task: ${newText}`);
      saveTasks();
    });

    span.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); span.blur(); }
      if (e.key === 'Escape') { span.textContent = task.text; span.blur(); }
    });

    // Actions
    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-danger';
    editBtn.style.cssText = 'background:var(--accent-light);color:var(--accent);';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
    editBtn.title = 'Double-click text or click here to edit';
    editBtn.addEventListener('click', () => {
      if (task.done) return;
      span.dispatchEvent(new MouseEvent('dblclick'));
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-danger';
    delBtn.textContent = '🗑️';
    delBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    delBtn.addEventListener('click', () => deleteTask(task.id));

    actions.append(editBtn, delBtn);
    li.append(check, span, actions);
    todoListEl.appendChild(li);
  });

  updateTodoStats();
}

/* ── actions ── */
function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  // Duplicate check (case-insensitive)
  const isDuplicate = tasks.some(t => t.text.toLowerCase() === trimmed.toLowerCase());
  if (isDuplicate) {
    showTodoWarning(`⚠️ "${trimmed}" is already in your list!`);
    return;
  }

  tasks.push({ id: Date.now(), text: trimmed, done: false });
  saveTasks();
  renderTasks();
  todoInput.value = '';
  todoInput.focus();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) { task.done = !task.done; saveTasks(); renderTasks(); }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

function clearDone() {
  tasks = tasks.filter(t => !t.done);
  saveTasks();
  renderTasks();
}

/* ── event listeners ── */
todoAddBtn.addEventListener('click', () => addTask(todoInput.value));

todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask(todoInput.value);
});

clearDoneBtn.addEventListener('click', clearDone);

/* ─────────────────────────────────────────────
   7. QUICK LINKS
───────────────────────────────────────────── */
const linkNameInput  = document.getElementById('link-name-input');
const linkUrlInput   = document.getElementById('link-url-input');
const linkAddBtn     = document.getElementById('link-add-btn');
const linksContainer = document.getElementById('links-container');
const linkWarningEl  = document.getElementById('link-warning');

let links = storage.get('links', []); // [{ id, name, url }]
let linkWarnTimer = null;

function saveLinks() {
  storage.set('links', links);
}

function showLinkWarning(msg) {
  linkWarningEl.textContent = msg;
  linkWarningEl.classList.remove('hidden');
  clearTimeout(linkWarnTimer);
  linkWarnTimer = setTimeout(() => linkWarningEl.classList.add('hidden'), 3000);
}

function normalizeUrl(url) {
  // Auto-prepend https:// if protocol is missing
  if (!/^https?:\/\//i.test(url)) return 'https://' + url;
  return url;
}

function renderLinks() {
  linksContainer.innerHTML = '';

  if (links.length === 0) {
    linksContainer.innerHTML = '<p style="font-size:.85rem;color:var(--text-muted);">No links saved yet.</p>';
    return;
  }

  links.forEach((link) => {
    const wrap = document.createElement('div');
    wrap.className = 'link-btn-wrap';

    const a = document.createElement('a');
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = link.name;
    a.title = link.url;

    const del = document.createElement('button');
    del.className = 'btn-danger';
    del.style.cssText = 'padding:.25rem .4rem;font-size:.75rem;';
    del.textContent = '✕';
    del.setAttribute('aria-label', `Remove link: ${link.name}`);
    del.addEventListener('click', () => {
      links = links.filter(l => l.id !== link.id);
      saveLinks();
      renderLinks();
    });

    wrap.append(a, del);
    linksContainer.appendChild(wrap);
  });
}

function addLink() {
  const name = linkNameInput.value.trim();
  const rawUrl = linkUrlInput.value.trim();

  if (!name) { showLinkWarning('⚠️ Please enter a link name.'); linkNameInput.focus(); return; }
  if (!rawUrl) { showLinkWarning('⚠️ Please enter a URL.'); linkUrlInput.focus(); return; }

  const url = normalizeUrl(rawUrl);

  // Basic URL validity check
  try { new URL(url); } catch {
    showLinkWarning('⚠️ That doesn\'t look like a valid URL.');
    linkUrlInput.focus();
    return;
  }

  links.push({ id: Date.now(), name, url });
  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
}

linkAddBtn.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });
linkNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') linkUrlInput.focus(); });

/* ─────────────────────────────────────────────
   8. INIT
───────────────────────────────────────────── */
function init() {
  initTheme();
  initName();
  updateClock();
  setInterval(updateClock, 1000);
  renderTimer();
  renderTasks();
  renderLinks();
}

init();
