/* Sensei Agent teacher web + centre admin: design prototype. Sample data, no AI, no server.
   Deep links: #p=<screen>. Vermilion (朱) marks only the places where a person decides. */
(function () {
  'use strict';
  var D = window.T_DATA;
  var LEARNER = '../index.html';
  var OPS = '../ops/index.html#p=tenants';
  var PROTO = 'Prototype thiết kế · dữ liệu mẫu · chưa nối AI';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ic = function (n, cls) { return '<svg class="ic ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; };
  var srcLink = function (k, page) { var s = D.src[k]; return '<a class="src" href="' + s.url + '" target="_blank" rel="noopener">' + ic('book', 'ic-xs') + '<span>' + esc(s.label) + (page ? ' · tr.' + page : '') + '</span></a>'; };

  /* ---------------- state ---------------- */
  var S;
  function fresh() {
    return {
      clock: 8 * 60 + 5,
      t1: {}, t1Edit: null, t1Min: 19, t1First: '衛生管理', t1Note: '',
      t2: {}, t3: {}, t4: null,
      up: 0, upOk: null,
      msgs: {}, msgText: {}, qs: {}, qText: {},
      samp: 'k12', rated: {},
      qtab: 't1', filter: 'all', search: '',
      rules: { hints: 3, photo: true, doc: true, gate: false, mocks: ['10/1/2027', '31/1/2027'], saved: null, dirty: false },
      plan: 'std', planAsk: false, planReq: null, seats: 60,
      set: { photo: true, doc: true, groups: true, samples: true, gate: true, notify: true }, setSaved: null, setDirty: false,
      brand: { color: '#1F3A68', logo: 'sakura', name: 'Hoa Anh Đào' }, brandSaved: null,
      classes: D.classes.map(function (c) { return Object.assign({}, c); }), newClass: false,
      inviteT: false, invited: [],
      menu: false
    };
  }
  S = fresh();
  var tick = function () { S.clock += 1; var h = Math.floor(S.clock / 60), m = S.clock % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; };

  var cnt = {
    t1: function () { return D.t1.filter(function (x) { return !S.t1[x.id]; }).length; },
    t2: function () { return D.t2.filter(function (x) { return !S.t2[x.id]; }).length; },
    t3: function () { return D.t3.filter(function (x) { return !S.t3[x.id]; }).length; },
    t4: function () { return S.t4 || S.t4Drop ? 0 : 1; },
    queue: function () { return cnt.t1() + cnt.t2() + cnt.t3() + cnt.t4(); },
    msgs: function () { return D.msgs.filter(function (x) { return !S.msgs[x.id]; }).length; },
    qs: function () { return D.qs.filter(function (x) { return !S.qs[x.id]; }).length; },
    all: function () { return cnt.queue() + cnt.msgs() + cnt.qs(); }
  };

  /* ---------------- routes ---------------- */
  var T = 't', A = 'a';
  var R = {
    login: { role: null, title: 'Chọn vai' },
    today: { role: T, nav: 'today', title: 'Hôm nay' },
    queue: { role: T, nav: 'queue', title: 'Hàng chờ duyệt' },
    messages: { role: T, nav: 'messages', title: 'Tin nhắn chờ duyệt' },
    questions: { role: T, nav: 'questions', title: 'Học viên hỏi cô' },
    classes: { role: T, nav: 'classes', title: 'Lớp của tôi' },
    'class-k12': { role: T, nav: 'classes', title: 'Lớp K12', parent: 'classes' },
    'learner-hanh': { role: T, nav: 'classes', title: 'Chị Hạnh', parent: 'class-k12' },
    samples: { role: T, nav: 'samples', title: 'Mẫu hội thoại' },
    curriculum: { role: T, nav: 'curriculum', title: 'Giáo trình' },
    rules: { role: T, nav: 'rules', title: 'Luật lớp' },
    admin: { role: A, nav: 'admin', title: 'Tổng quan trung tâm' },
    'admin-teachers': { role: A, nav: 'admin-teachers', title: 'Giáo viên' },
    'admin-classes': { role: A, nav: 'admin-classes', title: 'Lớp' },
    'admin-plan': { role: A, nav: 'admin-plan', title: 'Gói và chi phí' },
    'admin-settings': { role: A, nav: 'admin-settings', title: 'Thiết lập' },
    'admin-brand': { role: A, nav: 'admin-brand', title: 'Thương hiệu' }
  };
  var NAV = {
    t: [
      { g: 'Mỗi sáng · khoảng 10 phút', items: [
        { p: 'today', l: 'Hôm nay', i: 'home' },
        { p: 'queue', l: 'Hàng chờ duyệt', i: 'inbox', n: function () { return cnt.queue(); } },
        { p: 'messages', l: 'Tin nhắn chờ duyệt', i: 'chat', n: function () { return cnt.msgs(); } },
        { p: 'questions', l: 'Học viên hỏi cô', i: 'help', n: function () { return cnt.qs(); } }
      ] },
      { g: 'Lớp và nội dung', items: [
        { p: 'classes', l: 'Lớp của tôi', i: 'users' },
        { p: 'samples', l: 'Mẫu hội thoại', i: 'eye' },
        { p: 'curriculum', l: 'Giáo trình', i: 'book', n: function () { return cnt.t4(); } },
        { p: 'rules', l: 'Luật lớp', i: 'sliders' }
      ] }
    ],
    a: [
      { g: 'Quản trị trung tâm', items: [
        { p: 'admin', l: 'Tổng quan', i: 'grid' },
        { p: 'admin-teachers', l: 'Giáo viên', i: 'user' },
        { p: 'admin-classes', l: 'Lớp', i: 'users' },
        { p: 'admin-plan', l: 'Gói và chi phí', i: 'card' },
        { p: 'admin-settings', l: 'Thiết lập', i: 'toggle' },
        { p: 'admin-brand', l: 'Thương hiệu', i: 'palette' }
      ] }
    ]
  };
  var BNAV = {
    t: [['today', 'Hôm nay', 'home'], ['queue', 'Duyệt', 'inbox'], ['messages', 'Tin nhắn', 'chat'], ['classes', 'Lớp', 'users']],
    a: [['admin', 'Tổng quan', 'grid'], ['admin-classes', 'Lớp', 'users'], ['admin-plan', 'Gói', 'card'], ['admin-settings', 'Thiết lập', 'toggle']]
  };
  var CRUMB = {
    classes: ['Lớp của tôi'], 'class-k12': [['classes', 'Lớp của tôi'], 'K12'], 'learner-hanh': [['classes', 'Lớp của tôi'], ['class-k12', 'K12'], 'Nguyễn Thị Hạnh']
  };

  var cur = function () { var m = /p=([\w-]+)/.exec(location.hash); return m && R[m[1]] ? m[1] : 'login'; };
  var go = function (p) { if (location.hash === '#p=' + p) render(true); else location.hash = 'p=' + p; };

  /* ---------------- shared bits ---------------- */
  var badge = function (n, shu) { return n ? '<span class="count' + (shu ? ' shu' : '') + '">' + n + '</span>' : ''; };
  var decide = function (t) { return '<span class="decide">' + ic('seal', 'ic-xs') + (t || 'Cô quyết') + '</span>'; };
  var aiTag = function (t) { return '<span class="aitag">' + ic('spark', 'ic-xs') + esc(t) + '</span>'; };
  var hanko = function (t, big) { return '<span class="hanko' + (big ? ' big' : '') + '" aria-hidden="true"><span>' + (t || '承認') + '</span></span>'; };
  var empty = function (icon, t, b, act) { return '<div class="empty">' + ic(icon, 'ic-lg') + '<p class="empty-t">' + t + '</p><p class="empty-b">' + b + '</p>' + (act || '') + '</div>'; };
  var btn = function (label, act, arg, cls, icon) { return '<button class="btn ' + (cls || 'ghost') + '" data-act="' + act + '"' + (arg != null ? ' data-arg="' + esc(arg) + '"' : '') + '>' + (icon ? ic(icon, 'ic-sm') : '') + '<span>' + label + '</span></button>'; };
  var link = function (label, p, cls, icon) { return '<a class="btn ' + (cls || 'ghost') + '" href="#p=' + p + '">' + (icon ? ic(icon, 'ic-sm') : '') + '<span>' + label + '</span></a>'; };
  var ext = function (label, href, cls, icon) { return '<a class="btn ' + (cls || 'ghost') + '" href="' + href + '">' + ic(icon || 'phone', 'ic-sm') + '<span>' + label + '</span></a>'; };
  var head = function (o) {
    return '<header class="phead"><div class="phead-t">' + (o.back ? '<a class="back" href="#p=' + o.back[0] + '">' + ic('back', 'ic-sm') + '<span>' + o.back[1] + '</span></a>' : '') +
      (o.eye ? '<p class="eyebrow">' + o.eye + '</p>' : '') + '<h1 class="h1" tabindex="-1">' + o.h + '</h1>' + (o.lead ? '<p class="lead">' + o.lead + '</p>' : '') + '</div>' +
      (o.act ? '<div class="phead-a">' + o.act + '</div>' : '') + '</header>';
  };
  var av = function (name, cls) { var w = name.trim().split(/\s+/); return '<span class="av ' + (cls || '') + '" aria-hidden="true">' + esc(w[w.length - 1][0]) + '</span>'; };
  var flagIcon = { idle: 'clock', late: 'alert', repeat: 'refresh', new: 'seal' };
  var flagLabel = { idle: 'Bỏ học', late: 'Không kịp', repeat: 'Sai lặp', new: 'Kế hoạch tạm' };
  var sw = function (on, act, label, arg) { return '<button class="switch" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" data-act="' + act + '" data-arg="' + arg + '" aria-label="' + esc(label) + '"><span class="knob"></span></button>'; };

  /* ---------------- chrome ---------------- */
  function sideHTML(role, p) {
    var who = role === T ? { n: 'Cô Linh', r: 'Giáo viên · K12, K13', a: 'L' } : { n: 'Chị Thu', r: 'Quản trị trung tâm', a: 'T' };
    var groups = NAV[role].map(function (g) {
      return '<p class="nav-g">' + g.g + '</p><ul class="nav">' + g.items.map(function (it) {
        var on = R[p].nav === it.p; var n = it.n ? it.n() : 0;
        return '<li><a class="nav-i' + (on ? ' on' : '') + '" href="#p=' + it.p + '"' + (on ? ' aria-current="page"' : '') + '>' + ic(it.i, 'ic-sm') + '<span class="nav-l">' + it.l + '</span>' + badge(n, true) + '</a></li>';
      }).join('') + '</ul>';
    }).join('');
    return '<div class="side-in">' +
      '<div class="brand"><span class="seal" aria-hidden="true">先生</span><div><p class="wordmark">Sensei Agent</p><p class="tagline">' + esc(D.center.name) + '</p></div>' +
      '<button class="side-x" data-act="menu" aria-label="Đóng menu">' + ic('x') + '</button></div>' +
      '<div class="me">' + '<span class="av on-dark" aria-hidden="true">' + who.a + '</span><div><p class="me-n">' + who.n + '</p><p class="me-r">' + who.r + '</p></div></div>' +
      groups +
      '<div class="side-foot">' +
      '<p class="nav-g">Bề mặt khác</p>' +
      '<a class="nav-i" href="' + LEARNER + '">' + ic('phone', 'ic-sm') + '<span class="nav-l">Mở app học viên</span>' + ic('ext', 'ic-xs') + '</a>' +
      '<a class="nav-i" href="' + OPS + '">' + ic('server', 'ic-sm') + '<span class="nav-l">Vận hành Sensei Agent</span>' + ic('ext', 'ic-xs') + '</a>' +
      '<a class="nav-i" href="#p=login">' + ic('swap', 'ic-sm') + '<span class="nav-l">Đổi vai</span></a>' +
      '<p class="legend"><span class="shu-dot"></span>Màu son: chỗ con người quyết định</p>' +
      '</div></div>';
  }
  function topHTML(role, p) {
    var c = CRUMB[p];
    var trail = '<a href="#p=' + (role === T ? 'today' : 'admin') + '">' + esc(D.center.short) + '</a>';
    if (c) c.forEach(function (x) { trail += ic('next', 'ic-xs') + (Array.isArray(x) ? '<a href="#p=' + x[0] + '">' + x[1] + '</a>' : '<span aria-current="page">' + x + '</span>'); });
    else trail += ic('next', 'ic-xs') + '<span aria-current="page">' + R[p].title + '</span>';
    return '<button class="menu-b" data-act="menu" aria-label="Mở menu">' + ic('menu') + '</button>' +
      '<nav class="crumb" aria-label="Bạn đang ở đây">' + trail + '</nav>' +
      '<p class="mtitle">' + R[p].title + '</p>' +
      '<div class="top-r"><span class="proto">' + ic('info', 'ic-xs') + PROTO + '</span><span class="when">' + ic('cal', 'ic-xs') + 'Thứ Ba 17/11/2026</span></div>' +
      '<p class="proto-m">' + PROTO + '</p>';
  }
  function bnavHTML(role, p) {
    return BNAV[role].map(function (b) {
      var on = R[p].nav === b[0]; var n = b[0] === 'queue' ? cnt.queue() : b[0] === 'messages' ? cnt.msgs() : 0;
      return '<a class="bn' + (on ? ' on' : '') + '" href="#p=' + b[0] + '"' + (on ? ' aria-current="page"' : '') + '>' + ic(b[2]) + (n ? '<span class="bn-n">' + n + '</span>' : '') + '<span>' + b[1] + '</span></a>';
    }).join('') + '<button class="bn" data-act="menu">' + ic('menu') + '<span>Thêm</span></button>';
  }

  /* ---------------- screens ---------------- */
  var P = {};

  P.login = function () {
    return '<div class="login">' +
      '<div class="login-card">' +
      '<div class="brand lg"><span class="seal" aria-hidden="true">先生</span><div><p class="wordmark">Sensei Agent</p><p class="tagline">cho trung tâm dạy người Việt ở Nhật</p></div></div>' +
      '<p class="proto dark">' + ic('info', 'ic-xs') + PROTO + '</p>' +
      '<h1 class="h1" tabindex="-1">' + esc(D.center.name) + ' <span class="fict">(hư cấu)</span></h1>' +
      '<p class="lead">48 học viên · 3 lớp · 2 giáo viên. Chọn vai để xem Sensei Agent giúp người dạy thế nào, và chỗ nào con người luôn quyết.</p>' +
      '<div class="roles">' +
      '<a class="role" href="#p=today"><span class="av big">L</span><span class="role-t"><b>Cô Linh</b><em>Giáo viên · lớp 外食業2号 K12, K13</em><span>Mỗi sáng khoảng 10 phút: xem ai cần giúp, duyệt, trả lời học viên.</span></span>' + ic('next') + '</a>' +
      '<a class="role" href="#p=admin"><span class="av big alt">T</span><span class="role-t"><b>Chị Thu</b><em>Quản trị trung tâm</em><span>Gói, chỗ học viên, giáo viên, lớp, thiết lập, thương hiệu.</span></span>' + ic('next') + '</a>' +
      '</div>' +
      '<div class="login-rule"><p class="eyebrow">Ai quyết gì</p><ul>' +
      '<li><b>Học viên</b> quyết ngày thi, kế hoạch lớn, số nào được chia sẻ.</li>' +
      '<li><b>Giáo viên</b> duyệt kế hoạch đầu tiên, câu dùng chung, giáo trình, tin nhắn AI soạn.</li>' +
      '<li><b>Trung tâm</b> chọn gói, chỗ, tính năng, thương hiệu. Không đọc hội thoại.</li></ul></div>' +
      '<div class="login-links">' + ext('Mở app học viên', LEARNER, 'ghost on-dark', 'phone') + ext('Vận hành Sensei Agent', OPS, 'ghost on-dark', 'server') + '</div>' +
      '</div></div>';
  };

  P.today = function () {
    var all = cnt.all(), q = cnt.queue(), m = cnt.msgs(), a = cnt.qs();
    var next = cnt.t1() && !S.t1.hanh ? ['Bắt đầu: duyệt kế hoạch của chị Hạnh', 'learner-hanh'] : q ? ['Tiếp: hàng chờ duyệt (' + q + ')', 'queue'] : m ? ['Tiếp: duyệt ' + m + ' tin nhắn', 'messages'] : a ? ['Tiếp: trả lời ' + a + ' câu hỏi', 'questions'] : null;
    var helpers = [
      { id: 'hanh', go: 'learner-hanh', act: 'Mở hồ sơ', done: S.t1.hanh, doneT: 'Kế hoạch đã duyệt' },
      { id: 'quan', go: 'messages', act: 'Xem tin đã soạn', done: S.msgs.quan, doneT: S.msgs.quan === 'drop' ? 'Đã bỏ tin' : 'Đã gửi tin' },
      { id: 'ngoc', go: 'messages', act: 'Xem tin đã soạn', done: S.msgs.ngoc, doneT: S.msgs.ngoc === 'drop' ? 'Đã bỏ tin' : 'Đã gửi đề xuất' },
      { id: 'phuc', go: 'messages', act: 'Xem tin đã soạn', done: S.msgs.phuc, doneT: S.msgs.phuc === 'drop' ? 'Đã bỏ tin' : 'Đã gửi góp ý' },
      { id: 'thang', go: 'class-k12', act: 'Xem trong lớp' },
      { id: 'tam', go: 'class-k12', act: 'Xem trong lớp' }
    ];
    var rows = helpers.map(function (h) {
      var r = D.roster.filter(function (x) { return x.id === h.id; })[0];
      return '<li class="who' + (h.done ? ' done' : '') + '">' + av(r.name) + '<div class="who-t"><p class="who-n">' + esc(r.name) + ' <em>K12</em></p>' +
        '<p class="why ' + r.flag.k + '">' + ic(flagIcon[r.flag.k], 'ic-xs') + '<span>' + esc(r.flag.t) + '</span></p></div>' +
        (h.done ? '<span class="ok-t">' + ic('check', 'ic-xs') + h.doneT + '</span>' : link(h.act, h.go, 'ghost sm')) + '</li>';
    }).join('');
    var steps = [
      ['Xem ai cần giúp', 'learner-hanh', S.t1.hanh ? 0 : 1, 'users'],
      ['Duyệt hàng chờ', 'queue', q, 'inbox'],
      ['Duyệt tin nhắn', 'messages', m, 'chat'],
      ['Trả lời học viên', 'questions', a, 'help']
    ].map(function (s, i) {
      var done = !s[2];
      return '<li><a class="step' + (done ? ' done' : '') + '" href="#p=' + s[1] + '"><span class="step-n">' + (done ? ic('check', 'ic-xs') : i + 1) + '</span><span class="step-l">' + s[0] + '</span>' + (done ? '<em>Xong</em>' : '<em class="shu-t">' + (i === 0 ? '1 kế hoạch' : s[2] + ' việc') + '</em>') + '</a></li>';
    }).join('');
    var qrows = [
      ['T1', 'Kế hoạch tạm', cnt.t1(), 'queue', 't1'], ['T2', 'Câu dùng chung', cnt.t2(), 'queue', 't2'], ['T3', 'Báo sai, “không chắc”', cnt.t3(), 'queue', 't3'],
      ['T4', 'Giáo trình mới', cnt.t4(), 'curriculum'], ['T7', 'Tin nhắn Trợ lý lớp soạn', m, 'messages'], ['T6', 'Học viên hỏi cô', a, 'questions']
    ].map(function (r) {
      return '<li><button class="qrow" data-act="goQueue" data-arg="' + r[3] + (r[4] ? ':' + r[4] : '') + '"><span class="tcode">' + r[0] + '</span><span class="qrow-l">' + r[1] + '</span>' + (r[2] ? '<span class="count shu">' + r[2] + '</span>' : '<span class="zero">' + ic('check', 'ic-xs') + '0</span>') + ic('next', 'ic-xs') + '</button></li>';
    }).join('');
    return head({
      eye: 'Thứ Ba 17/11 · Trợ lý lớp đã đọc 32 học viên của cô lúc 06:00',
      h: all ? 'Chào cô Linh. Hôm nay có <span class="shu-t">' + all + ' việc</span> chờ cô quyết.' : 'Xong việc buổi sáng. Cảm ơn cô Linh.',
      lead: all ? 'Khoảng 10 phút. Trợ lý lớp chỉ xếp việc và soạn nháp; nó không tự gửi tin, không tự đổi kế hoạch.' : 'Không còn gì chờ cô. Trợ lý lớp sẽ báo nếu có học viên cần giúp trong ngày.',
      act: next ? link(next[0], next[1], 'shu', 'next') : link('Xem lớp K12', 'class-k12', 'primary', 'users')
    }) +
      '<ol class="steps" aria-label="Buổi sáng của cô">' + steps + '</ol>' +
      '<div class="g-today">' +
      '<section class="card"><div class="card-h"><h2 class="h2">Ai cần cô hôm nay <span class="muted">· 6 người</span></h2>' + aiTag('Trợ lý lớp xếp, lý do bên dưới') + '</div>' +
      '<ul class="wholist">' + rows + '</ul>' +
      '<p class="card-foot">' + ic('check', 'ic-xs ok') + '<span>Lớp K13: không ai cần giúp hôm nay · 12/14 người học hôm qua.</span></p></section>' +
      '<div class="stack">' +
      '<section class="card"><div class="card-h"><h2 class="h2">Chờ cô quyết</h2>' + decide() + '</div><ul class="qlist">' + qrows + '</ul></section>' +
      '<section class="card"><h2 class="h2">Hôm qua ở lớp</h2>' +
      '<div class="yday"><div><p class="big-n num">15<span>/18</span></p><p class="muted">K12 có học · TB 21 phút</p><div class="meter"><span style="width:83%"></span></div></div>' +
      '<div><p class="big-n num">12<span>/14</span></p><p class="muted">K13 có học · TB 18 phút</p><div class="meter"><span style="width:86%"></span></div></div></div></section>' +
      '<p class="never-line">' + ic('lock', 'ic-xs') + '<span>Trợ lý lớp không được: tự gửi tin, đổi kế hoạch, đổi ngày thi, xem ảnh gốc học viên chụp.</span></p>' +
      '</div></div>';
  };

  P.classes = function () {
    var mine = S.classes.filter(function (c) { return c.teacher === 'Cô Linh'; });
    return head({ eye: 'Cô Linh · 2 lớp · 32 học viên', h: 'Lớp của tôi', lead: 'Mở lớp để xem tiến độ từng người. Lớp IP05 của thầy Nam không hiện ở đây.', act: link('Mở lớp K12', 'class-k12', 'primary', 'users') }) +
      '<div class="cls-grid">' + mine.map(function (c) {
        var isK12 = c.id === 'k12';
        return '<article class="card cls"><div class="cls-top"><span class="exam-jp">' + esc(c.exam) + '</span><span class="cls-code">' + (c.id.toUpperCase()) + '</span></div>' +
          '<h2 class="h2">' + esc(c.name) + '</h2><p class="muted">' + c.n + ' học viên · thi mặc định ' + c.examDate + ' · thi thử lớp ' + c.nextMock + '</p>' +
          '<dl class="kv4"><div><dt>Học hôm qua</dt><dd class="num">' + c.studiedYesterday + '/' + c.n + '</dd></div><div><dt>Kịp ngày thi</dt><dd class="num">' + c.onTrack + '/' + c.n + '</dd></div>' +
          '<div><dt>Cần giúp</dt><dd class="num">' + c.help + '</dd></div><div><dt>Kế hoạch tạm</dt><dd class="num' + (c.tentative && isK12 && cnt.t1() ? ' shu-t' : '') + '">' + (isK12 ? cnt.t1() : c.tentative) + '</dd></div></dl>' +
          (isK12 ? link('Mở lớp K12', 'class-k12', 'ghost', 'next') : '<p class="note-sm">' + ic('info', 'ic-xs') + '<span>Prototype chỉ dựng chi tiết lớp K12. K13 hôm nay không có ai cần giúp.</span></p>') +
          '</article>';
      }).join('') + '</div>' +
      '<section class="card soft"><h2 class="h2">Lớp học trong Sensei Agent là gì</h2><p class="muted">Danh sách học viên của cô, thông báo lớp và nhóm học 3–5 người tự nguyện. Không có bảng xếp hạng công khai: học viên chỉ thấy tiến độ của chính mình.</p></section>';
  };

  P['class-k12'] = function () {
    var rs = D.roster.slice();
    var F = {
      all: function () { return true; },
      help: function (r) { return r.flag && r.flag.k !== 'new'; },
      tam: function (r) { return r.plan === 'tam' && !S.t1[r.id]; },
      late: function (r) { return r.flag && r.flag.k === 'late'; },
      idle: function (r) { return r.flag && r.flag.k === 'idle'; }
    };
    var chips = [['all', 'Tất cả'], ['help', 'Cần giúp'], ['tam', 'Kế hoạch tạm'], ['late', 'Không kịp ngày thi'], ['idle', 'Bỏ học ≥ 2 ngày']].map(function (c) {
      var n = rs.filter(F[c[0]]).length;
      return '<button class="chip' + (S.filter === c[0] ? ' on' : '') + '" data-act="filter" data-arg="' + c[0] + '" aria-pressed="' + (S.filter === c[0]) + '">' + c[1] + ' <b class="num">' + n + '</b></button>';
    }).join('');
    var q = S.search.trim().toLowerCase();
    var list = rs.filter(F[S.filter]).filter(function (r) { return !q || r.name.toLowerCase().indexOf(q) >= 0; });
    var rows = list.map(function (r) {
      var tam = r.plan === 'tam' && !S.t1[r.id];
      var pct = Math.round(r.est / 250 * 100);
      var action = r.id === 'hanh' ? link('Mở hồ sơ', 'learner-hanh', 'ghost sm') : tam ? btn('Duyệt kế hoạch', 'goQueue', 'queue:t1', 'ghost sm') : (r.id === 'quan' || r.id === 'ngoc' || r.id === 'phuc') ? (S.msgs[r.id] ? '<span class="ok-t">' + ic('check', 'ic-xs') + 'Đã xử lý tin</span>' : link('Tin đã soạn', 'messages', 'ghost sm')) : '';
      return '<li class="rrow' + (r.id === 'hanh' ? ' hl' : '') + '"><div class="r-name">' + av(r.name) + '<div><p class="who-n">' + esc(r.name) + '</p>' +
        (r.flag && !(r.flag.k === 'new' && !tam) ? '<p class="why ' + r.flag.k + '">' + ic(flagIcon[r.flag.k], 'ic-xs') + '<span>' + esc(r.flag.t) + '</span></p>' : '<p class="muted sm">Vào lớp ' + r.joined + '</p>') + '</div></div>' +
        '<div class="r-score"><span class="lab-m">Điểm ước tính</span><div class="sbar" title="' + r.est + '/250, cần 163"><span class="sfill' + (r.est >= 163 ? ' pass' : '') + '" style="width:' + pct + '%"></span><span class="spass"></span></div><span class="num">' + r.est + '</span></div>' +
        '<div class="r-c"><span class="lab-m">Đề cương</span><span class="num">' + r.syl + '%</span></div>' +
        '<div class="r-c"><span class="lab-m">7 ngày</span><span class="num">' + r.min7 + ' phút</span></div>' +
        '<div class="r-c"><span class="lab-m">Học gần nhất</span><span>' + r.last + '</span></div>' +
        '<div class="r-c"><span class="lab-m">Kế hoạch</span>' + (tam ? '<span class="pill shu">Tạm · chờ cô</span>' : '<span class="pill ok">' + (S.t1[r.id] ? 'Cô vừa duyệt' : 'Đã duyệt') + '</span>') + '</div>' +
        '<div class="r-a">' + action + '</div></li>';
    }).join('');
    var k = S.classes[0];
    return head({
      back: ['classes', 'Lớp của tôi'], eye: '外食業2号 · cô Linh · thi mặc định Chủ nhật 21/2/2027',
      h: 'Lớp K12 · 18 học viên', lead: 'Điểm ước tính trên thang 250; vạch dọc là mức đỗ 163. Số ước tính lấy từ bài chẩn đoán và bài làm hằng ngày (dữ liệu mẫu).',
      act: link('Luật lớp', 'rules', 'ghost', 'sliders') + btn('Chép mã mời', 'copy', k.code, 'ghost', 'copy')
    }) +
      '<div class="tiles">' +
      '<div class="tile"><p class="tile-l">Học hôm qua</p><p class="tile-v num">15<span>/18</span></p></div>' +
      '<div class="tile"><p class="tile-l">Kịp ngày thi (dự kiến)</p><p class="tile-v num">13<span>/18</span></p></div>' +
      '<div class="tile' + (cnt.t1() ? ' shu' : '') + '"><p class="tile-l">Kế hoạch tạm chờ cô</p><p class="tile-v num">' + cnt.t1() + '</p></div>' +
      '<div class="tile"><p class="tile-l">Thi thử của lớp (tắt AI)</p><p class="tile-v sm">10/1/2027</p></div></div>' +
      '<div class="filters"><div class="chips" role="group" aria-label="Lọc học viên">' + chips + '</div>' +
      '<label class="search">' + ic('search', 'ic-sm') + '<span class="sr-only">Tìm học viên</span><input id="search" type="search" placeholder="Tìm tên học viên" value="' + esc(S.search) + '"></label></div>' +
      '<div class="card flush"><div class="rhead" aria-hidden="true"><span>Học viên</span><span>Điểm ước tính / 250</span><span>Đề cương</span><span>7 ngày</span><span>Học gần nhất</span><span>Kế hoạch</span><span></span></div>' +
      (list.length ? '<ul class="rlist">' + rows + '</ul>' : empty('users', 'Không có học viên nào khớp', 'Không ai trong lớp K12 khớp bộ lọc này. Nếu ai đó cần giúp, Trợ lý lớp sẽ đưa lên đây mỗi sáng 06:00.', btn('Xem tất cả 18 người', 'filter', 'all', 'ghost'))) + '</div>';
  };

  P['learner-hanh'] = function () {
    var h = D.hanh, st = S.t1.hanh;
    var gp = function (v) { return (v / h.total * 100).toFixed(1) + '%'; };
    var areas = h.areas.map(function (a, i) {
      return '<li class="area"><div class="area-t"><span class="jp">' + a.ja + '</span><span class="muted">' + a.vn + ' · ' + a.pts + ' điểm</span>' + (i < 2 ? '<span class="pill warn">Ưu tiên ' + (i + 1) + '</span>' : '') + '</div>' +
        '<div class="abar"><span style="width:' + a.p + '%"></span><em class="num">' + a.p + '%</em></div></li>';
    }).join('');
    var maxM = 30;
    var week = h.week.map(function (d) { return '<li><span class="wk-bar"><span style="height:' + (d[1] / maxM * 100) + '%"></span></span><span class="num wk-v">' + d[1] + '</span><span class="wk-d">' + d[0] + '</span></li>'; }).join('');
    var phases = h.phases.map(function (x) { return '<li><span class="ph-w">' + x.w + '</span><span class="ph-t">' + x.t + '<em>' + x.why + '</em></span></li>'; }).join('');
    var mist = h.mistakes.map(function (x) { return '<li><p class="mist-h"><span class="jp">' + x.ja + '</span><span class="pill">' + x.n + '</span></p><p>' + x.what + '</p>' + srcLink(x.s, x.page) + '</li>'; }).join('');
    var log = h.log.map(function (x) { return '<li class="lg ' + x.k + '"><span class="lg-dot"></span><p class="lg-t"><span class="mono">' + x.t + '</span> · <b>' + x.who + '</b></p><p>' + x.what + '</p><p class="lg-why">Vì sao: ' + x.why + '</p></li>'; }).join('');
    var status = st ? '<div class="banner ok">' + hanko('承認') + '<div><p class="banner-t">' + (st === 'edited' ? 'Cô đã sửa và duyệt kế hoạch' : 'Cô đã duyệt kế hoạch') + ' · ' + S.t1At + '</p><p>Chị Hạnh thấy dấu duyệt của cô trong app. Kế hoạch không còn là “tạm”.</p></div>' + btn('Hoàn tác', 'undoT1', 'hanh', 'ghost sm', 'undo') + '</div>'
      : '<div class="banner shu">' + ic('seal', 'ic-lg') + '<div><p class="banner-t">Kế hoạch tạm · cô duyệt trước 20:37 hôm nay (còn 12 giờ)</p><p>Chị Hạnh đang học theo kế hoạch tạm từ tối qua. Cô duyệt, hoặc sửa rồi duyệt. Cô không đổi được ngày thi của chị.</p></div>' +
        '<div class="banner-a">' + btn('Duyệt kế hoạch', 't1ok', 'hanh', 'shu', 'check') + btn('Sửa', 't1edit', 'hanh', 'ghost', 'pen') + '</div></div>';
    return head({
      back: ['class-k12', 'Lớp K12'], eye: '26 tuổi · phục vụ nhà hàng, Osaka · vào lớp 16/11 · ' + h.shifts,
      h: av('Hạnh', 'big') + 'Nguyễn Thị Hạnh', lead: '外食業2号 · thi Chủ nhật 21/2/2027 · còn 13 tuần · chị tự chọn ngày thi này.',
      act: ext('Xem như chị Hạnh thấy', LEARNER + (S.t1.hanh ? '#p=plan-approved' : '#p=plan-provisional'), 'ghost', 'phone')
    }) + status +
      '<div class="g-learner"><div class="stack">' +
      '<section class="card"><div class="card-h"><h2 class="h2">Bản đồ năng lực</h2><span class="muted sm">Từ bài chẩn đoán 16/11</span></div>' +
      '<div class="gauge"><div class="g-track"><span class="g-fill" style="width:' + gp(h.est) + '"></span><span class="g-pass" style="left:' + gp(h.pass) + '"><em>Đỗ 163</em></span></div>' +
      '<p class="g-lab"><b class="num">' + h.est + '</b>/250 ước tính · còn thiếu khoảng <b class="num">' + (h.pass - h.est) + '</b> điểm</p></div>' +
      '<ul class="areas">' + areas + '</ul>' + srcLink('otaff') + '</section>' +
      '<section class="card"><div class="card-h"><h2 class="h2">Kế hoạch tạm</h2>' + aiTag('Agent Lập kế hoạch soạn') + '</div>' +
      '<div class="plan-top"><div><p class="big-n num">' + h.weekMin + '<span> phút/tuần</span></p><p class="muted">' + h.dayMin + ' phút ngày thường, xếp vào khe giữa 2 ca · 13 tuần</p></div>' +
      '<ol class="wk" aria-label="Số phút mỗi ngày trong tuần">' + week + '</ol></div>' +
      '<ol class="phases">' + phases + '</ol></section>' +
      '<section class="card"><div class="card-h"><h2 class="h2">Lỗi hay gặp</h2><span class="muted sm">Chẩn đoán + buổi học tối 16/11</span></div><ul class="mist">' + mist + '</ul></section>' +
      '</div><div class="stack">' +
      '<section class="card sees"><h2 class="h2">Cô thấy gì, không thấy gì</h2><div class="sees-g">' +
      '<div><p class="eyebrow">' + ic('eye', 'ic-xs') + 'Cô thấy</p><ul><li>Điểm từng phần, lỗi hay gặp</li><li>Kế hoạch và số phút học</li><li>Câu chị gửi “hỏi cô Linh”</li><li>Việc AI đã làm và lý do</li></ul></div>' +
      '<div><p class="eyebrow">' + ic('eye-off', 'ic-xs') + 'Cô không thấy</p><ul><li>Ảnh gốc chị chụp (hệ thống không lưu)</li><li>Hội thoại với AI (chị chưa đồng ý lấy mẫu)</li><li>Số chị chia sẻ cho đơn vị hỗ trợ</li><li>Không đổi được ngày thi thay chị</li></ul></div></div></section>' +
      '<section class="card"><div class="card-h"><h2 class="h2">AI đã làm gì và vì sao</h2><span class="muted sm">8 việc gần nhất</span></div><ol class="log">' + log + '</ol>' +
      '<p class="legend-sm"><span class="k ai"></span>Agent AI <span class="k tool"></span>Công cụ (code) <span class="k rule"></span>Luật lớp <span class="k human"></span>Con người</p></section>' +
      '</div></div>';
  };

  function t1Card(x) {
    var st = S.t1[x.id];
    if (st) return '<article class="card item done">' + hanko() + '<div class="item-d"><p class="item-t">' + esc(x.who) + ' · ' + (st === 'edited' ? 'đã sửa và duyệt' : 'đã duyệt') + '</p><p class="muted">Cô Linh · ' + (S.t1At || '') + (x.id === 'hanh' && S.t1Chg ? ' · ' + S.t1Chg : ' · học viên thấy dấu duyệt trong app') + '</p></div>' + btn('Hoàn tác', 'undoT1', x.id, 'ghost sm', 'undo') + '</article>';
    var editing = S.t1Edit === x.id;
    var body = '<div class="item-b"><dl class="kv4"><div><dt>Ước tính</dt><dd class="num">' + x.est + '/250</dd></div><div><dt>Phút/tuần</dt><dd class="num">' + x.weekMin + '</dd></div><div><dt>Số tuần</dt><dd class="num">' + x.weeks + '</dd></div><div><dt>Học trước</dt><dd class="jp">' + x.first + '</dd></div></dl>' +
      '<p class="ai-why">' + ic('spark', 'ic-xs') + '<span><b>Vì sao AI đề xuất:</b> ' + esc(x.why) + '</span></p></div>';
    if (editing) {
      var newTot = function (m) { return 4 * m + 62; };
      var opts = [15, 19, 25, 30].map(function (m) { var d = Math.round((newTot(m) - 138) / 138 * 100); return '<option value="' + m + '"' + (S.t1Min === m ? ' selected' : '') + '>' + m + ' phút (' + newTot(m) + ' phút/tuần, ' + (d > 0 ? '+' : '') + d + '%)</option>'; }).join('');
      var d = Math.round((newTot(S.t1Min) - 138) / 138 * 100);
      body += '<div class="edit"><p class="eyebrow shu">Cô sửa kế hoạch</p><div class="form2">' +
        '<label class="fld"><span>Số phút ngày thường</span><select id="t1Min">' + opts + '</select></label>' +
        '<label class="fld"><span>Phần học trước</span><select id="t1First"><option' + (S.t1First === '衛生管理' ? ' selected' : '') + '>衛生管理</option><option' + (S.t1First === '店舗運営' ? ' selected' : '') + '>店舗運営</option></select></label></div>' +
        '<label class="fld"><span>Lời nhắn kèm (không bắt buộc)</span><textarea id="t1Note" rows="2" placeholder="Ví dụ: chị cố giữ 19 phút, cuối tuần cô kiểm tra lại nhé.">' + esc(S.t1Note) + '</textarea></label>' +
        '<p class="rule-note ' + (Math.abs(d) > 20 ? 'warn' : '') + '">' + ic('info', 'ic-xs') + '<span>' + (Math.abs(d) > 20 ? 'Thay đổi ' + d + '% số phút, trên ngưỡng 20%: chị Hạnh sẽ được hỏi duyệt lại trong app (Chốt A).' : 'Thay đổi ' + (d > 0 ? '+' : '') + d + '% số phút, dưới ngưỡng 20%: áp dụng ngay, chị Hạnh được báo.') + '</span></p>' +
        '<p class="locked">' + ic('lock', 'ic-xs') + '<span>Ngày thi 21/2/2027 · chỉ chị Hạnh đổi được.</span></p></div>';
    }
    var acts = editing ? btn('Lưu và duyệt', 't1save', x.id, 'shu', 'check') + btn('Huỷ sửa', 't1cancel', x.id, 'ghost')
      : btn('Duyệt', 't1ok', x.id, 'shu', 'check') + (x.id === 'hanh' ? btn('Sửa', 't1edit', x.id, 'ghost', 'pen') + link('Hồ sơ', 'learner-hanh', 'ghost', 'user') : btn('Sửa', 't1edit', x.id, 'ghost', 'pen'));
    return '<article class="card item"><div class="item-h"><p class="item-t">' + esc(x.who) + '</p><span class="pill shu">' + ic('clock', 'ic-xs') + 'còn ' + x.left + '</span></div>' + body + '<div class="item-a">' + acts + '</div></article>';
  }
  function t2Card(x) {
    var st = S.t2[x.id];
    if (st) return '<article class="card item done">' + (st === 'ok' ? hanko() : '<span class="rej">' + ic('x') + '</span>') + '<div class="item-d"><p class="item-t">' + esc(x.q) + '</p><p class="muted">' + (st === 'ok' ? 'Đã vào ngân hàng chung · mọi lớp 外食業2号 dùng được · ' : 'Đã loại · không vào ngân hàng chung · ') + S.at2[x.id] + '</p></div>' + btn('Hoàn tác', 'undoT2', x.id, 'ghost sm', 'undo') + '</article>';
    var opts = x.opts.map(function (o, i) { return '<li class="' + (i === x.a ? 'right' : '') + '">' + (i === x.a ? ic('check', 'ic-xs') : '<span class="dot"></span>') + '<span class="jp-ok">' + esc(o) + '</span></li>'; }).join('');
    return '<article class="card item"><div class="item-h"><p class="item-t jp-ok">' + esc(x.q) + '</p><span class="pill">' + x.area + '</span></div>' +
      '<div class="item-b"><ul class="opts">' + opts + '</ul><p class="muted sm">' + ic('spark', 'ic-xs') + esc(x.from) + '</p>' +
      '<p class="verified">' + ic('shield', 'ic-xs') + '<span>Kiểm chứng: đáp án khớp nguồn, không xem đáp án khi soát.</span></p>' + srcLink(x.s, x.page) + '</div>' +
      '<div class="item-a">' + btn('Duyệt vào ngân hàng chung', 't2ok', x.id, 'shu', 'check') + btn('Loại', 't2no', x.id, 'ghost', 'x') + '</div></article>';
  }
  function t3Card(x) {
    var st = S.t3[x.id];
    var doneT = { keep: 'Giữ câu · đã báo lại cho người báo sai: câu đúng, kèm trang giáo trình', drop: 'Đã gỡ · không học viên nào thấy câu này nữa', fix: 'Gửi Gia sư soạn lại từ giáo trình · câu mới sẽ quay lại mục T2' };
    if (st) return '<article class="card item done">' + hanko(st === 'drop' ? '削除' : '承認') + '<div class="item-d"><p class="item-t">' + esc(x.q) + '</p><p class="muted">' + doneT[st] + ' · ' + S.at3[x.id] + '</p></div>' + btn('Hoàn tác', 'undoT3', x.id, 'ghost sm', 'undo') + '</article>';
    var reps = x.reports.length ? '<ul class="quotes">' + x.reports.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' : '';
    var acts = x.kind === 'report' ? btn('Giữ câu, trả lời người báo', 't3', x.id + ':keep', 'shu', 'check') + btn('Gỡ câu', 't3', x.id + ':drop', 'ghost', 'x')
      : btn('Gỡ câu', 't3', x.id + ':drop', 'shu', 'x') + btn('Soạn lại theo giáo trình', 't3', x.id + ':fix', 'ghost', 'refresh');
    return '<article class="card item"><div class="item-h"><p class="item-t">' + esc(x.q) + '</p><span class="pill ' + (x.kind === 'report' ? 'warn' : 'shu') + '">' + ic(x.kind === 'report' ? 'flag' : 'alert', 'ic-xs') + x.title + '</span></div>' +
      '<div class="item-b"><p><span class="muted">Đáp án hiện tại:</span> <b>' + esc(x.ans) + '</b></p>' + reps +
      '<p class="ai-why">' + ic('shield', 'ic-xs') + '<span><b>Kiểm chứng:</b> ' + esc(x.check) + '</span></p>' + srcLink(x.s, x.page) + '</div>' +
      '<div class="item-a">' + acts + '</div></article>';
  }

  P.queue = function () {
    var tabs = [['t1', 'T1', 'Kế hoạch tạm', cnt.t1()], ['t2', 'T2', 'Câu dùng chung', cnt.t2()], ['t3', 'T3', 'Báo sai<span class="hide-m">, không chắc</span>', cnt.t3()], ['t4', 'T4', 'Giáo trình', cnt.t4()]];
    var tb = tabs.map(function (t) { var on = S.qtab === t[0]; return '<button class="tab' + (on ? ' on' : '') + '" role="tab" aria-selected="' + on + '" data-act="qtab" data-arg="' + t[0] + '"><span class="tcode">' + t[1] + '</span><span>' + t[2] + '</span>' + (t[3] ? '<span class="count shu">' + t[3] + '</span>' : '<span class="zero">' + ic('check', 'ic-xs') + '</span>') + '</button>'; }).join('');
    var rule = {
      t1: 'Mặc định không chặn: học viên học ngay theo kế hoạch tạm, cô duyệt hoặc sửa trong 24 giờ. Trung tâm có thể bật “phải duyệt mới được học”.',
      t2: 'Chặn: câu chưa được cô duyệt không vào ngân hàng dùng chung. Câu chỉ dùng cho riêng một người vẫn qua Kiểm chứng.',
      t3: 'Câu có từ 2 lời báo sai tự ẩn, chờ cô. Câu Kiểm chứng đánh dấu “không chắc” chưa hiện cho ai.',
      t4: 'Chặn: giáo trình của trung tâm chỉ thành nguồn cho AI sau khi cô xác nhận từng phần.'
    }[S.qtab];
    var body;
    if (S.qtab === 't1') body = D.t1.map(t1Card).join('');
    if (S.qtab === 't2') body = D.t2.map(t2Card).join('');
    if (S.qtab === 't3') body = D.t3.map(t3Card).join('');
    if (S.qtab === 't4') body = S.t4 || S.t4Drop ? '<article class="card item done">' + (S.t4 ? hanko() : '<span class="rej">' + ic('x') + '</span>') + '<div class="item-d"><p class="item-t">' + D.upload.file + '</p><p class="muted">' + (S.t4 ? 'Đã xác nhận · AI dùng làm nguồn từ ' + S.t4 : 'Đã bỏ lúc ' + S.t4Drop + ' · AI không dùng tài liệu này') + '</p></div>' + link('Xem giáo trình', 'curriculum', 'ghost sm') + '</article>'
      : '<article class="card item"><div class="item-h"><p class="item-t">' + ic('doc', 'ic-sm') + ' ' + D.upload.file + '</p><span class="pill shu">Chờ cô xác nhận</span></div><div class="item-b"><p>' + D.upload.pages + ' trang · cô tải lên ' + D.upload.at + '. Agent Đọc tài liệu gắn 4 phần vào đề cương 店舗運営, để riêng 1 phần không thuộc đề cương.</p></div><div class="item-a">' + link('Mở để xác nhận', 'curriculum', 'shu', 'next') + '</div></article>';
    var left = cnt[S.qtab]();
    var emptyT = {
      t1: ['Hết kế hoạch tạm', 'Khi có học viên mới làm xong bài chẩn đoán, kế hoạch tạm của họ sẽ hiện ở đây để cô duyệt trong 24 giờ.'],
      t2: ['Hết câu chờ duyệt', 'Câu mới do Gia sư soạn hoặc sinh từ ảnh học viên chụp sẽ hiện ở đây, kèm kết quả Kiểm chứng và trang nguồn.'],
      t3: ['Không còn câu bị báo sai', 'Khi có từ 2 học viên báo sai một câu, hoặc Kiểm chứng không chắc, câu đó hiện ở đây và tạm ẩn khỏi lớp.'],
      t4: ['Không có giáo trình chờ', 'Tài liệu cô tải lên ở trang Giáo trình sẽ hiện ở đây sau khi AI gắn xong vào đề cương.']
    }[S.qtab];
    var nextTab = tabs.filter(function (t) { return t[3]; })[0];
    return head({ eye: 'AI soạn và soát · cô quyết', h: 'Hàng chờ duyệt <span class="shu-t num">' + cnt.queue() + '</span>', lead: 'Chưa có câu hay giáo trình nào đến tay học viên nếu cô chưa duyệt. Riêng kế hoạch tạm thì học viên học được ngay, theo luật lớp.' }) +
      '<div class="tabs" role="tablist" aria-label="Loại việc">' + tb + '</div>' +
      '<p class="rule-note">' + ic('info', 'ic-xs') + '<span>' + rule + '</span></p>' +
      (left === 0 ? '<div class="card">' + empty('check', emptyT[0], emptyT[1], nextTab ? btn('Sang ' + nextTab[1] + ' · ' + nextTab[2] + ' (' + nextTab[3] + ')', 'qtab', nextTab[0], 'primary', 'next') : link('Sang tin nhắn chờ duyệt', 'messages', 'primary', 'next')) + '</div>' : '') +
      '<div class="items">' + body + '</div>';
  };

  P.messages = function () {
    var left = cnt.msgs();
    var cards = D.msgs.map(function (m) {
      var st = S.msgs[m.id];
      if (st) return '<article class="card item done">' + (st === 'sent' ? hanko('送信') : '<span class="rej">' + ic('x') + '</span>') + '<div class="item-d"><p class="item-t">' + (st === 'sent' ? 'Đã gửi ' + esc(m.to) : 'Đã bỏ tin cho ' + esc(m.to)) + ' · ' + S.atM[m.id] + '</p><p class="muted">' + (st === 'sent' ? '“' + esc(S.msgText[m.id] || m.text) + '”' : 'Trợ lý lớp không gửi gì. Học viên không biết có bản nháp này.') + '</p></div>' + btn('Hoàn tác', 'undoMsg', m.id, 'ghost sm', 'undo') + '</article>';
      return '<article class="card item"><div class="item-h"><p class="item-t">' + av(m.to) + 'Gửi ' + esc(m.to) + '</p><span class="pill">' + m.kind + '</span></div>' +
        '<div class="item-b"><p class="ai-why">' + ic('spark', 'ic-xs') + '<span><b>Vì sao Trợ lý lớp soạn:</b> ' + esc(m.why) + '</span></p>' +
        '<label class="fld"><span>Tin nhắn, cô sửa trước khi gửi</span><textarea data-msg="' + m.id + '" rows="3">' + esc(S.msgText[m.id] != null ? S.msgText[m.id] : m.text) + '</textarea></label></div>' +
        '<div class="item-a">' + btn('Gửi', 'msgSend', m.id, 'shu', 'send') + btn('Bỏ tin này', 'msgDrop', m.id, 'ghost', 'x') + '</div></article>';
    }).join('');
    return head({ eye: 'T7 · Trợ lý lớp soạn nháp lúc 06:00', h: 'Tin nhắn chờ duyệt <span class="shu-t num">' + left + '</span>', lead: 'Trợ lý lớp không bao giờ tự gửi tin thay cô. Cô sửa chữ, rồi gửi hoặc bỏ. Tin gửi đi ký tên cô Linh.' }) +
      (left ? '' : '<div class="card">' + empty('check', 'Hết tin chờ duyệt', 'Sáng mai 06:00 Trợ lý lớp sẽ soạn nháp mới nếu có học viên cần nhắc, đổi kế hoạch hay góp ý.', link('Sang câu hỏi của học viên', 'questions', 'primary', 'next')) + '</div>') +
      '<div class="items">' + cards + '</div>';
  };

  P.questions = function () {
    var left = cnt.qs();
    var cards = D.qs.map(function (q) {
      var st = S.qs[q.id];
      var who = q.id === 'hanh' ? 'Chị Hạnh' : 'Chị Vy';
      if (st) return '<article class="card item done">' + hanko('返信') + '<div class="item-d"><p class="item-t">Đã trả lời ' + esc(q.who) + ' · ' + S.atQ[q.id] + '</p><p class="muted">' + who + ' thấy “Cô Linh đã trả lời” trong app. “' + esc(S.qText[q.id]) + '”</p></div>' + btn('Hoàn tác', 'undoQ', q.id, 'ghost sm', 'undo') + '</article>';
      var ctx = q.ctx.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('');
      return '<article class="card item"><div class="item-h"><p class="item-t">' + av(q.who) + esc(q.who) + '</p><span class="muted sm">' + q.at + '</span></div>' +
        '<div class="item-b"><p class="bubble jp-ok">' + esc(q.q) + '</p>' +
        '<div class="ctx"><p class="eyebrow">' + ic('spark', 'ic-xs') + 'AI tóm tắt ngữ cảnh · không phải câu trả lời</p><ul>' + ctx + '</ul><p class="muted sm">Nguồn liên quan: ' + q.src + '</p></div>' +
        '<p class="waiting">' + ic('clock', 'ic-xs') + '<span>' + who + ' đang thấy: “Đã gửi cô Linh · chờ trả lời”.</span></p>' +
        '<label class="fld"><span>Câu trả lời của cô (AI viết sẵn câu mở đầu, cô sửa)</span><textarea data-q="' + q.id + '" rows="3">' + esc(S.qText[q.id] != null ? S.qText[q.id] : q.draft) + '</textarea></label></div>' +
        '<div class="item-a">' + btn('Gửi trả lời', 'qSend', q.id, 'shu', 'send') + ext('Xem app học viên', LEARNER + '#p=ask-teacher', 'ghost', 'phone') + '</div></article>';
    }).join('');
    return head({ eye: 'T6 · “Em muốn hỏi cô Linh”', h: 'Học viên hỏi cô <span class="shu-t num">' + left + '</span>', lead: 'Khi học viên muốn hỏi người thật, AI chuyển câu hỏi kèm tóm tắt để cô khỏi đọc lại cả buổi học. Câu hỏi visa, hợp đồng vẫn được chuyển tới đường dây chính thức.' }) +
      (left ? '' : '<div class="card">' + empty('check', 'Đã trả lời hết', 'Câu hỏi mới sẽ hiện ở đây. Học viên thấy trạng thái “chờ cô trả lời” cho tới khi cô gửi.', link('Về Hôm nay', 'today', 'primary', 'home')) + '</div>') +
      '<div class="items">' + cards + '</div>';
  };

  P.samples = function () {
    var k12 = S.samp === 'k12';
    var seg = '<div class="seg" role="group" aria-label="Chọn lớp">' + [['k12', 'K12 · 5/18 đồng ý'], ['k13', 'K13 · 0/14 đồng ý']].map(function (s) { return '<button class="seg-b' + (S.samp === s[0] ? ' on' : '') + '" aria-pressed="' + (S.samp === s[0]) + '" data-act="samp" data-arg="' + s[0] + '">' + s[1] + '</button>'; }).join('') + '</div>';
    var list = D.samples.map(function (s) {
      var r = S.rated[s.id];
      var lines = s.lines.map(function (l) { return '<li class="ln ' + l[0] + '"><span class="ln-w">' + (l[0] === 'hv' ? 'Học viên' : 'Sensei Agent') + '</span><p class="jp-ok">' + esc(l[1]) + '</p></li>'; }).join('');
      return '<article class="card item"><div class="item-h"><p class="item-t">' + s.who + ' · ' + s.topic + '</p><span class="muted sm">' + s.when + '</span></div><ul class="chat">' + lines + '</ul>' +
        '<div class="item-a">' + (r ? '<span class="ok-t">' + ic('check', 'ic-xs') + (r === 'good' ? 'Cô chấm: Đạt' : 'Cô chấm: Cần sửa · đã gửi đội Sensei Agent (không kèm tên)') + '</span>' + btn('Chấm lại', 'rate', s.id + ':', 'ghost sm', 'undo')
        : btn('Đạt', 'rate', s.id + ':good', 'shu', 'check') + btn('Cần sửa', 'rate', s.id + ':bad', 'ghost', 'flag')) + '</div></article>';
    }).join('');
    return head({ eye: 'T5 · kiểm chất lượng AI', h: 'Mẫu hội thoại', lead: 'Chỉ lấy mẫu từ học viên đã tự bật “cho giáo viên đọc mẫu hội thoại”. Tên được ẩn. Cô chấm để đội Sensei Agent sửa AI, không để đánh giá học viên.', act: seg }) +
      (k12 ? '<div class="items">' + list + '</div>'
        : '<div class="card">' + empty('eye-off', 'Chưa có mẫu nào của lớp K13', 'Chưa học viên nào của K13 bật cho giáo viên đọc mẫu hội thoại. Cô không yêu cầu bật được: chỉ học viên tự bật trong màn Quyền riêng tư của app. Khi có người bật, mẫu mới hiện ở đây, tên đã ẩn.', ext('Xem màn Quyền riêng tư của học viên', LEARNER + '#p=privacy-tiers', 'ghost', 'phone')) + '</div>');
  };

  P.curriculum = function () {
    var u = D.upload;
    var mapRows = function (rows) { return '<ul class="maplist">' + rows.map(function (m) { var no = m.conf !== 'Chắc'; return '<li class="' + (no ? 'no' : '') + '"><span class="mono">' + m.pages + '</span><span>' + m.what + '</span><span class="to jp-ok">' + ic(no ? 'x' : 'next', 'ic-xs') + m.to + '</span></li>'; }).join('') + '</ul>'; };
    var pending = S.t4 || S.t4Drop ? '<article class="card item done">' + (S.t4 ? hanko() : '<span class="rej">' + ic('x') + '</span>') + '<div class="item-d"><p class="item-t">' + u.file + '</p><p class="muted">' + (S.t4 ? 'Cô xác nhận ' + S.t4 + ' · AI dùng tr.1–21 làm nguồn, trích dẫn dạng “Hoa Anh Đào · tr.N”. Tr.22–24 không dùng.' : 'Đã bỏ lúc ' + S.t4Drop + ' · AI không dùng tài liệu này.') + '</p></div>' + btn('Hoàn tác', 'undoT4', '', 'ghost sm', 'undo') + '</article>'
      : '<article class="card item"><div class="item-h"><p class="item-t">' + ic('doc', 'ic-sm') + ' ' + u.file + ' · ' + u.pages + ' trang</p><span class="pill shu">Chờ cô xác nhận</span></div>' +
        '<div class="item-b"><p class="ai-why">' + ic('spark', 'ic-xs') + '<span><b>Agent Đọc tài liệu</b> gắn từng đoạn vào đề cương 店舗運営. Chưa xác nhận thì AI chưa dùng.</span></p>' + mapRows(u.map) + '</div>' +
        '<div class="item-a">' + btn('Xác nhận và cho AI dùng', 't4ok', '', 'shu', 'check') + btn('Bỏ tài liệu', 't4no', '', 'ghost', 'x') + '</div></article>';
    var up = S.up === 0 ? '<div class="drop">' + ic('upload', 'ic-lg') + '<p class="drop-t">Tải giáo trình của trung tâm</p><p class="muted">PDF. Word hoặc Excel thì lưu sang PDF trước. Chỉ tải tài liệu trung tâm có quyền dùng.</p>' + btn('Chọn file PDF', 'upload', '', 'primary', 'upload') + '</div>'
      : S.up === 1 ? '<div class="drop busy"><span class="spin" aria-hidden="true"></span><p class="drop-t">Đang đọc HoaAnhDao_De-thi-thu-2026.pdf · 12 trang</p><p class="muted">Agent Đọc tài liệu đang nhận loại tài liệu và gắn vào đề cương (mô phỏng).</p></div>'
      : S.upOk ? '<article class="card item done">' + hanko() + '<div class="item-d"><p class="item-t">HoaAnhDao_De-thi-thu-2026.pdf</p><p class="muted">Cô xác nhận ' + S.upOk + ' · dùng làm đề luyện, AI không chép nguyên câu vào ngân hàng chung.</p></div>' + btn('Tải file khác', 'upReset', '', 'ghost sm', 'upload') + '</article>'
      : '<article class="card item"><div class="item-h"><p class="item-t">' + ic('doc', 'ic-sm') + ' HoaAnhDao_De-thi-thu-2026.pdf · 12 trang</p><span class="pill shu">Chờ cô xác nhận</span></div><div class="item-b">' +
        mapRows([{ pages: 'tr.1–6', what: 'Đề thi thử phần 衛生管理', to: '衛生管理 · đề luyện', conf: 'Chắc' }, { pages: 'tr.7–12', what: 'Đề thi thử phần 店舗運営', to: '店舗運営 · đề luyện', conf: 'Chắc' }]) + '</div><div class="item-a">' + btn('Xác nhận và cho AI dùng', 'upOk', '', 'shu', 'check') + btn('Bỏ tài liệu', 'upReset', '', 'ghost', 'x') + '</div></article>';
    var mats = D.materials.map(function (m) { return '<li><span class="mat-i">' + ic('book', 'ic-sm') + '</span><div><p class="who-n">' + m.name + '</p><p class="muted sm">' + m.kind + ' · ' + m.note + '</p></div><span class="pill ok">' + m.status + '</span></li>'; }).join('');
    var flow = ['Cô tải PDF', 'AI đọc, gắn đề cương', 'Cô xác nhận', 'AI dùng làm nguồn, có trích trang'].map(function (s, i) { return '<li' + (i === 2 ? ' class="me"' : '') + '><span class="fl-n">' + (i + 1) + '</span>' + s + '</li>'; }).join('');
    return head({ eye: 'T4 · giáo trình riêng của trung tâm thành nguồn cho AI', h: 'Giáo trình', lead: 'Tài liệu chưa được cô xác nhận thì AI không dùng. Mỗi câu AI soạn từ đây đều trích trang, để học viên và cô kiểm lại được.' }) +
      '<ol class="flow">' + flow + '</ol>' +
      '<div class="g-cur"><div class="stack"><h2 class="h2">Chờ cô xác nhận</h2>' + pending + '</div>' +
      '<div class="stack"><h2 class="h2">Tải tài liệu mới</h2>' + up + '<section class="card"><h2 class="h2">Đang dùng làm nguồn</h2><ul class="mats">' + mats + (S.t4 ? '<li><span class="mat-i">' + ic('book', 'ic-sm') + '</span><div><p class="who-n">' + u.file + '</p><p class="muted sm">Của trung tâm · cô Linh xác nhận ' + S.t4 + '</p></div><span class="pill ok">Đang dùng</span></li>' : '') + '</ul></section></div></div>';
  };

  P.rules = function () {
    var r = S.rules;
    var hints = '<div class="seg" role="group" aria-label="Số bậc gợi ý">' + [1, 2, 3].map(function (n) { return '<button class="seg-b' + (r.hints === n ? ' on' : '') + '" aria-pressed="' + (r.hints === n) + '" data-act="hints" data-arg="' + n + '">' + n + ' bậc</button>'; }).join('') + '</div>';
    var mocks = r.mocks.map(function (m, i) { return '<li class="mock">' + ic('cal', 'ic-xs') + '<span>' + m + '</span><button class="x-b" data-act="rmMock" data-arg="' + i + '" aria-label="Bỏ ngày ' + m + '">' + ic('x', 'ic-xs') + '</button></li>'; }).join('');
    var row = function (t, d, ctrl) { return '<li class="set"><div><p class="set-t">' + t + '</p><p class="muted sm">' + d + '</p></div><div class="set-c">' + ctrl + '</div></li>'; };
    return head({ eye: 'T8 · áp dụng cho cả lớp', h: 'Luật lớp K12', lead: 'Cô đặt luật cho lớp; AI làm theo. Học viên vẫn tự chọn ngày thi của mình.', act: '<span class="pill">外食業2号 · K12 · 18 học viên</span>' }) +
      '<div class="g-rules"><section class="card"><ul class="sets">' +
      row('Số bậc gợi ý trước khi giải thích', 'Học viên xin đáp án thì nhận gợi ý từng bậc trước. 3 bậc: nhắc lại thẻ, ví dụ tương tự, loại 1 phương án.', hints) +
      row('Lịch thi thử của lớp', 'Thi thử luôn tắt AI. Kế hoạch của từng người tự chừa chỗ cho các ngày này.', '<ul class="mocks">' + (mocks || '<li class="muted sm">Chưa có ngày nào. Thêm ít nhất 1 ngày trước ngày thi.</li>') + '</ul>' + btn('Thêm ngày', 'addMock', '', 'ghost sm', 'plus')) +
      row('Cho chụp ảnh nơi làm việc', 'Ảnh được che mặt, tên ngay trên điện thoại, không lưu ảnh gốc. Nhắc học viên chỉ chụp tài liệu được phép.', sw(r.photo, 'rule', 'Cho chụp ảnh nơi làm việc', 'photo')) +
      row('Cho tải tài liệu PDF', 'Học viên tải tài liệu học để AI soạn câu luyện.', sw(r.doc, 'rule', 'Cho tải tài liệu PDF', 'doc')) +
      row('Phải duyệt kế hoạch mới được học', 'Tắt (mặc định): học viên học ngay theo kế hoạch tạm, cô duyệt trong 24 giờ. Bật: học viên chờ cô duyệt, có thể mất một buổi học.', sw(r.gate, 'rule', 'Phải duyệt kế hoạch mới được học', 'gate')) +
      row('Ngày thi mặc định của lớp', 'Gợi ý sẵn khi học viên mới vào lớp. Mỗi người vẫn tự chọn ngày của mình.', '<span class="pill">Chủ nhật 21/2/2027</span>') +
      '</ul><div class="savebar">' + (r.saved && !r.dirty ? '<p class="ok-t">' + ic('check', 'ic-xs') + 'Đã lưu ' + r.saved + ' · áp dụng cho 18 học viên từ bài tiếp theo</p>' : r.dirty ? '<p class="shu-t sm">Có thay đổi chưa lưu</p>' : '<p class="muted sm">Chưa có thay đổi</p>') +
      btn('Lưu luật lớp', 'saveRules', '', 'shu', 'check') + '</div></section>' +
      '<aside class="card soft"><h2 class="h2">Cố định, lớp không đổi được</h2><ul class="locks">' +
      '<li>' + ic('lock', 'ic-xs') + '<span>Thi thử luôn tắt AI</span></li><li>' + ic('lock', 'ic-xs') + '<span>Câu hỏi visa, hợp đồng chuyển tới đường dây chính thức</span></li>' +
      '<li>' + ic('lock', 'ic-xs') + '<span>Kiểm chứng soát mọi câu trước khi hiện</span></li><li>' + ic('lock', 'ic-xs') + '<span>Kế hoạch đổi trên 20% hoặc đổi ngày thi: học viên duyệt</span></li></ul>' +
      '<p class="muted sm">Trung tâm có thể tắt chụp ảnh, tải tài liệu cho cả trung tâm ở trang Thiết lập của quản trị.</p></aside></div>';
  };

  /* ---------------- admin ---------------- */
  P.admin = function () {
    var used = D.center.learners;
    var cls = S.classes.map(function (c) { return '<li><span class="exam-jp">' + esc(c.exam) + '</span><span class="who-n">' + esc(c.name) + '</span><span class="muted sm">' + c.teacher + '</span><span class="num">' + c.n + ' HV</span><span class="num muted sm">' + c.studiedYesterday + '/' + c.n + ' học hôm qua</span></li>'; }).join('');
    var tch = D.teachers.map(function (t) { return '<li>' + av(t.name) + '<div><p class="who-n">' + t.name + '</p><p class="muted sm">' + t.learners + ' học viên · trả lời học viên trong ~' + t.reply + '</p></div><span class="num">' + t.pending + ' việc chờ</span></li>'; }).join('');
    return head({ eye: esc(D.center.name) + ' · tháng 11/2026', h: 'Chào chị Thu', lead: '48 học viên đang học ở 3 lớp. Chị quản lý gói, chỗ, giáo viên, lớp và thương hiệu. Chị không đọc hội thoại hay lỗi của từng học viên.', act: btn('Tạo lớp K14', 'newClassGo', '', 'shu', 'plus') }) +
      '<div class="tiles">' +
      '<div class="tile"><p class="tile-l">Học viên đang học</p><p class="tile-v num">' + used + '<span>/' + S.seats + ' chỗ</span></p><div class="meter"><span style="width:' + Math.round(used / S.seats * 100) + '%"></span></div></div>' +
      '<div class="tile"><p class="tile-l">Chi phí AI tháng 11 (ước tính mẫu)</p><p class="tile-v num">$49<span> tới nay</span></p><p class="muted sm">Dự kiến ≈ $86 · ≈ $1,8/học viên</p></div>' +
      '<div class="tile"><p class="tile-l">Việc chờ giáo viên</p><p class="tile-v num">19</p><p class="muted sm">Cũ nhất 12 giờ · quá 24 giờ: 0</p></div>' +
      '<div class="tile"><p class="tile-l">Gói</p><p class="tile-v sm">' + (S.plan === 'pro' ? 'Cao cấp' : 'Tiêu chuẩn') + '</p><p class="muted sm">' + (S.planReq ? 'Đổi sang Cao cấp từ 1/12' : 'Thuê bao theo học viên/tháng') + '</p></div></div>' +
      '<div class="g-admin"><section class="card"><div class="card-h"><h2 class="h2">Lớp</h2>' + link('Quản lý lớp', 'admin-classes', 'ghost sm') + '</div><ul class="clist">' + cls + '</ul></section>' +
      '<section class="card"><div class="card-h"><h2 class="h2">Giáo viên</h2>' + link('Quản lý', 'admin-teachers', 'ghost sm') + '</div><ul class="tlist">' + tch + '</ul></section>' +
      '<section class="card soft span2"><h2 class="h2">Trung tâm quyết gì, không quyết gì</h2><div class="sees-g">' +
      '<div><p class="eyebrow">' + ic('seal', 'ic-xs') + 'Chị quyết</p><ul><li>Gói chất lượng, số chỗ học viên</li><li>Bật, tắt tính năng cho cả trung tâm</li><li>Thêm, bớt giáo viên; tạo lớp</li><li>Logo, màu trên app học viên</li></ul></div>' +
      '<div><p class="eyebrow">' + ic('lock', 'ic-xs') + 'Không thuộc quyền trung tâm</p><ul><li>Đọc hội thoại của học viên</li><li>Chọn tên model AI (đội Sensei Agent điều tiết, phải qua bộ đo)</li><li>Gửi dữ liệu học viên cho công ty, đơn vị hỗ trợ</li><li>Tắt rào chắn an toàn</li></ul></div></div></section></div>';
  };

  P['admin-teachers'] = function () {
    var rows = D.teachers.map(function (t) { return '<li class="trow">' + av(t.name) + '<div><p class="who-n">' + t.name + ' · ' + t.full + '</p><p class="muted sm">' + t.classes.map(function (c) { return c.toUpperCase(); }).join(', ') + ' · ' + t.learners + ' học viên</p></div><div class="r-c"><span class="lab-m">Việc chờ</span><span class="num">' + t.pending + ' (cũ nhất ' + t.oldest + ')</span></div><div class="r-c"><span class="lab-m">Trả lời học viên</span><span>~' + t.reply + '</span></div><span class="pill ok">' + t.status + '</span></li>'; }).join('') +
      S.invited.map(function (e) { return '<li class="trow">' + '<span class="av" aria-hidden="true">?</span><div><p class="who-n">' + esc(e) + '</p><p class="muted sm">Lời mời đã gửi ' + S.inviteAt + ' · chưa nhận</p></div><div class="r-c"></div><div class="r-c"></div><span class="pill warn">Chờ nhận</span></li>'; }).join('');
    var form = S.inviteT ? '<section class="card"><h2 class="h2">Mời giáo viên</h2><div class="form2"><label class="fld"><span>Email giáo viên</span><input id="invEmail" type="email" value="co.mai@hoaanhdao.example" autocomplete="off"></label>' +
      '<label class="fld"><span>Giao lớp</span><select id="invClass"><option>Chưa giao lớp</option><option>外食業2号 · K13</option></select></label></div>' +
      '<p class="muted sm">Giáo viên mới thấy học viên của lớp được giao, không thấy lớp khác. Thêm giáo viên không tính vào chỗ học viên.</p>' +
      '<div class="item-a">' + btn('Gửi lời mời', 'invite', '', 'shu', 'send') + btn('Huỷ', 'inviteT', '', 'ghost') + '</div></section>' : '';
    return head({ eye: 'Quản trị trung tâm', h: 'Giáo viên', lead: '2 giáo viên đang dạy. Giáo viên tự do dùng Sensei Agent như một trung tâm 1 người.', act: S.inviteT ? '' : btn('Mời giáo viên', 'inviteT', '', 'primary', 'plus') }) +
      form + '<div class="card flush"><ul class="rlist tl">' + rows + '</ul></div>';
  };

  P['admin-classes'] = function () {
    var rows = S.classes.map(function (c) { return '<li class="crow' + (c.fresh ? ' hl' : '') + '"><div><p class="who-n">' + esc(c.name) + '</p><p class="muted sm">' + c.teacher + ' · thi mặc định ' + c.examDate + '</p></div><div class="r-c"><span class="lab-m">Học viên</span><span class="num">' + c.n + '</span></div><div class="r-c"><span class="lab-m">Mã mời</span><span class="mono">' + c.code + '</span></div>' + btn('Chép link mời', 'copy', c.code, 'ghost sm', 'copy') + '</li>'; }).join('');
    var form = S.newClass ? '<section class="card"><h2 class="h2">Tạo lớp mới</h2><div class="form4">' +
      '<label class="fld"><span>Tên lớp</span><input id="ncName" value="外食業2号 · K14"></label>' +
      '<label class="fld"><span>Kỳ thi</span><select id="ncExam"><option>外食業2号</option><option>IT Passport</option></select></label>' +
      '<label class="fld"><span>Giáo viên</span><select id="ncT"><option>Cô Linh</option><option>Thầy Nam</option></select></label>' +
      '<label class="fld"><span>Ngày thi mặc định</span><input id="ncDate" value="16/5/2027"></label></div>' +
      '<p class="muted sm">Còn ' + (S.seats - 48) + ' chỗ học viên trong gói. Học viên vào lớp bằng mã mời hoặc đường link.</p>' +
      '<div class="item-a">' + btn('Tạo lớp', 'createClass', '', 'shu', 'check') + btn('Huỷ', 'newClass', '', 'ghost') + '</div></section>' : '';
    return head({ eye: 'Quản trị trung tâm', h: 'Lớp', lead: S.classes.length + ' lớp. Lớp = danh sách học viên của giáo viên, thông báo lớp và nhóm học 3–5 người tự nguyện.', act: S.newClass ? '' : btn('Tạo lớp', 'newClass', '', 'primary', 'plus') }) +
      form + '<div class="card flush"><ul class="rlist cl">' + rows + '</ul></div>';
  };

  P['admin-plan'] = function () {
    var pro = S.plan === 'pro';
    var card = function (id, name, lines, curr, foot) {
      return '<article class="card plan' + (curr ? ' curr' : '') + '"><div class="card-h"><h2 class="h2">' + name + '</h2>' + (curr ? '<span class="pill ok">Đang dùng</span>' : '') + '</div><ul class="ticks">' + lines.map(function (l) { return '<li>' + ic(l[0] ? 'check' : 'info', 'ic-xs') + '<span>' + l[1] + '</span></li>'; }).join('') + '</ul><p class="price">Đơn giá / học viên / tháng: <b>chưa chốt</b><span class="muted sm"> · đang nghiên cứu thị trường</span></p>' + (foot ? '<div class="planbar">' + foot + '</div>' : '') + '</article>';
    };
    var req = S.planReq ? '<p class="ok-t">' + ic('check', 'ic-xs') + 'Đã gửi yêu cầu ' + S.planReq + ' · gói Cao cấp áp dụng từ 1/12/2026. Giáo viên, học viên không phải làm gì.</p>' + btn('Huỷ yêu cầu', 'planUndo', '', 'ghost sm', 'undo')
      : S.planAsk ? '<p class="shu-t sm">Đổi sang Cao cấp từ 1/12/2026 cho cả 48 học viên?</p>' + btn('Xác nhận đổi gói', 'planOk', '', 'shu', 'check') + btn('Huỷ', 'planAsk', '', 'ghost')
      : btn('Chuyển sang Cao cấp', 'planAsk', '', 'shu', 'swap');
    var usage = [['Phút học của học viên', '5.412'], ['Bài học 10 phút', '1.296'], ['Câu Kiểm chứng đã soát', '2.140'], ['Trang tài liệu AI đã đọc', '318']].map(function (u) { return '<li><span>' + u[0] + '</span><b class="num">' + u[1] + '</b></li>'; }).join('');
    return head({ eye: 'Quản trị trung tâm · thuê bao theo học viên đang học, không phí ban đầu', h: 'Gói và chi phí', lead: 'Trung tâm chọn mức chất lượng, không chọn tên model. Đội Sensei Agent chọn model cho từng gói sau khi model qua bộ đo chất lượng.' }) +
      '<div class="g-plan">' +
      card('std', 'Tiêu chuẩn', [[1, 'Gia sư và Trợ lý lớp dùng model tiêu chuẩn'], [1, 'Đủ cho bài 10 phút, gợi ý từng bậc, nhắc học'], [1, 'Kiểm chứng dùng model mạnh']], !pro) +
      card('pro', 'Cao cấp', [[1, 'Gia sư và Trợ lý lớp dùng model mạnh hơn'], [1, 'Giải thích sâu hơn ở trình độ tiếng Nhật thấp; tin nhắn nháp tự nhiên hơn'], [1, 'Kiểm chứng dùng model mạnh']], pro, pro ? '' : req) +
      '</div>' +
      '<p class="floor">' + ic('shield', 'ic-sm') + '<span><b>Kiểm chứng luôn dùng model mạnh ở mọi gói.</b> Sàn chất lượng không hạ theo giá: câu hỏi và lời giải được soát như nhau ở cả hai gói.</span></p>' +
      '<div class="g-admin">' +
      '<section class="card"><div class="card-h"><h2 class="h2">Chỗ học viên</h2>' + btn('Thêm 10 chỗ', 'seats', '', 'ghost sm', 'plus') + '</div><p class="big-n num">48<span>/' + S.seats + '</span></p><div class="meter"><span style="width:' + Math.round(48 / S.seats * 100) + '%"></span></div><p class="muted sm">Chỉ tính học viên đang học trong tháng. Học viên nghỉ không tính.' + (S.seats > 60 ? ' <b class="ok-c">Đã thêm chỗ, áp dụng ngay.</b>' : '') + '</p></section>' +
      '<section class="card"><h2 class="h2">Sử dụng tháng 11 (tới 17/11, mẫu)</h2><ul class="usage">' + usage + '</ul><p class="muted sm">Chi phí AI ước tính ≈ $1,8/học viên/tháng, đã gồm trong thuê bao.</p></section>' +
      '<section class="card span2 invoice"><div class="card-h"><h2 class="h2">Hoá đơn mẫu · tháng 11/2026</h2><span class="pill">Mẫu · số tiền để trống</span></div>' +
      '<table><thead><tr><th>Khoản</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>' +
      '<tr><td>Thuê bao gói ' + (pro ? 'Cao cấp' : 'Tiêu chuẩn') + '</td><td class="num">48 học viên đang học</td><td>chưa chốt</td><td>—</td></tr>' +
      '<tr><td>Phí ban đầu</td><td class="num">—</td><td>0</td><td class="num">0</td></tr>' +
      '<tr><td>Chi phí AI</td><td class="num">—</td><td>đã gồm trong thuê bao</td><td class="num">0</td></tr></tbody></table>' +
      '<p class="muted sm">Giá theo học viên đang học/tháng đang chờ nghiên cứu thị trường (học phí, chi phí giáo viên của các trung tâm). Prototype không đưa ra con số.</p></section></div>';
  };

  P['admin-settings'] = function () {
    var s = S.set;
    var row = function (k, t, d) { return '<li class="set"><div><p class="set-t">' + t + '</p><p class="muted sm">' + d + '</p></div><div class="set-c">' + sw(s[k], 'set', t, k) + '</div></li>'; };
    return head({ eye: 'Quản trị trung tâm · áp dụng cho mọi lớp', h: 'Thiết lập', lead: 'Tắt ở đây thì mọi lớp đều tắt. Giáo viên chỉnh tiếp trong phạm vi chị cho phép ở Luật lớp.' }) +
      '<div class="g-rules"><section class="card"><ul class="sets">' +
      row('photo', 'Chụp ảnh nơi làm việc', 'Che mặt, tên trên điện thoại; không lưu ảnh gốc. Tắt nếu công ty của học viên không cho chụp.') +
      row('doc', 'Tải tài liệu PDF', 'Học viên và giáo viên tải PDF để AI soạn câu luyện.') +
      row('groups', 'Nhóm học tự nguyện 3–5 người', 'Không có bảng xếp hạng công khai.') +
      row('samples', 'Giáo viên đọc mẫu hội thoại', 'Vẫn chỉ với học viên đã tự đồng ý; tên được ẩn.') +
      row('gate', 'Cho lớp bật “phải duyệt kế hoạch mới được học”', 'Nếu tắt, mọi lớp dùng mặc định: học ngay theo kế hoạch tạm.') +
      row('notify', 'Nhắc học qua thông báo app', 'Chỉ trong khung giờ học viên tự chọn.') +
      '</ul><div class="savebar">' + (S.setSaved && !S.setDirty ? '<p class="ok-t">' + ic('check', 'ic-xs') + 'Đã lưu ' + S.setSaved + ' · áp dụng cho 3 lớp, 48 học viên</p>' : S.setDirty ? '<p class="shu-t sm">Có thay đổi chưa lưu</p>' : '<p class="muted sm">Chưa có thay đổi</p>') + btn('Lưu thiết lập', 'saveSet', '', 'shu', 'check') + '</div></section>' +
      '<aside class="card soft"><h2 class="h2">Luôn bật, trung tâm không tắt được</h2><ul class="locks">' +
      ['Thi thử tắt AI', 'Rào chắn visa, pháp lý: chuyển tới đường dây chính thức', 'Che dữ liệu cá nhân trên điện thoại', 'Kiểm chứng soát mọi câu trước khi hiện', 'Học viên tự quyết chia sẻ số nào cho đơn vị hỗ trợ'].map(function (x) { return '<li>' + ic('lock', 'ic-xs') + '<span>' + x + '</span></li>'; }).join('') + '</ul></aside></div>';
  };

  var lum = function (hex) { var c = hex.replace('#', ''); var v = [0, 2, 4].map(function (i) { var x = parseInt(c.substr(i, 2), 16) / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  var LOGOS = {
    sakura: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="2" y="2" width="36" height="36" rx="10" fill="#F7DCE4"/><text x="20" y="28.5" text-anchor="middle" font-size="23" font-weight="900" fill="#9C2F52" font-family="Noto Serif JP, serif">桜</text></svg>',
    letter: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="3" y="3" width="34" height="34" rx="9" fill="none" stroke="currentColor" stroke-width="2.6"/><text x="20" y="26.5" text-anchor="middle" font-size="15" font-weight="800" fill="currentColor" font-family="Be Vietnam Pro, sans-serif">HAĐ</text></svg>',
    none: ''
  };
  P['admin-brand'] = function () {
    var b = S.brand;
    var dark = lum(b.color) < 0.35;
    var sws = [['#1F3A68', '藍 Chàm · gốc'], ['#2E6B4F', '若竹 Xanh trúc'], ['#4B3A78', '紫 Tím'], ['#9C3D5A', '桜 Hồng đậm'], ['#E8C872', 'Vàng nhạt']].map(function (c) { return '<button class="swatch' + (b.color === c[0] ? ' on' : '') + '" style="--c:' + c[0] + '" data-act="bcolor" data-arg="' + c[0] + '" aria-pressed="' + (b.color === c[0]) + '" aria-label="' + c[1] + '"><span></span><em>' + c[1] + '</em></button>'; }).join('');
    var logos = [['sakura', '桜 Hoa Anh Đào'], ['letter', 'Chữ HAĐ'], ['none', 'Không logo']].map(function (l) { return '<button class="logo-o' + (b.logo === l[0] ? ' on' : '') + '" data-act="blogo" data-arg="' + l[0] + '" aria-pressed="' + (b.logo === l[0]) + '"><span class="logo-pv">' + (LOGOS[l[0]] || ic('x')) + '</span>' + l[1] + '</button>'; }).join('');
    var preview = '<div class="pv" style="--pv-c:' + b.color + ';--pv-on:' + (dark ? '#fff' : '#141D30') + '"><div class="pv-phone"><div class="pv-top"><span class="pv-logo">' + LOGOS[b.logo] + '</span><div><p class="pv-name">' + esc(b.name || 'Tên trung tâm') + '</p><p class="pv-sub">chạy bằng Sensei Agent</p></div></div>' +
      '<div class="pv-body"><p class="pv-eye">Hôm nay · Thứ Ba 17/11</p><p class="pv-h">19 phút, chia theo ca</p><div class="pv-row"><span></span><span></span></div><div class="pv-row s"><span></span><span></span></div>' +
      '<div class="pv-gate"><span class="pv-seal">承認</span><span>Kế hoạch tuần · chị duyệt</span></div><span class="pv-btn">Bắt đầu 4 phút ôn thẻ</span></div></div>' +
      '<p class="muted sm">Xem trước đầu app học viên. Màu son cho chỗ học viên tự quyết giữ nguyên ở mọi trung tâm, để học viên luôn nhận ra.</p></div>';
    return head({ eye: 'Quản trị trung tâm · app học viên mang tên trung tâm', h: 'Thương hiệu', lead: 'Logo và màu của trung tâm hiện trên app học viên. Khung app mẫu đổi ngay khi chị chọn.' }) +
      '<div class="g-brand"><section class="card"><label class="fld"><span>Tên hiện trên app</span><input id="bName" value="' + esc(b.name) + '" maxlength="28"></label>' +
      '<p class="fld-l">Logo</p><div class="logos">' + logos + '</div>' +
      '<p class="fld-l">Màu chính</p><div class="swatches">' + sws + '</div>' +
      (dark ? '' : '<p class="rule-note warn">' + ic('alert', 'ic-xs') + '<span>Màu này nhạt: chữ trắng khó đọc, nên Sensei Agent tự đổi sang chữ tối trên đầu app.</span></p>') +
      '<div class="savebar">' + (S.brandSaved ? '<p class="ok-t">' + ic('check', 'ic-xs') + 'Đã áp dụng ' + S.brandSaved + ' · học viên thấy ở lần mở app tới</p>' : '<p class="muted sm">Chưa áp dụng</p>') + btn('Áp dụng cho app học viên', 'saveBrand', '', 'shu', 'check') + '</div></section>' +
      '<section class="card soft center">' + preview + '</section></div>';
  };

  /* ---------------- actions ---------------- */
  var toastT;
  function toast(t) { var el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('show'); }, 3200); }
  S.at2 = {}; S.at3 = {}; S.atM = {}; S.atQ = {};
  var ACT = {
    menu: function () { S.menu = !S.menu; chrome(); if (S.menu) { var f = $('#side .nav-i.on') || $('#side a'); if (f) f.focus(); } },
    goQueue: function (a) { var x = a.split(':'); if (x[1]) S.qtab = x[1]; go(x[0]); },
    filter: function (a) { S.filter = a; },
    copy: function (a) { try { navigator.clipboard && navigator.clipboard.writeText('https://senpai.example/join/' + a).catch(function () {}); } catch (e) { /* file:// may block */ } toast('Đã chép link mời lớp: senpai.example/join/' + a + ' (mẫu)'); },
    qtab: function (a) { S.qtab = a; },
    t1ok: function (a) { S.t1[a] = 'ok'; S.t1At = tick(); S.t1Edit = null; if (a === 'hanh') S.t1Chg = ''; toast('Đã duyệt kế hoạch. Học viên thấy dấu duyệt của cô trong app.'); },
    t1edit: function (a) { S.t1Edit = a; S.qtab = 't1'; if (cur() !== 'queue') go('queue'); },
    t1cancel: function () { S.t1Edit = null; },
    t1save: function (a) {
      var d = Math.round((4 * S.t1Min + 62 - 138) / 138 * 100);
      S.t1[a] = 'edited'; S.t1At = tick(); S.t1Edit = null;
      S.t1Chg = a === 'hanh' ? (Math.abs(d) > 20 ? 'đổi ' + d + '% · chị Hạnh được hỏi duyệt lại (Chốt A)' : S.t1Min + ' phút ngày thường, ' + (d > 0 ? '+' : '') + d + '% · áp dụng ngay') : '';
      toast(Math.abs(d) > 20 ? 'Đã lưu. Thay đổi trên 20% nên học viên sẽ được hỏi duyệt lại.' : 'Đã sửa và duyệt kế hoạch.');
    },
    undoT1: function (a) { delete S.t1[a]; },
    t2ok: function (a) { S.t2[a] = 'ok'; S.at2[a] = tick(); toast('Đã duyệt vào ngân hàng chung.'); },
    t2no: function (a) { S.t2[a] = 'no'; S.at2[a] = tick(); toast('Đã loại câu. Câu không vào ngân hàng chung.'); },
    undoT2: function (a) { delete S.t2[a]; },
    t3: function (a) { var x = a.split(':'); S.t3[x[0]] = x[1]; S.at3[x[0]] = tick(); toast({ keep: 'Đã giữ câu và trả lời người báo sai.', drop: 'Đã gỡ câu khỏi lớp.', fix: 'Đã gửi Gia sư soạn lại; câu mới sẽ về mục T2.' }[x[1]]); },
    undoT3: function (a) { delete S.t3[a]; },
    t4ok: function () { S.t4 = tick() + ' 17/11'; toast('Đã xác nhận. AI dùng giáo trình này làm nguồn từ bây giờ.'); },
    t4no: function () { S.t4Drop = tick(); toast('Đã bỏ tài liệu. AI không dùng tài liệu này.'); },
    undoT4: function () { S.t4 = null; S.t4Drop = null; },
    upload: function () { S.up = 1; setTimeout(function () { if (S.up === 1) { S.up = 2; if (cur() === 'curriculum') render(); } }, 1400); },
    upOk: function () { S.upOk = tick() + ' 17/11'; toast('Đã xác nhận đề thi thử của trung tâm.'); },
    upReset: function () { S.up = 0; S.upOk = null; },
    msgSend: function (a) { var ta = $('[data-msg="' + a + '"]'); if (ta) S.msgText[a] = ta.value; S.msgs[a] = 'sent'; S.atM[a] = tick(); toast('Đã gửi. Học viên thấy tin trong app, ký tên cô Linh.'); },
    msgDrop: function (a) { S.msgs[a] = 'drop'; S.atM[a] = tick(); toast('Đã bỏ tin. Không có gì được gửi.'); },
    undoMsg: function (a) { delete S.msgs[a]; },
    qSend: function (a) { var ta = $('[data-q="' + a + '"]'); var q = D.qs.filter(function (x) { return x.id === a; })[0]; S.qText[a] = ta ? ta.value : q.draft; S.qs[a] = 'sent'; S.atQ[a] = tick(); toast('Đã gửi trả lời.'); },
    undoQ: function (a) { delete S.qs[a]; },
    samp: function (a) { S.samp = a; },
    rate: function (a) { var x = a.split(':'); if (x[1]) S.rated[x[0]] = x[1]; else delete S.rated[x[0]]; if (x[1]) toast(x[1] === 'good' ? 'Đã ghi: Đạt.' : 'Đã gửi đội Sensei Agent để sửa AI (không kèm tên).'); },
    hints: function (a) { S.rules.hints = +a; S.rules.dirty = true; },
    rule: function (a) { S.rules[a] = !S.rules[a]; S.rules.dirty = true; },
    addMock: function () { var opts = ['14/2/2027', '7/2/2027', '24/1/2027', '17/1/2027']; var n = opts.filter(function (d) { return S.rules.mocks.indexOf(d) < 0; })[0]; if (n) { S.rules.mocks.push(n); S.rules.dirty = true; toast('Đã thêm ngày thi thử ' + n + '. Nhớ lưu.'); } else toast('Đã đủ 4 ngày thi thử gợi ý.'); },
    rmMock: function (a) { S.rules.mocks.splice(+a, 1); S.rules.dirty = true; },
    saveRules: function () { if (!S.rules.dirty) { toast('Chưa có gì thay đổi để lưu.'); return; } S.rules.saved = tick(); S.rules.dirty = false; toast('Đã lưu luật lớp K12.'); },
    newClassGo: function () { S.newClass = true; go('admin-classes'); },
    newClass: function () { S.newClass = !S.newClass; },
    createClass: function () {
      var v = function (id) { var e = $('#' + id); return e ? e.value : ''; };
      S.classes.push({ id: 'k14', name: v('ncName') || '外食業2号 · K14', exam: v('ncExam') || '外食業2号', teacher: v('ncT') || 'Cô Linh', n: 0, examDate: v('ncDate') || '16/5/2027', studiedYesterday: 0, code: 'HAD-K14-7Q2', fresh: true });
      S.newClass = false; toast('Đã tạo lớp. Gửi mã mời HAD-K14-7Q2 cho học viên.');
    },
    inviteT: function () { S.inviteT = !S.inviteT; },
    invite: function () { var e = $('#invEmail'); S.invited.push(e && e.value ? e.value : 'giao.vien@example'); S.inviteAt = tick(); S.inviteT = false; toast('Đã gửi lời mời (mẫu, không gửi email thật).'); },
    planAsk: function () { S.planAsk = !S.planAsk; },
    planOk: function () { S.planReq = tick() + ' 17/11'; S.planAsk = false; toast('Đã gửi yêu cầu đổi gói từ 1/12.'); },
    planUndo: function () { S.planReq = null; },
    seats: function () { S.seats += 10; toast('Đã thêm 10 chỗ: ' + S.seats + ' chỗ.'); },
    set: function (a) { S.set[a] = !S.set[a]; S.setDirty = true; },
    saveSet: function () { if (!S.setDirty) { toast('Chưa có gì thay đổi để lưu.'); return; } S.setSaved = tick(); S.setDirty = false; toast('Đã lưu thiết lập cho cả trung tâm.'); },
    bcolor: function (a) { S.brand.color = a; S.brandSaved = null; },
    blogo: function (a) { S.brand.logo = a; S.brandSaved = null; },
    saveBrand: function () { S.brandSaved = tick(); toast('Đã áp dụng thương hiệu cho app học viên (mẫu).'); }
  };

  /* ---------------- render ---------------- */
  function chrome() {
    var p = cur(), role = R[p].role;
    document.body.classList.toggle('menu-open', !!S.menu);
    $('#scrim').hidden = !S.menu;
    if (!role) return;
    $('#side').innerHTML = sideHTML(role, p);
    $('#top').innerHTML = topHTML(role, p);
    $('#bnav').innerHTML = bnavHTML(role, p);
  }
  var lastP = null;
  function render(focus) {
    var p = cur(), role = R[p].role;
    document.body.dataset.role = role || 'none';
    document.body.dataset.page = p;
    document.title = R[p].title + ' · Sensei Agent ' + (role === A ? 'quản trị trung tâm' : role === T ? 'giáo viên' : '') + ' (prototype)';
    var y = window.scrollY;
    chrome();
    $('#view').innerHTML = '<div class="page">' + P[p]() + '</div>';
    if (p !== lastP || focus) { window.scrollTo(0, 0); var h = $('#view .h1'); if (h && lastP !== null) h.focus({ preventScroll: true }); }
    else window.scrollTo(0, y);
    lastP = p;
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (el) { e.preventDefault(); var fn = ACT[el.dataset.act]; if (fn) { fn(el.dataset.arg || ''); if (el.dataset.act !== 'menu') render(); } return; }
    if (e.target.closest('#scrim')) { S.menu = false; chrome(); return; }
    if (S.menu && e.target.closest('#side a')) { S.menu = false; }
  });
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'search') { S.search = t.value; var pos = t.selectionStart; render(); var s = $('#search'); s.focus(); s.setSelectionRange(pos, pos); }
    if (t.dataset.msg) S.msgText[t.dataset.msg] = t.value;
    if (t.dataset.q) S.qText[t.dataset.q] = t.value;
    if (t.id === 't1Note') S.t1Note = t.value;
    if (t.id === 'bName') { S.brand.name = t.value; S.brandSaved = null; var n = $('.pv-name'); if (n) n.textContent = t.value || 'Tên trung tâm'; }
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 't1Min') { S.t1Min = +t.value; render(); }
    if (t.id === 't1First') { S.t1First = t.value; }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.menu) { S.menu = false; chrome(); } });
  window.addEventListener('hashchange', function () { S.menu = false; render(); });

  window.T_DEBUG = { acts: Object.keys(ACT), routes: Object.keys(R), state: function () { return S; } };
  render();
})();
