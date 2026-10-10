/* App pages (authenticated) */
(function () {
  const arrow = icon('arrow-right', 16);
  const reg = (path, def) => T.route(path, Object.assign({ auth: true }, def));

  /* ---------- Today ---------- */
  reg('/dashboard', {
    title: 'Today',
    render: () => {
      const u = T.user(); const all = T.tasks(); const open = all.filter((t) => !t.done);
      const now = Date.now(); const dayMs = 864e5;
      const overdue = open.filter((t) => t.due && t.due < now).length;
      const dueToday = open.filter((t) => t.due && t.due >= now - (now % dayMs) && t.due < now - (now % dayMs) + dayMs).length;
      const highPri = open.filter((t) => t.priority === 'high').length;
      const order = { high: 0, medium: 1, low: 2 };
      const scheduled = open.filter((t) => t.due).sort((a, b) => order[a.priority] - order[b.priority] || a.due - b.due);
      const unscheduled = open.filter((t) => !t.due).sort((a, b) => order[a.priority] - order[b.priority]);
      return `<div class="center-col">
        <div class="eyebrow">Today, ${T.esc(u.name)}</div>
        <h2 class="h-now">What should I do now?</h2>
        ${open.length ? `
          <div class="sub-p">${overdue} overdue · ${dueToday} due today · ${highPri} high priority</div>
          ${scheduled.length ? `<div class="sec-lbl">Top priorities</div><div class="tlist" id="tl-a">${scheduled.map(T.taskRow).join('')}</div>` : ''}
          ${unscheduled.length ? `<div class="sec-lbl${scheduled.length ? ' sp' : ''}">Unscheduled</div><div class="tlist" id="tl-b">${unscheduled.map(T.taskRow).join('')}</div>` : ''}`
        : `<p class="sub-p">Nothing open. Capture the next thing in the bar below.</p>`}
        <a class="u-link" href="/analytics">Weekly numbers live in Analytics</a>
      </div>`;
    },
    after: (root) => { T.$$('.tlist', root).forEach((tl) => T.bindTaskList(tl, () => T.render())); },
  });

  /* ---------- Tasks ---------- */
  let taskFilter = 'all', priFilter = 'all', taskSort = 'recommended', taskSearch = '';
  const STATUS_TABS = [['all', 'All'], ['pending', 'Pending'], ['in_progress', 'In progress'], ['completed', 'Completed']];
  const PRI_SORT = { high: 0, medium: 1, low: 2 };
  reg('/tasks', {
    title: 'Tasks',
    render: () => {
      const all = T.tasks();
      let list = all.filter((t) => (taskFilter === 'all' ? true : t.status === taskFilter));
      if (priFilter !== 'all') list = list.filter((t) => t.priority === priFilter);
      if (taskSearch.trim()) { const q = taskSearch.trim().toLowerCase(); list = list.filter((t) => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)); }
      list = list.slice().sort((a, b) => taskSort === 'priority' ? PRI_SORT[a.priority] - PRI_SORT[b.priority]
        : taskSort === 'due' ? (a.due || 9e15) - (b.due || 9e15)
        : taskSort === 'newest' ? b.created - a.created
        : (a.done - b.done) || PRI_SORT[a.priority] - PRI_SORT[b.priority] || (a.due || 9e15) - (b.due || 9e15));
      const highCount = all.filter((t) => !t.done && t.priority === 'high').length;
      return `<div class="page-h"><div class="eyebrow">Everything in your workspace</div><h1>Tasks</h1></div>
        <div class="tasks-toolbar">
          <h3>My tasks</h3><span class="muted-s">Capture quickly, then focus on what matters.</span>
          <button class="btn btn-primary btn-sm" id="t-add" style="margin-left:auto">${icon('plus', 15)}Add task</button>
        </div>
        <div class="tasks-filters">
          <div class="s-search"><span>${icon('search', 15)}</span><input id="t-search" placeholder="Search title, description, or category" value="${T.esc(taskSearch)}" /></div>
          <div class="seg" id="seg">${STATUS_TABS.map(([k, l]) => `<button data-f="${k}" class="${taskFilter === k ? 'on' : ''}">${l}${k === 'all' ? ` (${all.length})` : ''}</button>`).join('')}</div>
        </div>
        <div class="tasks-filters2">
          <select class="s-input s-select sm" id="t-pri"><option value="all" ${priFilter === 'all' ? 'selected' : ''}>All priorities</option><option value="high" ${priFilter === 'high' ? 'selected' : ''}>High priority</option><option value="medium" ${priFilter === 'medium' ? 'selected' : ''}>Medium priority</option><option value="low" ${priFilter === 'low' ? 'selected' : ''}>Low priority</option></select>
          <select class="s-input s-select sm" id="t-sort"><option value="recommended" ${taskSort === 'recommended' ? 'selected' : ''}>Recommended</option><option value="priority" ${taskSort === 'priority' ? 'selected' : ''}>Priority</option><option value="due" ${taskSort === 'due' ? 'selected' : ''}>Due date</option><option value="newest" ${taskSort === 'newest' ? 'selected' : ''}>Newest</option></select>
          ${highCount ? `<span class="hi-count">${highCount} high priority</span>` : ''}
        </div>
        ${list.length ? `<div class="tlist" id="tl">${list.map(T.taskRow).join('')}</div>`
        : `<div class="empty-card"><div class="ibox">${icon('tasks', 22)}</div><b>${all.length ? 'Nothing here' : 'No tasks yet'}</b>${all.length ? 'No tasks match this filter.' : 'Capture your first task in the bar above.'}</div>`}`;
    },
    after: (root) => {
      const redraw = () => { const d = T.routes['/tasks']; const c = T.$('#content'); c.innerHTML = d.render(); d.after(c); };
      T.$('#seg', root).onclick = (e) => { const b = e.target.closest('[data-f]'); if (!b) return; taskFilter = b.dataset.f; redraw(); };
      T.$('#t-pri', root).onchange = (e) => { priFilter = e.target.value; redraw(); };
      T.$('#t-sort', root).onchange = (e) => { taskSort = e.target.value; redraw(); };
      let st; T.$('#t-search', root).oninput = (e) => { taskSearch = e.target.value; clearTimeout(st); st = setTimeout(redraw, 220); };
      T.$('#t-add', root).onclick = () => T.openTaskModal(null, redraw);
      const tl = T.$('#tl', root); if (tl) T.bindTaskList(tl, redraw);
    },
  });

  /* ---------- Inbox ---------- */
  reg('/inbox', {
    title: 'Inbox',
    render: () => {
      const list = T.tasks().filter((t) => !t.done && !t.due);
      return `<div class="page-h"><div class="eyebrow">Unsorted captures</div><h1>Inbox</h1></div>
        ${list.length ? `<div class="tlist" id="tl">${list.map(T.taskRow).join('')}</div>`
        : `<div class="empty-card"><div class="ibox">${icon('inbox', 22)}</div><b>Inbox zero</b>Anything you capture without a date lands here.</div>`}`;
    },
    after: (root) => { const tl = T.$('#tl', root); if (tl) T.bindTaskList(tl, () => T.render()); },
  });

  /* ---------- AI planning ---------- */
  const TEMPLATES = [
    'Build a full-stack e-commerce platform with React and Node.js',
    'Create a mobile-responsive portfolio website with dark mode',
    'Design and implement a REST API for a blog application',
    'Set up a CI/CD pipeline with GitHub Actions and Docker',
  ];
  const MODES = ['Plan my day', 'Brain dump', 'Break down', 'Weekly review', 'Plan a goal'];
  const LIMIT = 15;
  let aiMode = 'Ask', aiHistory = [];
  let planDraft = null, planState = null;

  const MODE_CHECKLISTS = {
    'Weekly review': [
      ['Gather completed work from the past week', 'high'],
      ['Identify pending and overdue items', 'high'],
      ['Update task statuses in your system', 'medium'],
      ['Reflect on achievements and challenges', 'medium'],
      ['Plan priorities for the upcoming week', 'high'],
      ['Schedule a brief team sync (if applicable)', 'low'],
    ],
    'Plan my day': [
      ['Review everything due today and this week', 'high'],
      ['Pick the top 2-3 priorities for today', 'high'],
      ['Block focused time for the hardest task first', 'medium'],
      ['Leave a 10-15 minute buffer between tasks', 'low'],
      ['Check off progress at the end of the day', 'medium'],
    ],
    'Brain dump': [
      ['Capture everything on your mind, unsorted', 'medium'],
      ['Tag anything urgent as high priority', 'high'],
      ['Group related items together', 'low'],
      ['Move dated items onto your calendar', 'medium'],
      ['Review the list and discard anything stale', 'low'],
    ],
    'Break down': [
      ['Clarify the outcome you actually want', 'high'],
      ['List the major milestones to get there', 'high'],
      ['Split each milestone into concrete next actions', 'medium'],
      ['Estimate rough effort for each action', 'medium'],
      ['Sequence actions and flag any blockers', 'low'],
    ],
    'Plan a goal': [
      ['Define the goal and what success looks like', 'high'],
      ['Research what the goal will require', 'medium'],
      ['Set milestones with target dates', 'high'],
      ['Identify the very first step to take', 'medium'],
      ['Schedule a check-in to review progress', 'low'],
    ],
  };

  const makePlan = (goal) => {
    const g = goal.trim().replace(/[.\s]+$/, '');
    const short = g.length > 60 ? g.slice(0, 57) + '…' : g;
    return [
      { title: `Define scope and success criteria for: ${short}`, desc: 'Write down what "done" looks like and who needs to sign off.', priority: 'high', time: '2h' },
      { title: 'Research options and gather requirements', desc: 'Collect the constraints, references, and prior art you need before building.', priority: 'medium', time: '3h' },
      { title: 'Break the work into milestones with owners and dates', desc: 'Turn the goal into a sequence of concrete, assignable chunks.', priority: 'high', time: '1h' },
      { title: 'Complete the first milestone and review the result', desc: 'Ship the smallest useful slice, then check it against the goal.', priority: 'high', time: '4h' },
      { title: 'Test, gather feedback, and fix issues', desc: 'Validate with real usage and address what comes up.', priority: 'medium', time: '3h' },
      { title: 'Ship, announce, and schedule a retrospective', desc: 'Release the work and set a short retro to capture lessons.', priority: 'low', time: '1h' },
    ];
  };

  reg('/ai-planning', {
    title: 'AI',
    render: () => {
      const u = T.user(); const left = Math.max(0, LIMIT - u.aiUsed);
      return `<div class="ai-hero">
          <span class="pill">${icon('sparkles', 13)} AI planning</span>
          <h1>Turn goals into <span class="grad-text">plans.</span></h1>
          <p>Describe the outcome you want. Taskora will propose a dependency-aware plan for you to review, edit, and save.</p>
        </div>
        <div class="badges-row">
          <span class="badge-c">${icon('list', 14)} Structured breakdown</span>
          <span class="badge-c">${icon('wand', 14)} Editable suggestions</span>
          <span class="badge-c">${icon('circle-check', 14)} Review before save</span>
          <span class="badge-c"><i class="gdot"></i> <span id="gen-left">${left}/${LIMIT} generations left</span></span>
        </div>
        <div class="ai-card">
          <h3>Taskora AI</h3><div class="sm">Ask about your real tasks. Changes stay as a preview until you apply them.</div>
          <textarea class="ai-ta" id="ask-ta" placeholder="What should I work on first?"></textarea>
          <div class="mode-row" id="modes"><button data-m="Ask" class="on">Ask</button>${MODES.map((m) => `<button data-m="${m}">${m}</button>`).join('')}</div>
          <div id="ask-out"></div>
        </div>
        <div class="ai-card">
          <div class="label-up">${icon('type', 15)} Describe your goal or project</div>
          <div class="goal-ta"><textarea id="goal" maxlength="500" placeholder="Example: Plan the launch of my portfolio redesign by the end of next month."></textarea><span class="cnt" id="cnt">0/500</span></div>
          <div class="tpl-label">${icon('bulb', 14)} Quick start templates</div>
          <div class="tpls">${TEMPLATES.map((t) => `<button data-t="${T.esc(t)}">${icon('chevron-right', 12)}${T.esc(t)}</button>`).join('')}</div>
          <div class="ai-foot">
            <div class="l"><span id="foot-l">${left}/${LIMIT} generations left</span><button id="hist-btn">${icon('history', 14)}History ${icon('chevron-down', 12)}</button></div>
            <button class="btn btn-primary" id="create" disabled>Create plan ${icon('send', 15)}</button>
          </div>
          <div id="hist"></div>
          <div id="gen-progress"></div>
          <div id="recent-gens">${aiHistory.length ? recentGensHtml() : ''}</div>
          <div id="plan-out"></div>
        </div>`;
    },
    after: (root) => {
      const goal = T.$('#goal', root), cnt = T.$('#cnt', root), create = T.$('#create', root);
      const sync = () => { cnt.textContent = goal.value.length + '/500'; create.disabled = goal.value.trim().length < 5; };
      goal.oninput = sync;
      T.$('.tpls', root).onclick = (e) => { const b = e.target.closest('[data-t]'); if (!b) return; goal.value = b.dataset.t; sync(); goal.focus(); };

      // Ask card
      const ta = T.$('#ask-ta', root), out = T.$('#ask-out', root);
      const runMode = () => {
        if (MODE_CHECKLISTS[aiMode]) {
          out.innerHTML = checklistHtml(aiMode);
          bindChecklist(out);
        } else {
          const q = aiMode === 'Ask' ? (ta.value || 'What should I work on first?') : ta.value;
          out.innerHTML = `<div class="ai-reply">${T.md(T.assistantReply(q))}</div>`;
        }
      };
      T.$('#modes', root).onclick = (e) => {
        const b = e.target.closest('[data-m]'); if (!b) return;
        aiMode = b.dataset.m; T.$$('#modes button', root).forEach((x) => x.classList.toggle('on', x === b));
        runMode();
      };
      ta.onkeydown = (e) => { if ((e.key === 'Enter' && (e.metaKey || e.ctrlKey))) runMode(); };

      // History
      const hist = T.$('#hist', root);
      T.$('#hist-btn', root).onclick = () => {
        hist.innerHTML = hist.innerHTML ? '' : (aiHistory.length ? `<div class="hist">${aiHistory.map((h) => `<div><span>${T.esc(h.goal)}</span><em>${new Date(h.at).toLocaleDateString()}</em></div>`).join('')}</div>` : `<div class="hist"><div><span>No plans generated yet.</span></div></div>`);
      };

      // Create plan
      create.onclick = () => {
        const u = T.user();
        if (u.aiUsed >= LIMIT) return T.toast('Generation limit reached. Upgrade for more.', 'err');
        const text = goal.value;
        create.disabled = true; create.style.display = 'none';
        const prog = T.$('#gen-progress', root);
        const stop = `<button class="btn btn-outline btn-sm" id="stop-plan">${icon('stop', 13)}Stop planning</button>`;
        T.$('#create', root).insertAdjacentHTML('afterend', stop);
        prog.innerHTML = `<div class="gen-prog"><div class="gdots"><i></i><i></i><i></i> AI is analyzing your prompt and building the task tree…</div>
          <div class="gbar"><i id="gbar-fill"></i></div></div>`;
        requestAnimationFrame(() => { const f = T.$('#gbar-fill', root); if (f) f.style.width = '100%'; });
        T.$('#stop-plan', root).onclick = () => { clearTimeout(timer); finish(true); };
        const timer = setTimeout(() => finish(false), 1500);
        function finish(stopped) {
          T.$('#stop-plan', root)?.remove();
          prog.innerHTML = ''; create.style.display = ''; create.disabled = false;
          if (stopped) return;
          u.aiUsed += 1; T.saveUser(u);
          planDraft = makePlan(text);
          aiHistory.unshift({ goal: text, at: Date.now(), count: planDraft.length });
          const left = Math.max(0, LIMIT - u.aiUsed);
          T.$('#gen-left', root).textContent = T.$('#foot-l', root).textContent = `${left}/${LIMIT} generations left`;
          sync();
          T.$('#recent-gens', root).innerHTML = recentGensHtml();
          planState = { items: planDraft.map((p) => ({ ...p, selected: true, saved: false })) };
          renderPlanOut(root);
          T.$('#plan-out', root).scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      };
      if (planState) renderPlanOut(root);
    },
  });

  function recentGensHtml() {
    return `<div class="s-card recent-gens"><h3>${icon('history', 15)}Recent generations</h3>
      ${aiHistory.slice(0, 5).map((h) => `<div class="gen-row"><div><b>${T.esc(h.goal.slice(0, 60))}${h.goal.length > 60 ? '…' : ''}</b><span>${h.count} tasks · ${new Date(h.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${T.fmtTime(new Date(h.at))}</span></div></div>`).join('')}</div>`;
  }

  function checklistHtml(mode) {
    const items = MODE_CHECKLISTS[mode];
    return `<div class="ai-reply"><p>Here's a suggested set of tasks to help with ${T.esc(mode.toLowerCase())}. Feel free to adjust priorities or add details as needed.</p></div>
      <div class="checklist" id="mode-check">
        ${items.map(([t, p], i) => `<label class="chk-row"><input type="checkbox" checked data-i="${i}" /><div><div class="t">${T.esc(t)}</div><div class="p">${p}</div></div></label>`).join('')}
        <div class="right-btn gap"><button class="btn btn-outline btn-sm" id="chk-cancel">Cancel</button><button class="btn btn-primary btn-sm" id="chk-apply">Apply changes</button></div>
      </div>`;
  }
  function bindChecklist(scope) {
    const items = MODE_CHECKLISTS[aiMode];
    T.$('#chk-cancel', scope).onclick = () => { T.$('#ask-out').innerHTML = ''; };
    T.$('#chk-apply', scope).onclick = () => {
      const checked = T.$$('#mode-check input[type=checkbox]', scope).filter((c) => c.checked).map((c) => items[+c.dataset.i]);
      if (!checked.length) return T.toast('Select at least one item.', 'err');
      const all = T.tasks();
      checked.slice().reverse().forEach(([title, priority]) => all.unshift({ id: T.uid(), title, description: '', priority, due: null, assignee: '', pendingReason: '', done: false, status: 'pending', created: Date.now() }));
      T.saveTasks(all); T.toast(checked.length + ' tasks added to your workspace');
      T.$('#ask-out').innerHTML = '';
    };
  }

  function renderPlanOut(root) {
    const po = T.$('#plan-out', root); if (!po || !planState) return;
    const selCount = planState.items.filter((p) => p.selected).length;
    const savedCount = planState.items.filter((p) => p.saved).length;
    po.innerHTML = `<div class="plan-out"><h4>${planState.items.length} tasks · ${selCount} selected · ${savedCount} saved</h4>
      ${planState.items.map((p, i) => `
        <div class="plan-card ${p.saved ? 'saved' : ''}" data-i="${i}">
          <input type="checkbox" ${p.selected ? 'checked' : ''} data-sel="${i}" />
          <div class="pc-num">${i + 1}</div>
          <div class="pc-body">
            <b>${T.esc(p.title)}</b><p>${T.esc(p.desc)}</p>
            <div class="pc-meta">
              <select class="pri-sel" data-pi="${i}"><option value="high" ${p.priority === 'high' ? 'selected' : ''}>High</option><option value="medium" ${p.priority === 'medium' ? 'selected' : ''}>Medium</option><option value="low" ${p.priority === 'low' ? 'selected' : ''}>Low</option></select>
              <span class="pc-time">${icon('clock', 12)}${p.time}</span>
              <span class="pc-step">Step ${i + 1} of ${planState.items.length}</span>
            </div>
          </div>
          <button class="btn btn-outline btn-sm pc-save" data-save="${i}" ${p.saved ? 'disabled' : ''}>${p.saved ? icon('check', 13) + 'Saved' : icon('send', 13) + 'Save'}</button>
        </div>`).join('')}
      <div class="right-btn gap"><button class="btn btn-outline btn-sm" id="plan-cancel">Cancel</button><button class="btn btn-primary btn-sm" id="plan-save-all">Save selected to tasks</button></div>
    </div>`;
    po.onclick = (e) => {
      const sel = e.target.closest('[data-sel]');
      if (sel) { planState.items[+sel.dataset.sel].selected = sel.checked; renderPlanOut(root); return; }
      const sv = e.target.closest('[data-save]');
      if (sv && !sv.disabled) {
        const i = +sv.dataset.save; const p = planState.items[i];
        const all = T.tasks(); all.unshift({ id: T.uid(), title: p.title, description: p.desc, priority: p.priority, due: null, assignee: '', pendingReason: '', done: false, status: 'pending', created: Date.now() });
        T.saveTasks(all); p.saved = true; T.toast('Task saved: ' + p.title); renderPlanOut(root); return;
      }
      if (e.target.closest('#plan-cancel')) { planState = null; po.innerHTML = ''; return; }
      if (e.target.closest('#plan-save-all')) {
        const picked = planState.items.filter((p) => p.selected && !p.saved);
        if (!picked.length) return T.toast('Nothing left to save.', 'err');
        const all = T.tasks();
        picked.forEach((p) => { all.unshift({ id: T.uid(), title: p.title, description: p.desc, priority: p.priority, due: null, assignee: '', pendingReason: '', done: false, status: 'pending', created: Date.now() }); p.saved = true; });
        T.saveTasks(all); T.toast(picked.length + ' tasks added to your workspace'); renderPlanOut(root);
      }
    };
    po.addEventListener('change', (e) => {
      const ps = e.target.closest('.pri-sel'); if (!ps) return;
      planState.items[+ps.dataset.pi].priority = ps.value;
    });
  }

  /* ---------- Analytics (locked) ---------- */
  const locked = (title, text, extra) => `
    <div class="locked">
      <div class="lbox">${icon('lock', 36)}<span class="sp">${icon('sparkles', 16)}</span></div>
      <h3>${title}</h3><p>${text}</p>
      <div class="btns"><a class="btn btn-primary" href="/pricing">Upgrade to Pro ${arrow}</a>${extra || '<a class="btn btn-outline" href="/pricing">View Plans</a>'}</div>
      <small>Starting at $12/month · Cancel anytime</small>
    </div>`;
  T.lockedBlock = locked;

  reg('/analytics', {
    title: 'Analytics',
    render: () => `<div class="page-h" style="margin-top:20px"><div class="eyebrow">Productivity insights</div><h1>Analytics</h1></div>
      ${locked('Analytics', 'Understand completion, overdue work, priorities, and weekly activity with a Pro or Team plan.')}`,
  });

  /* ---------- Notifications ---------- */
  reg('/notifications', {
    title: 'Notifications',
    render: () => {
      const on = T.settings().pushEnabled;
      return `<div class="ncenter">
        <span class="pill">${icon('bell', 13)} Notification center</span>
        <h1>Push <span class="grad-text">Notifications.</span></h1>
        <p class="lead">Manage your notification preferences and stay updated on task activity.</p>
        <div class="push-card">
          <div class="ph ${on ? 'on' : ''}"><div class="ibox">${icon(on ? 'bell' : 'bell-off', 24)}</div><div><h3>Push Notifications</h3><span>${on ? 'Currently enabled' : 'Currently disabled'}</span></div></div>
          <p>${on ? 'You will be notified about due dates and task activity while Taskora is open.' : 'Enable push notifications to stay on top of your tasks and never miss a deadline.'}</p>
          <button class="btn ${on ? 'btn-outline' : 'btn-primary'} btn-block" id="push-btn">${on ? 'Disable Notifications' : 'Enable Notifications'}</button>
          <div class="note">Note: Email notifications require the Pro plan.</div>
        </div></div>`;
    },
    after: (root) => {
      T.$('#push-btn', root).onclick = async () => {
        if (T.settings().pushEnabled) { T.saveSettings({ pushEnabled: false }); T.toast('Notifications disabled'); return T.render(); }
        if (!('Notification' in window)) return T.toast('This browser does not support notifications.', 'err');
        let perm = Notification.permission;
        if (perm !== 'granted') perm = await Notification.requestPermission();
        if (perm === 'granted') { T.saveSettings({ pushEnabled: true }); T.toast('Notifications enabled'); T.render(); }
        else T.toast('Permission was not granted.', 'err');
      };
    },
  });

  /* ---------- Plans ---------- */
  const planCard = (o) => `
    <div class="plan ${o.pop ? 'pop' : ''}">
      ${o.pop ? `<span class="badge-pop">${icon('star', 11)} MOST POPULAR</span>` : ''}
      <h3>${o.name}</h3><div class="desc">${o.desc}</div>
      <div class="price">${o.price}${o.per ? '<small>/month</small>' : ''}</div>
      <ul>${o.items.map((i) => `<li><span class="ck">${icon('check', 10)}</span>${i}</li>`).join('')}</ul>${o.btn}
    </div>`;
  reg('/pricing', {
    title: 'Plans',
    render: () => `<div class="plans-page">
      <div class="sec-head"><span class="pill">${icon('sparkles', 13)} Simple pricing</span><h2>Plans that scale with you.</h2><p>Start free. Upgrade when you need more power. No hidden fees, cancel anytime.</p></div>
      <div class="plans">
        ${planCard({ name: 'Starter', desc: 'Perfect for individuals getting started.', price: 'Free', items: ['Up to 50 tasks', '15 AI generations / month', 'Email support', '1 workspace'], btn: '<button class="btn btn-outline" disabled style="opacity:1;cursor:default">Current plan</button>' })}
        ${planCard({ name: 'Pro', desc: 'For power users and small teams.', price: '$12', per: 1, pop: 1, items: ['Unlimited tasks', '250 AI generations / month', 'Priority support', '10 workspaces', 'Analytics dashboard', 'Custom categories'], btn: '<button class="btn btn-primary" data-up="Pro">Upgrade to Pro</button>' })}
        ${planCard({ name: 'Team', desc: 'For organizations that need full control.', price: '$49', per: 1, items: ['Everything in Pro', '1,500 AI generations / month', 'Unlimited workspaces', 'Dedicated support', 'Admin controls'], btn: '<button class="btn btn-outline" data-up="Team">Upgrade to Team</button>' })}
      </div></div>`,
    after: (root) => {
      root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-up]'); if (!b) return;
        T.toast('Online checkout is not available in this build.', 'err');
      });
    },
  });
})();
