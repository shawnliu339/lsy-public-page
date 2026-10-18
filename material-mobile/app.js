(() => {
  const root = document.querySelector('#view-root');
  const pageTitle = document.querySelector('#page-title');
  const sidebarScroll = document.querySelector('.sidebar-scroll');
  const configPanel = document.querySelector('.config-panel');
  const notificationMenu = document.querySelector('.notification-menu');
  const searchInput = document.querySelector('[data-global-search]');
  const searchResults = document.querySelector('[data-search-results]');
  const modalBackdrop = document.querySelector('[data-modal-backdrop]');
  const toast = document.querySelector('.toast');
  const mobileNavToggle = document.querySelector('[data-toggle-mobile-nav]');
  let toastTimer;

  const materialIcons = {
    dashboard: 'dashboard', pages: 'description', components: 'widgets', forms: 'edit_note',
    table: 'table_view', map: 'map', widgets: 'view_quilt', charts: 'monitoring', calendar: 'calendar_month',
    search: 'search', grid: 'apps', bell: 'notifications', settings: 'settings', globe: 'language',
    wallet: 'payments', network: 'hub', heart: 'group_add', refresh: 'schedule', info: 'info',
    check: 'check', close: 'close', edit: 'edit', user: 'person', chevron: 'expand_more', back: 'arrow_back',
  };
  const icon = (name, className = 'icon') =>
    `<span class="material-symbols-rounded ${className}" aria-hidden="true">${materialIcons[name] || name}</span>`;

  const safeStorage = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* preview still works */ }
    },
  };

  const state = {
    openGroups: new Set(),
    wizardStep: 0,
    tablePage: 1,
    tableQuery: '',
    tableSort: { key: null, direction: 1 },
    deletedRows: new Set(),
    calendarOffset: 0,
    theme: safeStorage.get('material-theme', { sidebar: 'light', accent: 'green', mini: false }),
  };

  const routes = [
    ['/admin/overview', 'Dashboard', 'dashboard'], ['/admin/widgets', 'Widgets', 'dashboard'],
    ['/pages/user', 'User Page', 'pages'], ['/pages/timeline', 'Timeline Page', 'pages'],
    ['/login', 'Login', 'pages'], ['/register', 'Register', 'pages'], ['/lock', 'Lock', 'pages'],
    ['/components/buttons', 'Buttons', 'components'], ['/components/grid-system', 'Grid System', 'components'],
    ['/components/panels', 'Panels', 'components'], ['/components/sweet-alert', 'Sweet Alert', 'components'],
    ['/components/notifications', 'Notifications', 'components'], ['/components/icons', 'Icons', 'components'],
    ['/components/typography', 'Typography', 'components'], ['/forms/regular', 'Regular Forms', 'forms'],
    ['/forms/extended', 'Extended Forms', 'forms'], ['/forms/validation', 'Validation Forms', 'forms'],
    ['/forms/wizard', 'Wizard', 'forms'], ['/table-list/regular', 'Regular Tables', 'tables'],
    ['/table-list/extended', 'Extended Tables', 'tables'], ['/table-list/paginated', 'Paginated Tables', 'tables'],
    ['/maps/google', 'Google Maps', 'maps'], ['/maps/full-screen', 'Full Screen Maps', 'maps'],
    ['/maps/vector-map', 'Vector Maps', 'maps'], ['/charts', 'Charts', 'dashboard'], ['/calendar', 'Calendar', 'dashboard'],
  ].map(([path, name, group]) => ({ path, name, group }));

  const routeLookup = new Map(routes.map((item) => [item.path, item]));
  const legacyRoutes = { dashboard: '/admin/overview', calendar: '/calendar', table: '/table-list/paginated' };

  const showToast = (message, type = 'default') => {
    toast.textContent = message;
    toast.dataset.type = type;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  };

  const openModal = (title, copy, tone = 'success') => {
    modalBackdrop.querySelector('h2').textContent = title;
    modalBackdrop.querySelector('[data-modal-copy]').textContent = copy;
    modalBackdrop.querySelector('.modal-icon').textContent = tone === 'danger' ? '!' : '✓';
    modalBackdrop.dataset.tone = tone;
    modalBackdrop.classList.add('is-open');
    modalBackdrop.setAttribute('aria-hidden', 'false');
  };

  const closeModal = () => {
    modalBackdrop.classList.remove('is-open');
    modalBackdrop.setAttribute('aria-hidden', 'true');
  };

  const setMobileNavigation = (open) => {
    document.body.classList.toggle('nav-open', open);
    mobileNavToggle.setAttribute('aria-expanded', String(open));
    mobileNavToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  };

  const pageHeader = (title, copy) => `
    <header class="content-header"><h1>${title}</h1><p>${copy}</p></header>`;

  const footer = () => `
    <footer class="page-footer"><nav><a href="#">CREATIVE TIM</a><a href="#">BLOG</a><a href="#">LICENSES</a></nav><span>© Visual standard prototype · <b>Design Preview</b></span></footer>`;

  const summaryCards = [
    ['globe', 'Capacity', '105GB', 'refresh', 'Updated now', 'yellow'],
    ['wallet', 'Revenue', '$1,345', 'calendar', 'Last day', 'green'],
    ['network', 'Errors', '23', 'bell', 'In the last hour', 'coral'],
    ['heart', 'Followers', '+45', 'refresh', 'Updated now', 'blue'],
  ];

  const lineChart = (color, path, labels, yLabels, rotateLabels = false) => `
    <svg class="chart-svg" viewBox="0 0 330 225" preserveAspectRatio="none" role="img" aria-label="Sample line chart">
      ${yLabels.map((label, i) => `<text x="0" y="${27 + i * 36}">${label}</text>`).join('')}
      <path class="line" stroke="${color}" d="${path}" transform="translate(-3 0) scale(1.1 1)" vector-effect="non-scaling-stroke" />
      ${labels.map((label, i) => {
        const x = 31 + i * (286 / Math.max(labels.length - 1, 1));
        return `<text x="${x}" y="215" text-anchor="${rotateLabels ? 'end' : 'middle'}"${rotateLabels ? ` transform="rotate(-42 ${x} 215)"` : ''}>${label}</text>`;
      }).join('')}
    </svg>`;

  const chartCards = [
    { value: '$34,657', change: '+18%', className: '', color: 'var(--active)', path: 'M35 74 C56 88 68 105 86 96 S111 51 137 68 S180 129 207 119 S238 61 291 48', labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'], y: ['700', '600', '500', '400', '300'], footer: 'Financial Statistics', action: 'add', actionClass: '' },
    { value: '169', change: '-14%', className: 'coral', color: 'var(--active)', path: 'M35 173 C64 137 82 130 111 128 S154 131 177 99 S213 82 244 82 S274 67 292 32', labels: ['12pm', '3pm', '6pm', '9pm', '12am', '3am', '6am', '9am'], y: ['2000', '1500', '1000', '500', '0'], footer: 'View all members', action: 'arrow_forward', actionClass: 'coral' },
    { value: '8,960', change: '~51%', className: 'yellow', color: 'var(--active)', path: 'M35 102 C56 115 68 118 88 83 S112 50 125 86 S158 102 174 96 S199 132 224 134 S251 91 317 89', labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October'], y: ['100', '90', '80', '70'], footer: 'View more details', action: 'info', actionClass: 'yellow', rotateLabels: true },
  ];

  const chartCardsMarkup = () => chartCards.map((chart) => `
    <article class="card chart-card"><div class="chart-head"><span class="chart-value">${chart.value}</span><span class="change-pill ${chart.className}">${chart.change}</span></div><div class="chart-stage">${lineChart(chart.color, chart.path, chart.labels, chart.y, chart.rotateLabels)}</div><div class="chart-footer"><span>${chart.footer}</span><button class="round-action material-symbols-rounded ${chart.actionClass}" type="button" data-demo="${chart.footer}">${chart.action}</button></div></article>`).join('');

  const worldMap = '<img class="world-map" src="./assets/world-map.svg" alt="World sales distribution map" />';

  const countries = [
    ['🇺🇸', 'USA', '2.920', '53.23%'], ['🇩🇪', 'Germany', '1.300', '20.43%'], ['🇦🇺', 'Australia', '760', '10.35%'],
    ['🇬🇧', 'United Kingdom', '690', '7.87%'], ['🇷🇴', 'Romania', '600', '5.94%'], ['🇧🇷', 'Brasil', '550', '4.34%'],
  ];

  const tasks = [
    ['is-done', 'AM', 'Sign contract for the annual conference'], ['', 'JM', 'Review the guest messaging workflow'],
    ['is-done', 'LR', 'Prepare the weekly occupancy report'], ['', 'SK', 'Confirm tomorrow’s housekeeping schedule'],
  ];

  const ringCards = [
    ['Email Statistics', 'Last Campaign Performance', 70, 'Open', 'Number of emails sent', 'var(--aqua)'],
    ['New Visitors', 'Out Of Total Number', 34, 'Visited', 'Campaign sent 2 days ago', 'var(--yellow)'],
    ['Orders', 'Total Number', 80, 'Completed', 'Updated 3 minutes ago', 'var(--coral)'],
    ['Subscriptions', 'Our Users', 11, 'Ended', 'Total users', '#737373'],
  ];

  const overviewTemplate = () => `
    <header class="material-page-heading"><h1>Dashboard</h1><p>Monitor capacity, revenue, errors and audience performance.</p></header>
    <section class="summary-grid">${summaryCards.map(([iconName, label, value, metaIcon, meta, color]) => `<article class="card summary-card"><div class="summary-main"><span class="summary-icon" style="color:var(--${color})">${icon(iconName)}</span><span class="summary-copy"><span class="summary-label">${label}</span><span class="summary-value">${value}</span></span></div><div class="summary-meta">${icon(metaIcon)}<span>${meta}</span></div></article>`).join('')}</section>
    <section class="chart-grid">${chartCardsMarkup()}</section>
    <section class="card map-card"><h2 class="card-title">Global Sales by Top Locations</h2><p class="card-subtitle">All Products That Were Shipped</p><div class="map-layout">${worldMap}<div class="country-list">${countries.map((country) => `<div class="country-row"><span class="flag">${country[0]}</span><span>${country[1]}</span><span>${country[2]}</span><span>${country[3]}</span></div>`).join('')}</div></div></section>${footer()}`;

  const widgetsTemplate = () => `
    <section class="content-page">${pageHeader('Widgets', 'Reusable status cards, task lists and progress widgets using the selected Material visual language.')}
      <section class="summary-grid">${summaryCards.map(([iconName, label, value, metaIcon, meta, color]) => `<article class="card summary-card"><div class="summary-main"><span class="summary-icon" style="color:var(--${color})">${icon(iconName)}</span><span class="summary-copy"><span class="summary-label">${label}</span><span class="summary-value">${value}</span></span></div><div class="summary-meta">${icon(metaIcon)}<span>${meta}</span></div></article>`).join('')}</section>
      <section class="ring-grid">${ringCards.map(([title, subtitle, progress, label, meta, color]) => `<article class="card ring-card" style="--ring-color:${color}"><h3>${title}</h3><p>${subtitle}</p><div class="ring" style="--progress:${progress};--ring-color:${color}"><strong>${progress}%</strong></div><div class="ring-label"><i></i><span>${label}</span></div><div class="ring-meta">${icon('refresh', 'icon icon-sm')} ${meta}</div></article>`).join('')}</section>
      <section class="card tasks-card" style="margin-top:24px"><h2 class="card-title">Tasks</h2><p class="card-subtitle">Operations team</p><div class="task-list">${tasks.map(([done, initials, copy]) => `<div class="task-row"><button class="task-check ${done}" type="button">${done ? icon('check') : ''}</button><span class="avatar task-avatar">${initials}</span><span class="task-copy">${copy}</span><span class="task-actions"><button class="tool-button edit" type="button" data-demo="Edit task">${icon('edit')}</button><button class="tool-button" type="button" data-demo="Delete task">${icon('close')}</button></span></div>`).join('')}</div></section>${footer()}</section>`;

  const chartsTemplate = () => `
    <section class="content-page">${pageHeader('Charts', 'Representative line, bar and progress charts for analytics and operational dashboards.')}
      <section class="chart-grid">${chartCardsMarkup()}</section>
      <section class="demo-grid two" style="margin-top:24px"><article class="card demo-card"><h2>Occupancy by Channel</h2><div class="bar-chart">${Array.from({ length: 16 }, (_, i) => `<span class="bar-pair"><i class="bar" style="height:${45 + (i * 17) % 53}%"></i><i class="bar" style="height:${55 + (i * 23) % 43}%"></i></span>`).join('')}</div><p class="chart-legend"><span class="legend-dot"></span>Direct <span class="legend-dot coral"></span>OTA</p></article><article class="card demo-card"><h2>Performance</h2>${ringCards.slice(0, 3).map(([title, , progress, , , color]) => `<div class="progress-row"><span>${title}</span><strong>${progress}%</strong><i><b style="width:${progress}%;background:${color}"></b></i></div>`).join('')}</article></section>${footer()}</section>`;

  const monthDays = [27, 28, 29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];
  const eventForDay = (n, index) => {
    if (n === 1 && index < 7) return '<span class="event"><b>12a</b> All Day Event</span>';
    if (n === 16) return '<span class="event"><b>Md-pro</b> Launch</span><span class="event green"><b>10:30a</b> Meeting</span>';
    if (n === 19) return '<span class="event"><b>7p</b> Birthday Party</span>';
    if (n === 21) return '<span class="event yellow"><b>12a</b> Product review</span>';
    if (n === 25) return '<span class="event coral"><b>12p</b> Lunch</span>';
    return '';
  };
  const calendarTitle = () => {
    const date = new Date(2026, 9 + state.calendarOffset, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  const calendarTemplate = () => `
    <section class="card calendar-card"><div class="calendar-toolbar"><h1>${calendarTitle()}</h1><div class="segment"><button class="is-active" type="button">month</button><button type="button">week</button><button type="button">day</button></div><div class="date-nav"><button type="button" data-calendar-nav="-1">‹</button><button type="button" data-calendar-nav="1">›</button><button type="button" data-calendar-today>today</button></div></div><div class="calendar-grid">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => `<div class="calendar-weekday">${day}</div>`).join('')}${monthDays.map((n, index) => `<div class="calendar-day ${index < 4 ? 'is-other' : ''} ${n === 18 ? 'is-today' : ''}"><span class="day-number">${n}</span>${eventForDay(n, index)}</div>`).join('')}</div></section>${footer()}`;

  const profileTemplate = () => `
    <section class="content-page">${pageHeader('User Profile', 'Profile summary and editable account details.')}
      <div class="profile-layout"><article class="card profile-card"><div class="profile-cover"></div><div class="profile-photo">CF</div><div class="profile-copy"><h2>Chet Faker</h2><small>Property Administrator</small><p>Coordinates guest operations, distribution and reporting across the demo workspace.</p><button class="demo-button primary round" data-demo="Profile followed">FOLLOW</button></div></article><article class="card demo-card"><h2>Edit Profile</h2><form class="form-grid" data-demo-form><label class="form-field"><span>Company</span><input value="Demo Company" /></label><label class="form-field"><span>Username</span><input value="chet.faker" /></label><label class="form-field"><span>Email</span><input type="email" value="chet@example.com" /></label><label class="form-field"><span>Role</span><select><option>Administrator</option><option>Manager</option></select></label><label class="form-field"><span>First Name</span><input value="Chet" /></label><label class="form-field"><span>Last Name</span><input value="Faker" /></label><label class="form-field full"><span>About me</span><textarea>Guest operations and property performance.</textarea></label><div class="form-field full"><button class="demo-button primary" type="submit">UPDATE PROFILE</button></div></form></article></div>${footer()}</section>`;

  const timelineTemplate = () => {
    const entries = [['New reservation', 'A direct booking was confirmed for Suite 401.', 'green'], ['Payment received', 'The remaining balance was captured successfully.', 'blue'], ['Maintenance alert', 'Air conditioner inspection requested for Room 302.', 'coral'], ['Report generated', 'The monthly occupancy report is ready.', 'yellow']];
    return `<section class="content-page">${pageHeader('Timeline', 'A chronological activity pattern for operational events and audit history.')}<div class="timeline">${entries.map(([title, copy, color], index) => `<article class="timeline-item"><span class="timeline-dot" style="background:var(--${color})"></span><div class="card timeline-card"><small>${index + 1} hour${index ? 's' : ''} ago</small><h3>${title}</h3><p>${copy}</p></div></article>`).join('')}</div>${footer()}</section>`;
  };

  const authTemplate = (mode) => {
    const content = {
      login: ['Welcome back', 'Sign in to continue to your dashboard.', '<label class="form-field"><span>Email</span><input type="email" placeholder="name@example.com" /></label><label class="form-field"><span>Password</span><input type="password" placeholder="••••••••" /></label>', 'SIGN IN'],
      register: ['Create account', 'Set up a new workspace administrator.', '<label class="form-field"><span>Name</span><input placeholder="Your name" /></label><label class="form-field"><span>Email</span><input type="email" placeholder="name@example.com" /></label><label class="form-field"><span>Password</span><input type="password" placeholder="At least 8 characters" /></label>', 'CREATE ACCOUNT'],
      lock: ['Session locked', 'Enter your password to unlock this session.', '<div class="profile-photo" style="margin:0 auto 18px">CF</div><label class="form-field"><span>Password</span><input type="password" placeholder="••••••••" /></label>', 'UNLOCK'],
    }[mode];
    return `<section class="auth-page"><article class="card auth-card"><h1>${content[0]}</h1><p>${content[1]}</p><form data-auth-form>${content[2]}<button class="demo-button primary round" type="submit">${content[3]}</button></form><div class="auth-links"><button type="button" data-route="/admin/overview">Dashboard</button><button type="button" data-route="${mode === 'login' ? '/register' : '/login'}">${mode === 'login' ? 'Create account' : 'Sign in'}</button></div></article></section>`;
  };

  const buttonsTemplate = () => `
    <section class="content-page">${pageHeader('Buttons', 'Button hierarchy, semantic colors, shapes and interaction states.')}
      <div class="demo-grid two"><article class="card demo-card"><h2>Colors</h2><div class="demo-stack">${[['Default', ''], ['Primary', 'primary'], ['Info', 'info'], ['Success', 'success'], ['Warning', 'warning'], ['Danger', 'danger']].map(([label, cls]) => `<button class="demo-button ${cls}" data-demo="${label} button">${label}</button>`).join('')}</div></article><article class="card demo-card"><h2>Styles</h2><div class="demo-stack"><button class="demo-button primary round" data-demo="Round button">ROUND</button><button class="demo-button outline" data-demo="Outline button">OUTLINE</button><button class="demo-button icon-only info" data-demo="Favorite">♥</button><button class="demo-button success" disabled>DISABLED</button></div></article><article class="card demo-card"><h2>Sizes</h2><div class="demo-stack"><button class="demo-button primary" style="min-height:48px">LARGE</button><button class="demo-button primary">DEFAULT</button><button class="demo-button primary" style="min-height:31px;font-size:11px">SMALL</button></div></article><article class="card demo-card"><h2>Actions</h2><div class="demo-stack"><button class="demo-button info" data-alert="Saved|Your changes have been saved.">SAVE</button><button class="demo-button danger" data-alert="Delete item?|This prototype demonstrates a destructive confirmation.|danger">DELETE</button></div></article></div>${footer()}</section>`;

  const gridTemplate = () => `
    <section class="content-page">${pageHeader('Grid System', 'A responsive twelve-column grid for consistent page composition.')}
      <article class="card demo-card"><h2>12 columns</h2><div class="grid-sample cols-12">${Array.from({ length: 12 }, () => '<span class="grid-cell">1</span>').join('')}</div><h2 style="margin-top:28px">Four columns</h2><div class="grid-sample cols-4">${Array.from({ length: 4 }, () => '<span class="grid-cell">3</span>').join('')}</div><h2 style="margin-top:28px">Three columns</h2><div class="grid-sample cols-3">${Array.from({ length: 3 }, () => '<span class="grid-cell">4</span>').join('')}</div></article>${footer()}</section>`;

  const panelsTemplate = () => `
    <section class="content-page">${pageHeader('Panels', 'Expandable content panels for secondary information and progressive disclosure.')}
      <div class="demo-grid two"><article class="card demo-card"><h2>Accordion</h2>${['Property settings', 'Reservation policies', 'Notification preferences'].map((title, i) => `<div class="panel-item ${i === 0 ? 'is-open' : ''}"><button class="panel-heading" type="button" data-panel-toggle><span>${title}</span><span>⌄</span></button><div class="panel-body">This section can be expanded or collapsed. It demonstrates the spacing, dividers and lightweight motion used by Material Dashboard.</div></div>`).join('')}</article><article class="card demo-card"><h2>Information Panel</h2><h3>Operational summary</h3><p>Panels group supporting information without competing with the primary page task.</p><button class="demo-button primary" data-demo="Panel action selected">VIEW DETAILS</button></article></div>${footer()}</section>`;

  const sweetAlertTemplate = () => `
    <section class="content-page">${pageHeader('Sweet Alert', 'Modal feedback patterns for confirmations, warnings and completed actions.')}
      <div class="demo-grid three">${[['Basic message', 'Message sent', 'The message was delivered successfully.', ''], ['Success message', 'Good job!', 'The requested operation completed successfully.', ''], ['Warning message', 'Are you sure?', 'This action may change existing data.', 'danger']].map(([label, title, copy, tone]) => `<article class="card demo-card"><h2>${label}</h2><p>${copy}</p><button class="demo-button ${tone ? 'danger' : 'primary'}" data-alert="${title}|${copy}|${tone}">TRY IT</button></article>`).join('')}</div>${footer()}</section>`;

  const notificationsTemplate = () => `
    <section class="content-page">${pageHeader('Notifications', 'Toast notifications for lightweight feedback and system status.')}
      <div class="demo-grid two"><article class="card demo-card"><h2>Notification Styles</h2><div class="notification-buttons">${[['Primary', 'primary'], ['Info', 'info'], ['Success', 'success'], ['Warning', 'warning'], ['Danger', 'danger'], ['Default', 'default']].map(([label, tone]) => `<button class="demo-button ${tone}" data-notify="${tone}">${label}</button>`).join('')}</div></article><article class="card demo-card"><h2>Guidance</h2><p>Use notifications for non-blocking feedback. Use a modal when a decision or explicit confirmation is required.</p><button class="demo-button outline" data-notify="info">SHOW EXAMPLE</button></article></div>${footer()}</section>`;

  const iconNames = ['dashboard', 'pages', 'components', 'forms', 'table', 'map', 'widgets', 'charts', 'calendar', 'search', 'grid', 'bell', 'settings', 'globe', 'wallet', 'network', 'heart', 'refresh', 'info', 'check', 'close', 'edit', 'user', 'chevron'];
  const iconsTemplate = () => `<section class="content-page">${pageHeader('Icons', 'The line icon set used throughout navigation, actions and status cards.')}<article class="card demo-card"><div class="icon-gallery">${iconNames.map((name) => `<button class="icon-tile" type="button" data-demo="${name} icon">${icon(name)}<span>${name}</span></button>`).join('')}</div></article>${footer()}</section>`;

  const typographyTemplate = () => `<section class="content-page">${pageHeader('Typography', 'Inter provides the complete Material interface hierarchy from display headings to captions.')}<article class="card demo-card"><div class="type-specimen"><span class="type-label">Display</span><span class="type-display">Material Dashboard</span></div><div class="type-specimen"><span class="type-label">Heading</span><span class="type-heading">Operational overview</span></div><div class="type-specimen"><span class="type-label">Body</span><span>Clear interface copy supports scanning and quick decision-making.</span></div><div class="type-specimen"><span class="type-label">Caption</span><small style="color:var(--ink-faint)">UPDATED THREE MINUTES AGO</small></div></article>${footer()}</section>`;

  const regularFormsTemplate = () => `
    <section class="content-page">${pageHeader('Regular Forms', 'Text inputs, select controls, text areas and native choices.')}
      <article class="card demo-card"><form class="form-grid" data-demo-form><label class="form-field"><span>Property name</span><input placeholder="Enter property name" /></label><label class="form-field"><span>Property type</span><select><option>Hotel</option><option>Apartment</option><option>Villa</option></select></label><label class="form-field"><span>Email address</span><input type="email" placeholder="team@example.com" /></label><label class="form-field"><span>Phone</span><input type="tel" placeholder="+81 00 0000 0000" /></label><label class="form-field full"><span>Description</span><textarea placeholder="Describe this property"></textarea></label><div class="form-field full"><span>Preferences</span><div class="choice-row"><label><input type="checkbox" checked /> Email alerts</label><label><input type="checkbox" /> SMS alerts</label><label><input type="radio" name="status" checked /> Active</label><label><input type="radio" name="status" /> Draft</label></div></div><div class="form-field full"><button class="demo-button primary" type="submit">SAVE SETTINGS</button></div></form></article>${footer()}</section>`;

  const extendedFormsTemplate = () => `
    <section class="content-page">${pageHeader('Extended Forms', 'Date, range, color, file and switch controls for richer input scenarios.')}
      <article class="card demo-card"><form class="form-grid" data-demo-form><label class="form-field"><span>Check-in date</span><input type="date" value="2026-10-18" /></label><label class="form-field"><span>Check-out time</span><input type="time" value="11:00" /></label><label class="form-field"><span>Accent preview</span><input type="color" value="#43a047" /></label><label class="form-field"><span>Rate adjustment <b data-range-output>25%</b></span><input type="range" min="0" max="100" value="25" data-range /></label><label class="form-field"><span>Import file</span><input type="file" /></label><div class="form-field"><span>Automatic confirmation</span><div class="choice-row"><label class="switch"><input type="checkbox" checked /><i></i></label></div></div><label class="form-field full"><span>Tags</span><input value="VIP, returning guest, direct booking" /></label><div class="form-field full"><button class="demo-button primary" type="submit">APPLY CHANGES</button></div></form></article>${footer()}</section>`;

  const validationTemplate = () => `
    <section class="content-page">${pageHeader('Validation Forms', 'Submit the form to see required-field and email validation states.')}
      <article class="card demo-card"><form class="form-grid" data-validate-form novalidate><label class="form-field"><span>First name *</span><input name="firstName" required /><small class="field-error">First name is required.</small></label><label class="form-field"><span>Last name *</span><input name="lastName" required /><small class="field-error">Last name is required.</small></label><label class="form-field full"><span>Email *</span><input name="email" type="email" required /><small class="field-error">Enter a valid email address.</small></label><label class="form-field"><span>Password *</span><input name="password" type="password" minlength="8" required /><small class="field-error">Use at least 8 characters.</small></label><label class="form-field"><span>Role *</span><select required><option value="">Choose a role</option><option>Administrator</option><option>Manager</option></select><small class="field-error">Choose a role.</small></label><div class="form-field full"><button class="demo-button primary" type="submit">VALIDATE FORM</button></div></form></article>${footer()}</section>`;

  const wizardTemplate = () => {
    const steps = ['About', 'Account', 'Address'];
    return `<section class="content-page">${pageHeader('Wizard', 'A three-step form with previous, next and completion actions.')}<article class="card demo-card"><div class="wizard-steps">${steps.map((step, i) => `<span class="wizard-step ${i === state.wizardStep ? 'is-active' : ''}">${i + 1}. ${step}</span>`).join('')}</div>${steps.map((step, i) => `<section class="wizard-pane ${i === state.wizardStep ? 'is-active' : ''}" data-wizard-pane="${i}"><h2>${step}</h2>${i === 0 ? '<div class="form-grid"><label class="form-field"><span>First name</span><input /></label><label class="form-field"><span>Last name</span><input /></label></div>' : i === 1 ? '<div class="form-grid"><label class="form-field"><span>Email</span><input type="email" /></label><label class="form-field"><span>Password</span><input type="password" /></label></div>' : '<div class="form-grid"><label class="form-field full"><span>Address</span><input /></label><label class="form-field"><span>City</span><input /></label><label class="form-field"><span>Country</span><select><option>Japan</option><option>United States</option></select></label></div>'}</section>`).join('')}<div class="wizard-actions"><button class="demo-button outline" type="button" data-wizard-prev ${state.wizardStep === 0 ? 'disabled' : ''}>PREVIOUS</button><button class="demo-button primary" type="button" data-wizard-next>${state.wizardStep === 2 ? 'FINISH' : 'NEXT'}</button></div></article>${footer()}</section>`;
  };

  const regularRows = [['Dakota Rice', 'Niger', 'Oud-Turnhout', '$36,738'], ['Minerva Hooper', 'Curaçao', 'Sinaai-Waas', '$23,789'], ['Sage Rodriguez', 'Netherlands', 'Baileux', '$56,142'], ['Philip Chaney', 'Korea, South', 'Overland Park', '$38,735'], ['Doris Greene', 'Malawi', 'Feldkirchen', '$63,542']];
  const regularTableTemplate = () => `<section class="content-page">${pageHeader('Regular Tables', 'A lightweight table treatment for standard datasets.')}<article class="card demo-card"><h2>Simple Table</h2><table class="basic-table"><thead><tr><th>Name</th><th>Country</th><th>City</th><th>Salary</th></tr></thead><tbody>${regularRows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></article>${footer()}</section>`;

  const extendedTableTemplate = () => `<section class="content-page">${pageHeader('Extended Tables', 'Rows with status, role and contextual actions.')}<article class="card demo-card"><table class="basic-table"><thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Last active</th><th>Actions</th></tr></thead><tbody>${[['AM', 'Aileen Murphy', 'Owner', 'Active', 'Now'], ['JR', 'Jorge Ruiz', 'Manager', 'Active', '12 min'], ['SK', 'Sora Kim', 'Agent', 'Pending', '2 hours'], ['DN', 'Doris Nguyen', 'Viewer', 'Blocked', '4 days']].map(([initials, name, role, status, time], index) => `<tr><td><span class="member-cell"><i class="avatar">${initials}</i>${name}</span></td><td>${role}</td><td><span class="status-badge ${status === 'Pending' ? 'warning' : status === 'Blocked' ? 'danger' : ''}">${status}</span></td><td>${time}</td><td><span class="row-actions"><button title="Edit" data-row-edit="${index}">${icon('edit')}</button><button title="Delete" data-row-delete="${index}">${icon('close')}</button></span></td></tr>`).join('')}</tbody></table></article>${footer()}</section>`;

  const tableRows = [
    [1, "Noelia O'Kon", 'otho.smitham@example.com', 39, '13098.00'], [2, 'Mr. Enid Von PhD', 'pollich.cecilia@example.com', 26, '35978.00'], [3, 'Colton Koch', 'little.myrna@example.net', 48, '26278.00'], [4, 'Gregory Vandervort', 'dock47@example.org', 27, '25537.00'], [5, 'Miss Rahsaan Heaney IV', 'ugrady@example.com', 21, '49003.00'], [6, 'Lydia Brown', 'lydia@example.com', 44, '31950.00'], [7, 'Marcus Lee', 'marcus@example.com', 31, '28740.00'], [8, 'Aiko Tanaka', 'aiko@example.jp', 29, '46500.00'], [9, 'Sofia Martin', 'sofia@example.es', 36, '41200.00'], [10, 'Ethan Wilson', 'ethan@example.com', 42, '37600.00'], [11, 'Mia Evans', 'mia@example.co.uk', 24, '29800.00'], [12, 'Lucas Meyer', 'lucas@example.de', 38, '44200.00'],
    ...Array.from({ length: 38 }, (_, index) => {
      const givenNames = ['Amelia', 'Haruto', 'Chloe', 'Daniel', 'Isla', 'Mateo', 'Nora', 'Oliver'];
      const familyNames = ['Bennett', 'Sato', 'Dubois', 'Kim', 'Rossi'];
      const id = index + 13;
      const given = givenNames[index % givenNames.length];
      const family = familyNames[Math.floor(index / givenNames.length) % familyNames.length];
      return [id, `${given} ${family}`, `${given}.${family}${id}@example.com`.toLowerCase(), 23 + ((index * 7) % 31), `${24000 + ((index * 1379) % 31000)}.00`];
    }),
  ];
  const filteredTableRows = () => {
    const query = state.tableQuery.toLowerCase();
    const filtered = tableRows.filter((row) => !state.deletedRows.has(row[0]) && row.slice(1).join(' ').toLowerCase().includes(query));
    if (!state.tableSort.key) return filtered;
    return filtered.sort((a, b) => {
      const keys = { name: 1, email: 2, age: 3, salary: 4 };
      const index = keys[state.tableSort.key];
      return String(a[index]).localeCompare(String(b[index]), undefined, { numeric: true }) * state.tableSort.direction;
    });
  };
  const paginatedTableTemplate = () => {
    const rows = filteredTableRows();
    const pages = Math.max(1, Math.ceil(rows.length / 5));
    state.tablePage = Math.min(state.tablePage, pages);
    const visible = rows.slice((state.tablePage - 1) * 5, state.tablePage * 5);
    const pageStart = Math.min(Math.max(1, state.tablePage - 2), Math.max(1, pages - 4));
    const pageNumbers = Array.from({ length: Math.min(5, pages) }, (_, index) => pageStart + index);
    return `<section class="table-page"><div class="table-intro"><h1>Custom table with pagination</h1><p>We Combine <span class="accent-copy">Element-UI</span> Table Functionalities Together With A Custom Pagination Component Which Should Provide A Very Good Starting Point To Integrate Tables In Your Application. Check Out More Functionalities At <span class="accent-copy">Table Documentation.</span></p></div><article class="card table-card"><span class="table-caption">Extended Tables</span><div class="table-tools"><button class="page-size" type="button"><span>5</span><span>⌄</span></button><label class="table-search"><input type="search" placeholder="Search" value="${state.tableQuery}" data-table-search />${icon('search', 'icon icon-sm')}</label></div><table class="data-table"><thead><tr>${[['NAME', 'name'], ['EMAIL', 'email'], ['AGE', 'age'], ['SALARY', 'salary']].map(([label, key]) => `<th><button class="sort-button" type="button" data-sort="${key}">${label}${state.tableSort.key === key ? (state.tableSort.direction === 1 ? ' ↑' : ' ↓') : ''}</button></th>`).join('')}<th>ACTIONS</th></tr></thead><tbody>${visible.length ? visible.map((row) => `<tr><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td>${row[4]}</td><td><span class="row-actions"><button type="button" title="View" data-row-view="${row[0]}">${icon('user')}</button><button type="button" title="Edit" data-row-edit="${row[0]}">${icon('edit')}</button><button type="button" title="Delete" data-row-delete="${row[0]}">${icon('close')}</button></span></td></tr>`).join('') : '<tr><td colspan="5" class="empty-state">No matching records</td></tr>'}</tbody></table><div class="table-bottom"><span>Showing ${visible.length ? (state.tablePage - 1) * 5 + 1 : 0} To ${Math.min(state.tablePage * 5, rows.length)} Of ${rows.length} Entries</span><nav class="pagination"><button type="button" data-page="${Math.max(1, state.tablePage - 1)}">«</button>${pageNumbers.map((page) => `<button class="${state.tablePage === page ? 'current' : ''}" type="button" data-page="${page}">${page}</button>`).join('')}<button type="button" data-page="${Math.min(pages, state.tablePage + 1)}">»</button></nav></div></article></section>`;
  };

  const mapPins = () => `<span class="map-pin" style="left:20%;top:32%"><span>1</span></span><span class="map-pin" style="left:52%;top:45%;background:var(--aqua)"><span>2</span></span><span class="map-pin" style="left:73%;top:28%;background:var(--yellow)"><span>3</span></span>`;
  const googleMapTemplate = () => `<section class="content-page">${pageHeader('Google Maps', 'Interactive prototype controls for a standard location map.')}<article class="card map-demo" data-map>${mapPins()}<div class="map-controls"><button type="button" data-map-zoom="in">+</button><button type="button" data-map-zoom="out">−</button><button type="button" data-map-reset>⌂</button></div></article>${footer()}</section>`;
  const fullScreenMapTemplate = () => `<section class="content-page full-map-page"><article class="card map-demo full-map" data-map>${mapPins()}<div class="map-floating-card"><h2>Property Locations</h2><p>Three active properties are shown on the map.</p></div><div class="map-controls"><button type="button" data-map-zoom="in">+</button><button type="button" data-map-zoom="out">−</button><button type="button" data-map-reset>⌂</button></div></article></section>`;
  const vectorMapTemplate = () => `<section class="content-page">${pageHeader('Vector Maps', 'A vector-based geographic overview with an accompanying location table.')}<article class="card demo-card"><div class="vector-layout">${worldMap}<div class="country-list">${countries.map((country) => `<div class="country-row"><span class="flag">${country[0]}</span><span>${country[1]}</span><span>${country[2]}</span><span>${country[3]}</span></div>`).join('')}</div></div></article>${footer()}</section>`;

  const templates = {
    '/admin/overview': overviewTemplate, '/admin/widgets': widgetsTemplate, '/pages/user': profileTemplate,
    '/pages/timeline': timelineTemplate, '/login': () => authTemplate('login'), '/register': () => authTemplate('register'), '/lock': () => authTemplate('lock'),
    '/components/buttons': buttonsTemplate, '/components/grid-system': gridTemplate, '/components/panels': panelsTemplate,
    '/components/sweet-alert': sweetAlertTemplate, '/components/notifications': notificationsTemplate,
    '/components/icons': iconsTemplate, '/components/typography': typographyTemplate, '/forms/regular': regularFormsTemplate,
    '/forms/extended': extendedFormsTemplate, '/forms/validation': validationTemplate, '/forms/wizard': wizardTemplate,
    '/table-list/regular': regularTableTemplate, '/table-list/extended': extendedTableTemplate,
    '/table-list/paginated': paginatedTableTemplate, '/maps/google': googleMapTemplate,
    '/maps/full-screen': fullScreenMapTemplate, '/maps/vector-map': vectorMapTemplate, '/charts': chartsTemplate, '/calendar': calendarTemplate,
  };

  const currentRoute = () => {
    const hashRoute = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (templates[hashRoute]) return hashRoute;
    const legacy = new URLSearchParams(location.search).get('view');
    return legacyRoutes[legacy] || '/admin/overview';
  };

  const navigate = (route) => {
    if (!templates[route]) return;
    if (location.hash === `#${route}`) render();
    else location.hash = route;
  };

  const activeGroupDefaults = (route) => {
    const info = routeLookup.get(route);
    if (!info || info.group === 'dashboard') return;
    if (state.openGroups.size === 0 && info.group === 'tables') ['forms', 'tables', 'maps'].forEach((group) => state.openGroups.add(group));
    else state.openGroups.add(info.group);
  };

  const syncNavigation = (route) => {
    activeGroupDefaults(route);
    document.querySelectorAll('button[data-route]').forEach((button) => button.classList.toggle('is-active', button.dataset.route === route));
    document.querySelectorAll('[data-nav-group], .nav-group-components, .nav-group-forms, .nav-group-table, .nav-group-maps').forEach((group) => {
      const toggle = group.querySelector('[data-group-toggle]');
      if (!toggle) return;
      const key = toggle.dataset.groupToggle;
      const isOpen = state.openGroups.has(key);
      const isSection = routeLookup.get(route)?.group === key;
      group.classList.toggle('is-open', isOpen);
      toggle.classList.toggle('is-section-active', isSection);
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  };

  const applyTheme = () => {
    const sidebarColors = { light: '#ffffff', dark: '#262626', warm: '#f5f5f5' };
    const accentColors = { aqua: '#00acc1', blue: '#1a73e8', green: '#43a047', yellow: '#fb8c00', coral: '#e53935' };
    document.documentElement.style.setProperty('--sidebar', sidebarColors[state.theme.sidebar] || sidebarColors.light);
    document.documentElement.style.setProperty('--active', accentColors[state.theme.accent] || accentColors.green);
    document.documentElement.style.setProperty('--sidebar-ink', state.theme.sidebar === 'dark' ? '#ffffff' : '#262626');
    document.documentElement.style.setProperty('--sidebar-icon', state.theme.sidebar === 'dark' ? 'rgb(255 255 255 / .64)' : '#9e9e9e');
    document.documentElement.style.setProperty('--sidebar-active-bg', state.theme.sidebar === 'dark' ? 'rgb(255 255 255 / .16)' : '#262626');
    document.documentElement.style.setProperty('--sidebar-active-ink', '#ffffff');
    document.body.classList.toggle('sidebar-mini', Boolean(state.theme.mini));
    document.querySelector('[data-sidebar-mini]').checked = Boolean(state.theme.mini);
    document.querySelectorAll('[data-config="sidebar"] button').forEach((button) => button.classList.toggle('is-selected', button.dataset.value === state.theme.sidebar));
    document.querySelectorAll('[data-config="accent"] button').forEach((button) => button.classList.toggle('is-selected', button.dataset.value === state.theme.accent));
    safeStorage.set('material-theme', state.theme);
  };

  const render = () => {
    const route = currentRoute();
    root.innerHTML = templates[route]();
    const info = routeLookup.get(route);
    pageTitle.textContent = info?.name || 'Dashboard';
    document.body.dataset.view = info?.group === 'tables' ? 'table' : route === '/calendar' ? 'calendar' : info?.group || 'dashboard';
    document.body.dataset.route = route;
    document.title = `${info?.name || 'Dashboard'} · Material Dashboard PRO`;
    syncNavigation(route);
    window.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(() => {
      if (route === '/admin/overview') sidebarScroll.scrollTop = 0;
      else {
        const activeItem = document.querySelector(`button[data-route="${route}"]`);
        if (activeItem) sidebarScroll.scrollTop = Math.max(0, activeItem.offsetTop - sidebarScroll.clientHeight / 2);
      }
    });
  };

  const updateSearchResults = (query) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      searchResults.classList.remove('is-open');
      searchResults.innerHTML = '';
      return;
    }
    const matches = routes.filter((item) => `${item.name} ${item.path}`.toLowerCase().includes(normalized)).slice(0, 7);
    searchResults.innerHTML = matches.length ? matches.map((item) => `<button type="button" data-route="${item.path}"><strong>${item.name}</strong><small>${item.path}</small></button>`).join('') : '<span class="search-empty">No matching pages</span>';
    searchResults.classList.add('is-open');
  };

  document.addEventListener('click', (event) => {
    const routeButton = event.target.closest('button[data-route]');
    if (routeButton) {
      searchInput.value = '';
      searchResults.classList.remove('is-open');
      setMobileNavigation(false);
      navigate(routeButton.dataset.route);
      return;
    }

    if (event.target.closest('[data-toggle-mobile-nav]')) {
      setMobileNavigation(!document.body.classList.contains('nav-open'));
      configPanel.classList.remove('is-open');
      return;
    }

    if (event.target.closest('[data-close-mobile-nav]')) {
      setMobileNavigation(false);
      return;
    }

    const groupButton = event.target.closest('[data-group-toggle]');
    if (groupButton) {
      const key = groupButton.dataset.groupToggle;
      state.openGroups.has(key) ? state.openGroups.delete(key) : state.openGroups.add(key);
      syncNavigation(currentRoute());
      return;
    }

    if (event.target.closest('[data-toggle-config]')) {
      const isOpen = configPanel.classList.toggle('is-open');
      configPanel.setAttribute('aria-hidden', String(!isOpen));
      notificationMenu.classList.remove('is-open');
      return;
    }

    if (event.target.closest('[data-toggle-notifications]')) {
      const isOpen = notificationMenu.classList.toggle('is-open');
      notificationMenu.setAttribute('aria-hidden', String(!isOpen));
      configPanel.classList.remove('is-open');
      return;
    }

    const panelToggle = event.target.closest('[data-panel-toggle]');
    if (panelToggle) {
      panelToggle.closest('.panel-item').classList.toggle('is-open');
      return;
    }

    const alertButton = event.target.closest('[data-alert]');
    if (alertButton) {
      const [title, copy, tone] = alertButton.dataset.alert.split('|');
      openModal(title, copy, tone || 'success');
      return;
    }

    if (event.target.closest('[data-close-modal]') || event.target === modalBackdrop) {
      closeModal();
      return;
    }

    const notifyButton = event.target.closest('[data-notify]');
    if (notifyButton) {
      showToast(`${notifyButton.textContent.trim()} notification example`, notifyButton.dataset.notify);
      return;
    }

    const demoButton = event.target.closest('[data-demo]');
    if (demoButton) {
      showToast(`${demoButton.dataset.demo} selected`);
      return;
    }

    const taskCheck = event.target.closest('.task-check');
    if (taskCheck) {
      taskCheck.classList.toggle('is-done');
      taskCheck.innerHTML = taskCheck.classList.contains('is-done') ? icon('check') : '';
      return;
    }

    const segmentButton = event.target.closest('.segment button');
    if (segmentButton) {
      segmentButton.parentElement.querySelectorAll('button').forEach((button) => button.classList.toggle('is-active', button === segmentButton));
      showToast(`${segmentButton.textContent.trim()} calendar view selected`);
      return;
    }

    const calendarNav = event.target.closest('[data-calendar-nav]');
    if (calendarNav) {
      state.calendarOffset += Number(calendarNav.dataset.calendarNav);
      render();
      return;
    }
    if (event.target.closest('[data-calendar-today]')) {
      state.calendarOffset = 0;
      render();
      return;
    }

    if (event.target.closest('[data-wizard-prev]')) {
      state.wizardStep = Math.max(0, state.wizardStep - 1);
      render();
      return;
    }
    if (event.target.closest('[data-wizard-next]')) {
      if (state.wizardStep === 2) {
        openModal('Setup complete', 'All wizard steps have been completed.');
        state.wizardStep = 0;
      } else state.wizardStep += 1;
      render();
      return;
    }

    const pageButton = event.target.closest('[data-page]');
    if (pageButton) {
      state.tablePage = Number(pageButton.dataset.page);
      render();
      return;
    }

    const sortButton = event.target.closest('[data-sort]');
    if (sortButton) {
      const key = sortButton.dataset.sort;
      state.tableSort.direction = state.tableSort.key === key ? -state.tableSort.direction : 1;
      state.tableSort.key = key;
      render();
      return;
    }

    const rowDelete = event.target.closest('[data-row-delete]');
    if (rowDelete) {
      const id = Number(rowDelete.dataset.rowDelete);
      if (currentRoute() === '/table-list/paginated') {
        state.deletedRows.add(id);
        render();
        showToast('Row deleted', 'danger');
      } else openModal('Delete row?', 'This action is demonstrated without changing permanent data.', 'danger');
      return;
    }

    const rowEdit = event.target.closest('[data-row-edit]');
    if (rowEdit) {
      openModal('Edit record', 'The edit form would open here in a production workflow.');
      return;
    }
    const rowView = event.target.closest('[data-row-view]');
    if (rowView) {
      openModal('Record details', 'This is the detail action for the selected table row.');
      return;
    }

    const mapControl = event.target.closest('[data-map-zoom], [data-map-reset]');
    if (mapControl) {
      const map = mapControl.closest('[data-map]');
      const current = Number(map.dataset.zoom || 1);
      const next = mapControl.hasAttribute('data-map-reset') ? 1 : Math.min(1.5, Math.max(.8, current + (mapControl.dataset.mapZoom === 'in' ? .1 : -.1)));
      map.dataset.zoom = String(next);
      map.style.setProperty('--map-zoom', next);
      showToast(`Map zoom ${Math.round(next * 100)}%`);
      return;
    }

    if (!event.target.closest('.search-shell')) searchResults.classList.remove('is-open');
    if (!event.target.closest('.notification-menu, [data-toggle-notifications]')) notificationMenu.classList.remove('is-open');
  });

  document.addEventListener('submit', (event) => {
    event.preventDefault();
    if (event.target.matches('[data-validate-form]')) {
      let valid = true;
      event.target.querySelectorAll('[required]').forEach((input) => {
        const field = input.closest('.form-field');
        const inputValid = input.checkValidity();
        field.classList.toggle('is-invalid', !inputValid);
        valid = valid && inputValid;
      });
      if (valid) openModal('Form is valid', 'All required information passed validation.');
      else showToast('Please correct the highlighted fields.', 'danger');
      return;
    }
    if (event.target.matches('[data-auth-form]')) {
      openModal('Authentication successful', 'The prototype has accepted the submitted credentials.');
      return;
    }
    if (event.target.matches('[data-demo-form]')) openModal('Changes saved', 'The form interaction completed successfully.');
  });

  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-global-search]')) updateSearchResults(event.target.value);
    if (event.target.matches('[data-table-search]')) {
      state.tableQuery = event.target.value;
      state.tablePage = 1;
      const cursor = event.target.selectionStart;
      render();
      const input = document.querySelector('[data-table-search]');
      input?.focus();
      input?.setSelectionRange(cursor, cursor);
    }
    if (event.target.matches('[data-range]')) document.querySelector('[data-range-output]').textContent = `${event.target.value}%`;
  });

  document.querySelector('[data-sidebar-mini]').addEventListener('change', (event) => {
    state.theme.mini = event.target.checked;
    applyTheme();
  });

  document.querySelectorAll('[data-config="sidebar"] button').forEach((button) => button.addEventListener('click', () => {
    state.theme.sidebar = button.dataset.value;
    applyTheme();
  }));

  document.querySelectorAll('[data-config="accent"] button').forEach((button) => button.addEventListener('click', () => {
    state.theme.accent = button.dataset.value;
    applyTheme();
  }));

  document.querySelectorAll('.config-action').forEach((button) => button.addEventListener('click', () => showToast(`${button.textContent.trim()} selected`)));
  document.querySelector('.tool-button[aria-label="Applications"]').addEventListener('click', () => showToast('Application switcher opened'));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
      setMobileNavigation(false);
      configPanel.classList.remove('is-open');
      notificationMenu.classList.remove('is-open');
      searchResults.classList.remove('is-open');
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      searchInput.focus();
    }
  });

  if (new URLSearchParams(location.search).get('config') === 'open') {
    configPanel.classList.add('is-open');
    configPanel.setAttribute('aria-hidden', 'false');
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) setMobileNavigation(false);
  });
  applyTheme();
  render();
})();
