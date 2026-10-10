/* Public pages: landing, register, login */
(function () {
  const arrow = icon('arrow-right', 16);

  /* ---------- Landing ---------- */
  const features = [
    ['brain', 'AI Planning', 'Generate a structured first draft of tasks, then review and edit every suggestion before saving.'],
    ['zap', 'Fast Task Updates', 'Keep task changes responsive while the workspace synchronizes them in the background.'],
    ['activity', 'Actionable Analytics', 'See completion activity, upcoming workload, overdue work, and priority distribution.'],
    ['shield', 'Workspace Privacy', "Supabase authentication and Row Level Security isolate each user's task data."],
    ['terminal', 'Developer First', 'Clean REST APIs, strict TypeScript definitions, and robust serverless architecture.'],
    ['layers', 'Multi-Platform', 'Fully responsive design that works beautifully on desktop, tablet, and mobile devices.'],
  ];
  const steps = [
    ['align-left', 'linear-gradient(135deg,#2563eb,#3b82f6)', '01', 'Describe', 'Tell Taskora AI what you want to achieve. Be as detailed or brief as you like.'],
    ['sparkles', 'linear-gradient(135deg,#38bdf8,#2dd4bf)', '02', 'AI Generates', 'Our Groq-powered engine breaks your goal into prioritized, actionable sub-tasks.'],
    ['circle-check', 'linear-gradient(135deg,#059669,#10b981)', '03', 'Execute', 'Choose the next priority, track progress, and adjust the plan as the work changes.'],
  ];
  const plan = (o) => `
    <div class="plan ${o.pop ? 'pop' : ''}">
      ${o.pop ? `<span class="badge-pop">${icon('star', 11)} MOST POPULAR</span>` : ''}
      <h3>${o.name}</h3><div class="desc">${o.desc}</div>
      <div class="price">${o.price}${o.per ? `<small>/month</small>` : ''}</div>
      <ul>${o.items.map((i) => `<li><span class="ck">${icon('check', 10)}</span>${i}</li>`).join('')}</ul>
      ${o.btn}
    </div>`;

  T.pages.landingHtml = () => `
  <div class="landing">
    <div class="wrap" style="max-width:1102px">
      <nav class="l-nav">
        <a href="/" class="logo" aria-label="Taskora"><img src="/assets/logo.png" alt="Taskora" /></a>
        <div class="l-nav-right"><a class="link" href="/login">Sign In</a><a class="btn btn-primary" href="/register">Get Started Free</a></div>
      </nav>
      <section class="hero">
        <div>
          <span class="pill">${icon('sparkles', 14)} Generative AI Powered</span>
          <h1>Think big.<br>Let AI handle<br>the <span class="accent-text">execution.</span></h1>
          <p class="lead">Turn a goal into an editable task plan, choose what matters, and track the work from one focused workspace.</p>
          <div class="hero-cta"><a class="btn btn-primary btn-lg" href="/register">Start Building Free ${arrow}</a><a class="btn btn-outline btn-lg" href="/login">Sign In</a></div>
          <div class="chips"><span class="chip">Review first</span><span class="chip">Private by default</span><span class="chip">Fast capture</span><span class="chip">Built for focus</span></div>
        </div>
        <div class="mock" aria-hidden="true">
          <div class="mock-bar"><i class="dot r"></i><i class="dot y"></i><i class="dot g"></i><div class="mock-url">taskora.ai/dashboard</div></div>
          <div class="mock-stats">
            <div class="stat s1"><b>24</b><span>TASKS</span></div><div class="stat s2"><b>18</b><span>DONE</span></div>
            <div class="stat s3"><b>6</b><span>ACTIVE</span></div><div class="stat s4"><b>12</b><span>AI GEN</span></div>
          </div>
          <div class="mock-row done"><span class="cb">${icon('check', 11)}</span>Design system audit<span class="tag high">HIGH</span></div>
          <div class="mock-row"><span class="cb"></span>API integration tests<span class="tag med">MEDIUM</span></div>
          <div class="mock-row"><span class="cb"></span>Deploy staging build<span class="tag high">HIGH</span></div>
        </div>
      </section>
    </div>

    <section class="section" id="features"><div class="wrap">
      <div class="sec-head nopill"><h2>Built for velocity.</h2><p>Stop wasting time planning. Describe what you want to achieve and start crossing off tasks instantly.</p></div>
      <div class="features">${features.map(([ic, t, d]) => `<div class="feat"><div class="ibox">${icon(ic, 18)}</div><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>
    </div></section>

    <section class="section grid-bg" id="how"><div class="wrap">
      <div class="sec-head"><span class="pill">${icon('target', 13)} How it works</span><h2>Three steps to productivity.</h2><p>Move from an idea to a reviewable task plan in three clear steps.</p></div>
      <div class="steps">${steps.map(([ic, bg, n, t, d]) => `<div class="step"><div class="sico" style="background:${bg}">${icon(ic, 20)}</div><div class="num">${n}</div><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>
    </div></section>

    <section class="section" id="pricing"><div class="wrap">
      <div class="sec-head"><span class="pill">${icon('sparkles', 13)} Simple pricing</span><h2>Plans that scale with you.</h2><p>Start free. Upgrade when you need more power. No hidden fees, cancel anytime.</p></div>
      <div class="plans">
        ${plan({ name: 'Starter', desc: 'Perfect for individuals getting started.', price: 'Free', items: ['Up to 50 tasks', '15 AI generations / month', 'Email support', '1 workspace'], btn: '<a class="btn btn-outline" href="/register">Get Started</a>' })}
        ${plan({ name: 'Pro', desc: 'For power users and small teams.', price: '$12', per: 1, pop: 1, items: ['Unlimited tasks', '250 AI generations / month', 'Priority support', '10 workspaces', 'Analytics dashboard', 'Custom categories'], btn: '<a class="btn btn-primary" href="/register">Choose Pro</a>' })}
        ${plan({ name: 'Team', desc: 'For organizations that need full control.', price: '$49', per: 1, items: ['Everything in Pro', '1,500 AI generations / month', 'Unlimited workspaces', 'Dedicated support', 'Custom integrations', 'Admin controls'], btn: '<a class="btn btn-outline" href="/register">Choose Team</a>' })}
      </div>
    </div></section>

    <section class="section" style="border-top:0;padding-top:24px"><div class="wrap">
      <div class="cta-card">
        <span class="pill">${icon('zap', 13)} Start in under a minute</span>
        <h2>Ready to ship faster?</h2>
        <p class="sub">Describe a goal, review the AI plan, and start tracking work in one workspace. No credit card required on Starter.</p>
        <div class="mini-feats">
          <div class="mini"><span style="color:#f59e0b">${icon('zap', 16)}</span><div><b>AI first draft</b><span>Turn a goal into editable tasks</span></div></div>
          <div class="mini"><span style="color:#22c55e">${icon('check', 16)}</span><div><b>15 free generations</b><span>Enough to plan your first week</span></div></div>
          <div class="mini"><span style="color:#60a5fa">${icon('shield', 16)}</span><div><b>Private by default</b><span>Your workspace stays isolated</span></div></div>
        </div>
        <div class="cta-btns"><a class="btn btn-primary btn-lg" href="/register">Create Your Free Account ${arrow}</a><a class="btn btn-outline btn-lg" href="/login">Sign In</a></div>
      </div>
    </div></section>

    <footer class="footer"><div class="wrap">
      <div class="f-grid">
        <div class="f-brand">${T.logo()}<p>AI-assisted task planning and progress tracking for focused work.</p></div>
        <div class="f-col"><h4>Product</h4><a href="/#features">Features</a><a href="/#pricing">Pricing</a><a href="/ai-planning">AI Engine</a><a href="/settings/general">Integrations</a><a href="/">Changelog</a></div>
        <div class="f-col"><h4>Company</h4><a href="/">About</a><a href="/">Blog</a><a href="/">Careers</a><a href="mailto:support@taskora.ai">Contact</a></div>
        <div class="f-col"><h4>Legal</h4><a href="/">Privacy Policy</a><a href="/">Terms of Service</a><a href="/">Cookie Policy</a><a href="/">GDPR</a></div>
      </div>
      <div class="f-bottom"><span>© ${new Date().getFullYear()} Taskora AI Workspace. All rights reserved.</span><span>Designed for clear, focused execution.</span></div>
    </div></footer>
  </div>`;

  T.route('/', {
    title: 'Taskora AI — Intelligent Task Management',
    render: T.pages.landingHtml,
    after: (root) => {
      // in-page anchors (smooth scroll) — keep router out of it
      root.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="/#"]');
        if (!a) return;
        e.preventDefault(); e.stopPropagation();
        const el = document.getElementById(a.getAttribute('href').slice(2));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, true);
      if (location.hash) { const el = document.getElementById(location.hash.slice(1)); if (el) el.scrollIntoView(); }
    },
  });

  /* ---------- Auth ---------- */
  const QUESTIONS = [
    'What was the name of your first pet?',
    'What city were you born in?',
    "What was your mother's maiden name?",
    'What was the name of your first school?',
    'What was your childhood nickname?',
  ];
  const left = (h, p) => `
    <div class="auth-left"><span class="ring a"></span><span class="ring b"></span>
      <div class="auth-panel">${T.logo()}<h1>${h}</h1><p>${p}</p>
        <div class="auth-feats">
          <div class="auth-feat"><span style="color:#ec4899">${icon('activity', 20)}</span><b>Deep Insights</b><span>Track historical completion rates.</span></div>
          <div class="auth-feat"><span style="color:#60a5fa">${icon('users', 20)}</span><b>Organize Life</b><span>Prioritize tasks efficiently.</span></div>
        </div></div></div>`;

  const bindPw = () => {};

  T.route('/register', {
    title: 'Taskora AI — Create account', guest: true,
    render: () => `
    <div class="auth">
      ${left('Start your productivity journey today.', 'Create a free account to unlock AI-powered task management, advanced analytics, and smart notifications.')}
      <div class="auth-right"><div class="auth-box">
        <h2>Create account</h2><p class="sub">Sign up to get started immediately.</p>
        <form class="form-card" id="reg" novalidate>
          <div id="reg-err"></div>
          <div class="field"><label for="r-name">Full Name</label><input class="input" id="r-name" placeholder="John Doe" autocomplete="name" required /></div>
          <div class="field"><label for="r-email">Email Address</label><input class="input" id="r-email" type="email" placeholder="name@example.com" autocomplete="email" required /></div>
          <div class="field"><label for="r-pass">Password</label><input class="input" id="r-pass" type="password" placeholder="••••••••" autocomplete="new-password" required /></div>
          <div class="field"><label for="r-pass2">Confirm Password</label><input class="input" id="r-pass2" type="password" placeholder="••••••••" autocomplete="new-password" required /></div>
          <div class="field"><label for="r-q">Security Question</label><select class="select" id="r-q">${QUESTIONS.map((q) => `<option>${q}</option>`).join('')}</select></div>
          <div class="field"><label for="r-a">Security Answer</label><input class="input" id="r-a" placeholder="Your secret answer" autocomplete="off" required /></div>
          <button class="btn btn-primary btn-block" type="submit" id="reg-btn">Start Productivity Journey ${arrow}</button>
        </form>
        <div class="auth-alt">Already have an account? <a href="/login">Sign in</a></div>
      </div></div>
    </div>`,
    after: (root) => {
      const f = T.$('#reg', root); const err = T.$('#reg-err', root);
      f.onsubmit = async (e) => {
        e.preventDefault();
        const v = (id) => T.$('#' + id, root).value;
        const show = (m) => (err.innerHTML = m ? `<div class="form-error">${T.esc(m)}</div>` : '');
        if (!v('r-name').trim()) return show('Please enter your full name.');
        if (!/^\S+@\S+\.\S+$/.test(v('r-email'))) return show('Please enter a valid email address.');
        if (v('r-pass').length < 8) return show('Password must be at least 8 characters.');
        if (v('r-pass') !== v('r-pass2')) return show('Passwords do not match.');
        if (!v('r-a').trim()) return show('Please provide a security answer.');
        const b = T.$('#reg-btn', root); b.disabled = true;
        try {
          await T.register({ name: v('r-name'), email: v('r-email'), password: v('r-pass'), question: v('r-q'), answer: v('r-a') });
          T.navigate('/dashboard');
        } catch (ex) { show(ex.message); b.disabled = false; }
      };
    },
  });

  T.route('/login', {
    title: 'Taskora AI — Sign in', guest: true,
    render: () => `
    <div class="auth">
      ${left('Welcome back. Let’s get things done.', 'Sign in to pick up where you left off with your AI-powered task workspace.')}
      <div class="auth-right"><div class="auth-box">
        <h2>Sign in</h2><p class="sub">Enter your credentials to continue.</p>
        <form class="form-card" id="login" novalidate>
          <div id="log-err"></div>
          <div class="field"><label for="l-email">Email Address</label><input class="input" id="l-email" type="email" placeholder="name@example.com" autocomplete="email" required /></div>
          <div class="field"><label for="l-pass">Password</label><input class="input" id="l-pass" type="password" placeholder="••••••••" autocomplete="current-password" required /></div>
          <a class="fp-link" href="/forgot-password">Forgot password?</a>
          <button class="btn btn-primary btn-block" type="submit" id="log-btn">Sign In ${arrow}</button>
        </form>
        <div class="auth-alt">Don’t have an account? <a href="/register">Sign up</a></div>
      </div></div>
    </div>`,
    after: (root) => {
      const f = T.$('#login', root); const err = T.$('#log-err', root);
      f.onsubmit = async (e) => {
        e.preventDefault();
        const b = T.$('#log-btn', root); b.disabled = true;
        try { await T.login(T.$('#l-email', root).value, T.$('#l-pass', root).value); T.navigate('/dashboard'); }
        catch (ex) { err.innerHTML = `<div class="form-error">${T.esc(ex.message)}</div>`; b.disabled = false; }
      };
    },
  });

  /* ---------- Forgot password ---------- */
  let fpState = { step: 'email', email: '' };
  T.route('/forgot-password', {
    title: 'Taskora AI — Reset password', guest: true,
    render: () => {
      fpState = { step: 'email', email: '' };
      return `<div class="fp-wrap"><div class="fp-box" id="fp-box"></div></div>`;
    },
    after: (root) => { paintForgot(root); },
  });

  function paintForgot(root) {
    const box = T.$('#fp-box', root);
    if (fpState.step === 'email') {
      box.innerHTML = `${T.logo()}
        <h2>Forgot Password?</h2><p class="sub">No worries, we'll help you get back in.</p>
        <form class="form-card" id="fp-f1" novalidate>
          <div id="fp-err"></div>
          <div class="field"><label for="fp-email">Email Address</label><input class="input" id="fp-email" type="email" placeholder="name@example.com" autocomplete="email" required /></div>
          <button class="btn btn-primary btn-block" type="submit">Verify Email</button>
        </form>
        <div class="auth-alt"><a href="/login">${icon('arrow-left', 14)} Back to login</a></div>`;
      T.$('#fp-f1', box).onsubmit = (e) => {
        e.preventDefault();
        const email = T.$('#fp-email', box).value.trim().toLowerCase();
        const err = T.$('#fp-err', box);
        if (!T.findUserByEmail(email)) { err.innerHTML = `<div class="form-error">No account found with this email.</div>`; return; }
        fpState = { step: 'question', email };
        paintForgot(root);
      };
    } else if (fpState.step === 'question') {
      const u = T.findUserByEmail(fpState.email);
      box.innerHTML = `
        <div class="sec-q-badge">${icon('shield-check', 14)} YOUR SECURITY QUESTION</div>
        <h3 class="fp-q">${T.esc(u.question)}</h3>
        <form class="form-card" id="fp-f2" novalidate>
          <div id="fp-err2"></div>
          <div class="field"><label for="fp-ans">Your Answer</label><input class="input" id="fp-ans" placeholder="Enter the secret answer" autocomplete="off" required /></div>
          <div class="field"><label for="fp-np">New Password</label><input class="input" id="fp-np" type="password" placeholder="••••••••" autocomplete="new-password" required /></div>
          <div class="field"><label for="fp-cp">Confirm New Password</label><input class="input" id="fp-cp" type="password" placeholder="••••••••" autocomplete="new-password" required /></div>
          <button class="btn btn-primary btn-block" type="submit">Change Password</button>
        </form>
        <div class="auth-alt"><a href="/forgot-password" id="fp-chmail">${icon('arrow-left', 14)} Change email</a></div>`;
      T.$('#fp-chmail', box).onclick = (e) => { e.preventDefault(); fpState = { step: 'email', email: '' }; paintForgot(root); };
      T.$('#fp-f2', box).onsubmit = async (e) => {
        e.preventDefault();
        const err = T.$('#fp-err2', box);
        const ans = T.$('#fp-ans', box).value, np = T.$('#fp-np', box).value, cp = T.$('#fp-cp', box).value;
        const show = (m) => (err.innerHTML = m ? `<div class="form-error">${T.esc(m)}</div>` : '');
        if (!ans.trim()) return show('Please answer your security question.');
        if (!(await T.checkSecurityAnswer(fpState.email, ans))) return show('That answer is not correct.');
        if (np.length < 8) return show('New password must be at least 8 characters.');
        if (np !== cp) return show('Passwords do not match.');
        await T.resetPassword(fpState.email, np);
        fpState = { step: 'done', email: fpState.email };
        paintForgot(root);
      };
    } else {
      box.innerHTML = `
        <div class="fp-done"><span class="ok-circle">${icon('circle-check', 30)}</span>
        <h2>Password Reset!</h2><p class="sub">Your account is now secure.</p>
        <div class="fp-card"><b>All Set!</b><p>Your password has been updated securely. You can now login with your new credentials.</p>
        <a class="btn btn-primary btn-block" href="/login">Go to Login</a></div></div>`;
    }
  }

  T.route('*', {
    title: 'Page not found — Taskora AI',
    render: () => `<div class="landing"><div class="wrap" style="text-align:center;padding:160px 24px">
      <h1 style="font-size:64px;font-weight:800">404</h1><p style="color:var(--muted);margin:12px 0 28px;font-size:16px">This page doesn’t exist.</p>
      <a class="btn btn-primary" href="/">Back to home</a></div></div>`,
  });
})();
