/* Settings pages */
(function () {
  const ACCENTS = [['blue', 'Blue', '#3b82f6'], ['violet', 'Violet', '#8b5cf6'], ['green', 'Green', '#22c55e'], ['orange', 'Orange', '#f97316'], ['pink', 'Pink', '#ec4899'], ['red', 'Red', '#ef4444']];

  const NAV = [
    { g: 'Account', items: [
      ['/settings/general', 'General', 'settings'], ['/settings/profile', 'Profile', 'user'], ['/settings/appearance', 'Appearance', 'palette'],
      ['/settings/notifications', 'Notifications', 'bell'], ['/settings/security', 'Security', 'lock'], ['/settings/billing', 'Billing', 'card'] ] },
    { g: 'Workspace', items: [
      ['/settings/workspace/general', 'General', 'building'], ['/settings/members', 'Members', 'users', 'lock'], ['/settings/roles', 'Roles & Permissions', 'shield-check'] ] },
    { g: 'Developer', items: [['#', 'API Keys', 'key', 'soon'], ['#', 'Webhooks', 'link', 'soon'], ['#', 'Integrations', 'plug', 'soon']] },
    { g: 'Danger', items: [['#delete', 'Delete Account', 'trash', 'danger']] },
  ];

  const skeleton = () => `
    <div class="skel" style="height:28px;width:150px;margin-bottom:12px"></div>
    <div class="skel" style="height:14px;width:260px;margin-bottom:36px"></div>
    <div class="s-card" style="padding:20px">${[0, 1, 2, 3, 4].map(() => `<div style="display:flex;gap:14px;align-items:center;margin-bottom:18px"><div class="skel" style="width:36px;height:36px;flex-shrink:0"></div><div style="flex:1"><div class="skel" style="height:12px;width:40%;margin-bottom:8px"></div><div class="skel" style="height:10px;width:62%"></div></div><div class="skel" style="width:44px;height:24px;border-radius:99px"></div></div>`).join('')}</div>`;

  const layout = (path, body) => {
    const u = T.user();
    return `<div class="set-layout">
      <nav class="set-nav" aria-label="Settings">
        <div class="set-user"><span class="avatar md">${u.avatar ? `<img src="${u.avatar}" alt="">` : T.esc(u.name.charAt(0).toUpperCase())}</span><div><b>${T.esc(u.name)}</b><span>${T.esc(u.email)}</span></div></div>
        <div class="free-pill">${u.plan === 'free' ? 'FREE PLAN' : u.plan.toUpperCase() + ' PLAN'}</div>
        <div class="set-div"></div>
        ${NAV.map((grp) => `<div class="set-grp">${grp.g}</div>${grp.items.map(([href, label, ic, flag]) => {
          if (flag === 'soon') return `<div class="sn-item disabled">${icon(ic, 17)}<span>${label}</span><span class="soon">SOON</span></div>`;
          if (flag === 'danger') return `<button class="sn-item danger" data-delete>${icon(ic, 17)}<span>${label}</span></button>`;
          const active = path === href;
          return `<a class="sn-item ${active ? 'active' : ''}" href="${href}">${icon(ic, 17)}<span>${label}</span>${flag === 'lock' ? `<span class="lk">${icon('lock', 13)}</span>` : active ? '<i class="dot-a"></i>' : ''}</a>`;
        }).join('')}`).join('')}
      </nav>
      <div class="set-body" id="set-body"><div class="set-col">${body}</div></div>
    </div>`;
  };

  const pages = {};
  const reg = (path, title, sub, build, after) => { pages[path] = { title, sub, build, after }; };

  /* General */
  reg('/settings/general', 'General', 'Set your date, time, and week preferences.', (s) => {
    const now = new Date(); const p = (n) => String(n).padStart(2, '0');
    const dEx = { 'MM/DD/YYYY': `${p(now.getMonth() + 1)}/${p(now.getDate())}/${now.getFullYear()}`, 'DD/MM/YYYY': `${p(now.getDate())}/${p(now.getMonth() + 1)}/${now.getFullYear()}`, 'YYYY-MM-DD': `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}` };
    const t12 = (() => { const h = now.getHours() % 12 || 12; return h + ':' + p(now.getMinutes()) + ' ' + (now.getHours() >= 12 ? 'PM' : 'AM'); })();
    const t24 = p(now.getHours()) + ':' + p(now.getMinutes());
    return `<div class="s-card"><h3>${icon('globe', 17)}Date &amp; Time</h3>
      <span class="lbl">Week starts on</span>
      <div class="opt-grid c2" data-grp="weekStart">
        <button class="opt ${s.weekStart === 'sunday' ? 'on' : ''}" data-v="sunday">${icon('calendar', 16)}Sunday</button>
        <button class="opt ${s.weekStart === 'monday' ? 'on' : ''}" data-v="monday">${icon('calendar', 16)}Monday</button></div>
      <span class="lbl">Date format</span>
      <div class="opt-grid" data-grp="dateFormat">${Object.keys(dEx).map((k) => `<button class="opt row ${s.dateFormat === k ? 'on' : ''}" data-v="${k}"><span>${k}</span><small>${dEx[k]}</small></button>`).join('')}</div>
      <span class="lbl">Time format</span>
      <div class="opt-grid c2" data-grp="timeFormat">
        <button class="opt stack ${s.timeFormat === '12h' ? 'on' : ''}" data-v="12h">${icon('clock', 18)}<span>12-hour</span><small>${t12}</small></button>
        <button class="opt stack ${s.timeFormat === '24h' ? 'on' : ''}" data-v="24h">${icon('clock', 18)}<span>24-hour</span><small>${t24}</small></button></div>
    </div>`;
  }, (root) => {
    root.addEventListener('click', (e) => {
      const b = e.target.closest('.opt'); if (!b) return;
      const g = b.closest('[data-grp]').dataset.grp; T.saveSettings({ [g]: b.dataset.v });
      T.$$('.opt', b.parentNode).forEach((x) => x.classList.toggle('on', x === b)); T.toast('Preference saved');
    });
  });

  /* Profile */
  reg('/settings/profile', 'Profile', 'Manage your personal information and preferences.', (s, u) => {
    const zones = (Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [u.timezone]);
    return `<div class="s-card"><span class="lbl" style="margin-top:0;text-transform:none;letter-spacing:0;font-size:13px;font-weight:700">Avatar</span>
        <div class="up-row"><span class="avatar lg" id="pf-av">${u.avatar ? `<img src="${u.avatar}" alt="">` : T.esc(u.name.charAt(0).toUpperCase())}</span>
          <div><b id="up-trig">Upload a photo</b><span>JPG, PNG or WebP. Max 2MB.</span></div><input type="file" id="up-file" accept="image/png,image/jpeg,image/webp" hidden /></div></div>
      <div class="s-card">
        <label class="flabel" for="pf-name">Display Name</label><input class="s-input" id="pf-name" value="${T.esc(u.name)}" />
        <label class="flabel fgap" for="pf-mail">Email</label>
        <div class="row-gap"><div class="input-ico grow"><span>${icon('mail', 16)}</span><input class="s-input" id="pf-mail" value="${T.esc(u.email)}" disabled /></div><button class="btn btn-outline btn-sm" id="chg-mail" style="height:42px">Change Email</button></div>
        <label class="flabel fgap" for="pf-bio">Bio</label><textarea class="s-input" id="pf-bio" placeholder="Tell us about yourself..." maxlength="300">${T.esc(u.bio || '')}</textarea></div>
      <div class="s-card">
        <label class="flabel" for="pf-tz">Timezone</label><input class="s-input" id="pf-tz" list="tzs" value="${T.esc(u.timezone)}" /><datalist id="tzs">${zones.map((z) => `<option value="${z}">`).join('')}</datalist>
        <label class="flabel fgap" for="pf-lang">Language</label>
        <select class="s-input s-select" id="pf-lang">${['English', 'Español', 'Français', 'Deutsch', 'Português', 'العربية', 'اردو'].map((l) => `<option ${u.language === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="right-btn"><button class="btn btn-primary" id="pf-save" disabled>Save Changes</button></div>`;
  }, (root) => {
    const u0 = T.user(); const save = T.$('#pf-save', root);
    const dirty = () => (save.disabled = false);
    ['pf-name', 'pf-bio', 'pf-tz', 'pf-lang'].forEach((id) => (T.$('#' + id, root).oninput = dirty));
    T.$('#up-trig', root).onclick = () => T.$('#up-file', root).click();
    T.$('#pf-av', root).onclick = () => T.$('#up-file', root).click();
    T.$('#up-file', root).onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      if (f.size > 2 * 1024 * 1024) return T.toast('Image must be 2MB or smaller.', 'err');
      const r = new FileReader();
      r.onload = () => { const u = T.user(); u.avatar = r.result; T.saveUser(u); T.toast('Photo updated'); T.render(); };
      r.readAsDataURL(f);
    };
    T.$('#chg-mail', root).onclick = () => T.toast('Email changes require verification, which is not enabled yet.', 'err');
    save.onclick = () => {
      const u = T.user(); const name = T.$('#pf-name', root).value.trim();
      if (!name) return T.toast('Display name cannot be empty.', 'err');
      Object.assign(u, { name, bio: T.$('#pf-bio', root).value, timezone: T.$('#pf-tz', root).value, language: T.$('#pf-lang', root).value });
      T.saveUser(u); save.disabled = true; T.toast('Profile saved'); T.render();
    };
  });

  /* Appearance */
  reg('/settings/appearance', 'Appearance', 'Customize how Taskora AI looks and feels.', (s) => `
    <div class="s-card"><h3>${icon('sun', 17)}Theme</h3>
      <div class="opt-grid c3" data-grp="theme">
        ${[['light', 'Light', 'sun'], ['dark', 'Dark', 'moon'], ['system', 'System', 'monitor']].map(([k, l, ic]) => `<button class="opt stack ${s.theme === k ? 'on' : ''}" data-v="${k}" style="min-height:80px">${icon(ic, 18)}<span>${l}</span></button>`).join('')}
      </div></div>
    <div class="s-card"><h3>${icon('today', 17)}Sidebar Style</h3>
      <div class="opt-grid c3" data-grp="sidebar">
        ${[['default', 'Default', 'Full sidebar with labels'], ['compact', 'Compact', 'Icons with smaller labels'], ['minimal', 'Minimal', 'Icons only']].map(([k, l, d]) => `
          <button class="opt tall ${s.sidebar === k ? 'on' : ''}" data-v="${k}"><div class="side-prev"><span class="sp-a"><b></b><b></b><b></b></span><i class="sp-b"></i></div><b>${l}</b><small>${d}</small></button>`).join('')}
      </div></div>
    <div class="s-card"><h3>${icon('palette', 17)}Accent Color</h3>
      <div class="swatches" data-grp="accent">${ACCENTS.map(([k, l, c]) => `<button class="swatch ${s.accent === k ? 'on' : ''}" data-v="${k}" style="color:${c}"><i style="background:${c}"></i><span style="color:var(--text-2)">${l}</span></button>`).join('')}</div></div>
    <div class="s-card"><h3>${icon('type', 17)}Font Size</h3>
      <div class="opt-grid c3" data-grp="fontSize">
        ${[['small', 'Small', 'Aa', '13px'], ['medium', 'Medium', 'Aa', '16px'], ['large', 'Large', 'Aa', '19px']].map(([k, l, a, px]) => `<button class="opt stack fs-opt ${s.fontSize === k ? 'on' : ''}" data-v="${k}"><span style="font-size:${px};line-height:1">${a}</span><small>${l}</small></button>`).join('')}
      </div></div>`, (root) => {
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-v]'); if (!b) return;
      const g = b.closest('[data-grp]').dataset.grp; T.saveSettings({ [g]: b.dataset.v });
      T.$$('[data-v]', b.parentNode).forEach((x) => x.classList.toggle('on', x === b));
      const lbl = { theme: 'Theme', sidebar: 'Sidebar style', accent: 'Accent color', fontSize: 'Font size' }[g]; T.toast(lbl + ' updated');
    });
  });

  /* Notifications */
  const toggle = (key, on) => `<button class="toggle ${on ? 'on' : ''}" role="switch" aria-checked="${on}" data-k="${key}"></button>`;
  reg('/settings/notifications', 'Notifications', 'Choose how and when you want to be notified.', (s) => `
    <div class="s-card"><h3 style="margin-bottom:10px">On this phone</h3>
      <p class="muted-s" style="line-height:20px;margin-bottom:16px;font-size:12.5px">Reminders can appear while Taskora is open, and as a push when the browser delivers one. iPhone installed apps do not run background alerts the way a native app does. Permission is only requested from this screen.</p>
      <div class="row-gap"><button class="btn btn-outline btn-sm" id="inst" style="height:40px">Install Taskora</button><button class="btn btn-primary btn-sm" id="rem" style="height:40px">${s.pushEnabled ? 'Reminders enabled' : 'Enable reminders'}</button></div></div>
    <div class="s-card"><h3>${icon('bell', 17)}In-App Notifications</h3>
      ${[['assigned', 'square-check', 'Task assigned to me', 'Get notified when a task is assigned to you'], ['due', 'clock', 'Task due in 24 hours', "Reminder before a task's deadline"], ['mention', 'message', 'Comment mentioning me', 'When someone mentions you in a comment'], ['ai', 'sparkles', 'AI generation completed', 'When an AI task generation finishes']]
        .map(([k, ic, t, d]) => `<div class="n-row"><span class="nico">${icon(ic, 17)}</span><div class="nt"><b>${t}</b><span>${d}</span></div>${toggle(k, s.notif[k])}</div>`).join('')}</div>
    <div class="s-card"><h3>${icon('mail', 17)}Email Notifications</h3>
      ${[['bars', 'Weekly productivity summary', 'A weekly digest of your productivity stats'], ['alert', 'Task overdue reminders', 'Get reminded about overdue tasks'], ['users', 'Team activity digest', 'Weekly summary of team activity']]
        .map(([ic, t, d]) => `<div class="n-row off"><span class="nico">${icon(ic, 17)}</span><div class="nt"><b>${t} <span class="soon-b">Coming soon</span></b><span>${d}</span></div><button class="toggle" disabled aria-label="${t}"></button></div>`).join('')}</div>`, (root) => {
    root.addEventListener('click', async (e) => {
      const t = e.target.closest('.toggle[data-k]');
      if (t) { const s = T.settings(); s.notif[t.dataset.k] = !s.notif[t.dataset.k]; T.saveSettings({ notif: s.notif }); t.classList.toggle('on', s.notif[t.dataset.k]); t.setAttribute('aria-checked', s.notif[t.dataset.k]); return; }
      if (e.target.closest('#inst')) { if (window.__installPrompt) { window.__installPrompt.prompt(); } else T.toast('Use your browser menu to “Install app” or “Add to Home Screen”.'); }
      if (e.target.closest('#rem')) {
        if (!('Notification' in window)) return T.toast('Notifications are not supported here.', 'err');
        const p = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
        if (p === 'granted') { T.saveSettings({ pushEnabled: true }); T.$('#rem', root).textContent = 'Reminders enabled'; T.toast('Reminders enabled'); } else T.toast('Permission was not granted.', 'err');
      }
    });
  });
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); window.__installPrompt = e; });

  /* Security */
  const pw = (id, label) => `<label class="flabel fgap" for="${id}" style="margin-top:${id === 'pw-cur' ? 0 : 18}px">${label}</label><div class="pw-wrap"><input class="s-input" id="${id}" type="password" autocomplete="${id === 'pw-cur' ? 'current-password' : 'new-password'}" /><button type="button" class="eye" data-eye="${id}" aria-label="Show password">${icon('eye', 17)}</button></div>`;
  reg('/settings/security', 'Security', 'Manage your password and authentication methods.', () => {
    const plat = (navigator.userAgentData && navigator.userAgentData.platform) || (navigator.userAgent.match(/\(([^)]+)\)/) || [])[1] || 'This device';
    return `<div class="s-card"><h3>${icon('lock', 17)}Change Password</h3>
        ${pw('pw-cur', 'Current Password')}${pw('pw-new', 'New Password')}${pw('pw-cnf', 'Confirm New Password')}
        <div class="right-btn" style="margin-top:20px"><button class="btn btn-primary btn-sm" id="pw-save" style="height:42px">Update Password</button></div></div>
      <div class="s-card"><h3>${icon('link', 17)}Connected Accounts</h3>
        <div class="acct-row"><span class="ai">${brandIcon('google', 20)}</span><div><b>Google</b><span>Not connected</span></div><button class="btn" data-conn="Google">Connect</button></div>
        <div class="acct-row"><span class="ai">${brandIcon('github', 20)}</span><div><b>Github</b><span>Not connected</span></div><button class="btn" data-conn="GitHub">Connect</button></div></div>
      <div class="s-card"><h3>${icon('monitor', 17)}Active Sessions</h3>
        <div class="sess"><span class="ai">${icon('globe', 18)}</span><div><b>Current Session <em>ACTIVE</em></b><span>${T.esc(plat)}</span></div></div>
        <div class="sess-note">${icon('info', 14)}To end all other sessions, change your password above.</div></div>`;
  }, (root) => {
    root.addEventListener('click', async (e) => {
      const eye = e.target.closest('[data-eye]');
      if (eye) { const i = T.$('#' + eye.dataset.eye, root); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; eye.innerHTML = icon(show ? 'eye-off' : 'eye', 17); return; }
      const c = e.target.closest('[data-conn]'); if (c) return T.toast(c.dataset.conn + ' sign-in is not configured for this workspace.', 'err');
      if (e.target.closest('#pw-save')) {
        const cur = T.$('#pw-cur', root).value, nw = T.$('#pw-new', root).value, cf = T.$('#pw-cnf', root).value;
        const u = T.user();
        if (!cur || !nw || !cf) return T.toast('Fill in all password fields.', 'err');
        if (u.pass !== (await T.hash(cur))) return T.toast('Current password is incorrect.', 'err');
        if (nw.length < 8) return T.toast('New password must be at least 8 characters.', 'err');
        if (nw !== cf) return T.toast('New passwords do not match.', 'err');
        u.pass = await T.hash(nw); T.saveUser(u);
        ['pw-cur', 'pw-new', 'pw-cnf'].forEach((id) => (T.$('#' + id, root).value = '')); T.toast('Password updated');
      }
    });
  });

  /* Billing */
  reg('/settings/billing', 'Billing', 'Manage your subscription and AI usage.', (s, u) => {
    const used = u.aiUsed, pct = Math.min(100, Math.round((used / 15) * 100));
    const reset = new Date(u.aiCycleStart); reset.setMonth(reset.getMonth() + 1);
    const p = (n) => n;
    return `<div class="s-card"><span class="muted-s">Current plan</span><div class="plan-name">${u.plan === 'free' ? 'Starter' : u.plan}</div>
      <div class="muted-s">AI usage this cycle</div><div style="font-weight:800;font-size:14px;margin:4px 0 2px">${used} / 15 generations used</div>
      <div class="muted-s" style="font-size:12px">Resets on ${reset.getMonth() + 1}/${reset.getDate()}/${reset.getFullYear()}</div>
      <div class="usage-bar"><i style="width:${pct}%"></i></div>
      <a class="btn btn-primary" href="/pricing" style="height:42px">View plans and upgrade</a></div>`;
  });

  /* Workspace general */
  reg('/settings/workspace/general', 'Workspace', 'Manage your workspace settings and information.', (s, u) => {
    const w = u.workspace || {};
    return `<div class="s-card"><span class="lbl" style="margin-top:0;text-transform:none;letter-spacing:0;font-size:13px;font-weight:700">Workspace Logo</span>
        <div class="up-row"><span class="up-logo">${icon('building', 24)}</span><div><b>Upload logo</b><span>JPG, PNG or WebP. Max 2MB.</span></div></div></div>
      <div class="s-card">
        <label class="flabel" for="ws-name">Workspace Name</label><input class="s-input" id="ws-name" placeholder="My Workspace" value="${T.esc(w.name || '')}" maxlength="40" />
        <label class="flabel fgap" for="ws-slug">Workspace Slug</label>
        <div class="row-gap"><input class="s-input grow" id="ws-slug" placeholder="my-workspace" value="${T.esc(w.slug || '')}" maxlength="40" /><button class="btn btn-outline btn-sm" id="ws-regen" style="height:42px">${icon('refresh', 14)}Regenerate</button></div></div>
      <div class="right-btn"><button class="btn btn-primary" id="ws-save" disabled>${w.name ? 'Save Changes' : 'Create Workspace'}</button></div>`;
  }, (root) => {
    const slugify = (v) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    const nm = T.$('#ws-name', root), sg = T.$('#ws-slug', root), sv = T.$('#ws-save', root);
    let touched = false;
    const upd = () => (sv.disabled = !nm.value.trim());
    nm.oninput = () => { if (!touched) sg.value = slugify(nm.value); upd(); };
    sg.oninput = () => { touched = true; upd(); };
    T.$('#ws-regen', root).onclick = () => { sg.value = (slugify(nm.value) || 'workspace') + '-' + Math.random().toString(36).slice(2, 6); touched = true; };
    T.$('.up-row', root).onclick = () => T.toast('Workspace logos are available on Pro and Team plans.', 'err');
    sv.onclick = () => { const u = T.user(); u.workspace = { name: nm.value.trim(), slug: slugify(sg.value) || slugify(nm.value) }; T.saveUser(u); sv.disabled = true; T.toast('Workspace saved'); };
  });

  /* Members + Roles (Pro) */
  reg('/settings/members', 'Members', 'Invite teammates and manage who has access.', () =>
    T.lockedBlock('Members — Pro Feature', 'Invite teammates, assign roles, and collaborate on shared workspaces. Available on the Pro and Team plans.'));
  reg('/settings/roles', 'Roles & Permissions', 'Define custom permission sets for your workspace.', () =>
    T.lockedBlock('Roles & Permissions — Pro Feature', 'Control exactly what each team member can do. Define permissions for Owners, Admins, Members, and Viewers. Protect sensitive workspace data with granular access control.'));

  /* ---------- wire up routes ---------- */
  Object.keys(pages).forEach((path) => {
    const pg = pages[path];
    T.route(path, {
      auth: true, group: 'settings', title: 'Settings',
      render: (p) => layout(path, `<div id="set-slot">${skeleton()}</div>`),
      after: (root) => {
        const slot = T.$('#set-slot', root); if (!slot) return;
        const myPath = location.pathname;
        setTimeout(() => {
          if (location.pathname !== myPath || !T.$('#set-slot')) return;
          const u = T.user(); if (!u) return;
          const s = T.settings();
          const lockedPage = path === '/settings/members' || path === '/settings/roles';
          slot.innerHTML = `<h1>${pg.title}</h1><p class="sub">${pg.sub}</p>${pg.build(s, u)}`;
          if (lockedPage) slot.querySelector('.locked').style.paddingTop = '48px';
          if (pg.after) pg.after(slot);
        }, 380);
        root.addEventListener('click', async (e) => {
          if (e.target.closest('[data-delete]')) {
            const ok = await T.confirm({ title: 'Delete account?', text: 'This permanently removes your account and all of your tasks from this browser. This cannot be undone.', ok: 'Delete account', danger: true });
            if (!ok) return;
            const u = T.user(); T.store.del('tasks:' + u.id);
            T.store.set('users', T.users().filter((x) => x.email !== u.email)); T.store.del('session');
            T.toast('Account deleted'); T.navigate('/');
          }
        });
      },
    });
  });
})();
