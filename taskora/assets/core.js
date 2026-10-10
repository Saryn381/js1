/* Taskora core: storage, auth, router, shell, assistant */
(function () {
  const T = (window.T = { pages: {}, state: {} });

  /* ---------- helpers ---------- */
  T.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  T.$ = (sel, root) => (root || document).querySelector(sel);
  T.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  T.uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  T.store = {
    get(k, d) { try { const v = localStorage.getItem('taskora:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('taskora:' + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem('taskora:' + k); } catch (e) {} },
  };
  T.hash = async (s) => {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { return btoa(unescape(encodeURIComponent(s))); }
  };
  const LOGO = '/assets/logo.png';
  T.logo = (cls) => `<div class="brand-logo ${cls || ''}"><img src="${LOGO}" alt="Taskora" /></div>`;

  T.toast = (msg, kind) => {
    const box = T.$('#toasts'); if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || 'ok');
    el.innerHTML = icon(kind === 'err' ? 'alert' : 'circle-check', 16) + '<span>' + T.esc(msg) + '</span>';
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .25s'; setTimeout(() => el.remove(), 260); }, 2600);
  };

  T.confirm = ({ title, text, ok, danger }) => new Promise((res) => {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h3>${T.esc(title)}</h3><p>${T.esc(text)}</p>
      <div class="acts"><button class="btn btn-outline btn-sm" data-r="0">Cancel</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-sm" data-r="1">${T.esc(ok || 'Confirm')}</button></div></div>`;
    bg.addEventListener('click', (e) => {
      const b = e.target.closest('[data-r]');
      if (b || e.target === bg) { bg.remove(); res(b ? b.dataset.r === '1' : false); }
    });
    document.body.appendChild(bg);
  });

  /* ---------- settings (appearance + preferences) ---------- */
  const DEFAULT_SETTINGS = {
    theme: 'system', sidebar: 'default', accent: 'blue', fontSize: 'medium',
    weekStart: 'monday', dateFormat: 'MM/DD/YYYY', timeFormat: '12h',
    notif: { assigned: true, due: true, mention: true, ai: true },
    pushEnabled: false,
  };
  T.settings = () => Object.assign({}, DEFAULT_SETTINGS, T.store.get('settings', {}));
  T.saveSettings = (patch) => {
    const s = Object.assign(T.settings(), patch);
    T.store.set('settings', s);
    T.applyAppearance();
    return s;
  };
  T.applyAppearance = () => {
    const s = T.settings(); const r = document.documentElement;
    let theme = s.theme;
    if (theme === 'system') theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    r.setAttribute('data-theme', theme);
    r.setAttribute('data-accent', s.accent);
    r.setAttribute('data-font', s.fontSize);
    const sh = T.$('#shell'); if (sh) sh.setAttribute('data-sidebar', s.sidebar);
    const mt = document.querySelector('meta[name="theme-color"]'); if (mt) mt.content = theme === 'light' ? '#f6f8fb' : '#0b0f17';
  };

  /* ---------- auth ---------- */
  T.users = () => T.store.get('users', []);
  T.user = () => {
    const email = T.store.get('session', null);
    if (!email) return null;
    return T.users().find((u) => u.email === email) || null;
  };
  T.saveUser = (u) => { const us = T.users().map((x) => (x.email === u.email ? u : x)); T.store.set('users', us); };
  T.register = async ({ name, email, password, question, answer }) => {
    const us = T.users();
    email = email.trim().toLowerCase();
    if (us.some((u) => u.email === email)) throw new Error('An account with this email already exists.');
    const u = {
      id: T.uid(), name: name.trim(), email, pass: await T.hash(password), question,
      ans: await T.hash(answer.trim().toLowerCase()), created: Date.now(), bio: '', avatar: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', language: 'English',
      plan: 'free', aiUsed: 2, aiCycleStart: Date.now(), workspace: null,
    };
    us.push(u); T.store.set('users', us); T.store.set('session', email);
    return u;
  };
  T.login = async (email, password) => {
    email = email.trim().toLowerCase();
    const u = T.users().find((x) => x.email === email);
    if (!u || u.pass !== (await T.hash(password))) throw new Error('Invalid email or password.');
    T.store.set('session', email);
    return u;
  };
  T.logout = () => { T.store.del('session'); T.closeAssistant(); T.navigate('/login'); };
  T.findUserByEmail = (email) => T.users().find((u) => u.email === (email || '').trim().toLowerCase()) || null;
  T.checkSecurityAnswer = async (email, answer) => {
    const u = T.findUserByEmail(email); if (!u) return false;
    return u.ans === (await T.hash(answer.trim().toLowerCase()));
  };
  T.resetPassword = async (email, newPass) => {
    const u = T.findUserByEmail(email); if (!u) throw new Error('Account not found.');
    u.pass = await T.hash(newPass); T.saveUser(u); return u;
  };

  /* ---------- tasks ---------- */
  T.tasks = () => { const u = T.user(); return u ? T.store.get('tasks:' + u.id, []) : []; };
  T.saveTasks = (t) => { const u = T.user(); if (u) T.store.set('tasks:' + u.id, t); };
  const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  T.parseTask = (raw) => {
    let title = raw.trim(), due = null, pri = 'medium';
    const now = new Date(); let day = null;
    if (/\btomorrow\b/i.test(title)) { day = new Date(now); day.setDate(day.getDate() + 1); title = title.replace(/\btomorrow\b/i, ''); }
    else if (/\b(today|tonight)\b/i.test(title)) { day = new Date(now); title = title.replace(/\b(today|tonight)\b/i, ''); }
    else {
      const m = title.match(new RegExp('\\b(' + DAYS.join('|') + ')\\b', 'i'));
      if (m) { day = new Date(now); let diff = (DAYS.indexOf(m[1].toLowerCase()) - now.getDay() + 7) % 7; if (diff === 0) diff = 7; day.setDate(day.getDate() + diff); title = title.replace(m[0], ''); }
    }
    const tm = title.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if (tm) {
      let h = parseInt(tm[1], 10) % 12; if (/pm/i.test(tm[3])) h += 12;
      if (!day) { day = new Date(now); if (new Date(day.setHours(h, +(tm[2] || 0), 0, 0)) < now) day.setDate(day.getDate() + 1); }
      day.setHours(h, +(tm[2] || 0), 0, 0); title = title.replace(tm[0], '');
    } else if (day) day.setHours(9, 0, 0, 0);
    if (day) due = day.getTime();
    if (/(!{2,}|\burgent\b|\bimportant\b|\bhigh\b)/i.test(title)) { pri = 'high'; title = title.replace(/(!{2,}|\burgent\b|\bimportant\b|\bhigh priority\b)/i, ''); }
    else if (/\blow\b/i.test(title)) pri = 'low';
    title = title.replace(/\s{2,}/g, ' ').replace(/\b(on|by|at)\s*$/i, '').trim() || raw.trim();
    return {
      id: T.uid(), title: title.charAt(0).toUpperCase() + title.slice(1), description: '',
      done: false, status: 'pending', priority: pri, due, assignee: '', pendingReason: '', created: Date.now(),
    };
  };
  T.STATUS_LABEL = { pending: 'Pending', in_progress: 'In progress', completed: 'Completed' };
  T.syncTaskStatus = (t) => { t.done = t.status === 'completed'; return t; };
  T.addTask = (raw) => {
    if (!raw.trim()) return null;
    const t = T.parseTask(raw); const all = T.tasks(); all.unshift(t); T.saveTasks(all);
    return t;
  };
  T.fmtDue = (ts) => {
    if (!ts) return '';
    const s = T.settings(); const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, '0');
    const dt = s.dateFormat === 'DD/MM/YYYY' ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
      : s.dateFormat === 'YYYY-MM-DD' ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      : `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
    return dt + ' ' + T.fmtTime(d);
  };
  T.fmtTime = (d) => {
    const s = T.settings(); d = d || new Date();
    if (s.timeFormat === '24h') return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    let h = d.getHours() % 12 || 12; return h + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + (d.getHours() >= 12 ? 'PM' : 'AM');
  };
  T.taskRow = (t) => {
    const late = !t.done && t.due && t.due < Date.now();
    const sub = [t.priority.charAt(0).toUpperCase() + t.priority.slice(1), t.due ? T.fmtDue(t.due) : 'No date'].join(' · ');
    return `
    <div class="trow ${t.done ? 'done' : ''}" data-id="${t.id}">
      <button class="cb" data-act="toggle" aria-label="Toggle done">${t.done ? icon('check', 12) : ''}</button>
      <div class="tt">
        <div class="ttl">${T.esc(t.title)}</div>
        <div class="sub ${late ? 'late' : ''}">${T.esc(sub)}</div>
      </div>
      <span class="pri ${t.priority}">${t.priority}</span>
      <div class="row-menu-wrap">
        <button class="dots" data-act="menu" aria-label="More options">${icon('dots', 16)}</button>
      </div>
    </div>`;
  };
  T.bindTaskList = (root, rerender) => {
    const closeMenus = () => T.$$('.rmenu').forEach((m) => m.remove());
    document.addEventListener('click', (e) => { if (!e.target.closest('.rmenu') && !e.target.closest('[data-act="menu"]')) closeMenus(); });
    root.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const row = b.closest('.trow'); if (!row) return;
      const all = T.tasks(); const i = all.findIndex((x) => x.id === row.dataset.id); if (i < 0) return;
      if (b.dataset.act === 'toggle') {
        all[i].status = all[i].done ? 'pending' : 'completed';
        T.syncTaskStatus(all[i]);
        T.saveTasks(all); rerender(); return;
      }
      if (b.dataset.act === 'menu') {
        const had = T.$('.rmenu'); closeMenus(); if (had) return;
        const m = document.createElement('div'); m.className = 'rmenu';
        m.innerHTML = `<button class="mi" data-m="edit">${icon('edit', 15)}Edit</button><button class="mi danger" data-m="delete">${icon('trash', 15)}Delete</button>`;
        b.closest('.row-menu-wrap').appendChild(m);
        m.addEventListener('click', async (ev) => {
          const mb = ev.target.closest('[data-m]'); if (!mb) return;
          closeMenus();
          if (mb.dataset.m === 'edit') T.openTaskModal(all[i], rerender);
          if (mb.dataset.m === 'delete') {
            const ok = await T.confirm({ title: 'Delete this task?', text: `"${all[i].title}" will be permanently removed.`, ok: 'Delete task', danger: true });
            if (!ok) return;
            const fresh = T.tasks(); const j = fresh.findIndex((x) => x.id === row.dataset.id); if (j < 0) return;
            fresh.splice(j, 1); T.saveTasks(fresh); T.toast('Task deleted'); rerender();
          }
        });
      }
    });
  };

  /* ---------- task modal (Essentials / Details / Schedule & Notes) ---------- */
  const PRI_META = {
    low: { ic: 'flag', label: 'Low' }, medium: { ic: 'target', label: 'Medium' }, high: { ic: 'flag', label: 'High' },
  };
  T.openTaskModal = (existing, onSave) => {
    const editing = !!existing;
    const d = existing && existing.due ? new Date(existing.due) : null;
    const pad = (n) => String(n).padStart(2, '0');
    const st = {
      title: existing ? existing.title : '', description: existing ? existing.description || '' : '',
      priority: existing ? existing.priority : 'medium', assignee: existing ? existing.assignee || '' : '',
      pendingReason: existing ? existing.pendingReason || '' : '',
      dueDate: d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : '',
      dueTime: d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '',
      step: 'essentials',
    };
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    const tabs = [['essentials', 'Essentials'], ['details', 'Details'], ['schedule', 'Schedule & Notes']];

    const essentials = () => `
      <label class="flabel">${icon('type', 14)} Action title</label>
      <input class="s-input" id="tm-title" placeholder="e.g., Review Q3 marketing analytics..." value="${T.esc(st.title)}" />
      <label class="flabel fgap">${icon('list', 14)} Additional context</label>
      <textarea class="s-input" id="tm-desc" placeholder="Add any relevant links, notes, or details...">${T.esc(st.description)}</textarea>
      <label class="flabel fgap">${icon('flag', 14)} Priority level</label>
      <div class="pri-grid" id="tm-pri">
        ${['low', 'medium', 'high'].map((p) => `<button class="pri-opt ${p} ${st.priority === p ? 'on' : ''}" data-p="${p}">${icon(PRI_META[p].ic, 18)}<span>${PRI_META[p].label}</span></button>`).join('')}
      </div>
      <div class="tm-preview">
        <span class="tm-pav">${icon('circle-check', 16)}</span>
        <div><b>${T.esc(st.title) || 'Untitled task'}</b> <span class="pri ${st.priority}">${st.priority}</span>
          <div class="d">${T.esc(st.description) || 'No description provided.'}</div></div>
      </div>`;
    const details = () => `
      <label class="flabel">${icon('user', 14)} Assigned to</label>
      <input class="s-input" id="tm-assignee" placeholder="Assignee name or email..." value="${T.esc(st.assignee)}" />
      <label class="flabel fgap">${icon('alert', 14)} Pending reason <span class="opt-tag">optional</span></label>
      <textarea class="s-input" id="tm-reason" placeholder="Why is this blocked?">${T.esc(st.pendingReason)}</textarea>`;
    const schedule = () => `
      <label class="flabel">${icon('calendar', 14)} Due date</label>
      <input class="s-input" id="tm-date" type="date" value="${st.dueDate}" />
      <label class="flabel fgap">${icon('clock', 14)} Due time</label>
      <input class="s-input" id="tm-time" type="time" value="${st.dueTime}" />
      <label class="flabel fgap">${icon('bulb', 14)} Notes</label>
      <textarea class="s-input" id="tm-notes" placeholder="Anything else worth noting..."></textarea>`;

    const paint = () => {
      const sync = () => {
        const t = T.$('#tm-title', bg); if (t) st.title = t.value;
        const de = T.$('#tm-desc', bg); if (de) st.description = de.value;
        const as = T.$('#tm-assignee', bg); if (as) st.assignee = as.value;
        const rs = T.$('#tm-reason', bg); if (rs) st.pendingReason = rs.value;
        const dd = T.$('#tm-date', bg); if (dd) st.dueDate = dd.value;
        const dt = T.$('#tm-time', bg); if (dt) st.dueTime = dt.value;
      };
      sync();
      const foot = st.step === 'essentials'
        ? `<button class="btn btn-outline btn-sm" data-x="cancel">Cancel</button><button class="btn btn-primary btn-sm" data-x="next" ${st.title.trim() ? '' : 'disabled'}>Continue</button>`
        : st.step === 'details'
        ? `<button class="btn btn-outline btn-sm" data-x="back">Back</button><button class="btn btn-primary btn-sm" data-x="next">Continue</button>`
        : `<button class="btn btn-outline btn-sm" data-x="back">Back</button><button class="btn btn-primary btn-sm" data-x="save">${editing ? 'Save changes' : 'Save task'} ${icon('send', 14)}</button>`;
      bg.innerHTML = `<div class="modal task-modal" role="dialog" aria-modal="true">
        <div class="tm-tabs">${tabs.map(([k, l]) => `<button class="tm-tab ${st.step === k ? 'on' : ''}" data-tab="${k}">${l.toUpperCase()}</button>`).join('')}</div>
        <div class="tm-body">${st.step === 'essentials' ? essentials() : st.step === 'details' ? details() : schedule()}</div>
        <div class="acts">${foot}</div>
      </div>`;
      T.$('#tm-pri', bg)?.addEventListener('click', (e) => { const b = e.target.closest('[data-p]'); if (!b) return; st.priority = b.dataset.p; paint(); });
      ['tm-title', 'tm-desc'].forEach((id) => { const el = T.$('#' + id, bg); if (el) el.oninput = () => { st[id === 'tm-title' ? 'title' : 'description'] = el.value; paintLive(); }; });
      const paintLive = () => {
        const prev = T.$('.tm-preview', bg); if (!prev) return;
        prev.querySelector('b').textContent = st.title || 'Untitled task';
        prev.querySelector('.d').textContent = st.description || 'No description provided.';
        T.$('#tm-title', bg).closest('.tm-body').parentNode.querySelector('[data-x="next"]').disabled = !st.title.trim();
      };
    };
    bg.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (tab) { st.step = tab.dataset.tab; paint(); return; }
      const x = e.target.closest('[data-x]'); if (!x) return;
      if (x.dataset.x === 'cancel') { bg.remove(); return; }
      if (x.dataset.x === 'back') { st.step = st.step === 'schedule' ? 'details' : 'essentials'; paint(); return; }
      if (x.dataset.x === 'next') { st.step = st.step === 'essentials' ? 'details' : 'schedule'; paint(); return; }
      if (x.dataset.x === 'save') {
        if (!st.title.trim()) return;
        let due = null;
        if (st.dueDate) { const [y, mo, da] = st.dueDate.split('-').map(Number); const [h, mi] = (st.dueTime || '09:00').split(':').map(Number); due = new Date(y, mo - 1, da, h, mi).getTime(); }
        const all = T.tasks();
        if (editing) {
          const i = all.findIndex((t) => t.id === existing.id); if (i < 0) return;
          Object.assign(all[i], { title: st.title.trim(), description: st.description, priority: st.priority, assignee: st.assignee, pendingReason: st.pendingReason, due });
        } else {
          all.unshift({ id: T.uid(), title: st.title.trim(), description: st.description, priority: st.priority, assignee: st.assignee, pendingReason: st.pendingReason, due, done: false, status: 'pending', created: Date.now() });
        }
        T.saveTasks(all); T.toast(editing ? 'Task updated' : 'Task added: ' + st.title.trim());
        bg.remove(); if (onSave) onSave(); else if (current && current.refresh) current.refresh();
      }
    });
    bg.addEventListener('mousedown', (e) => { if (e.target === bg) bg.remove(); });
    document.body.appendChild(bg);
    paint();
    setTimeout(() => T.$('#tm-title', bg)?.focus(), 30);
  };

  /* ---------- router ---------- */
  const routes = (T.routes = {});
  T.route = (path, def) => { routes[path] = def; };
  let current = null, navToken = 0, shellMounted = false;

  T.navigate = (path, replace) => {
    if (path === location.pathname + location.search) return;
    history[replace ? 'replaceState' : 'pushState']({}, '', path);
    T.render();
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const href = a.getAttribute('href');
    if (!href || !href.startsWith('/') || href.startsWith('//') || href.startsWith('/assets/')) return;
    e.preventDefault();
    if (href.startsWith('#')) return;
    T.navigate(href);
  });
  window.addEventListener('popstate', () => T.render());

  T.render = () => {
    let path = location.pathname.replace(/\/+$/, '') || '/';
    if (path === '/index' || path === '/index.html') path = '/';
    if (path === '/settings') { history.replaceState({}, '', '/settings/general'); path = '/settings/general'; }
    const def = routes[path] || routes['*'];
    const user = T.user();
    const token = ++navToken;
    if (def.auth && !user) return T.navigate('/login', true);
    if (def.guest && user) return T.navigate('/dashboard', true);
    const prev = current; current = def;
    window.scrollTo(0, 0);
    if (def.auth) {
      document.title = 'Taskora AI - Dashboard';
      T.mountShell(def, path, prev);
      T.loadPage(def, path, prev, token);
    } else {
      shellMounted = false; T.closeAssistant(true);
      document.title = def.title || 'Taskora AI — Intelligent Task Management';
      T.$('#app').innerHTML = def.render();
      if (def.after) def.after(T.$('#app'));
    }
  };

  T.start = () => {
    T.applyAppearance();
    matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', () => T.settings().theme === 'system' && T.applyAppearance());
    T.render();
  };

  /* ---------- app shell ---------- */
  const NAV_MAIN = [
    ['/dashboard', 'Today', 'today'], ['/tasks', 'Tasks', 'tasks'], ['/inbox', 'Inbox', 'inbox'],
    ['/ai-planning', 'AI', 'sparkles'], ['/analytics', 'Analytics', 'chart'],
  ];
  const NAV_ACC = [['/notifications', 'Notifications', 'bell'], ['/pricing', 'Plans', 'card'], ['/settings/general', 'Settings', 'settings']];

  T.mountShell = (def, path) => {
    const user = T.user(); const s = T.settings();
    const nav = (arr) => arr.map(([href, label, ic]) => `<a class="nav-item" href="${href}" data-nav="${href.startsWith('/settings') ? '/settings' : href}">${icon(ic, 18)}<span>${label}</span></a>`).join('');
    if (!shellMounted || !T.$('#shell')) {
      T.$('#app').innerHTML = `
      <div class="shell ${T.store.get('collapsed', false) ? 'collapsed' : ''}" id="shell" data-sidebar="${s.sidebar}">
        <header class="topbar">
          <div class="ttl"><b id="tb-title"></b><span>Private workspace</span></div>
          <div class="tb-right">
            <button class="icon-btn" id="tb-theme" title="Switch theme" aria-label="Switch theme">${icon('monitor', 18)}</button>
            <button class="icon-btn" id="tb-bell" title="Notifications" aria-label="Notifications">${icon('bell', 18)}</button>
            <button class="user-btn" id="tb-user" aria-haspopup="menu"><span class="avatar" id="tb-av"></span><span id="tb-name"></span>${icon('chevron-down', 14)}</button>
          </div>
        </header>
        <aside class="sidebar">
          <div class="sb-head">${T.logo()}<div><b>Taskora AI</b><span>Personal workspace</span></div></div>
          <button class="collapse-btn" id="sb-collapse" aria-label="Collapse sidebar">${icon('chevron-left', 12)}</button>
          <div class="sb-scroll">
            <div class="sb-group"><div class="sb-label">Workspace</div>${nav(NAV_MAIN)}</div>
            <div class="sb-group"><div class="sb-label">Account</div>${nav(NAV_ACC)}</div>
            <div class="unlock"><b>${icon('sparkles', 16)}Unlock more AI</b><p>Increase generation limits and unlock advanced planning.</p><a href="/pricing">View plans</a></div>
            <a class="nav-item" href="mailto:support@taskora.ai" style="margin-top:6px">${icon('help', 18)}<span>Help and support</span></a>
          </div>
        </aside>
        <main class="main" id="main">
          <div class="quick"><div class="quick-in">
            <div class="quick-row">${icon('plus', 18)}<input id="q-in" type="text" placeholder="Add a task, e.g. tomorrow 11am" autocomplete="off" />
              <button class="mic" id="q-mic" aria-label="Voice input">${icon('mic', 18)}</button>
              <button class="add" id="q-add" disabled>Add</button></div>
            <div class="sync" id="q-sync">Synced</div>
          </div></div>
          <div class="content" id="content"></div>
        </main>
      </div>
      <button class="assist-fab" id="as-fab">${icon('sparkles', 18)}<span>Assistant</span></button>`;
      shellMounted = true;
      T.bindShell();
    }
    T.$('#tb-title').textContent = def.title;
    T.$('#tb-av').innerHTML = user.avatar ? `<img src="${user.avatar}" alt="">` : T.esc(user.name.charAt(0).toUpperCase());
    T.$('#tb-name').textContent = user.name;
    T.$$('.nav-item[data-nav]').forEach((a) => {
      const key = a.dataset.nav;
      a.classList.toggle('active', key === '/settings' ? path.startsWith('/settings') : path === key);
    });
  };

  T.bindShell = () => {
    const sh = T.$('#shell');
    T.$('#sb-collapse').onclick = () => { const c = sh.classList.toggle('collapsed'); T.store.set('collapsed', c); };
    const qin = T.$('#q-in'), qadd = T.$('#q-add');
    const sync = () => { const ok = qin.value.trim().length > 0; qadd.disabled = !ok; qadd.classList.toggle('ready', ok); };
    qin.oninput = sync;
    const submit = () => {
      if (!qin.value.trim()) return;
      const t = T.addTask(qin.value); qin.value = ''; sync();
      const s = T.$('#q-sync'); s.textContent = 'Saving…'; setTimeout(() => (s.textContent = 'Synced'), 600);
      T.toast('Task added: ' + t.title);
      if (current && current.refresh) current.refresh();
    };
    qadd.onclick = submit;
    qin.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
    const mic = T.$('#q-mic'); let rec = null;
    mic.onclick = () => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return T.toast('Voice input is not supported in this browser.', 'err');
      if (rec) { rec.stop(); return; }
      rec = new SR(); rec.lang = 'en-US'; rec.interimResults = true;
      mic.classList.add('on');
      rec.onresult = (ev) => { qin.value = Array.from(ev.results).map((r) => r[0].transcript).join(''); sync(); };
      rec.onend = () => { mic.classList.remove('on'); rec = null; };
      rec.onerror = () => { mic.classList.remove('on'); rec = null; };
      rec.start();
    };
    // topbar controls
    const closeMenus = () => T.$$('.menu').forEach((m) => m.remove());
    document.addEventListener('click', (e) => { if (!e.target.closest('.menu') && !e.target.closest('#tb-user') && !e.target.closest('#tb-bell')) closeMenus(); });
    T.$('#tb-theme').onclick = () => {
      const order = ['system', 'light', 'dark']; const s = T.settings();
      const next = order[(order.indexOf(s.theme) + 1) % 3]; T.saveSettings({ theme: next });
      T.toast('Theme: ' + next.charAt(0).toUpperCase() + next.slice(1));
    };
    T.$('#tb-bell').onclick = () => {
      const had = T.$('.menu.notif'); closeMenus(); if (had) return;
      const m = document.createElement('div'); m.className = 'menu notif';
      m.innerHTML = `<div class="mhead"><b>Notifications</b></div><div class="empty">${icon('bell-off', 22)}<div style="margin-top:8px">You're all caught up.</div></div>`;
      T.$('.tb-right').appendChild(m);
    };
    T.$('#tb-user').onclick = () => {
      const had = T.$('.menu:not(.notif)'); closeMenus(); if (had) return;
      const u = T.user(); const m = document.createElement('div'); m.className = 'menu';
      m.innerHTML = `<div class="mhead"><b>${T.esc(u.name)}</b>${T.esc(u.email)}</div><div class="sep"></div>
        <a class="mi" href="/settings/profile">${icon('user', 16)}Profile</a>
        <a class="mi" href="/settings/general">${icon('settings', 16)}Settings</a>
        <a class="mi" href="/pricing">${icon('card', 16)}Plans</a><div class="sep"></div>
        <button class="mi danger" id="mi-out">${icon('logout', 16)}Sign out</button>`;
      T.$('.tb-right').appendChild(m);
      T.$('#mi-out').onclick = () => T.logout();
      m.addEventListener('click', (e) => e.target.closest('a') && closeMenus());
    };
    T.$('#as-fab').onclick = () => T.toggleAssistant();
  };

  T.loadPage = (def, path, prev, token) => {
    const c = T.$('#content'); const main = T.$('#main');
    main.scrollTop = 0;
    const sameGroup = prev && prev.group && prev.group === def.group;
    const paint = () => {
      if (token !== navToken) return;
      c.innerHTML = def.render(path);
      if (def.after) def.after(c, path);
    };
    def.refresh = () => { if (token === navToken || current === def) { const sc = main.scrollTop; c.innerHTML = def.render(path); def.after && def.after(c, path); main.scrollTop = sc; } };
    if (sameGroup) { paint(); return; }
    c.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
    setTimeout(paint, 420);
  };

  /* ---------- assistant ---------- */
  const chat = { open: false, msgs: [], busy: false, timer: null };
  const SUGGEST = ['What should I work on today?', 'Which open tasks are overdue?', 'Plan my next three days.', 'What did I complete this week?'];

  const md = (s) => {
    const lines = s.split('\n'); let out = '', inOl = false, inUl = false;
    const inline = (t) => T.esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const close = () => { if (inOl) { out += '</ol>'; inOl = false; } if (inUl) { out += '</ul>'; inUl = false; } };
    lines.forEach((l) => {
      let m;
      if ((m = l.match(/^\s*(\d+)\.\s+(.*)$/))) { if (!inOl) { close(); out += '<ol>'; inOl = true; } out += '<li>' + inline(m[2]) + '</li>'; }
      else if ((m = l.match(/^\s*[-•]\s+(.*)$/))) { if (!inUl) { close(); out += '<ul>'; inUl = true; } out += '<li>' + inline(m[1]) + '</li>'; }
      else if (l.trim() === '') close();
      else { close(); out += '<p>' + inline(l) + '</p>'; }
    });
    close(); return out;
  };
  T.md = md;

  T.assistantReply = (q) => {
    const tasks = T.tasks(); const open = tasks.filter((t) => !t.done); const now = Date.now();
    const overdue = open.filter((t) => t.due && t.due < now);
    const weekAgo = now - 7 * 864e5; const doneWeek = tasks.filter((t) => t.done);
    const ql = q.toLowerCase();
    const list = (arr) => arr.slice(0, 6).map((t, i) => `${i + 1}. **${t.title}**${t.due ? ' — due ' + T.fmtDue(t.due) : ''} (${t.priority})`).join('\n');
    const tail = "\n\nIf you'd like help structuring a specific project or need suggestions on what to prioritize once you've added tasks, just let me know!";
    if (!tasks.length) {
      if (/overdue|late/.test(ql)) return "You don't have any tasks yet, so nothing is overdue. Add a task with a due date using the bar at the top and I'll watch the deadlines for you." + tail;
      if (/complete|done|finish/.test(ql)) return "You haven't completed any tasks yet. Once you check a few off, I can summarize your week." + tail;
      if (/three|3|next|plan/.test(ql)) return "Your workspace is empty right now, so here's a simple way to shape the next three days:\n\n1. **Day 1 — Capture** – Add everything on your mind to the task bar with rough due dates.\n2. **Day 1 — Prioritize** – Mark the 2-3 items that truly matter as high priority.\n3. **Day 2 — Execute** – Block focused time for the highest-priority task first.\n4. **Day 3 — Review** – Check off what's done and move unfinished items forward.\n5. **Leave buffers** – Keep 10-15 minutes between tasks." + tail;
      return "I don't see any tasks in your workspace yet, but here's a reliable way to plan your day:\n\n1. **Capture everything** – Add each task to the bar at the top. Use natural phrases like \"tomorrow 11am\".\n2. **Estimate effort** – For each new task, add an approximate time (e.g., \"30m\", \"2h\") so you can slot them into your day.\n3. **Pick 2-3 priorities** – Choose high-priority items that fit the time you have today.\n4. **Leave room for breaks** and a short buffer (10-15 min) between tasks.\n5. **Review at day-end** – Mark completed items and move any unfinished work to tomorrow." + tail;
    }
    if (/overdue|late/.test(ql)) return overdue.length ? `You have **${overdue.length} overdue** task${overdue.length > 1 ? 's' : ''}:\n\n${list(overdue)}\n\nStart with the first one and either finish it or reschedule it.` : 'Nothing is overdue right now. Nice work staying on top of your deadlines.';
    if (/complete|done|finish/.test(ql)) return doneWeek.length ? `You've completed **${doneWeek.length}** task${doneWeek.length > 1 ? 's' : ''} so far:\n\n${list(doneWeek)}` : "You haven't completed any tasks yet. Pick the smallest open task and finish it to build momentum.";
    if (/three|3 days|next/.test(ql)) {
      const dated = open.filter((t) => t.due && t.due < now + 3 * 864e5).sort((a, b) => a.due - b.due);
      return (dated.length ? `Here's what is due in the next three days:\n\n${list(dated)}\n\n` : 'Nothing has a due date in the next three days.\n\n') + `You have **${open.length}** open task${open.length === 1 ? '' : 's'} in total. Try to finish the highest-priority one first each day and keep a 10-15 minute buffer between tasks.`;
    }
    const order = { high: 0, medium: 1, low: 2 };
    const sorted = open.slice().sort((a, b) => order[a.priority] - order[b.priority] || (a.due || 9e15) - (b.due || 9e15));
    return open.length ? `Here's what I'd focus on today:\n\n${list(sorted)}\n\nStart with the first item, then work down the list. Leave a short break between tasks.` : "You have no open tasks. Capture the next thing in the bar at the top and I'll help you prioritize it.";
  };

  function chatHtml() {
    if (!chat.msgs.length) {
      return `<div class="ap-empty"><div class="ibox">${icon('bot', 22)}</div><h4>What should we plan?</h4>
        <p>Ask about priorities, deadlines, completed work, or a realistic plan for the next few days.</p>
        <div class="sugg">${SUGGEST.map((s) => `<button data-q="${T.esc(s)}">${T.esc(s)}</button>`).join('')}</div></div>`;
    }
    return chat.msgs.map((m) => m.role === 'user'
      ? `<div class="msg user"><div class="bub">${T.esc(m.text)}</div></div>`
      : `<div class="msg bot"><div class="av">${icon('sparkles', 14)}</div><div class="bub">${m.typing ? '<span class="typing"><i></i>Reviewing your workload…</span>' : md(m.text)}</div></div>`).join('');
  }
  function paintChat(stick) {
    const body = T.$('#ap-body'); if (!body) return;
    body.innerHTML = chatHtml();
    if (stick !== false) body.scrollTop = body.scrollHeight;
    const inp = T.$('#ap-in'), send = T.$('#ap-send');
    if (send) {
      send.innerHTML = chat.busy ? icon('stop', 14) : icon('send', 16);
      send.classList.toggle('ready', chat.busy || (inp && inp.value.trim().length > 0));
    }
  }
  function ask(q) {
    q = q.trim(); if (!q || chat.busy) return;
    chat.msgs.push({ role: 'user', text: q });
    const m = { role: 'bot', text: '', typing: true }; chat.msgs.push(m); chat.busy = true;
    const inp = T.$('#ap-in'); if (inp) inp.value = '';
    paintChat();
    const full = T.assistantReply(q);
    chat.timer = setTimeout(() => {
      m.typing = false; let i = 0;
      const step = () => {
        if (!chat.busy) return;
        i = Math.min(full.length, i + 6); m.text = full.slice(0, i); paintChat();
        if (i >= full.length) { chat.busy = false; paintChat(); return; }
        chat.timer = setTimeout(step, 18);
      };
      step();
    }, 1100);
  }
  T.toggleAssistant = () => (chat.open ? T.closeAssistant() : T.openAssistant());
  T.openAssistant = () => {
    if (T.$('#as-panel')) return;
    chat.open = true;
    const p = document.createElement('div'); p.className = 'assist-panel'; p.id = 'as-panel';
    p.innerHTML = `<div class="ap-head"><div class="ibox">${icon('sparkles', 18)}</div><div><b>Taskora Assistant</b><span>Answers from your live task context</span></div>
        <button class="x" id="ap-x" aria-label="Close">${icon('x', 16)}</button></div>
      <div class="ap-body" id="ap-body"></div>
      <div class="ap-foot"><div class="ap-input"><input id="ap-in" type="text" placeholder="Ask about your tasks..." autocomplete="off" />
        <button class="ap-send" id="ap-send" aria-label="Send">${icon('send', 16)}</button></div>
        <div class="ap-note">${icon('info', 12)}<span>Task content is loaded server-side from your account.</span></div></div>`;
    document.body.appendChild(p);
    const fab = T.$('#as-fab'); if (fab) fab.innerHTML = icon('x', 16) + '<span>Assistant</span>';
    paintChat();
    T.$('#ap-x').onclick = () => T.closeAssistant();
    const inp = T.$('#ap-in'), send = T.$('#ap-send');
    inp.oninput = () => send.classList.toggle('ready', chat.busy || inp.value.trim().length > 0);
    inp.onkeydown = (e) => { if (e.key === 'Enter') ask(inp.value); };
    send.onclick = () => { if (chat.busy) { chat.busy = false; clearTimeout(chat.timer); const l = chat.msgs[chat.msgs.length - 1]; if (l && l.typing) { l.typing = false; l.text = 'Stopped.'; } paintChat(); } else ask(inp.value); };
    p.addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (b) ask(b.dataset.q); });
    setTimeout(() => inp.focus(), 50);
  };
  T.closeAssistant = (reset) => {
    chat.open = false; const p = T.$('#as-panel'); if (p) p.remove();
    const fab = T.$('#as-fab'); if (fab) fab.innerHTML = icon('sparkles', 18) + '<span>Assistant</span>';
    if (reset) { chat.msgs = []; chat.busy = false; clearTimeout(chat.timer); }
  };
})();
