/* Sensei Agent clickable design prototype. Sample data only: no AI, no backend, nothing leaves the page. */
(function () {
  'use strict';

  const D = window.SENPAI_DATA;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
  /* {漢字|かな} → ruby, **x** → strong. Everything else is escaped. */
  const jp = (s) => esc(s)
    .replace(/\{([^|}]+)\|?([^}]*)\}/g, (m, base, rt) => (rt ? `<ruby>${base}<rt>${rt}</rt></ruby>` : base))
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  const ic = (name, cls) => `<svg class="ic ${cls || ''}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;
  const LET = ['A', 'B', 'C', 'D'];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- dates ---------- */
  const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const WDL = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const day = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const dm = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
  const dmy = (d) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  const daysBetween = (a, b) => Math.round((b - a) / 86400000);
  const ONB_DAY = day('2026-11-15');
  const TODAY = day('2026-11-17');
  const REPLAN_DAY = day('2026-11-22');
  const hm = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
  const sumMin = (w) => w.days.reduce((t, d) => t + d.study.reduce((a, s) => a + s[1], 0), 0);
  const dayMin = (d) => d.study.reduce((a, s) => a + s[1], 0);

  /* ---------- state ---------- */
  const freshLesson = () => ({ mode: 'lesson', phase: 'cards', card: 0, q: 0, st: {}, reviewQ: 0 });
  const freshCap = (kind) => ({ kind: kind || 'photo', stage: 'poster', step: 0, masks: {}, q: 0, st: {} });
  /* Real exam pace: 55 questions in 70 minutes, about 76 s each. The short mock keeps that pace. */
  const PACE = (70 * 60) / 55;
  const freshMock = (len) => ({ started: false, len: len || 10, q: 0, ans: {}, submitted: false, left: Math.round((len || 10) * PACE) });
  /* Quick review: f = which list (wrong | new | red | yellow | green), list = lesson question indexes, i = position. */
  const freshQuick = () => ({ f: null, list: [], i: 0, st: {} });
  const ROUND = 5;
  const freshTq = (from) => ({ from: from || 'lesson', stage: 'draft', include: { q: true, tried: true, weak: true }, text: 'Em chưa hiểu vì sao 60℃ không đủ để diệt khuẩn ạ.' });
  const fresh = () => ({
    screen: 'onb', stack: [],
    exam: 'gaishoku', examDate: D.klass.examDate,
    onb: { step: 0, adult: false, photo: 'none' },
    diag: { i: -1, ans: [] }, diagDone: false,
    /* planApproved: chị Hạnh started the plan. teacherPlan: cô Linh's first-plan review (T1), never blocks learning. */
    planApproved: false, planTab: 'week', teacherPlan: 'pending',
    tq: freshTq(), classSeen: false, group: 'none',
    privTab: 'mai', chatConsent: false, capShared: false,
    done: { cards: false, lesson: false, capture: false, review: false },
    cards: { i: 0, flipped: false, known: 0 },
    lesson: freshLesson(),
    cap: freshCap(),
    chat: [],
    re: { stage: 'notice', approved: false, kept: false },
    mock: freshMock(),
    /* hist: lesson question index → 'right' (first try, no hint) or 'wrong'. marks: index → red | yellow | green. Both stay on the phone. */
    hist: {}, marks: {}, quick: freshQuick(),
    consent: { minutes: false, streak: false, syllabus: false, mock: false },
    ledger: [], mentorSnap: null, mentorAt: null,
    reports: [],
    logOpen: false,
    sheet: null
  });
  let S = fresh();
  let enterAnim = true;

  /* ---------- shared bits ---------- */
  const exam = () => D.exams[S.exam];
  const area = (examId, id) => D.exams[examId].areas.find((a) => a.id === id);
  const prio = (a) => Math.round(a.pts * Math.max(0, 0.8 - a.p) * 10) / 10;
  const weeksLeft = (from) => Math.floor(daysBetween(from || ONB_DAY, day(S.examDate)) / 7);
  const srcHref = (src) => encodeURI(D.sources[src.k].url) + (src.pdf ? `#page=${src.pdf}` : '');
  const srcLink = (src, lead) => {
    const s = D.sources[src.k];
    return `<a class="src" href="${esc(srcHref(src))}" target="_blank" rel="noopener">${ic('book')}<span>${lead || 'Nguồn'}: ${esc(s.label)}${src.page ? ` · tr.${src.page}` : ''}</span>${ic('ext', 'ic-xs')}</a>`;
  };
  const areaTag = (examId, id) => { const a = area(examId, id); return `<span class="tag">${jp(a.ja)}<span class="tag-vn">${esc(a.vn)}</span></span>`; };
  /* Shared questions carry the teacher's approval (T2); `extra` replaces the badge for non-shared items. */
  const teamLabel = (extra) => `<p class="team">${ic('pen', 'ic-xs')}<span>Câu do đội soạn · qua Kiểm chứng${extra || ''}</span>${extra ? '' : `<span class="okby">${ic('check', 'ic-xs')}Cô Linh đã duyệt</span>`}</p>`;
  const gateHead = (letter, eyebrow, title, id) => `<div class="gate-head"><span class="gate-mark" aria-hidden="true">${ic('gate')}<b>${letter}</b></span><div><p class="eyebrow shu">${eyebrow}</p><h2 class="h2" id="${id}">${title}</h2></div></div>`;
  const stamp = (when, who) => `<div class="stamp-wrap"><div class="stamp" aria-hidden="true"><span>承認</span></div><p class="stamp-note">${ic('check', 'ic-sm')}<span>${who || 'Chị đã duyệt'} · ${esc(when)}</span></p></div>`;
  /* Links out to the other surfaces always open a new tab, so the learner app keeps its place. */
  const TEACHER = '../teacher/index.html#p=';
  const extLink = (href, label, cls) => `<a class="${cls || 'xlink'}" href="${esc(href)}" target="_blank" rel="noopener">${label}${ic('ext', 'ic-xs')}</a>`;
  const teacherAv = () => '<span class="av av-teach" aria-hidden="true">L</span>';
  const progressBar = (done, total, label) => `<div class="pbar" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><span style="width:${Math.round((done / total) * 100)}%"></span></div>`;
  const segs = (n, cur, doneUpTo) => `<div class="segs" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<span class="${i < doneUpTo ? 'on' : ''} ${i === cur ? 'cur' : ''}"></span>`).join('')}</div>`;
  const empty = (icon, title, body, action) => `<div class="empty">${ic(icon, 'ic-lg')}<p class="empty-t">${title}</p><p class="empty-b">${body}</p>${action || ''}</div>`;

  /* ---------- the day of chị Hạnh ---------- */
  const SLOTS = [
    { k: 'cards', t: '09:50', where: 'Trên tàu', icon: 'train', title: 'Ôn 6 thẻ đến hạn', min: 4, go: 'cards', why: 'Ôn giãn cách: 6 thẻ đến hạn hôm nay' },
    { shift: 'Ca trưa', t: '10:30–14:30' },
    { k: 'lesson', t: '15:00', where: 'Giờ nghỉ', icon: 'cup', title: 'Bài 10 phút: HACCP + 2 vòng 5 câu', min: 10, go: 'lesson', why: '衛生管理 đang ưu tiên 1' },
    { k: 'capture', t: '16:20', where: 'Trước ca', icon: 'camera', title: 'Chụp là học', min: 2, go: 'capture', why: 'Học từ poster ở chỗ làm' },
    { shift: 'Ca tối', t: '17:00–22:30' },
    { k: 'review', t: '23:00', where: 'Sau ca', icon: 'moon', title: 'Ôn lại 1 câu chưa chắc', min: 3, go: 'review', why: 'Gợi ý từng bậc, không đưa đáp án ngay' }
  ];
  const nextSlot = () => SLOTS.find((s) => s.k && !S.done[s.k]);
  const minutesDone = () => SLOTS.filter((s) => s.k && S.done[s.k]).reduce((a, s) => a + s.min, 0);

  /* ---------- scene clock ---------- */
  function clock() {
    const s = S.screen;
    const n = nextSlot();
    const table = {
      onb: [ONB_DAY, '21:30'], diag: [ONB_DAY, '21:36'], map: [ONB_DAY, '21:51'],
      plan: S.re.approved ? [REPLAN_DAY, '20:06'] : (S.planApproved && S.teacherPlan === 'approved') ? [day('2026-11-16'), '08:40'] : [ONB_DAY, '21:53'],
      askTeacher: S.tq.stage === 'replied' ? [day('2026-11-18'), '08:52'] : [TODAY, '23:12'],
      class: [TODAY, '23:20'],
      today: [TODAY, n ? n.t : '23:05'], cards: [TODAY, '09:50'],
      lesson: [TODAY, S.lesson.mode === 'review' ? '23:00' : '15:00'],
      capture: [TODAY, '16:20'], ask: [TODAY, '23:10'],
      replan: [REPLAN_DAY, '20:00'], privacy: [REPLAN_DAY, '21:00'], mentor: [day('2026-11-23'), '09:00'],
      mock: [day('2026-11-19'), '10:00'], quick: [TODAY, n ? n.t : '23:05'], pass: [TODAY, n ? n.t : '23:05'], eval: [REPLAN_DAY, '21:10'], review: [day('2026-11-23'), '10:00'], me: [REPLAN_DAY, '21:00']
    };
    const [d, t] = table[s] || [TODAY, '12:00'];
    return { d, t, label: `${WD[d.getDay()]} ${dm(d)}` };
  }

  /* ---------- tap a word: built-in word list, free, no AI ---------- */
  const GLOSS_KEYS = Object.keys(D.glossary).sort((a, b) => b.length - a.length);
  const wordBtn = (key, inner) => `<button class="w" data-act="word" data-arg="${esc(key)}" lang="ja">${inner}</button>`;
  /* Plain Japanese (mock stems): each known word becomes a button, longest match first. */
  function tapJa(s) {
    let out = ''; let plain = ''; let i = 0;
    while (i < s.length) {
      const k = GLOSS_KEYS.find((g) => s.startsWith(g, i));
      if (k) { out += esc(plain) + wordBtn(k, esc(k)); plain = ''; i += k.length; } else { plain += s[i]; i++; }
    }
    return out + esc(plain);
  }
  /* Like jp(), but a {漢字|かな} term that is in the word list becomes a button. */
  const jpTap = (s) => esc(s)
    .replace(/\{([^|}]+)\|?([^}]*)\}/g, (m, base, rt) => { const r = rt ? `<ruby>${base}<rt>${rt}</rt></ruby>` : base; return D.glossary[base] ? wordBtn(base, r) : r; })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  /* ---------- stars, results, peers, marks ---------- */
  const STAR = '<path d="M12 2.6l2.85 5.95 6.5.8-4.78 4.5 1.22 6.45L12 17.1l-5.79 3.2 1.22-6.45L2.65 9.35l6.5-.8z"/>';
  const stars = (n, cls) => `<span class="stars ${cls || ''}" role="img" aria-label="${n}/3 sao">${[0, 1, 2].map((i) => `<svg viewBox="0 0 24 24" class="${i < n ? 'on' : ''}" style="--d:${(0.15 + i * 0.14).toFixed(2)}s" aria-hidden="true">${STAR}</svg>`).join('')}</span>`;
  /* Stars for a syllabus item = questions right on the first try, no hint, out of 10. */
  const starsFor = (first) => (first >= 9 ? 3 : first >= 7 ? 2 : first >= 4 ? 1 : 0);
  /* ok = right first try with no hint; help = right after a hint or a wrong try; miss = answer shown; '' = not done */
  function qResult(q, st) {
    if (!st || !(st.tries.includes(q.a) || st.reveal)) return '';
    if (st.tries[0] === q.a && st.hint === 0) return 'ok';
    return st.tries.includes(q.a) ? 'help' : 'miss';
  }
  const peerLine = (p) => (p == null ? '' : `<p class="peer">${ic('users', 'ic-xs')}<span><b>${p}%</b> người học khác làm đúng ngay lần đầu · ước tính, số mẫu</span></p>`);
  const MARKS = [['red', 'Chưa hiểu'], ['yellow', 'Chưa chắc'], ['green', 'Đã chắc']];
  const markRow = (qi) => `<div class="marks" role="group" aria-label="Đánh dấu câu này để ôn sau"><p class="marks-l">Đánh dấu để ôn sau</p>${MARKS.map((m) => `<button class="mk mk-${m[0]} ${S.marks[qi] === m[0] ? 'on' : ''}" aria-pressed="${S.marks[qi] === m[0]}" data-act="mark" data-arg="${qi}:${m[0]}"><i aria-hidden="true"></i>${m[1]}</button>`).join('')}</div>`;
  /* Which lesson question a question block is showing (null for capture questions, which are not in the bank). */
  const ctxIdx = (ctx) => {
    if (ctx === 'drill') return S.quick.list[S.quick.i];
    if (ctx === 'lesson') return S.lesson.mode === 'review' ? S.lesson.reviewQ : S.lesson.q;
    return null;
  };

  /* ---------- question block (lesson, capture, quick review) ---------- */
  function qState(bucket, i) {
    if (!bucket[i]) bucket[i] = { tries: [], hint: 0, asked: false, reveal: false, level: 1, reported: false, thread: [] };
    return bucket[i];
  }
  const isDone = (q, st) => st.tries.includes(q.a) || st.reveal;

  function qBlock(ctx, q, st, idx, total, examId) {
    const done = isDone(q, st);
    const attempted = st.tries.length > 0;
    const right = st.tries.includes(q.a);
    const opts = q.opts.map((o, i) => {
      const tried = st.tries.includes(i);
      const isRight = i === q.a;
      const elim = st.hint >= 3 && q.elim === i && !tried;
      let cls = 'opt';
      let state = '';
      if (tried && !isRight) { cls += ' is-wrong'; state = `${ic('x', 'ic-sm')}Chưa đúng`; }
      if (isRight && (tried || st.reveal)) { cls += ' is-right'; state = `${ic('check', 'ic-sm')}${tried ? 'Đúng' : 'Đáp án đúng'}`; }
      if (elim) { cls += ' is-elim'; state = 'Đã loại'; }
      const dis = done || tried || elim;
      const why = elim ? 'Đã loại nhờ gợi ý bậc 3' : tried ? 'Chị đã chọn đáp án này' : 'Câu này đã xong';
      return `<li><button class="${cls}" data-act="answer" data-arg="${ctx}:${i}" ${dis ? `disabled data-why="${why}"` : ''}><span class="opt-key">${LET[i]}</span><span class="opt-text">${jp(o)}</span>${state ? `<span class="opt-state">${state}</span>` : ''}</button></li>`;
    }).join('');

    const thread = st.thread.map((m) => `<div class="bubble ${m.kind}"><p class="bubble-who">${ic(m.kind === 'tpl' ? 'lock' : 'bulb', 'ic-xs')}<span>${m.kind === 'tpl' ? 'Sensei Agent · mẫu cố định' : `Sensei Agent · gợi ý bậc ${m.lvl}`}</span></p><p>${m.html}</p></div>`).join('');

    let feedback = '';
    if (attempted && !right && !st.reveal) feedback = `<p class="fb warn" tabindex="-1" data-focus>${ic('alert', 'ic-sm')}<span>Chưa đúng. Chị thử lại, hoặc xin gợi ý bậc tiếp theo.</span></p>`;
    if (right) feedback = `<p class="fb ok" tabindex="-1" data-focus>${ic('check', 'ic-sm')}<span>${st.hint > 0 || st.tries.length > 1 ? 'Đúng rồi, nhờ gợi ý. Hồ sơ năng lực ghi nhận ít điểm hơn một chút.' : 'Đúng ngay lần đầu!'}</span></p>`;
    if (st.reveal && !right) feedback = `<p class="fb info" tabindex="-1" data-focus>${ic('info', 'ic-sm')}<span>Đáp án là ${LET[q.a]}. Sensei Agent sẽ hỏi lại câu này khi đến hạn ôn.</span></p>`;

    let tools = '';
    if (!done) {
      const ask = !attempted
        ? (st.asked ? '' : `<button class="chip" data-act="askAnswer" data-arg="${ctx}">${ic('chat', 'ic-sm')}Cho em đáp án luôn</button>`)
        : `<button class="chip" data-act="reveal" data-arg="${ctx}">${ic('eye', 'ic-sm')}Xem đáp án và giải thích</button>`;
      const hint = st.hint < 3 ? `<button class="chip" data-act="hint" data-arg="${ctx}">${ic('bulb', 'ic-sm')}Gợi ý bậc ${st.hint + 1}</button>` : '';
      const teacher = ctx === 'lesson' ? `<button class="chip chip-person" data-act="askTeacher" data-arg="lesson">${teacherAv()}Vẫn vướng? Hỏi cô Linh</button>` : '';
      tools = `<div class="chips">${ask}${hint}${teacher}</div>`;
    }

    let expl = '';
    if (done) {
      const lv = st.level;
      const tabs = [['L1', 'mới bắt đầu, N5'], ['L2', 'N4'], ['L3', 'N3 trở lên']].map((t, i) =>
        `<button role="tab" class="lv ${lv === i + 1 ? 'on' : ''}" aria-selected="${lv === i + 1}" data-act="level" data-arg="${ctx}:${i + 1}"><b>${t[0]}</b><span>${t[1]}</span></button>`).join('');
      const report = st.reported
        ? `<p class="reported">${ic('flag', 'ic-sm')}Đã báo sai · cô Linh sẽ xem và báo lại chị</p>`
        : `<button class="btn ghost sm" data-act="report" data-arg="${ctx}">${ic('flag', 'ic-sm')}Báo sai</button>`;
      expl = `<section class="expl" aria-label="Giải thích">
        <p class="eyebrow">Giải thích theo trình độ tiếng Nhật</p>
        <div class="lvtabs" role="tablist" aria-label="Trình độ">${tabs}</div>
        <p class="expl-body" role="tabpanel">${jpTap(q.expl[lv - 1])}</p>
        ${lv > 1 ? `<p class="tap-hint">${ic('book', 'ic-xs')}<span>Chạm từ có gạch chấm để xem nghĩa · miễn phí</span></p>` : ''}
        ${srcLink(q.src)}
        <div class="expl-foot">${teamLabel()}${report}</div>
        ${ctx === 'lesson' ? `<button class="ask-person" data-act="askTeacher" data-arg="lesson">${teacherAv()}<span>Đọc rồi vẫn chưa hiểu?<b>Hỏi cô Linh</b></span>${ic('next', 'ic-sm')}</button>` : ''}
      </section>`;
    }

    return `<div class="qwrap">
      <div class="qmeta">${areaTag(examId || 'gaishoku', q.area)}<span class="qcount">Câu ${idx + 1}/${total}</span></div>
      <h1 class="qstem" tabindex="-1">${jp(q.q)}</h1>
      ${done ? '' : srcLink(q.src, 'Câu soạn từ')}
      <ol class="opts" aria-label="Các lựa chọn">${opts}</ol>
      <div aria-live="polite">${feedback}</div>
      ${done && ctxIdx(ctx) != null ? `${peerLine(q.peer)}${markRow(ctxIdx(ctx))}` : ''}
      ${thread ? `<div class="thread">${thread}</div>` : ''}
      ${tools}
      ${expl}
    </div>`;
  }

  /* ---------- week timeline rows ---------- */
  const H0 = 6; const H1 = 24;
  const pct = (h) => `${(((h - H0) / (H1 - H0)) * 100).toFixed(2)}%`;
  function dayBar(d, opts) {
    const shifts = d.shifts.map((s) => `<span class="bar-shift" style="left:${pct(s[0])};width:calc(${pct(s[1])} - ${pct(s[0])})"></span>`).join('');
    const study = d.study.map((s) => `<span class="bar-study" style="left:${pct(s[0])}" title="${hm(s[0])} · ${s[1]} phút"></span>`).join('');
    return `<div class="bar ${opts && opts.faded ? 'faded' : ''}" aria-hidden="true">${shifts}${study}</div>`;
  }
  function weekRows(w, highlightIdx) {
    const start = day(w.start);
    return w.days.map((d, i) => {
      const date = addDays(start, i);
      const off = d.shifts.length === 0;
      const shiftTxt = off ? 'Nghỉ' : d.shifts.map((s) => `${hm(s[0])}–${hm(s[1])}`).join(', ');
      return `<li class="wrow ${i === highlightIdx ? 'is-today' : ''}">
        <div class="wday"><b>${WD[date.getDay()]}</b><span>${dm(date)}</span></div>
        <div class="wmid">${dayBar(d)}<p class="wshift">${off ? `<span class="day-off">${ic('sun', 'ic-xs')}Nghỉ</span>` : `Ca ${shiftTxt}`}</p></div>
        <div class="wmin"><b>${dayMin(d)}</b><span>phút</span></div>
      </li>`;
    }).join('');
  }
  const barLegend = () => `<p class="legend"><span class="lg-shift"></span>Giờ làm <span class="lg-study"></span>Khung học Sensei Agent xếp <span class="lg-axis">06:00 → 24:00</span></p>`;

  /* ================= SCREENS ================= */
  const SCREENS = {};

  /* ----- 1. onboarding ----- */
  SCREENS.onb = function () {
    const st = S.onb;
    const setup = (n, label) => ({ title: 'Thiết lập', sub: `Bước ${n}/6 · ${label}` });
    const K = D.klass;
    if (st.step === 0) {
      return {
        title: 'Lời mời vào lớp', sub: 'Tham gia rồi thiết lập khoảng 3 phút',
        body: `<div class="pad invite">
          <div class="invite-brand"><span class="center-logo lg" aria-hidden="true">${D.center.mark}</span><div><p class="invite-center">${esc(D.center.name)}</p><p class="muted">Trung tâm tiếng Nhật và kỹ năng · Osaka (hư cấu)</p></div></div>
          <p class="eyebrow">Chị được mời vào lớp</p>
          <h1 class="h1" tabindex="-1">Cô Linh mời chị vào lớp <span class="jt">${jp('{外食業|がいしょくぎょう}2{号|ごう}')}</span> · ${K.code}</h1>
          <article class="class-card">
            <div class="class-card-top">${teacherAv()}<div><p class="class-card-t">${esc(K.title)}</p><p class="muted">Giáo viên: cô Linh · ${K.students} học viên</p></div></div>
            <dl class="kv">
              <div><dt>Ngày thi lớp gợi ý</dt><dd>${WDL[day(K.examDate).getDay()]} ${dmy(day(K.examDate))}</dd></div>
              <div><dt>Mã mời</dt><dd class="mono">${K.invite}</dd></div>
              <div><dt>Học ở đâu</dt><dd>Trên điện thoại, giữa các ca · lớp gặp online tối CN</dd></div>
            </dl>
          </article>
          <ul class="facts">
            <li>${ic('spark', 'ic-sm')}<span>Sensei Agent lập kế hoạch vừa lịch ca của chị; cô Linh xem lại trong 24 giờ.</span></li>
            <li>${ic('shield', 'ic-sm')}<span>Cô Linh thấy tiến độ học để dạy. Công ty và đơn vị hỗ trợ không thấy gì nếu chị không bật.</span></li>
          </ul>
          <p class="powered">Ứng dụng của ${esc(D.center.name)} · chạy bằng <b>Sensei Agent</b></p>
        </div>`,
        dock: `<button class="btn primary block" data-act="onbNext">Tham gia lớp${ic('next', 'ic-sm')}</button>`
      };
    }
    if (st.step === 1) {
      const card = (id) => {
        const e = D.exams[id];
        const on = S.exam === id;
        return `<button class="choice ${on ? 'on' : ''}" role="radio" aria-checked="${on}" data-act="pickExam" data-arg="${id}">
          <span class="choice-ja jt">${jp(e.ja)}</span>
          <span class="choice-vn">${esc(e.vn)}</span>
          <span class="choice-meta">${esc(e.meta)}</span>
          <span class="choice-who">${esc(e.who)}</span>
          <span class="radio" aria-hidden="true"></span>
        </button>`;
      };
      return Object.assign(setup(1, 'Kỳ thi'), {
        body: `<div class="pad">
          <p class="eyebrow">Chào chị · Bước 1/6</p>
          <h1 class="h1" tabindex="-1">Chị đang ôn kỳ thi nào?</h1>
          <p class="lead">Sensei Agent tính kế hoạch ngược từ ngày thi này, vừa với lịch ca của chị.</p>
          <div class="choices" role="radiogroup" aria-label="Kỳ thi">${card('gaishoku')}${card('ip')}</div>
          ${S.exam === 'ip' ? `<p class="note">${ic('info', 'ic-sm')}<span>IT Passport là kỳ thi của anh Tuấn (lớp IP05, thầy Nam). Demo sẽ cho xem chẩn đoán và bản đồ IT Passport, rồi quay lại chị Hạnh.</span></p>` : ''}
          <div class="srcs">${srcLink({ k: 'otaff' })}${srcLink({ k: 'ipKubun' })}</div>
        </div>`,
        dock: `<button class="btn primary block" data-act="onbNext">Tiếp tục${ic('next', 'ic-sm')}</button>`
      });
    }
    if (st.step === 2) {
      const days = daysBetween(ONB_DAY, day(S.examDate));
      const ok = days > 0 && days <= 400;
      return Object.assign(setup(2, 'Ngày thi'), {
        body: `<div class="pad">
          <p class="eyebrow">Bước 2/6</p>
          <h1 class="h1" tabindex="-1">Chị thi ngày nào?</h1>
          <label class="field"><span class="field-label">Ngày thi</span>
            <input type="date" id="examDate" value="${esc(S.examDate)}" min="2026-11-16" max="2027-12-31" aria-describedby="dateHelp"></label>
          <p class="helper" id="dateHelp">Lớp K12 gợi ý ${dmy(day(K.examDate))}. Chị đổi được; chỉ chị đổi được ngày thi (Chốt A), cô Linh thì không. Lịch thi chính thức xem ở trang OTAFF.</p>
          ${S.examDate !== K.examDate ? `<button class="btn ghost sm" data-act="classDate">${ic('refresh', 'ic-sm')}Dùng ngày lớp gợi ý (${dmy(day(K.examDate))})</button>` : `<p class="note ok">${ic('check', 'ic-sm')}<span>Đang dùng ngày thi lớp gợi ý.</span></p>`}
          ${ok ? `<div class="countdown"><b class="num">${Math.floor(days / 7)}</b><span>tuần</span><em>${days} ngày nữa · ${WDL[day(S.examDate).getDay()]} ${dmy(day(S.examDate))}</em></div>`
            : `<p class="fb warn">${ic('alert', 'ic-sm')}<span>Ngày thi cần sau hôm nay (15/11/2026) và trong khoảng 1 năm.</span></p>`}
          <label class="check"><input type="checkbox" id="adult" ${st.adult ? 'checked' : ''}><span class="check-box" aria-hidden="true">${ic('check', 'ic-sm')}</span><span>Tôi từ 18 tuổi trở lên</span></label>
          <p class="helper">Dịch vụ AI mà Sensei Agent dùng yêu cầu người dùng từ 18 tuổi.</p>
        </div>`,
        dock: (st.adult && ok)
          ? `<button class="btn primary block" data-act="onbNext">Tiếp tục${ic('next', 'ic-sm')}</button>`
          : `<p class="dock-hint" id="whyNext">${ic('info', 'ic-sm')}${ok ? 'Đánh dấu “Tôi từ 18 tuổi trở lên” để tiếp tục.' : 'Chọn lại ngày thi để tiếp tục.'}</p><button class="btn primary block" disabled aria-describedby="whyNext" data-why="Cần xác nhận 18+ và ngày thi hợp lệ">Tiếp tục</button>`
      });
    }
    /* step 3: shift schedule photo */
    const read = st.photo === 'read';
    const scanning = st.photo === 'scanning';
    const rows = D.weekNow.days.map((d, i) => {
      const date = addDays(day(D.weekNow.start), i);
      return `<tr><th scope="row">${WD[date.getDay()]} ${dm(date)}</th><td>${d.shifts.length ? d.shifts.map((s) => `${hm(s[0])}–${hm(s[1])}`).join('<br>') : '<span class="day-off">Nghỉ</span>'}</td></tr>`;
    }).join('');
    return Object.assign(setup(3, 'Lịch ca'), {
      body: `<div class="pad">
        <p class="eyebrow">Bước 3/6</p>
        <h1 class="h1" tabindex="-1">${read ? 'Sensei Agent đọc được 10 ca tuần này' : 'Chụp lịch ca tuần này'}</h1>
        <p class="lead">${read ? 'Chị kiểm tra lại. Sensei Agent chỉ đọc hàng của chị.' : 'Sensei Agent xếp giờ học vào khoảng trống giữa các ca.'}</p>
        ${read ? `<table class="shift-read"><caption class="sr-only">Lịch ca đã đọc</caption><tbody>${rows}</tbody></table>
          <p class="note">${ic('shield', 'ic-sm')}<span>Tên đồng nghiệp trong ảnh đã được che trên máy. Ảnh không được lưu.</span></p>`
          : shiftPaper(scanning)}
      </div>`,
      dock: read
        ? `<div class="row2"><button class="btn ghost" data-act="rescan">${ic('refresh', 'ic-sm')}Chụp lại</button><button class="btn primary" data-act="onbNext">Đúng rồi${ic('next', 'ic-sm')}</button></div>`
        : scanning ? `<p class="dock-hint" role="status">${ic('scan', 'ic-sm')}Đang đọc lịch ca…</p>`
          : `<button class="btn primary block" data-act="scanShift">${ic('camera', 'ic-sm')}Chụp lịch ca</button>`
    });
  };

  function shiftPaper(scanning) {
    const names = ['ハン', '■■', '■■■'];
    const grid = [
      ['10:30-14:30<br>17:00-22:30', '10:30-14:30<br>17:00-22:30', '10:30-14:30<br>17:00-22:30', '休', '10:30-14:30<br>17:00-22:30', '17:00-22:30', '10:30-14:30'],
      ['17:00-22:30', '休', '10:30-14:30', '10:30-22:30', '休', '10:30-14:30', '17:00-22:30'],
      ['休', '10:30-22:30', '17:00-22:30', '17:00-22:30', '10:30-14:30', '休', '10:30-22:30']
    ];
    const head = ['月16', '火17', '水18', '木19', '金20', '土21', '日22'].map((h) => `<th>${h}</th>`).join('');
    const body = grid.map((r, i) => `<tr class="${i === 0 ? 'me' : ''}"><th class="${i ? 'blurred' : ''}">${names[i]}</th>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
    return `<figure class="photo paper-photo ${scanning ? 'scanning' : ''}">
      <div class="paper"><p class="paper-title">シフト表　11/16〜11/22</p><table class="paper-table"><thead><tr><th></th>${head}</tr></thead><tbody>${body}</tbody></table></div>
      ${scanning ? '<span class="scanline" aria-hidden="true"></span>' : ''}
      <figcaption>Ảnh mẫu vẽ bằng HTML · tên đồng nghiệp đã che</figcaption>
    </figure>`;
  }

  /* ----- 2. diagnostic ----- */
  SCREENS.diag = function () {
    const qs = D.diag[S.exam];
    const d = S.diag;
    if (d.i < 0) {
      return {
        title: 'Chẩn đoán', sub: 'Bước 4/6',
        body: `<div class="pad">
          <p class="eyebrow">Bước 4/6 · ${esc(exam().short)}</p>
          <h1 class="h1" tabindex="-1">Bài chẩn đoán</h1>
          <p class="lead">Sensei Agent cần biết chị đang vững phần nào, hổng phần nào.</p>
          <ul class="facts">
            <li>${ic('clock', 'ic-sm')}<span>Bản thật: 15 phút, phủ đủ các phần của đề cương chính thức.</span></li>
            <li>${ic('list', 'ic-sm')}<span>Demo này: ${qs.length} câu mẫu.</span></li>
            <li>${ic('bulb', 'ic-sm')}<span>Chưa biết thì chọn “Em chưa biết”. Không bị trừ điểm, Sensei Agent biết chỗ cần dạy.</span></li>
          </ul>
        </div>`,
        dock: `<button class="btn primary block" data-act="diagStart">${ic('play', 'ic-sm')}Bắt đầu</button>`
      };
    }
    const q = qs[d.i];
    const chosen = d.ans[d.i];
    const letters = q.labels || LET;
    const opts = q.opts.map((o, i) => `<li><button class="opt ${chosen === i ? 'is-picked' : ''}" role="radio" aria-checked="${chosen === i}" data-act="diagPick" data-arg="${i}"><span class="opt-key">${letters[i]}</span><span class="opt-text">${jp(o)}</span></button></li>`).join('');
    const stem = q.verbatim
      ? `<p class="cite">${esc(q.cite)}</p><h1 class="qstem ja-stem" tabindex="-1" lang="ja">${esc(q.q)}</h1>
         <details class="gist"><summary>${ic('eye', 'ic-sm')}Xem nghĩa tiếng Việt (đội dịch)</summary><p>${esc(q.gist)}</p></details>`
      : `<div class="qmeta">${areaTag(S.exam, q.area)}</div><h1 class="qstem" tabindex="-1">${jp(q.q)}</h1>`;
    return {
      title: 'Chẩn đoán', sub: `Bước 4/6 · Câu ${d.i + 1}/${qs.length}`,
      body: `<div class="pad">
        ${progressBar(d.i, qs.length, 'Tiến độ chẩn đoán')}
        <p class="eyebrow">Câu ${d.i + 1}/${qs.length} · không chấm từng câu</p>
        ${stem}
        <ol class="opts" role="radiogroup" aria-label="Các lựa chọn">${opts}
          <li><button class="opt dunno ${chosen === -1 ? 'is-picked' : ''}" role="radio" aria-checked="${chosen === -1}" data-act="diagPick" data-arg="-1"><span class="opt-key">?</span><span class="opt-text">Em chưa biết</span></button></li>
        </ol>
        ${q.verbatim ? srcLink(q.src, 'Đề công khai') : srcLink(q.src, 'Câu soạn từ')}
        ${q.verbatim ? '' : teamLabel(' · câu chẩn đoán')}
      </div>`,
      dock: chosen === undefined
        ? `<p class="dock-hint">${ic('info', 'ic-sm')}Chọn một đáp án, hoặc “Em chưa biết”.</p>`
        : `<button class="btn primary block" data-act="diagNext">${d.i + 1 < qs.length ? 'Câu tiếp' : 'Xem bản đồ năng lực'}${ic('next', 'ic-sm')}</button>`
    };
  };

  /* ----- 3. competency map ----- */
  function mapBody() {
    const e = exam();
    const areas = e.areas.slice().sort((a, b) => prio(b) - prio(a));
    const rank = {}; areas.forEach((a, i) => { rank[a.id] = i; });
    const maxPts = Math.max.apply(null, e.areas.map((a) => a.pts));
    const rows = areas.map((a) => {
      const r = rank[a.id];
      const badge = r === 0 ? '<span class="prio p1">Ưu tiên 1</span>' : r === 1 ? '<span class="prio p2">Ưu tiên 2</span>' : '<span class="prio ok">Đang ổn</span>';
      return `<li class="arow ${r < 2 ? 'hot' : ''}">
        <div class="arow-top"><div><p class="jt">${jp(a.ja)}</p><p class="arow-vn">${esc(a.vn)}</p></div>${badge}</div>
        <div class="arow-bars">
          <div class="weight" style="width:${Math.round((a.pts / maxPts) * 100)}%"><span>${a.pts} ${e.id === 'ip' ? 'câu' : 'điểm'}</span></div>
          <div class="mastery"><i><span style="width:${Math.round(a.p * 100)}%"></span></i><em>Đã nắm ~${Math.round(a.p * 100)}%</em></div>
        </div>
        <p class="split">${esc(a.split)}</p>
        <p class="formula">ưu tiên = ${a.pts} × (0,8 − ${String(a.p).replace('.', ',')}) = <b>${String(prio(a)).replace('.', ',')}</b></p>
      </li>`;
    }).join('');
    let gauge = '';
    if (e.id === 'gaishoku') {
      const est = Math.round(e.areas.reduce((t, a) => t + a.pts * a.p, 0));
      gauge = `<div class="gauge">
        <div class="gauge-num"><b class="num">${est}</b><span>/ ${e.total} điểm ước tính</span></div>
        <div class="gauge-track" aria-hidden="true"><span class="gauge-fill" style="width:${(est / e.total) * 100}%"></span><span class="gauge-pass" style="left:${(e.pass / e.total) * 100}%"><em>cần ${e.pass}</em></span></div>
        <p class="gauge-note">Còn thiếu khoảng <b>${e.pass - est} điểm</b>. Hai phần nặng điểm nhất cũng đang yếu nhất.</p>
      </div>`;
    } else {
      gauge = `<p class="lead">IT Passport: 100 câu, 92 câu tính điểm, chia 3 nhóm. Sensei Agent xếp ưu tiên theo số câu và mức đã nắm.</p>`;
    }
    return `${gauge}
      <ol class="areas">${rows}</ol>
      <p class="note">${ic('info', 'ic-sm')}<span>Ưu tiên = độ nặng của phần × khoảng còn thiếu tới mức nắm 80%. Số % là <b>dữ liệu mẫu</b>; bản thật tính từ bài chẩn đoán 15 phút.</span></p>
      <div class="srcs">${e.src.map((k) => srcLink({ k: k }, 'Cơ cấu đề')).join('')}</div>`;
  }
  SCREENS.map = function () {
    const e = exam();
    const inSetup = !S.planApproved;
    let dock;
    if (e.id === 'ip') dock = `<button class="btn primary block" data-act="backToHanh">Tiếp demo với chị Hạnh (外食業2号)${ic('next', 'ic-sm')}</button>`;
    else if (inSetup) dock = `<button class="btn primary block" data-act="nav" data-arg="plan">Xem kế hoạch Sensei Agent đề xuất${ic('next', 'ic-sm')}</button>`;
    return {
      title: 'Bản đồ năng lực', sub: inSetup ? 'Bước 5/6' : esc(e.short), tab: 'plan',
      body: `${inSetup ? '' : planSeg('map')}<div class="pad">
        <p class="eyebrow">${inSetup ? 'Bước 5/6 · ' : ''}Theo đề cương chính thức</p>
        <h1 class="h1" tabindex="-1"><span class="jt">${jp(e.ja)}</span></h1>
        ${e.id === 'ip' ? `<p class="note">${ic('users', 'ic-sm')}<span>Kỳ thi của anh Tuấn (lớp IP05, thầy Nam). Phần còn lại của demo đi theo chị Hạnh.</span></p>` : ''}
        ${mapBody()}
      </div>`,
      dock: dock
    };
  };

  /* ----- 4. weekly plan + gate A ----- */
  const planSeg = (on) => `<div class="seg" role="tablist" aria-label="Kế hoạch">
    <button role="tab" aria-selected="${on === 'week'}" class="${on === 'week' ? 'on' : ''}" data-act="nav" data-arg="plan" data-replace="1">${ic('cal', 'ic-sm')}Tuần này</button>
    <button role="tab" aria-selected="${on === 'map'}" class="${on === 'map' ? 'on' : ''}" data-act="nav" data-arg="map" data-replace="1">${ic('map', 'ic-sm')}Bản đồ năng lực</button></div>`;

  SCREENS.plan = function () {
    const w = D.weekNow;
    const total = sumMin(w);
    const wl = weeksLeft();
    const inSetup = !S.planApproved;
    const road = Array.from({ length: wl }, (_, i) => {
      const cls = i < 4 ? 'r-hyg' : i < 8 ? 'r-mix' : i < wl - 2 ? 'r-drill' : 'r-mock';
      return `<span class="${cls} ${i === 0 ? 'cur' : ''}"></span>`;
    }).join('');
    const gate = inSetup ? `<section class="gate" aria-labelledby="gateA">
        ${gateHead('A', 'Chốt A · chị quyết định', 'Bắt đầu học theo kế hoạch tạm?', 'gateA')}
        <p>Sau này Sensei Agent tự chỉnh trong ±20% thời lượng. Thay đổi trên 20% hoặc đổi ngày thi luôn cần chị duyệt.</p>
      </section>` : '';
    /* T1: cô Linh reviews the first plan within 24 hours; the learner never waits for it. */
    const teacher = inSetup
      ? `<section class="tstatus" aria-labelledby="t1">${teacherAv()}<div><p class="eyebrow">Kế hoạch tạm</p><h2 class="h3" id="t1">Học được ngay; cô Linh sẽ xem trong 24 giờ</h2>
          <p>Chị không phải chờ. Nếu cô sửa, Sensei Agent báo chị biết sửa gì và vì sao.</p></div></section>`
      : S.teacherPlan === 'approved'
        ? `${stamp('08:40 T2 16/11', 'Cô Linh đã duyệt')}
          <section class="tstatus done" aria-labelledby="t1">${teacherAv()}<div><p class="eyebrow">Cô Linh sửa 1 chỗ</p><h2 class="h3" id="t1">T5 19/11, buổi 10:00: <span class="jt">${jp('{衛生管理|えいせいかんり}')}</span> → <span class="jt">${jp('{店舗運営|てんぽうんえい}')}</span> (15 phút)</h2>
            <p>Vì tuần này lớp học ${jp('{店舗運営|てんぽうんえい}')}. Đổi 15/138 phút = 11%, dưới 20%, nên áp dụng luôn; chị không cần duyệt lại.</p>
            <button class="btn ghost sm" data-act="askTeacher" data-arg="plan">${ic('chat', 'ic-sm')}Nhắn cô Linh</button></div></section>`
        : `<section class="tstatus wait" aria-labelledby="t1">${teacherAv()}<div><p class="eyebrow">${ic('clock', 'ic-xs')}Đang chờ cô Linh xem</p><h2 class="h3" id="t1">Chị cứ học theo kế hoạch tạm</h2>
            <p>Cô Linh xem trước 21:53 T2 16/11. Kế hoạch chạy bình thường trong lúc chờ.</p>
            <div class="tstatus-acts">${extLink(TEACHER + 'queue', 'Xem phía cô Linh')}<button class="btn demo sm" data-act="teacherApprovePlan">${ic('play', 'ic-sm')}Giả lập: cô Linh duyệt</button></div></div></section>`;
    return {
      title: 'Kế hoạch', sub: inSetup ? 'Bước 6/6 · kế hoạch tạm' : S.teacherPlan === 'approved' ? `${w.label} · cô Linh đã duyệt` : `${w.label} · chờ cô Linh xem`, tab: 'plan',
      body: `${inSetup ? '' : planSeg('week')}<div class="pad">
        <p class="eyebrow">${inSetup ? 'Bước 6/6 · ' : ''}Tính ngược từ ngày thi</p>
        <h1 class="h1" tabindex="-1">Còn ${wl} tuần · thi ${WD[day(S.examDate).getDay()]} ${dmy(day(S.examDate))}</h1>
        ${S.re.approved ? '' : teacher}
        <div class="road" aria-label="Lộ trình ${wl} tuần (mẫu)"><div class="road-bar">${road}</div>
          <p class="road-legend"><span class="lg"><i class="r-hyg"></i>衛生・店舗</span><span class="lg"><i class="r-mix"></i>接客・調理</span><span class="lg"><i class="r-drill"></i>Luyện đề</span><span class="lg"><i class="r-mock"></i>Thi thử tắt AI</span></p></div>
        <div class="week-head"><div><p class="eyebrow">${esc(w.label)}</p><p class="week-total"><b class="num">${total}</b> phút · ${(total / 7).toFixed(0)} phút/ngày trung bình</p></div></div>
        ${barLegend()}
        <ol class="week">${weekRows(w, S.planApproved ? 1 : -1)}</ol>
        <details class="why"><summary>${ic('spark', 'ic-sm')}Vì sao Sensei Agent xếp như vậy?</summary>
          <ul>
            <li><span class="jt">${jp('{衛生管理|えいせいかんり}')}</span> nặng 80 điểm, chị mới nắm ~35% → ưu tiên 80 × 0,45 = <b>36</b>, cao nhất. Tiếp theo là <span class="jt">${jp('{店舗運営|てんぽうんえい}')}</span> (32).</li>
            <li>Ngày làm 2 ca: 4 khung ngắn (tàu, giờ nghỉ, trước ca, sau ca) = 19 phút.</li>
            <li>Ngày nghỉ (T5) học dài hơn: 30 phút.</li>
            <li>Thẻ đến hạn ôn xếp vào lúc đi tàu (ôn giãn cách FSRS).</li>
          </ul></details>
        ${S.re.approved ? `<p class="note ok">${ic('check', 'ic-sm')}<span>Tuần 2 (23–29/11): kế hoạch mới chị đã duyệt ngày 22/11.</span></p>` : ''}
        ${gate}
      </div>`,
      dock: inSetup
        ? `<div class="row2 lead-r"><button class="btn ghost" data-act="planLater">Để sau</button><button class="btn shu" data-act="approvePlan">${ic('play', 'ic-sm')}Học ngay</button></div>`
        : `<button class="btn primary block" data-act="nav" data-arg="today" data-tabnav="1">Đi tới Hôm nay (T3 17/11)${ic('next', 'ic-sm')}</button>`
    };
  };

  /* ----- 5. today ----- */
  SCREENS.today = function () {
    if (!S.planApproved) {
      return {
        title: 'Hôm nay', sub: '', tab: 'today',
        body: `<div class="pad">${empty('cal', 'Chị chưa bắt đầu kế hoạch', 'Sensei Agent xếp giờ học sau khi chị bấm “Học ngay” ở kế hoạch tạm. Không cần chờ cô Linh.', `<button class="btn primary" data-act="nav" data-arg="plan">Xem kế hoạch tạm</button>`)}</div>`
      };
    }
    const n = nextSlot();
    const done = minutesDone();
    const total = 19;
    const r = 34; const C = 2 * Math.PI * r;
    const ring = `<svg class="ring" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="${r}" class="ring-bg"/><circle cx="40" cy="40" r="${r}" class="ring-fg" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - done / total)).toFixed(1)}"/></svg>`;
    const items = SLOTS.map((s) => {
      if (s.shift) return `<li class="tl-shift"><span class="tl-time">${s.t}</span><span class="tl-shift-bar">${ic('users', 'ic-xs')}${s.shift} · đi làm</span></li>`;
      const isDoneS = S.done[s.k];
      const isNext = n && n.k === s.k;
      return `<li class="tl-item ${isDoneS ? 'done' : ''} ${isNext ? 'next' : ''}">
        <span class="tl-time">${s.t}</span>
        <button class="tl-card" data-act="slot" data-arg="${s.k}">
          <span class="tl-ic">${ic(isDoneS ? 'check' : s.icon)}</span>
          <span class="tl-body"><span class="tl-where">${s.where}${isNext ? ' · <b>tiếp theo</b>' : isDoneS ? ' · xong' : ''}</span><span class="tl-title">${s.title}</span><span class="tl-why">${s.why}</span></span>
          <span class="tl-min">${s.min}′</span>
        </button></li>`;
    }).join('');
    const log = [
      ['06:00', `Chọn bài HACCP: ${jp('{衛生管理|えいせいかんり}')} đang ưu tiên 1 (80 điểm, mới nắm ~35%).`],
      ['06:01', 'Kiểm chứng soát 10/10 câu với giáo trình; câu nào cũng có trích nguồn.'],
      ['06:02', 'Xếp 4 khung học vào khoảng trống giữa 2 ca, tổng 19 phút.'],
      ['09:45', 'Gửi nhắc học (trong khung giờ chị đã chọn).']
    ].map((l) => `<li><span class="mono">${l[0]}</span><span>${l[1]}</span></li>`).join('');
    return {
      title: 'Hôm nay', sub: `Thứ Ba 17/11 · còn ${Math.floor(daysBetween(TODAY, day(S.examDate)) / 7)} tuần`, tab: 'today',
      body: `<section class="hero">
          <div class="hero-txt"><p class="eyebrow on-dark">Thứ Ba 17/11 · 2 ca</p>
          <h1 class="hero-h" tabindex="-1">${done >= total ? 'Xong 19 phút hôm nay' : `${total - done} phút nữa là xong hôm nay`}</h1>
          <p class="hero-sub">Sensei Agent tự chọn nội dung và giờ học, vừa khít giữa các ca.</p></div>
          <div class="hero-ring">${ring}<span class="ring-num"><b>${done}</b>/${total}′</span></div>
        </section>
        <div class="pad">
          ${n ? `<button class="next-card" data-act="slot" data-arg="${n.k}"><span class="next-l"><span class="eyebrow">Việc tiếp theo · ${n.t}</span><span class="next-t">${n.title}</span><span class="next-m">${n.min} phút · ${n.where.toLowerCase()}</span></span><span class="next-go">${ic('next')}</span></button>`
            : `<p class="note ok">${ic('check', 'ic-sm')}<span>Hôm nay xong rồi. Mai Sensei Agent xếp tiếp theo lịch ca.</span></p>`}
          <p class="eyebrow gap">Có thêm ít phút rảnh?</p>
          <ul class="tools">
            <li><button class="tool" data-act="nav" data-arg="quick">${ic('refresh')}<b>Ôn nhanh</b><span>Câu sai, câu chưa làm</span></button></li>
            <li><button class="tool" data-act="nav" data-arg="mock">${ic('timer')}<b>Thi thử ngắn</b><span>10 câu · 13 phút</span></button></li>
            <li><button class="tool" data-act="nav" data-arg="pass">${ic('map')}<b>Khả năng đỗ</b><span>Ước tính</span></button></li>
          </ul>
          <h2 class="h3">Một ngày của chị</h2>
          <ol class="timeline">${items}</ol>
          <section class="agentlog">
            <button class="agentlog-t" data-act="toggleLog" aria-expanded="${S.logOpen}">${ic('spark', 'ic-sm')}<span>Sensei Agent đã tự làm sáng nay</span><span class="count">4 việc</span>${ic('next', 'ic-sm chev')}</button>
            ${S.logOpen ? `<ol class="agentlog-list">${log}</ol>` : ''}
          </section>
        </div>`
    };
  };

  /* ----- flashcards 09:50 ----- */
  SCREENS.cards = function () {
    const c = S.cards;
    const all = D.flashcards;
    if (c.i >= all.length) {
      return {
        title: 'Ôn thẻ', sub: '09:50 · trên tàu', tab: 'today', back: true,
        body: `<div class="pad">${empty('check', `Xong ${all.length} thẻ`, `Nhớ ${c.known}/${all.length}. Thẻ chưa nhớ sẽ quay lại sớm hơn (ôn giãn cách FSRS).`)}</div>`,
        dock: `<button class="btn primary block" data-act="finishSlot" data-arg="cards">Về Hôm nay</button>`
      };
    }
    const f = all[c.i];
    return {
      title: 'Ôn thẻ', sub: `09:50 · thẻ ${c.i + 1}/${all.length}`, tab: 'today', back: true,
      body: `<div class="pad">
        ${progressBar(c.i, all.length, 'Tiến độ ôn thẻ')}
        <p class="eyebrow">Thẻ ${c.i + 1}/${all.length} · đến hạn hôm nay</p>
        <button class="flash ${c.flipped ? 'flipped' : ''}" data-act="flip">
          <span class="flash-ja jt">${jp(f.ja)}</span>
          ${c.flipped ? `<span class="flash-vn">${esc(f.vn)}</span>` : `<span class="flash-hint">${ic('refresh', 'ic-sm')}Chạm để lật thẻ</span>`}
        </button>
        ${c.flipped ? srcLink(f.src) : ''}
        <h1 class="sr-only" tabindex="-1">Ôn thẻ ${c.i + 1}</h1>
      </div>`,
      dock: c.flipped
        ? `<div class="row2"><button class="btn ghost" data-act="rate" data-arg="0">Chưa nhớ</button><button class="btn primary" data-act="rate" data-arg="1">Nhớ rồi</button></div>`
        : `<button class="btn primary block" data-act="flip">Lật thẻ</button>`
    };
  };

  /* ----- 6. lesson ----- */
  SCREENS.lesson = function () {
    const L = S.lesson;
    const cards = D.lessonCards;
    const qs = D.lessonQs;
    if (L.mode === 'review') {
      const qi = L.reviewQ;
      const q = qs[qi];
      const st = qState(L.st, 'r' + qi);
      return {
        title: 'Ôn lại', sub: '23:00 · sau ca', tab: 'today', back: true,
        body: `<div class="pad">
          <p class="eyebrow">23:00 · Sau ca · câu chị chưa chắc lúc 15:00</p>
          ${qBlock('lesson', q, st, 0, 1)}
        </div>`,
        dock: isDone(q, st) ? `<button class="btn primary block" data-act="finishSlot" data-arg="review">Xong, về Hôm nay</button>` : `<p class="dock-hint">${ic('info', 'ic-sm')}Chọn một đáp án. Gợi ý có sẵn nếu cần.</p>`
      };
    }
    if (L.phase === 'cards') {
      const c = cards[L.card];
      const rows = c.rows.map((r) => `<li><span class="lrow-ja jt">${jp(r[0])}</span><span class="lrow-vn">${esc(r[1])}</span></li>`).join('');
      return {
        title: 'Bài 10 phút', sub: `HACCP · thẻ ${L.card + 1}/${cards.length}`, tab: 'today', back: true,
        body: `<div class="pad">
          ${segs(cards.length + qs.length, L.card, L.card)}
          <p class="eyebrow">15:00 · Thẻ ${L.card + 1}/${cards.length} · rồi 2 vòng × ${ROUND} câu</p>
          <article class="lcard enter-x">
            <h1 class="lcard-ja jt" tabindex="-1">${jp(c.ja)}</h1>
            <p class="lcard-vn">${esc(c.vn)}</p>
            <ul class="lrows">${rows}</ul>
            <p class="callout">${ic('info', 'ic-sm')}<span>${jp(c.note)}</span></p>
            ${srcLink(c.src)}
          </article>
        </div>`,
        dock: `<div class="row2">${L.card > 0 ? `<button class="btn ghost" data-act="lessonCard" data-arg="-1">${ic('back', 'ic-sm')}Thẻ trước</button>` : `<span class="dock-note">Tổng bài: khoảng 10 phút</span>`}
          <button class="btn primary" data-act="lessonCard" data-arg="1">${L.card + 1 < cards.length ? 'Thẻ tiếp' : 'Làm vòng 1'}${ic('next', 'ic-sm')}</button></div>`
      };
    }
    const all = cards.length + qs.length;
    const rounds = Math.ceil(qs.length / ROUND);
    if (L.phase === 'quiz') {
      const q = qs[L.q];
      const st = qState(L.st, L.q);
      const r = Math.floor(L.q / ROUND);
      const next = L.q + 1 >= qs.length ? 'Xem kết quả và sao' : (L.q + 1) % ROUND === 0 ? `Xem điểm vòng ${r + 1}` : 'Câu tiếp';
      return {
        title: 'Bài 10 phút', sub: `HACCP · vòng ${r + 1}/${rounds} · câu ${(L.q % ROUND) + 1}/${ROUND}`, tab: 'today', back: true,
        body: `<div class="pad">
          ${segs(all, cards.length + L.q, cards.length + L.q)}
          <p class="eyebrow">Vòng ${r + 1}/${rounds} · chấm ngay từng câu</p>
          ${qBlock('lesson', q, st, L.q % ROUND, ROUND)}
        </div>`,
        dock: isDone(q, st)
          ? `<button class="btn primary block" data-act="lessonNext">${next}${ic('next', 'ic-sm')}</button>`
          : `<p class="dock-hint">${ic('info', 'ic-sm')}Chọn một đáp án. Lời giải hiện sau khi chị đã thử.</p>`
      };
    }
    const res = qs.map((q, i) => qResult(q, L.st[i]));
    const RL = { ok: ['check', 'Đúng ngay'], help: ['bulb', 'Đúng ở lần sau'], miss: ['eye', 'Xem đáp án'], '': ['x', 'Chưa làm'] };
    if (L.phase === 'round') {
      /* instant score for the round just finished (L.q = its last question) */
      const r = Math.floor(L.q / ROUND);
      const part = res.slice(r * ROUND, r * ROUND + ROUND);
      const ok = part.filter((x) => x === 'ok').length;
      const rows = part.map((x, k) => `<li class="rr ${x || 'none'}"><span class="rr-n mono">${r * ROUND + k + 1}</span>${ic(RL[x][0], 'ic-sm')}<span>${RL[x][1]}</span></li>`).join('');
      return {
        title: 'Bài 10 phút', sub: `HACCP · xong vòng ${r + 1}/${rounds}`, tab: 'today', back: true,
        body: `<div class="pad">
          ${segs(all, -1, cards.length + L.q + 1)}
          <p class="eyebrow">Xong vòng ${r + 1}/${rounds} · chấm ngay</p>
          <h1 class="h1" tabindex="-1"><span class="num big">${ok}/${ROUND}</span> câu đúng ngay lần đầu</h1>
          <ol class="rround">${rows}</ol>
          <p class="note">${ic('info', 'ic-sm')}<span>${ok === ROUND ? 'Cả 5 câu đúng ngay. ' : 'Câu không đúng ngay lần đầu sẽ vào “Câu sai lần trước” để ôn nhanh. '}Còn ${rounds - r - 1} vòng nữa là xong bài và nhận sao cho mục này.</span></p>
        </div>`,
        dock: `<button class="btn primary block" data-act="lessonRound">Làm vòng ${r + 2} · ${ROUND} câu${ic('next', 'ic-sm')}</button>`
      };
    }
    /* done: stars for the syllabus item just studied */
    const first = res.filter((x) => x === 'ok').length;
    const helped = res.filter((x) => x === 'help').length;
    const shown = res.filter((x) => x === 'miss').length;
    const perRound = Array.from({ length: rounds }, (_, r) => `Vòng ${r + 1}: ${res.slice(r * ROUND, r * ROUND + ROUND).filter((x) => x === 'ok').length}/${ROUND}`).join(' · ');
    const n = starsFor(first);
    const items = D.syllabus.map((it) => {
      const cur = it.stars == null;
      return `<li class="sy ${cur ? 'cur' : ''}"><span class="sy-t"><span class="jt">${jp(it.ja)}</span><em>${esc(it.vn)} · ${cur ? 'vừa học' : 'lần trước (mẫu)'}</em></span>${stars(cur ? n : it.stars, 'sm')}</li>`;
    }).join('');
    return {
      title: 'Bài 10 phút', sub: 'Kết quả', tab: 'today', back: true,
      body: `<div class="pad">
        ${segs(all, -1, all)}
        <section class="starcard">
          <p class="eyebrow">Xong bài HACCP · ${jp('{衛生管理|えいせいかんり}')}</p>
          ${stars(n, 'big')}
          <h1 class="h1" tabindex="-1">${n ? `Mục này đạt ${n} sao` : 'Mục này chưa có sao'}</h1>
          <p class="starcard-item jt">${jp('{食中毒|しょくちゅうどく}{予防|よぼう}・HACCP')}</p>
          <p class="starcard-rule">Đúng ngay ${first}/${qs.length} câu · ${perRound}</p>
        </section>
        <div class="stats">
          <div class="stat"><b class="num">${first}</b><span>Đúng ngay lần đầu</span></div>
          <div class="stat"><b class="num">${helped}</b><span>Đúng ở lần sau</span></div>
          <div class="stat"><b class="num">${shown}</b><span>Xem đáp án</span></div>
        </div>
        <div class="row2"><button class="btn ghost sm" data-act="nav" data-arg="quick">${ic('refresh', 'ic-sm')}Ôn câu sai</button><button class="btn ghost sm" data-act="nav" data-arg="pass">${ic('map', 'ic-sm')}Khả năng đỗ</button></div>
        <p class="eyebrow gap">Sao theo mục · ${jp('{衛生管理|えいせいかんり}')}</p>
        <ul class="sylist">${items}</ul>
        <p class="helper">Sao tính theo số câu đúng ngay lần đầu, không dùng gợi ý: 9–10 câu = 3 sao, 7–8 = 2 sao, 4–6 = 1 sao.</p>
        <p class="note">${ic('spark', 'ic-sm')}<span>Sensei Agent cập nhật hồ sơ năng lực. Câu chưa chắc sẽ quay lại lúc 23:00 hôm nay (ôn giãn cách).</span></p>
      </div>`,
      dock: `<button class="btn primary block" data-act="finishSlot" data-arg="lesson">Về Hôm nay</button>`
    };
  };

  /* ----- 7. capture-to-learn ----- */
  function poster(mode) {
    const m = S.cap.masks;
    const steps = ['流水で手を洗う', '洗浄剤を手に取る', '手のひら、指の腹面を洗う', '手の甲、指の背を洗う', '指の間、股を洗う', '親指、母指球を洗う', '指先を洗う', '手首を洗う', '洗浄剤を流水でよく洗い流す', '手をふき乾燥させる', 'アルコールによる消毒'];
    const kana = ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ', 'サ'];
    const li = steps.map((s, i) => `<li><b>${kana[i]}</b>${s}</li>`).join('');
    const preview = mode === 'preview';
    const pii = (key, text, tagTxt, label) => {
      const masked = m[key];
      if (!preview) return `<span class="pii">${text}</span>`;
      return `<button class="pii tap ${masked ? 'masked' : ''}" data-act="mask" data-arg="${key}" aria-pressed="${!!masked}" aria-label="${masked ? `Bỏ che ${label}` : `Che thêm ${label}`}"><span class="pii-text">${text}</span>${tagTxt ? `<em class="pii-tag">${tagTxt}</em>` : ''}</button>`;
    };
    const face = (cls) => `<svg class="face ${cls}" viewBox="0 0 60 70" aria-hidden="true"><rect x="8" y="6" width="44" height="14" rx="4" fill="#fff" stroke="#9aa6bd"/><circle cx="30" cy="34" r="16" fill="#E8C4A8"/><path d="M14 30c2-10 30-10 32 0" fill="#3a2a22"/><circle cx="24" cy="35" r="1.8" fill="#2b2b2b"/><circle cx="36" cy="35" r="1.8" fill="#2b2b2b"/><path d="M25 42c3 2 7 2 10 0" stroke="#8a4b3a" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M8 70c2-12 11-18 22-18s20 6 22 18" fill="#fff" stroke="#9aa6bd"/></svg>`;
    return `<div class="poster ${preview ? 'is-preview' : ''}">
      <div class="poster-top">${pii('shop', '梅田店 厨房', '', 'tên cửa hàng')}<span class="poster-title">手洗いの手順</span></div>
      <div class="poster-mid">
        <div class="poster-people ${preview ? 'blurred' : ''}">${face('f1')}${face('f2')}${preview ? `<em class="blur-tag">${ic('shield', 'ic-xs')}Mặt đã che trên máy</em>` : ''}</div>
        <ol class="poster-steps">${li}</ol>
      </div>
      <p class="poster-note">2度洗いが効果的です（イ～ケまでをくりかえす）</p>
      <p class="poster-foot">${pii('name', '担当：田中 美咲', '→ [TÊN]', 'tên người phụ trách')}${pii('phone', 'TEL 090-0000-1234', '→ [SĐT]', 'số điện thoại')}</p>
    </div>`;
  }

  const PIPE = [
    ['Thu nhỏ và vẽ lại ảnh: bỏ vị trí GPS, giờ chụp (EXIF)', 'Trên điện thoại'],
    ['Tìm và làm mờ khuôn mặt (MediaPipe, chạy trong trình duyệt)', 'Trên điện thoại'],
    ['Chị xem lại, chạm để che thêm, rồi bấm “Gửi”', 'Chị quyết định'],
    ['Máy chủ đọc chữ; tên, số điện thoại thành [TÊN] [SĐT]', 'Sau khi chị gửi'],
    ['Chỉ lưu chữ đã che. Không lưu ảnh', 'Sau khi chị gửi']
  ];
  const PIPE_DOC = [
    ['Mở file trên điện thoại; bỏ tên tác giả, ngày tạo (metadata)', 'Trên điện thoại'],
    ['Tìm và làm mờ khuôn mặt trong trang (MediaPipe)', 'Trên điện thoại'],
    PIPE[2], PIPE[3],
    ['Chỉ lưu chữ đã che. Không lưu file', 'Sau khi chị gửi']
  ];
  const pipeList = (upTo) => `<ol class="pipe">${(S.cap.kind === 'doc' ? PIPE_DOC : PIPE).map((p, i) => `<li class="${i < upTo ? 'done' : i === upTo ? 'cur' : ''}"><span class="pipe-dot">${i < upTo ? ic('check', 'ic-xs') : i + 1}</span><span class="pipe-t">${p[0]}<em>${p[1]}</em></span></li>`).join('')}</ol>`;

  SCREENS.capture = function () {
    const C = S.cap;
    const doc = C.kind === 'doc';
    const base = { title: doc ? 'Tải tài liệu là học' : 'Chụp là học', tab: 'capture' };
    /* the page as the learner sees it: a photo, or page 1 of a PDF */
    const shot = (mode, cap) => (doc
      ? `<figure class="photo docpage"><p class="doc-bar">${ic('file', 'ic-xs')}<span>手洗いマニュアル_梅田店.pdf</span><em>trang 1/3</em></p>${poster(mode)}<figcaption>${cap}</figcaption></figure>`
      : `<figure class="photo">${poster(mode)}<figcaption>${cap}</figcaption></figure>`);
    if (C.stage === 'poster') {
      const kindSeg = `<div class="seg" role="tablist" aria-label="Nguồn tài liệu">
        <button role="tab" aria-selected="${!doc}" class="${doc ? '' : 'on'}" data-act="capKind" data-arg="photo">${ic('camera', 'ic-sm')}Chụp ảnh</button>
        <button role="tab" aria-selected="${doc}" class="${doc ? 'on' : ''}" data-act="capKind" data-arg="doc">${ic('file', 'ic-sm')}Tải tài liệu (PDF)</button></div>`;
      const allowed = `<p class="note warn">${ic('alert', 'ic-sm')}<span><b>Chỉ chụp/tải tài liệu chỗ làm cho phép.</b> Không chụp giấy tờ nội bộ, thông tin khách. Trung tâm hoặc công ty có thể tắt tính năng này.</span></p>`;
      if (doc) {
        const files = [
          ['pdf', '手洗いマニュアル_梅田店.pdf', 'PDF · 3 trang · 1,2 MB'],
          ['xlsx', '衛生管理記録表_11月.xlsx', 'Excel · đổi sang PDF trước khi đọc'],
          ['docx', '新人研修メモ.docx', 'Word · đổi sang PDF trước khi đọc']
        ].map((f) => `<li><button class="file" data-act="pickDoc" data-arg="${f[0]}"><span class="file-ic ${f[0]}">${f[0].toUpperCase()}</span><span class="file-t"><span lang="ja">${f[1]}</span><em>${f[2]}</em></span>${ic('next', 'ic-sm')}</button></li>`).join('');
        return Object.assign(base, {
          sub: '16:20 · chọn file',
          body: `${kindSeg}<div class="pad">
            <p class="eyebrow">16:20 · Trước ca · 2 phút</p>
            <h1 class="h1" tabindex="-1">Chọn tài liệu chỗ làm gửi chị</h1>
            <p class="lead">PDF đọc được ngay. Word, Excel được đổi sang PDF trước khi đọc, rồi che dữ liệu cá nhân như ảnh chụp.</p>
            <p class="eyebrow">Trong máy chị (mẫu)</p>
            <ul class="files">${files}</ul>
            ${allowed}
          </div>`,
          dock: `<p class="dock-hint">${ic('info', 'ic-sm')}Chạm một file để xem trước. Chưa có gì được gửi.</p>`
        });
      }
      return Object.assign(base, {
        sub: '16:20 · trước ca',
        body: `${kindSeg}<div class="pad">
          <p class="eyebrow">16:20 · Trước ca · 2 phút</p>
          <h1 class="h1" tabindex="-1">Chụp tài liệu ở chỗ làm, Sensei Agent biến thành bài học</h1>
          <figure class="photo viewfinder"><span class="vf-corners" aria-hidden="true"></span>${poster('raw')}<figcaption>Ảnh mẫu vẽ bằng HTML · tên, số điện thoại là giả</figcaption></figure>
          <p class="note">${ic('shield', 'ic-sm')}<span>Khuôn mặt được che ngay trên điện thoại. Ảnh gốc không bao giờ được lưu.</span></p>
          ${allowed}
        </div>`,
        dock: `<button class="btn primary block shutter" data-act="shoot">${ic('camera', 'ic-sm')}Chụp poster</button>`
      });
    }
    if (C.stage === 'processing') {
      return Object.assign(base, {
        sub: 'Đang xử lý trên máy',
        body: `<div class="pad">
          <p class="eyebrow">Trên điện thoại của chị</p>
          <h1 class="h1" tabindex="-1">Đang che dữ liệu cá nhân…</h1>
          <div role="status" aria-live="polite">${pipeList(C.step)}</div>
        </div>`,
        dock: `<p class="dock-hint" role="status">${ic('scan', 'ic-sm')}Chưa có gì rời khỏi điện thoại.</p>`
      });
    }
    if (C.stage === 'preview') {
      const extra = ['shop', 'name', 'phone'].filter((k) => C.masks[k]).length;
      return Object.assign(base, {
        sub: 'Xem trước',
        body: `<div class="pad">
          <p class="eyebrow">Xem trước · chưa gửi</p>
          <h1 class="h1" tabindex="-1">Chị xem lại trước khi gửi</h1>
          ${shot('preview', `Chạm vào chữ để che thêm${extra ? ` · đã che thêm ${extra}` : ''}`)}
          <ul class="facts">
            <li>${ic('check', 'ic-sm ok')}<span>2 khuôn mặt đã làm mờ trên máy</span></li>
            <li>${ic('check', 'ic-sm ok')}<span>${doc ? 'Tên tác giả, ngày tạo file (metadata) đã bỏ · Sensei Agent chỉ đọc trang 1–3' : 'Vị trí GPS, giờ chụp đã bỏ'}</span></li>
            <li>${ic('info', 'ic-sm')}<span>Tên và số điện thoại sẽ thành [TÊN], [SĐT] khi máy chủ đọc chữ</span></li>
          </ul>
          ${pipeList(2)}
        </div>`,
        dock: `<div class="row2"><button class="btn danger-ghost" data-act="askDelete">${ic('trash', 'ic-sm')}${doc ? 'Bỏ file' : 'Xoá ảnh'}</button><button class="btn primary" data-act="sendPhoto">${ic('send', 'ic-sm')}Gửi</button></div>`
      });
    }
    if (C.stage === 'sent') {
      const shop = C.masks.shop ? '[ĐÃ CHE]' : '梅田店 厨房';
      return Object.assign(base, {
        sub: 'Chữ đã che',
        body: `<div class="pad">
          <p class="eyebrow">Máy chủ chỉ giữ phần này</p>
          <h1 class="h1" tabindex="-1">Chữ đã che, không còn ${doc ? 'file' : 'ảnh'}</h1>
          <pre class="redacted" aria-label="Văn bản đã che">${esc(shop)}
手洗いの手順
ア 流水で手を洗う
イ 洗浄剤を手に取る
…
コ 手をふき乾燥させる
サ アルコールによる消毒
2度洗いが効果的です（イ～ケまでをくりかえす）
担当：<mark>[TÊN]</mark>　TEL <mark>[SĐT]</mark></pre>
          <dl class="kv">
            <div><dt>${doc ? 'File gốc' : 'Ảnh gốc'}</dt><dd>${ic('x', 'ic-xs')}Không lưu</dd></div>
            <div><dt>Khuôn mặt</dt><dd>2 · đã che trên máy</dd></div>
            <div><dt>Tên, SĐT</dt><dd>2 · thay bằng nhãn</dd></div>
            <div><dt>Khớp đề cương</dt><dd><span class="jt">${jp('{衛生管理|えいせいかんり}')}</span> · ${jp('{手洗|てあら}い')}</dd></div>
            <div><dt>Kiểm chứng</dt><dd>${ic('check', 'ic-xs ok')}3/3 câu khớp giáo trình</dd></div>
          </dl>
          ${srcLink({ k: 'hyg1ja', page: 11, pdf: 16 }, 'Đối chiếu')}
        </div>`,
        dock: `<div class="row2"><button class="btn danger-ghost" data-act="askDelete">${ic('trash', 'ic-sm')}Xoá ảnh</button><button class="btn primary" data-act="capQuiz">Làm 3 câu${ic('next', 'ic-sm')}</button></div>`
      });
    }
    if (C.stage === 'quiz') {
      const q = D.captureQs[C.q];
      const st = qState(C.st, C.q);
      return Object.assign(base, {
        sub: `Câu ${C.q + 1}/3 từ ảnh của chị`,
        body: `<div class="pad">${progressBar(C.q, 3, 'Tiến độ 3 câu')}${qBlock('cap', q, st, C.q, 3)}</div>`,
        dock: isDone(q, st)
          ? `<button class="btn primary block" data-act="capNext">${C.q < 2 ? 'Câu tiếp' : 'Xong'}${ic('next', 'ic-sm')}</button>`
          : `<p class="dock-hint">${ic('info', 'ic-sm')}Chọn một đáp án.</p>`
      });
    }
    /* done */
    return Object.assign(base, {
      sub: 'Xong',
      body: `<div class="pad">
        <p class="eyebrow">Chụp là học · xong</p>
        <h1 class="h1" tabindex="-1">3 câu từ ${doc ? 'tài liệu' : 'ảnh'} của chị</h1>
        <p class="lead">Các câu này chỉ dùng cho chị.</p>
        <section class="tstatus" aria-labelledby="t2">${teacherAv()}<div><p class="eyebrow">Muốn dùng cho cả lớp?</p><h2 class="h3" id="t2">Cô Linh duyệt trước khi chia sẻ</h2>
          <p>Câu chỉ vào ngân hàng câu chung của lớp khi cô Linh duyệt. Cô chỉ thấy chữ đã che, không bao giờ thấy ảnh hay file gốc.</p>
          <div class="tstatus-acts">${S.capShared ? `<p class="decided ok">${ic('check', 'ic-sm')}Đã đề xuất · chờ cô Linh duyệt</p>` : `<button class="btn ghost sm" data-act="shareCap">${ic('users', 'ic-sm')}Đề xuất cho cả lớp</button>`}${extLink(TEACHER + 'queue', 'Xem hàng chờ phía cô Linh')}</div></div></section>
      </div>`,
      dock: `<div class="row2"><button class="btn danger-ghost" data-act="askDelete">${ic('trash', 'ic-sm')}Xoá ảnh</button><button class="btn primary" data-act="finishSlot" data-arg="capture">Về Hôm nay</button></div>`
    });
  };

  /* ----- 8. ask (legal guardrail) ----- */
  const LEGAL = /visa|ビザ|在留|gia hạn|tư cách lưu trú|thẻ lưu trú|vĩnh trú|入管|hợp đồng|sa thải|đuổi việc|nghỉ việc|thôi việc|nợ lương|tiền lương|tăng ca|hộ chiếu|パスポート|quấy rối|ハラスメント|解雇|退職|残業|未払い|労基|転職|đổi việc|契約|永住/i;
  const ANSWER = /đáp án|dap an|答え|正解/i;
  function legalCard() {
    return `<div class="legal" role="note" aria-label="Chuyển hướng pháp lý">
      <p class="legal-tag">${ic('lock', 'ic-xs')}Mẫu cố định · không do AI viết</p>
      <h3 class="legal-h">Sensei Agent không tư vấn visa hay luật lao động</h3>
      <p>Câu hỏi về hoàn cảnh riêng (visa, hợp đồng, lương) cần nơi chính thức trả lời. Trả lời sai có thể ảnh hưởng tư cách lưu trú của chị.</p>
      <p class="ja-block" lang="ja">Sensei Agentは、ビザ（在留資格）や労働に関する法律の相談には対応していません。ご自身の状況については、公的な相談窓口にお問い合わせください。</p>
      <div class="contact">
        <p class="contact-ja jt" lang="ja">${jp('{外国人在留総合|がいこくじんざいりゅうそうごう}インフォメーションセンター')}</p>
        <p class="contact-vn">Trung tâm thông tin lưu trú · Cục Xuất nhập cảnh Nhật Bản</p>
        <a class="btn call" href="tel:0570013904">${ic('phone', 'ic-sm')}Gọi 0570-013904</a>
        <ul class="contact-list">
          <li>${ic('check', 'ic-xs ok')}Có hỗ trợ tiếng Việt</li>
          <li>${ic('clock', 'ic-xs')}T2–T6, 8:30–17:15 (trừ ngày lễ, 29/12–3/1)</li>
          <li>${ic('phone', 'ic-xs')}Điện thoại IP, gọi từ nước ngoài: <span class="nw">03-5796-7112</span></li>
        </ul>
        ${srcLink({ k: 'isa' }, 'Trang chính thức')}
      </div>
      <p class="fine">Kiến thức luật có trong đề thi (ví dụ ${jp('{食品衛生法|しょくひんえいせいほう}')}) Sensei Agent vẫn dạy bình thường. Nhật ký chỉ ghi nhãn “chủ đề pháp lý”, không lưu câu hỏi của chị.</p>
    </div>`;
  }
  function botReply(kind) {
    if (kind === 'legal') return legalCard();
    if (kind === 'answer') return `<p class="bubble-who">${ic('lock', 'ic-xs')}<span>Sensei Agent · mẫu cố định</span></p><p>Sensei Agent chưa đưa đáp án khi chị chưa thử. Tự nhớ lại giúp nhớ lâu hơn. Gợi ý bậc 1: ${jp(D.lessonQs[0].hints[0])}</p><button class="btn ghost sm" data-act="openLessonQ">${ic('book', 'ic-sm')}Mở câu hỏi đó</button>`;
    if (kind === 'haccp') return `<p class="bubble-who">${ic('book', 'ic-xs')}<span>Sensei Agent · câu trả lời mẫu có nguồn</span></p><p>HACCP là cách quản lý vệ sinh theo quy trình. Theo luật, <b>mọi</b> cơ sở phải: lập kế hoạch quản lý vệ sinh, viết quy trình khi cần, ghi chép và lưu, kiểm tra định kỳ.</p>${srcLink({ k: 'hyg2', page: 5, pdf: 9 })}`;
    return `<p class="bubble-who">${ic('info', 'ic-xs')}<span>Prototype · chưa nối AI</span></p><p>Ở bản thật, gia sư AI trả lời câu này, có trích nguồn từ giáo trình chính thức. Trong demo, chị thử một câu gợi ý ở trên nhé.</p>`;
  }
  SCREENS.ask = function () {
    const msgs = S.chat.map((m) => (m.from === 'me'
      ? `<li class="msg me"><p>${esc(m.text)}</p></li>`
      : `<li class="msg bot ${m.kind === 'legal' ? 'wide' : ''}">${botReply(m.kind)}</li>`)).join('');
    const sugg = ['Em muốn đổi visa thì làm sao?', 'Gia hạn visa cần giấy gì?', 'HACCP là gì?', 'Cho em đáp án câu 75℃ luôn'];
    return {
      title: 'Hỏi Sensei Agent', sub: 'Có nguồn · không tư vấn visa', tab: 'ask',
      body: `<div class="pad chat">
        <h1 class="sr-only" tabindex="-1">Hỏi Sensei Agent</h1>
        <ol class="msgs" aria-live="polite">
          <li class="msg bot"><p class="bubble-who">${ic('spark', 'ic-xs')}<span>Sensei Agent</span></p><p>Chị hỏi về bài học, đề thi, từ tiếng Nhật đều được. Sensei Agent trả lời kèm nguồn. Cần người thật giải thích thì chị hỏi cô Linh.</p></li>
          ${msgs}
        </ol>
        <div class="sugg" aria-label="Câu hỏi gợi ý"><p class="eyebrow">Thử hỏi</p>${sugg.map((s) => `<button class="chip" data-act="askChip" data-arg="${esc(s)}">${esc(s)}</button>`).join('')}
          <button class="chip chip-person" data-act="askTeacher" data-arg="ask">${teacherAv()}Em muốn hỏi cô Linh</button></div>
      </div>`,
      dock: `<form class="composer" data-form="chat" autocomplete="off">
        <label class="sr-only" for="chatIn">Câu hỏi của chị</label>
        <input id="chatIn" name="q" type="text" placeholder="Nhập câu hỏi…" enterkeyhint="send">
        <button type="submit" class="send" aria-label="Gửi câu hỏi">${ic('send')}</button>
      </form>`
    };
  };

  /* ----- ask the teacher (T6): the learner sees the AI summary before it is sent ----- */
  const TQ_TEXT = {
    lesson: 'Em chưa hiểu vì sao 60℃ không đủ để diệt khuẩn ạ.',
    ask: 'Cô giải thích thêm giúp em HACCP cần làm những việc gì ạ?',
    plan: 'Cô ơi, T3, T4 tuần sau em làm ca liền, em nên học bài 店舗運営 lúc nào ạ?',
    class: 'Dạ em cảm ơn cô. Tối CN 29/11 em tham gia thi thử được ạ.'
  };
  const TQ_REPLY = {
    lesson: 'Chị Hạnh ơi, 60℃ là mức GIỮ NÓNG để vi khuẩn không tăng (増やさない). Muốn DIỆT thì tâm thực phẩm phải 75℃, giữ ít nhất 1 phút. Mẹo nhớ: giữ 60, diệt 75. Tối CN lớp mình làm thêm 3 câu dạng này nhé.',
    ask: 'HACCP em nhớ 4 việc: lập kế hoạch vệ sinh, viết quy trình, ghi chép và lưu, kiểm tra định kỳ. Tối CN cô chữa thêm ví dụ ở quán mình.',
    plan: 'Hai ngày ca liền em chỉ ôn thẻ 5 phút trên tàu thôi. Bài 店舗運営 cô đã dời sang T5, ngày em nghỉ.',
    class: 'Cô nhận rồi. Hẹn em tối CN, cứ làm hết sức, không tính điểm lớp đâu.'
  };
  function tqLines() {
    const from = S.tq.from;
    const weak = ['weak', 'Phần đang yếu', `${jp('{衛生管理|えいせいかんり}')} · đã nắm ~35%`];
    if (from === 'lesson') {
      const L = S.lesson;
      const { q, st } = ctxQ('lesson');
      const tried = st.tries.length
        ? `Đã chọn ${st.tries.map((i) => `${LET[i]} (${jp(q.opts[i])})`).join(', ')}${st.tries.includes(q.a) ? '' : ' → chưa đúng'}${st.hint ? ` · đã xem gợi ý bậc ${st.hint}` : ''}`
        : `Chưa chọn đáp án${st.hint ? ` · đã xem gợi ý bậc ${st.hint}` : ''}`;
      return [['q', 'Câu đang làm', `Bài HACCP · câu ${(L.mode === 'review' ? L.reviewQ : L.q) + 1}/${D.lessonQs.length}: ${jp(q.q)}`], ['tried', 'Chị đã thử', tried], weak];
    }
    if (from === 'ask') {
      const mine = S.chat.filter((m) => m.from === 'me');
      const last = mine.length ? mine[mine.length - 1].text : 'Chưa hỏi gì trong phiên này';
      return [['q', 'Chị vừa hỏi Sensei Agent', esc(last)], ['tried', 'Sensei Agent đã trả lời', mine.length ? 'Câu trả lời mẫu, có trích nguồn giáo trình' : 'Chưa có'], weak];
    }
    return [['q', 'Kế hoạch tuần này', '138 phút · cô Linh đã sửa buổi T5 19/11'], ['tried', 'Tiến độ hôm nay', `${minutesDone()}/19 phút`], weak];
  }
  SCREENS.askTeacher = function () {
    const T = S.tq;
    const lines = tqLines();
    const sentLines = lines.filter((l) => T.include[l[0]]);
    const mine = `<li class="msg me"><p>${esc(T.text)}</p>${sentLines.length ? `<p class="msg-att">${ic('spark', 'ic-xs')}Kèm ${sentLines.length} dòng Sensei Agent tóm tắt</p>` : ''}</li>`;
    const base = { title: 'Hỏi cô Linh', sub: 'Giáo viên thật trả lời', tab: { lesson: 'today', plan: 'plan', class: 'class' }[S.tq.from] || 'ask', back: true };
    if (T.stage === 'draft') {
      const rows = lines.map((l) => {
        const on = !!T.include[l[0]];
        return `<li><button class="sumline ${on ? 'on' : ''}" role="checkbox" aria-checked="${on}" data-act="tqLine" data-arg="${l[0]}"><span class="check-box" aria-hidden="true">${ic('check', 'ic-sm')}</span><span class="sumline-t"><b>${l[1]}</b><span>${l[2]}</span></span></button></li>`;
      }).join('');
      return Object.assign(base, {
        body: `<div class="pad">
          <div class="to-line">${teacherAv()}<div><p class="to-n">Gửi cô Linh</p><p class="muted">Cô trả lời trong giờ làm việc · Sensei Agent không trả lời thay cô</p></div></div>
          <h1 class="h1" tabindex="-1">Chị xem Sensei Agent tóm tắt gì trước khi gửi</h1>
          <section class="tq-sum" aria-labelledby="sumT">
            <p class="tq-sum-h" id="sumT">${ic('spark', 'ic-sm')}<span>Sensei Agent tóm tắt để cô hiểu nhanh</span><em>AI viết · bỏ dòng nào cũng được</em></p>
            <ul class="sumlines">${rows}</ul>
          </section>
          <label class="field"><span class="field-label">Câu hỏi của chị</span>
            <textarea id="tqText" rows="3" aria-describedby="tqHelp">${esc(T.text)}</textarea></label>
          <p class="helper" id="tqHelp">Viết tiếng Việt cũng được. Cô Linh đọc được tiếng Việt.</p>
          <p class="eyebrow gap">Không gửi kèm</p>
          <ul class="never">${['Tin nhắn khác với Sensei Agent', 'Ảnh, file chị chụp hoặc tải', 'Lịch ca, nơi làm việc'].map((n) => `<li>${ic('lock', 'ic-sm')}<span>${n}</span></li>`).join('')}</ul>
        </div>`,
        dock: `<button class="btn primary block" data-act="tqSend">${ic('send', 'ic-sm')}Gửi cô Linh</button>`
      });
    }
    const replied = T.stage === 'replied';
    const reply = replied ? `<li class="msg teacher">${teacherAv()}<div><p class="bubble-who"><b>Cô Linh</b><span>08:52 T4 18/11 · cô tự viết</span></p><p>${jp(TQ_REPLY[T.from] || TQ_REPLY.class)}</p></div></li>` : '';
    const backTo = T.from === 'lesson' ? ['back', 'Quay lại bài học'] : T.from === 'plan' ? ['back', 'Quay lại Kế hoạch'] : T.from === 'class' ? ['back', 'Quay lại Lớp'] : ['back', 'Quay lại Hỏi Sensei Agent'];
    return Object.assign(base, {
      sub: replied ? 'Cô Linh đã trả lời' : 'Đã gửi · chờ cô trả lời',
      body: `<div class="pad chat">
        <div class="to-line">${teacherAv()}<div><p class="to-n">Cô Linh</p><p class="muted">Giáo viên lớp ${esc(D.klass.title)}</p></div></div>
        <h1 class="sr-only" tabindex="-1">Hỏi cô Linh</h1>
        <ol class="msgs" aria-live="polite">${mine}${reply}</ol>
        ${replied ? `<p class="note ok">${ic('check', 'ic-sm')}<span>Sensei Agent ghi nhớ mẹo của cô vào thẻ ôn “やっつける”, để lần sau nhắc chị.</span></p>`
          : `<section class="tstatus wait" aria-labelledby="tqW">${ic('clock')}<div><p class="eyebrow">Đã gửi · 23:12 T3 17/11</p><h2 class="h3" id="tqW">Cô Linh trả lời trong giờ làm việc</h2>
            <p>Thường trước trưa hôm sau. Sensei Agent không trả lời thay cô; trong lúc chờ, chị cứ học tiếp.</p>
            <div class="tstatus-acts">${extLink(TEACHER + 'questions', 'Xem phía cô Linh')}<button class="btn demo sm" data-act="tqReply">${ic('play', 'ic-sm')}Giả lập: cô Linh trả lời</button></div></div></section>`}
      </div>`,
      dock: `<div class="row2"><button class="btn ghost" data-act="tab" data-arg="today">Về Hôm nay</button><button class="btn primary" data-act="${backTo[0]}">${backTo[1]}</button></div>`
    });
  };

  /* ----- class: teacher messages (T7), announcements, opt-in study group, no ranking ----- */
  SCREENS.class = function () {
    const K = D.klass;
    const G = S.group;
    const annc = [
      ['timer', 'Thi thử tắt AI chung cả lớp', 'CN 29/11 · 20:00–21:10 · làm trên app, chấm bằng code'],
      ['book', `Tuần 2 ôn ${jp('{店舗運営|てんぽうんえい}')}`, 'Tài liệu cô Linh đã xác nhận · có trong bài hằng ngày'],
      ['alert', 'Chỉ chụp/tải tài liệu được phép', 'Không chụp giấy tờ nội bộ, thông tin khách hàng']
    ].map((a) => `<li>${ic(a[0])}<span><b>${a[1]}</b><em>${a[2]}</em></span></li>`).join('');
    const members = [['H', 'Hạnh (chị)', true], ['V', 'Vy', true], ['T', 'Tâm', false], ['N', 'Ngọc', true]]
      .map((m) => `<li><span class="av">${m[0]}</span><span class="o-n">${m[1]}</span><span class="gstat ${m[2] ? 'ok' : ''}">${m[2] ? `${ic('check', 'ic-xs')}Đã học hôm nay` : 'Chưa học'}</span></li>`).join('');
    const group = G === 'joined'
      ? `<article class="group"><div class="group-top"><div><p class="group-n">Nhóm “Tối muộn” (sau ca)</p><p class="muted">4 người · cùng lớp K12 · tự nguyện</p></div><span class="pill">${ic('users', 'ic-xs')}Đã tham gia</span></div>
          <ul class="others gm">${members}</ul>
          <p class="muted">Nhóm chỉ thấy tên gọi và “đã học hôm nay”. Không thấy điểm, câu sai hay tin nhắn.</p>
          <button class="btn ghost sm" data-act="groupSet" data-arg="none">Rời nhóm</button></article>`
      : `<article class="group">
          <p class="group-n">Nhóm học 3–5 người, tự nguyện</p>
          <p>Cùng giờ học với nhau sau ca. Nhóm chỉ thấy tên gọi của chị và chị đã học hôm nay chưa. Không có điểm, không có câu sai.</p>
          ${G === 'later' ? `<p class="muted">Chị chọn để sau. Tham gia lúc nào cũng được.</p>` : ''}
          <div class="row2 lead-r">${G === 'later' ? '<span></span>' : '<button class="btn ghost" data-act="groupSet" data-arg="later">Để sau</button>'}<button class="btn shu" data-act="groupSet" data-arg="joined">${ic('users', 'ic-sm')}Tham gia nhóm học</button></div></article>`;
    return {
      title: 'Lớp', sub: `${esc(K.title)} · cô Linh`, tab: 'class',
      body: `<div class="pad">
        <section class="class-card">
          <div class="class-card-top"><span class="center-logo" aria-hidden="true">${D.center.mark}</span><div><h1 class="h2" tabindex="-1">Lớp ${esc(K.title)}</h1><p class="muted">Cô Linh · ${K.students} học viên · thi ${dmy(day(K.examDate))}</p></div></div>
        </section>
        <p class="eyebrow gap">Tin từ cô Linh</p>
        <article class="tmsg">
          <div class="tmsg-top">${teacherAv()}<div><p class="to-n">Cô Linh</p><p class="muted">20:05 T3 17/11 · gửi cả lớp</p></div></div>
          <p>Cả lớp ơi, tuần này nhiều bạn nhầm 60℃ (giữ nóng) với 75℃ (diệt khuẩn). Tối CN 29/11 lớp thi thử tắt AI 70 phút. Ai bận ca thì nhắn cô để làm bù nhé.</p>
          <p class="prov"><span class="prov-mark" aria-hidden="true"></span>${ic('spark', 'ic-xs')}<span>Trợ lý lớp soạn nháp · cô Linh đã đọc, sửa và bấm gửi. AI không tự gửi tin.</span></p>
          <button class="btn ghost sm" data-act="askTeacher" data-arg="class">${ic('chat', 'ic-sm')}Trả lời cô</button>
        </article>
        <p class="eyebrow gap">Thông báo lớp</p>
        <ul class="annc">${annc}</ul>
        <p class="eyebrow gap">Nhóm học</p>
        ${group}
        <p class="note">${ic('shield', 'ic-sm')}<span><b>Lớp không có bảng xếp hạng công khai.</b> Không ai bị so điểm với người khác; điểm của chị chỉ chị và cô Linh thấy.</span></p>
      </div>`
    };
  };

  /* ----- 9. Sunday replan ----- */
  SCREENS.replan = function () {
    const R = S.re;
    const oldW = D.weekNextOld; const newW = D.weekNextNew;
    const total = sumMin(newW);
    const changed = oldW.days.reduce((t, d, i) => t + Math.max(0, dayMin(d) - dayMin(newW.days[i])), 0);
    const pctChange = Math.round((changed / total) * 100);
    if (R.stage === 'notice') {
      const ch = [[1, 'T3 24/11', '10:30–22:30 (ca liền)'], [2, 'T4 25/11', '10:30–22:30 (ca liền)'], [5, 'T7 28/11', 'Nghỉ (trước: ca tối)']];
      return {
        title: 'Kế hoạch tuần sau', sub: 'CN 22/11 · 20:00', tab: 'plan', back: true,
        body: `<div class="pad">
          <p class="eyebrow">Chủ nhật 22/11 · 20:00</p>
          <h1 class="h1" tabindex="-1">Lịch ca tuần sau thay đổi</h1>
          <p class="lead">Chị vừa chụp lịch ca 23–29/11. Sensei Agent thấy 3 ngày khác trước:</p>
          <ul class="changes">${ch.map((c) => `<li><b>${c[1]}</b><span>${c[2]}</span></li>`).join('')}</ul>
          <ol class="loop" aria-label="Vòng lặp của agent">
            <li class="done">${ic('eye', 'ic-sm')}<span>Quan sát<em>lịch ca mới</em></span></li>
            <li class="done">${ic('cal', 'ic-sm')}<span>Lập lại<em>kế hoạch tuần</em></span></li>
            <li class="done">${ic('shield', 'ic-sm')}<span>Kiểm tra<em>đổi ${pctChange}% &gt; 20%</em></span></li>
            <li class="cur">${ic('gate', 'ic-sm')}<span>Hỏi chị<em>Chốt A</em></span></li>
          </ol>
          <section class="autolog"><p class="eyebrow">Tuần này Sensei Agent đã tự chỉnh</p>
            <p>${ic('check', 'ic-sm ok')}<span>T5 19/11: chị bỏ lỡ bài 15:00 → dời 10 phút sang T7. Đổi 10/138 phút = 7%, dưới 20% nên Sensei Agent tự làm, không cần hỏi.</span></p></section>
        </div>`,
        dock: `<button class="btn primary block" data-act="reDiff">Xem kế hoạch mới${ic('next', 'ic-sm')}</button>`
      };
    }
    const start = day(newW.start);
    const rows = newW.days.map((d, i) => {
      const o = dayMin(oldW.days[i]); const n = dayMin(d); const delta = n - o;
      const date = addDays(start, i);
      return `<li class="drow ${delta ? 'changed' : ''}">
        <div class="wday"><b>${WD[date.getDay()]}</b><span>${dm(date)}</span></div>
        <div class="wmid">${dayBar(oldW.days[i], { faded: true })}${dayBar(d)}</div>
        <div class="dmin">${delta ? `<span class="old">${o}</span>${ic('next', 'ic-xs')}` : ''}<b>${n}</b>${delta ?`<em class="${delta > 0 ? 'up' : 'down'}">${delta > 0 ? '+' : '−'}${Math.abs(delta)}</em>` : ''}</div>
      </li>`;
    }).join('');
    const decided = R.approved || R.kept;
    return {
      title: 'Kế hoạch tuần sau', sub: 'So sánh · 23–29/11', tab: 'plan', back: true,
      body: `<div class="pad">
        <p class="eyebrow">Tuần 2 · 23–29/11</p>
        <h1 class="h1" tabindex="-1">Sensei Agent đề xuất dời ${changed} phút</h1>
        <div class="delta">
          <div class="delta-num"><b class="num shu-num">${pctChange}%</b><span>kế hoạch thay đổi</span></div>
          <div class="delta-bar" aria-hidden="true"><span class="delta-fill" style="width:${Math.min(100, pctChange * 2)}%"></span><span class="delta-th" style="left:40%"><em>ngưỡng 20%</em></span></div>
          <p class="delta-f">${changed} phút đổi chỗ ÷ ${total} phút cả tuần. Tổng phút giữ nguyên: ${total}.</p>
        </div>
        <p class="legend"><span class="lg-old"></span>Kế hoạch cũ <span class="lg-shift"></span>Ca mới <span class="lg-study"></span>Khung học mới</p>
        <ol class="week diff">${rows}</ol>
        ${R.approved ? stamp('20:06 CN 22/11') : R.kept
          ? `<p class="note">${ic('info', 'ic-sm')}<span>Chị giữ kế hoạch cũ. T3, T4 trùng ca liền nên dễ bỏ lỡ; nếu bỏ lỡ từ 2 ngày, Sensei Agent sẽ đề xuất lại.</span></p>`
          : `<section class="gate" aria-labelledby="gateA2">${gateHead('A', 'Chốt A · chị quyết định', `Đổi ${pctChange}%: cần chị duyệt`, 'gateA2')}<p>Dưới 20% Sensei Agent tự chỉnh. Lần này trên 20%, nên Sensei Agent chưa đổi gì cho tới khi chị bấm duyệt.</p></section>`}
      </div>`,
      dock: decided
        ? (R.kept ? `<div class="row2"><button class="btn ghost" data-act="nav" data-arg="plan" data-tabnav="1">Về Kế hoạch</button><button class="btn shu" data-act="approveRe">Đổi ý: duyệt mới</button></div>`
          : `<button class="btn primary block" data-act="nav" data-arg="plan" data-tabnav="1">Về Kế hoạch</button>`)
        : `<div class="row2"><button class="btn ghost" data-act="keepRe">Giữ bản cũ</button><button class="btn shu" data-act="approveRe">${ic('check', 'ic-sm')}Duyệt bản mới</button></div>`
    };
  };

  /* ----- 10. mock exam, AI off ----- */
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const tutorOff = () => `<div class="tutor-off"><button class="btn ghost block" disabled aria-describedby="tutorWhy" data-why="Gia sư tắt khi thi thử">${ic('lock', 'ic-sm')}Hỏi gia sư</button>
    <p id="tutorWhy">Đang thi thử nên gia sư tắt, để đo đúng sức của chị. Nghiên cứu: người luyện với AI không rào chắn làm bài thi không có AI kém hơn 17%. <a href="${D.sources.bastani.url}" target="_blank" rel="noopener">Bastani 2025, PNAS${ic('ext', 'ic-xs')}</a></p></div>`;
  SCREENS.mock = function () {
    const M = S.mock;
    const qs = D.mockQs.slice(0, M.len);
    if (!M.started) {
      const len = (n, meta) => `<button class="choice ${M.len === n ? 'on' : ''}" role="radio" aria-checked="${M.len === n}" data-act="mockLen" data-arg="${n}">
          <span class="choice-vn">${n} câu · khoảng ${Math.round((n * PACE) / 60)} phút</span><span class="choice-meta">${meta}</span><span class="radio" aria-hidden="true"></span></button>`;
      return {
        title: 'Thi thử', sub: 'AI tắt', tab: 'me', back: true,
        body: `<div class="pad">
          <p class="eyebrow">Thi thử ngắn · chế độ tắt AI</p>
          <h1 class="h1" tabindex="-1">Thi như thật, không có gia sư</h1>
          <div class="choices" role="radiogroup" aria-label="Độ dài bài thi">${len(10, 'Vừa giờ nghỉ 15 phút giữa hai ca')}${len(20, 'Khi rảnh 30 phút, ví dụ tối không đi làm')}</div>
          <div class="fullmock">${ic('cal')}<div><p class="fullmock-t">Đề đủ: 55 câu · 70 phút</p>
            <p class="fullmock-d">Nên làm vào ngày nghỉ, như thi thật. Bản demo chỉ có ${D.mockQs.length} câu mẫu.</p>
            ${M.fullAsked ? `<p class="fullmock-ok">${ic('check', 'ic-xs')}<span>Đã ghi: Sensei Agent gợi ý đề đủ vào ngày nghỉ gần nhất theo lịch ca của chị.</span></p>` : `<button class="btn ghost sm" data-act="mockFull">${ic('cal', 'ic-sm')}Gợi ý vào ngày nghỉ</button>`}</div></div>
          <ul class="facts">
            <li>${ic('timer', 'ic-sm')}<span>${M.len} câu trong ${mmss(M.left)}: cùng nhịp đề thật (55 câu trong 70 phút, khoảng 76 giây một câu).</span></li>
            <li>${ic('lock', 'ic-sm')}<span>Gia sư và gợi ý đều khoá. Máy chấm bằng code, không dùng AI.</span></li>
            <li>${ic('book', 'ic-sm')}<span>Câu hỏi tiếng Nhật, không có furigana, giống đề thật. Tra từ và dịch câu mở lại sau khi nộp bài.</span></li>
          </ul>
          ${teamLabel(` · ${D.mockQs.length} câu mẫu`)}
          <div class="srcs">${srcLink({ k: 'otaffVi' }, 'Cách thi')}</div>
        </div>`,
        dock: `<button class="btn primary block" data-act="mockStart">${ic('play', 'ic-sm')}Bắt đầu ${M.len} câu</button>`
      };
    }
    if (M.submitted) {
      const byArea = {};
      let score = 0;
      qs.forEach((q, i) => {
        const ok = M.ans[i] === q.a; if (ok) score++;
        byArea[q.area] = byArea[q.area] || [0, 0]; byArea[q.area][1]++; if (ok) byArea[q.area][0]++;
      });
      const areas = Object.keys(byArea).map((k) => `<li>${areaTag('gaishoku', k)}<b>${byArea[k][0]}/${byArea[k][1]}</b></li>`).join('');
      const review = qs.map((q, i) => {
        const ok = M.ans[i] === q.a;
        return `<li class="${ok ? 'ok' : 'miss'}"><p class="rv-q" lang="ja" data-long="sentence" data-arg="${i}">問${i + 1}　${tapJa(q.q)}</p>
          <p class="rv-a">${ok ? ic('check', 'ic-xs') : ic('x', 'ic-xs')}<span>${M.ans[i] === undefined ? 'Chưa làm' : ok ? 'Đúng' : `Chị chọn ${M.ans[i] + 1}`} · đáp án: ${q.a + 1}. <span lang="ja">${esc(q.opts[q.a])}</span></span></p>
          ${peerLine(q.peer)}
          <button class="btn ghost sm rv-tr" data-act="sentence" data-arg="${i}">${ic('chat', 'ic-sm')}Dịch cả câu</button>
          ${srcLink(q.src)}</li>`;
      }).join('');
      return {
        title: 'Thi thử', sub: 'Kết quả', tab: 'me', back: true,
        body: `<div class="pad">
          <p class="eyebrow">Kết quả thi thử ${qs.length} câu · chấm bằng code</p>
          <h1 class="h1" tabindex="-1"><span class="num big">${score}/${qs.length}</span> câu đúng</h1>
          <ul class="byarea">${areas}</ul>
          <p class="note">${ic('shield', 'ic-sm')}<span>Cô Linh thấy điểm này để dạy. Chị Mai (đơn vị hỗ trợ) chỉ thấy nếu chị bật “Điểm thi thử” (Chốt B).</span></p>
          <h2 class="h3">Xem lại từng câu</h2>
          <p class="tap-hint">${ic('book', 'ic-xs')}<span>Chạm từ có gạch chấm để xem nghĩa. Giữ lâu trên câu, hoặc bấm “Dịch cả câu”, để dịch cả câu. Miễn phí, không dùng AI.</span></p>
          <ol class="rv">${review}</ol>
        </div>`,
        dock: `<div class="row2"><button class="btn ghost" data-act="mockRetry">${ic('refresh', 'ic-sm')}Làm lại</button><button class="btn primary" data-act="nav" data-arg="privacy">Cài đặt chia sẻ</button></div>`
      };
    }
    const q = qs[M.q];
    const opts = q.opts.map((o, i) => `<li><button class="opt ${M.ans[M.q] === i ? 'is-picked' : ''}" role="radio" aria-checked="${M.ans[M.q] === i}" data-act="mockPick" data-arg="${i}"><span class="opt-key">${i + 1}</span><span class="opt-text" lang="ja">${esc(o)}</span></button></li>`).join('');
    const dots = qs.map((_, i) => `<button class="qdot ${i === M.q ? 'cur' : ''} ${M.ans[i] !== undefined ? 'ans' : ''}" data-act="mockGo" data-arg="${i}" aria-label="Câu ${i + 1}${M.ans[i] !== undefined ? ', đã làm' : ''}" ${i === M.q ? 'aria-current="step"' : ''}>${i + 1}</button>`).join('');
    const answered = Object.keys(M.ans).length;
    return {
      title: 'Thi thử', sub: 'AI tắt', tab: 'me', back: true,
      body: `<div class="mockbar" role="timer" aria-label="Thời gian còn lại">${ic('lock', 'ic-sm')}<span>AI tắt</span><b class="mono ${M.left < 60 ? 'low' : ''}" id="mockTime">${mmss(M.left)}</b></div>
        <div class="pad">
          <nav class="qdots" aria-label="Chọn câu">${dots}</nav>
          <p class="eyebrow">問${M.q + 1} / ${qs.length} · ${area('gaishoku', q.area).vn} · tra từ mở sau khi nộp</p>
          <h1 class="qstem ja-stem" tabindex="-1" lang="ja">${esc(q.q)}</h1>
          <ol class="opts" role="radiogroup" aria-label="Các lựa chọn">${opts}</ol>
          ${tutorOff()}
        </div>`,
      dock: `<div class="row2">${M.q > 0 ? `<button class="btn ghost" data-act="mockGo" data-arg="${M.q - 1}">${ic('back', 'ic-sm')}Câu trước</button>` : `<span class="dock-note">Đã làm ${answered}/${qs.length}</span>`}
        ${M.q + 1 < qs.length ? `<button class="btn primary" data-act="mockGo" data-arg="${M.q + 1}">Câu sau${ic('next', 'ic-sm')}</button>` : `<button class="btn primary" data-act="mockSubmit">Nộp bài</button>`}</div>`
    };
  };

  /* ----- quick review: wrong last time, not done yet, three colour marks ----- */
  SCREENS.quick = function () {
    const Q = S.quick;
    const base = { title: 'Ôn nhanh', tab: 'today', back: true };
    const toMenu = `<button class="btn ghost" data-act="quickMenu">${ic('list', 'ic-sm')}Chọn lại</button>`;
    if (!Q.f) {
      const row = (x) => {
        const n = quickList(x[0]).length;
        const lead = x[3] ? ic(x[3]) : `<i class="qdot-c qc-${x[0]}" aria-hidden="true"></i>`;
        return `<li><button class="mrow" data-act="quick" data-arg="${x[0]}">${lead}<span class="mrow-t">${x[1]}<em>${x[2]}</em></span><span class="qn ${n ? '' : 'zero'}">${n} câu</span>${ic('next', 'ic-sm')}</button></li>`;
      };
      const best = QUICK.find((x) => quickList(x[0]).length);
      return Object.assign(base, {
        sub: 'Bài HACCP · 10 câu',
        body: `<div class="pad">
          <p class="eyebrow">Ôn nhanh · bài HACCP · ${D.lessonQs.length} câu</p>
          <h1 class="h1" tabindex="-1">Chọn nhóm câu để ôn</h1>
          <p class="lead">Mỗi câu chấm ngay. Gợi ý vẫn có trước đáp án, như trong bài học.</p>
          <ul class="menu">${QUICK.slice(0, 2).map(row).join('')}</ul>
          <p class="eyebrow gap">Câu chị tự đánh dấu</p>
          <ul class="menu">${QUICK.slice(2).map(row).join('')}</ul>
          <p class="helper">${ic('shield', 'ic-xs')} Lịch sử trả lời và dấu màu chỉ lưu trên điện thoại của chị, không gửi cho công ty hay đơn vị hỗ trợ.</p>
        </div>`,
        dock: best
          ? `<button class="btn primary block" data-act="quick" data-arg="${best[0]}">Ôn ${best[1].toLowerCase()} · ${quickList(best[0]).length} câu${ic('next', 'ic-sm')}</button>`
          : `<button class="btn primary block" data-act="slot" data-arg="lesson">Làm bài 10 phút</button>`
      });
    }
    const lab = QUICK.find((x) => x[0] === Q.f);
    const n = Q.list.length;
    if (!n) {
      const E = {
        wrong: ['check', 'Chưa có câu sai', 'Câu chị làm sai, phải nhờ gợi ý hoặc xem đáp án sẽ hiện ở đây.'],
        new: ['check', `Chị đã làm hết ${D.lessonQs.length} câu`, 'Không còn câu mới trong bài này. Mai Sensei Agent mở bài tiếp theo kế hoạch.']
      }[Q.f] || ['flag', `Chưa có câu nào ${lab[1].toLowerCase()}`, 'Sau khi trả lời một câu, chị chạm “Chưa hiểu”, “Chưa chắc” hoặc “Đã chắc” ngay dưới câu để đánh dấu.'];
      return Object.assign(base, {
        sub: lab[1],
        body: `<div class="pad"><p class="eyebrow">Ôn nhanh · ${lab[1]}</p><h1 class="sr-only" tabindex="-1">${E[1]}</h1>${empty(E[0], E[1], E[2])}</div>`,
        dock: `<div class="row2">${toMenu}<button class="btn primary" data-act="slot" data-arg="lesson">Làm bài 10 phút</button></div>`
      });
    }
    if (Q.i >= n) {
      const ok = Q.list.filter((qi, k) => qResult(D.lessonQs[qi], Q.st[k]) === 'ok').length;
      return Object.assign(base, {
        sub: `${lab[1]} · xong`,
        body: `<div class="pad"><p class="eyebrow">Ôn nhanh · ${lab[1]}</p><h1 class="sr-only" tabindex="-1">Xong ${n} câu</h1>
          ${empty('check', `Xong ${n} câu · đúng ngay ${ok}/${n}`, ok === n ? 'Các câu này đã ra khỏi nhóm “Câu sai lần trước”.' : 'Câu còn sai vẫn nằm trong nhóm “Câu sai lần trước” để chị ôn lần sau.')}</div>`,
        dock: `<div class="row2">${toMenu}<button class="btn primary" data-act="tab" data-arg="today">Về Hôm nay</button></div>`
      });
    }
    const q = D.lessonQs[Q.list[Q.i]];
    const st = qState(Q.st, Q.i);
    return Object.assign(base, {
      sub: `Câu ${Q.i + 1}/${n}`,
      body: `<div class="pad">
        ${progressBar(Q.i, n, 'Tiến độ ôn nhanh')}
        <p class="eyebrow">Ôn nhanh · ${lab[1]} · câu ${Q.i + 1}/${n}</p>
        ${qBlock('drill', q, st, Q.i, n)}
      </div>`,
      dock: isDone(q, st)
        ? `<div class="row2">${toMenu}<button class="btn primary" data-act="quickNext">${Q.i + 1 < n ? 'Câu tiếp' : 'Xong'}${ic('next', 'ic-sm')}</button></div>`
        : `<p class="dock-hint">${ic('info', 'ic-sm')}Chọn một đáp án. Gợi ý có sẵn nếu cần.</p>`
    });
  };

  /* ----- pass likelihood: an estimate against the anonymous average of people who passed ----- */
  const RADAR = { hyg: [0, -1, 'Vệ sinh'], sm: [1, 0, 'Vận hành'], prep: [0, 1, 'Chế biến'], cs: [-1, 0, 'Phục vụ'] };
  function radar(areas) {
    const R = 78;
    const pt = (a, v) => { const d = RADAR[a.id]; return [(d[0] * R * v).toFixed(1), (d[1] * R * v).toFixed(1)]; };
    const poly = (fn) => areas.map((a) => pt(a, fn(a)).join(',')).join(' ');
    const rings = [0.25, 0.5, 0.75, 1].map((v) => `<polygon class="rd-ring" points="${poly(() => v)}"/>`).join('');
    const axes = areas.map((a) => { const [x, y] = pt(a, 1); return `<line class="rd-axis" x1="0" y1="0" x2="${x}" y2="${y}"/>`; }).join('');
    const labels = areas.map((a) => {
      const d = RADAR[a.id];
      const x = d[0] * (R + 10); const y = d[1] * (R + 10) + (d[1] < 0 ? -2 : d[1] > 0 ? 14 : 5);
      return `<text class="rd-lab" x="${x}" y="${y}" text-anchor="${d[0] > 0 ? 'start' : d[0] < 0 ? 'end' : 'middle'}">${d[2]}</text>`;
    }).join('');
    const dots = (cls, fn, who) => areas.map((a) => { const [x, y] = pt(a, fn(a)); return `<circle class="${cls}" cx="${x}" cy="${y}" r="4.5"><title>${who} · ${a.vn}: ${Math.round(fn(a) * 100)}%</title></circle>`; }).join('');
    const peer = (a) => D.passers[a.id];
    return `<svg class="radar" viewBox="-150 -104 300 212" role="img" aria-labelledby="rdT"><title id="rdT">Biểu đồ 4 phần thi: đường liền là chị, đường đứt là người đã đỗ. Số cụ thể ở bảng bên dưới.</title>
      ${rings}${axes}
      <polygon class="rd-peer" points="${poly(peer)}"/>
      <polygon class="rd-me" points="${poly((a) => a.p)}"/>
      ${dots('rd-dot-peer', peer, 'Người đã đỗ')}${dots('rd-dot-me', (a) => a.p, 'Chị')}
      ${labels}</svg>`;
  }
  SCREENS.pass = function () {
    const e = D.exams.gaishoku;
    const est = Math.round(e.areas.reduce((t, a) => t + a.pts * a.p, 0));
    const peerPts = Math.round(e.areas.reduce((t, a) => t + a.pts * D.passers[a.id], 0));
    const level = est >= e.pass + 10 ? 2 : est >= e.pass - 15 ? 1 : 0;
    const LV = ['Thấp', 'Sát nút', 'Cao'];
    const meter = `<ol class="meter" aria-label="Khả năng đỗ: ${LV[level]}">${LV.map((l, i) => `<li class="${i === level ? 'on' : ''}" ${i === level ? 'aria-current="true"' : ''}>${l}</li>`).join('')}</ol>`;
    const gain = (a) => a.pts * (D.passers[a.id] - a.p);
    const top = e.areas.slice().sort((x, y) => gain(y) - gain(x))[0];
    const rows = e.areas.map((a) => `<tr class="${a === top ? 'top' : ''}"><th scope="row"><span class="cmp-n"><span class="jt">${jp(a.ja)}</span><em>${esc(a.vn)} · ${a.pts}đ</em></span></th><td class="mono">${Math.round(a.p * 100)}%</td><td class="mono">${Math.round(D.passers[a.id] * 100)}%</td></tr>`).join('');
    return {
      title: 'Khả năng đỗ', sub: 'Ước tính · số mẫu', tab: 'today', back: true,
      body: `<div class="pad">
        <p class="eyebrow">Ước tính · dữ liệu mẫu · ${dm(TODAY)}</p>
        <h1 class="h1" tabindex="-1">Khả năng đỗ hôm nay: ${LV[level].toLowerCase()}</h1>
        ${meter}
        <div class="passnum"><p><b class="num">~${est}</b><span>/${e.total} điểm ước tính</span></p><p><b class="num">${e.pass}</b><span>điểm cần để đỗ</span></p></div>
        <p class="lead">Còn thiếu khoảng ${e.pass - est} điểm, còn ${weeksLeft(TODAY)} tuần. Phần <b>${esc(top.vn)}</b> gỡ được nhiều điểm nhất.</p>
        <section class="radar-card" aria-label="So với người đã đỗ">
          <p class="eyebrow">Chị so với người đã đỗ</p>
          <p class="rd-legend"><span class="lg-i"><span class="lg-me"></span>Chị (ước tính)</span><span class="lg-i"><span class="lg-peer"></span>Người đã đỗ (trung bình ẩn danh)</span></p>
          ${radar(e.areas)}
          <table class="cmp"><thead><tr><th scope="col">Phần thi</th><th scope="col">Chị</th><th scope="col">Người đã đỗ</th></tr></thead><tbody>${rows}</tbody></table>
        </section>
        <p class="note">${ic('info', 'ic-sm')}<span>Đây là <b>ước tính</b> từ bài chẩn đoán và các câu chị đã làm, không phải điểm thi thật. “Người đã đỗ” là trung bình ẩn danh của người học tự báo đã đỗ (khoảng ${peerPts}/${e.total} điểm): không tên, không xếp hạng ai. Bản demo dùng số mẫu; app thật chỉ hiện khi đủ nhiều người.</span></p>
        <p class="helper">${ic('shield', 'ic-xs')} Ước tính này không gửi cho công ty. Chị Mai chỉ thấy số chị tự bật ở “Ai thấy gì”.</p>
      </div>`,
      dock: `<button class="btn primary block" data-act="slot" data-arg="lesson">Học ${esc(top.vn.toLowerCase())} ngay${ic('next', 'ic-sm')}</button>`
    };
  };

  /* ----- 11. privacy (gate B) ----- */
  const METRICS = [
    { k: 'minutes', label: 'Phút học mỗi tuần', sample: '112 phút tuần này' },
    { k: 'streak', label: 'Chuỗi ngày học', sample: '7 ngày liên tiếp' },
    { k: 'syllabus', label: '% đề cương đã học', sample: '18% đề cương' },
    { k: 'mock', label: 'Điểm thi thử', sample: null }
  ];
  const mockSample = () => {
    if (S.mock.submitted) { const s = D.mockQs.slice(0, S.mock.len).filter((q, i) => S.mock.ans[i] === q.a).length; return `${s}/${S.mock.len} câu (thi thử gần nhất)`; }
    return '7/10 câu (thi thử gần nhất)';
  };
  const metricVal = (m) => (m.k === 'mock' ? mockSample() : m.sample);
  const NEVER = ['Câu trả lời sai', 'Tin nhắn với Sensei Agent', 'Cảm xúc, ghi chú', 'Ảnh chụp và chữ đã che'];

  /* What cô Linh sees to teach; chats only with the learner's T5 consent. She never sees the rest. */
  const LINH_SEES = ['Kế hoạch và tiến độ học', 'Bản đồ năng lực, điểm thi thử', 'Câu sai và số gợi ý đã dùng', 'Câu chị báo sai, câu chị hỏi cô (kèm tóm tắt chị đã xem)'];
  const LINH_NEVER = ['Ảnh và file gốc chị chụp hoặc tải', 'Tin nhắn với Sensei Agent, trừ khi chị bật mẫu hội thoại', 'Lịch ca, tên nơi làm việc', 'Không đổi được ngày thi của chị, không gửi dữ liệu cho công ty hay đơn vị hỗ trợ'];

  SCREENS.privacy = function () {
    const on = METRICS.filter((m) => S.consent[m.k]).length;
    const linh = S.privTab === 'linh';
    const tiers = `<div class="tiers" role="tablist" aria-label="Ai thấy gì">
      <button role="tab" class="tier ${linh ? 'on' : ''}" aria-selected="${linh}" data-act="privTab" data-arg="linh"><span class="av av-teach" aria-hidden="true">L</span><span class="tier-t"><b>Cô Linh</b><em>giáo viên · xem để dạy</em></span><span class="tier-n">${S.chatConsent ? 'Có mẫu hội thoại' : 'Học tập'}</span></button>
      <button role="tab" class="tier ${linh ? '' : 'on'}" aria-selected="${!linh}" data-act="privTab" data-arg="mai"><span class="av av-mai" aria-hidden="true">M</span><span class="tier-t"><b>Chị Mai</b><em>đơn vị hỗ trợ · Chốt B</em></span><span class="tier-n">${on}/4 số</span></button></div>`;
    const ledger = S.ledger.length
      ? `<ol class="ledger">${S.ledger.slice().reverse().map((e) => `<li><span class="mono">${e.t}</span><span class="${e.off ? 'off' : 'on'}">${e.off ? 'Tắt' : 'Bật'}</span><span>${esc(e.what)}</span></li>`).join('')}</ol>`
      : '<p class="muted">Chưa có thay đổi nào. Mặc định mọi chia sẻ thêm đều tắt.</p>';
    const common = `<p class="eyebrow gap">Sổ đồng ý</p>
        ${ledger}
        <section class="danger-zone"><p class="eyebrow">Xoá dữ liệu</p>
          <p>Xoá hồ sơ năng lực, kế hoạch, lịch sử trả lời, chữ đã che và sổ đồng ý bằng một chạm.</p>
          <button class="btn danger block" data-act="askWipe">${ic('trash', 'ic-sm')}Xoá toàn bộ dữ liệu</button></section>`;
    if (linh) {
      return {
        title: 'Ai thấy gì', sub: 'Cô Linh · giáo viên', tab: 'me', back: true,
        body: `${tiers}<div class="pad">
          <p class="eyebrow">Tầng 1 · giáo viên của lớp</p>
          <h1 class="h1" tabindex="-1">Cô Linh thấy gì?</h1>
          <p class="lead">Cô Linh thấy việc học của chị để dạy đúng chỗ. Chị không cần bật; đây là điều kiện của lớp học.</p>
          <ul class="sees">${LINH_SEES.map((n) => `<li>${ic('eye', 'ic-sm')}<span>${n}</span></li>`).join('')}</ul>
          <ul class="togs">
            <li class="tog"><div class="tog-l"><p class="tog-t" id="lbl-chat">Cho cô đọc mẫu hội thoại (T5)</p><p class="tog-d">${S.chatConsent ? 'Đang bật · cô đọc vài đoạn chị hỏi Sensei Agent, đã ẩn tên, để sửa cách AI giảng' : 'Đang tắt · cô không đọc tin nhắn của chị với Sensei Agent'}</p></div>
              <button class="switch ${S.chatConsent ? 'on' : ''}" role="switch" aria-checked="${S.chatConsent}" aria-labelledby="lbl-chat" data-act="chatConsent"><span></span></button></li>
          </ul>
          <p class="eyebrow gap">Cô Linh không bao giờ</p>
          <ul class="never">${LINH_NEVER.map((n) => `<li>${ic('lock', 'ic-sm')}<span>${n}</span></li>`).join('')}</ul>
          ${common}
        </div>`
      };
    }
    const toggles = METRICS.map((m) => {
      const v = S.consent[m.k];
      return `<li class="tog"><div class="tog-l"><p class="tog-t" id="lbl-${m.k}">${m.label}</p><p class="tog-d">${v ? `Chị Mai thấy: <b>${esc(metricVal(m))}</b>` : 'Đang tắt · chị Mai không thấy'}</p></div>
        <button class="switch ${v ? 'on' : ''}" role="switch" aria-checked="${v}" aria-labelledby="lbl-${m.k}" data-act="toggle" data-arg="${m.k}"><span></span></button></li>`;
    }).join('');
    return {
      title: 'Ai thấy gì', sub: 'Chốt B · chị Mai, đơn vị hỗ trợ', tab: 'me', back: true,
      body: `${tiers}<div class="pad">
        ${gateHead('B', 'Chốt B · chị quyết định', 'Chị Mai được xem gì?', 'gateB')}
        <p class="lead">Chị Mai làm ở đơn vị hỗ trợ người lao động (<span lang="ja">登録支援機関</span>), có nghĩa vụ hỗ trợ chị học tiếng Nhật. Mặc định chị Mai không thấy gì. Chị bật từng số, tắt lúc nào cũng được.</p>
        <p class="eyebrow">Có thể chia sẻ · đang bật ${on}/4 · số mẫu</p>
        <ul class="togs">${toggles}</ul>
        <div class="row2 tight">
          <button class="btn ghost" data-act="mentorPreview">${ic('eye', 'ic-sm')}Xem như chị Mai</button>
          ${on ? `<button class="btn ghost" data-act="revokeAll">${ic('x', 'ic-sm')}Thu hồi tất cả</button>` : `<button class="btn ghost" disabled data-why="Chưa bật loại số nào" aria-describedby="noRevoke">${ic('x', 'ic-sm')}Thu hồi tất cả</button>`}
        </div>
        ${on ? '' : '<p class="helper" id="noRevoke">Chưa bật loại số nào, nên chưa có gì để thu hồi.</p>'}
        <p class="eyebrow gap">Chị Mai không bao giờ thấy</p>
        <ul class="never">${NEVER.map((n) => `<li>${ic('lock', 'ic-sm')}<span>${n}</span></li>`).join('')}</ul>
        ${common}
      </div>`
    };
  };

  /* ----- support-org view (chị Mai, 登録支援機関): only the numbers each learner enabled ----- */
  SCREENS.mentor = function () {
    const snap = S.mentorSnap || { minutes: false, streak: false, syllabus: false, mock: false };
    const shared = METRICS.filter((m) => snap[m.k]);
    const tiles = METRICS.map((m) => `<div class="tile ${snap[m.k] ? '' : 'off'}"><p class="tile-l">${m.label}</p>${snap[m.k] ? `<p class="tile-v">${esc(metricVal(m))}</p>` : '<p class="tile-v none">—<span>chưa chia sẻ</span></p>'}</div>`).join('');
    const others = [
      ['Lan', 'JLPT N3', 'Chuỗi 12 ngày', '—'],
      ['Minh', '外食業2号', '—', '—'],
      ['Thảo', '外食業2号', '96 phút/tuần', '31% đề cương']
    ].map((o) => `<li><span class="av">${o[0][0]}</span><span class="o-n">${o[0]}<em>${o[1]}</em></span><span class="o-v">${o[2]}</span><span class="o-v">${o[3]}</span></li>`).join('');
    return {
      title: 'Trang chị Mai', sub: 'Đơn vị hỗ trợ · chỉ đọc', role: 'mentor', back: true,
      body: `<div class="pad">
        <p class="eyebrow">Chị Mai · 登録支援機関 · hỗ trợ 13 người (mẫu)</p>
        <h1 class="h1" tabindex="-1">Người chị Mai hỗ trợ</h1>
        <p class="lead">Chị Mai chỉ thấy số mà từng người tự bật. Không có câu sai, tin nhắn, cảm xúc hay ảnh.</p>
        <p class="note">${ic('info', 'ic-sm')}<span>Dùng làm hồ sơ hỗ trợ học tiếng Nhật (nghĩa vụ của đơn vị hỗ trợ), không dùng để đánh giá người lao động.</span></p>
        ${srcLink({ k: 'isaYoryo', page: 100 }, 'Nghĩa vụ')}
        <article class="mcard">
          <div class="mcard-top"><span class="av big">H</span><div><p class="mcard-n">Chị Hạnh</p><p class="mcard-e">${jp('{外食業|がいしょくぎょう}2{号|ごう}')} · thi 21/2/2027</p></div><span class="shared">${shared.length}/4 số</span></div>
          ${shared.length ? `<div class="tiles">${tiles}</div>` : empty('lock', 'Chị Hạnh chưa chia sẻ số nào', 'Chị Mai không thể yêu cầu xem câu sai, tin nhắn hay cảm xúc. Chỉ người học mới bật được.')}
          <div class="mcard-foot"><span class="muted">Cập nhật ${esc(S.mentorAt || '09:00 T2 23/11')}</span><button class="btn ghost sm" data-act="mentorReload">${ic('refresh', 'ic-sm')}Tải lại</button></div>
          ${METRICS.some((m) => !!snap[m.k] !== !!S.consent[m.k]) ? `<p class="demo-hint">${ic('info', 'ic-xs')}<span>Gợi ý demo: chị Hạnh vừa đổi cài đặt sau lần tải này. Bấm “Tải lại” để thấy thay đổi.</span></p>` : ''}
        </article>
        <p class="eyebrow gap">Người khác chị Mai hỗ trợ (mẫu)</p>
        <ul class="others">${others}</ul>
        <p class="muted">và 9 người khác · mỗi người tự quyết chia sẻ gì</p>
        <section class="never-box"><p class="eyebrow">Chị Mai không bao giờ thấy</p><ul class="never">${NEVER.map((n) => `<li>${ic('lock', 'ic-sm')}<span>${n}</span></li>`).join('')}</ul></section>
      </div>`,
      dock: `<button class="btn primary block" data-act="leaveRole" data-arg="privacy">${ic('back', 'ic-sm')}Về app của chị Hạnh</button>`
    };
  };

  /* ----- shared-question review moved to the teacher web: this screen only hands off ----- */
  SCREENS.review = function () {
    const q = [
      ['Câu dùng chung chờ cô duyệt', 'T2 · chặn: chưa duyệt thì chưa ai thấy', 2 + (S.capShared ? 1 : 0)],
      ['Câu học viên báo sai', 'T3 · từ 2 báo trở lên câu tự ẩn', S.reports.length],
      ['Kế hoạch đầu chờ cô xem', 'T1 · không chặn, người học vẫn học', 3]
    ].map((r) => `<li><span class="hq-n num">${r[2]}</span><span class="hq-t"><b>${r[0]}</b><em>${r[1]}</em></span></li>`).join('');
    return {
      title: 'Duyệt câu dùng chung', sub: 'Đã chuyển sang web giáo viên', role: 'review', back: true,
      body: `<div class="pad">
        <p class="eyebrow">Trước đây là Chốt C trong app</p>
        <h1 class="h1" tabindex="-1">Việc duyệt câu giờ là của cô Linh</h1>
        <p class="lead">Người duyệt là giáo viên của lớp, làm trên web giáo viên. App của chị Hạnh chỉ hiện huy hiệu “Cô Linh đã duyệt” trên câu dùng chung.</p>
        <p class="eyebrow gap">Hàng chờ của cô Linh lúc này (chỉ đọc, mẫu)</p>
        <ul class="handoff-q">${q}</ul>
        ${extLink(TEACHER + 'queue', `${ic('school', 'ic-sm')}<span>Mở web giáo viên</span>`, 'btn primary block handoff')}
        <p class="helper">Mở tab mới. Cô Linh chỉ thấy chữ đã che, không thấy ảnh hay file gốc.</p>
      </div>`,
      dock: `<button class="btn ghost block" data-act="leaveRole" data-arg="me">${ic('back', 'ic-sm')}Về app của chị Hạnh</button>`
    };
  };

  /* ----- eval board ----- */
  SCREENS.eval = function () {
    const rows = D.evalSuites.map((s) => `<li class="suite"><div class="suite-top"><span class="suite-id">${s.id}</span><p class="suite-n">${s.name}</p><span class="pill">Chưa đo</span></div>
      <p class="suite-w">${esc(s.what)}</p><p class="suite-t"><span>Mục tiêu</span>${esc(s.target)}</p></li>`).join('');
    return {
      title: 'Minh bạch chất lượng', sub: 'Bảng đo', tab: 'me', back: true,
      body: `<div class="pad">
        <p class="eyebrow">Responsible AI có đo đạc</p>
        <h1 class="h1" tabindex="-1">Sensei Agent đạt chất lượng tới đâu?</h1>
        <div class="empty inline">${ic('clock', 'ic-lg')}<div><p class="empty-t">Chưa có số đo</p><p class="empty-b">Lần chạy đầu: 4–5/11/2026. Số thật công bố ở Demo Day 7/11. Dưới đây là mục tiêu đội tự đặt.</p></div></div>
        <ol class="suites">${rows}</ol>
        <p class="note">${ic('info', 'ic-sm')}<span><b>Khoảng cách công bằng</b> (E1): điểm giải thích cho người mới học tiếng Nhật (L1) không được thấp hơn điểm cho người đã khá (L3) quá 0,5.</span></p>
      </div>`
    };
  };

  /* ----- me ----- */
  SCREENS.me = function () {
    const e = D.exams.gaishoku;
    const row = (icon, t, d, act, arg, cls) => `<li><button class="mrow ${cls || ''}" data-act="${act}" data-arg="${arg || ''}">${ic(icon)}<span class="mrow-t">${t}<em>${d}</em></span>${ic('next', 'ic-sm')}</button></li>`;
    const on = METRICS.filter((m) => S.consent[m.k]).length;
    return {
      title: 'Tôi', sub: 'Hồ sơ, ai thấy gì', tab: 'me', back: true,
      body: `<div class="pad">
        <section class="profile"><span class="av big">H</span><div><h1 class="h2" tabindex="-1">Chị Hạnh, 26</h1><p>Phục vụ nhà hàng, Osaka · KNĐĐ số 1</p><p class="muted">Nhân vật tổng hợp (giả định, sẽ kiểm chứng bằng phỏng vấn 20 người)</p></div></section>
        <dl class="kv">
          <div><dt>Lớp</dt><dd>${esc(D.klass.title)} · cô Linh</dd></div>
          <div><dt>Trung tâm</dt><dd>${esc(D.center.name)}</dd></div>
          <div><dt>Kỳ thi</dt><dd class="jt">${jp(e.ja)}</dd></div>
          <div><dt>Ngày thi</dt><dd>${dmy(day(S.examDate))} · còn ${weeksLeft(REPLAN_DAY)} tuần</dd></div>
          <div><dt>Kế hoạch</dt><dd>${!S.planApproved ? 'Chưa bắt đầu' : S.teacherPlan === 'approved' ? 'Đang học · cô Linh đã duyệt' : 'Kế hoạch tạm · chờ cô Linh xem'}</dd></div>
        </dl>
        <ul class="menu">
          ${row('eye', 'Ai thấy gì: cô Linh và chị Mai', `Hai tầng quyền · đang chia sẻ ${on}/4 số với chị Mai`, 'nav', 'privacy', '')}
          ${row('timer', 'Thi thử tắt AI', 'Đo đúng sức, gia sư khoá', 'nav', 'mock')}
          ${row('list', 'Sensei Agent đạt chất lượng tới đâu', 'Bảng đo H1–H4, N1, P1, E1', 'nav', 'eval')}
        </ul>
        <p class="eyebrow gap">Xem vai khác (demo)</p>
        <ul class="menu">
          ${row('users', 'Chị Mai · đơn vị hỗ trợ', 'Chỉ thấy số chị cho phép', 'mentorPreview', '')}
          ${row('gate', 'Duyệt câu dùng chung', 'Giờ là việc của cô Linh, trên web giáo viên', 'nav', 'review')}
          <li>${extLink(TEACHER + 'today', `${ic('school')}<span class="mrow-t">Web giáo viên của cô Linh<em>Mở tab mới</em></span>`, 'mrow')}</li>
        </ul>
        <section class="danger-zone"><p class="eyebrow">Xoá dữ liệu</p><button class="btn danger block" data-act="askWipe">${ic('trash', 'ic-sm')}Xoá toàn bộ dữ liệu</button></section>
        <p class="powered">Ứng dụng của ${esc(D.center.name)} · chạy bằng <b>Sensei Agent</b></p>
      </div>`
    };
  };

  /* ================= SHEETS ================= */
  const SHEETS = {
    wipe: () => ({
      title: 'Xoá toàn bộ dữ liệu?',
      body: '<p>Xoá hồ sơ năng lực, kế hoạch, lịch sử trả lời, chữ đã che và sổ đồng ý. Chị Mai mất mọi số ngay lập tức; cô Linh không còn thấy lịch sử học. Không hoàn tác được.</p>',
      actions: [['Huỷ', 'closeSheet', '', 'ghost'], ['Xoá hết', 'wipe', '', 'danger']]
    }),
    delPhoto: () => ({
      title: S.cap.kind === 'doc' ? 'Bỏ file này?' : 'Xoá ảnh này?',
      body: `<p>${S.cap.stage === 'preview' ? `${S.cap.kind === 'doc' ? 'File' : 'Ảnh'} chưa được gửi đi. Xoá thì không có gì rời khỏi điện thoại.` : `${S.cap.kind === 'doc' ? 'File' : 'Ảnh'} gốc chưa từng được lưu. Thao tác này xoá chữ đã che và các câu tạo từ đó.`}</p>`,
      actions: [['Huỷ', 'closeSheet', '', 'ghost'], [S.cap.kind === 'doc' ? 'Bỏ file' : 'Xoá ảnh', 'delPhoto', '', 'danger']]
    }),
    report: (ctx) => ({
      title: 'Báo câu này sai',
      body: `<p>Cô Linh sẽ xem lại và báo chị kết quả. Câu có từ 2 người báo sẽ tạm ẩn. Chị chọn lý do:</p>
        <div class="reasons" role="radiogroup" aria-label="Lý do">${['Đáp án sai', 'Nguồn không khớp', 'Giải thích khó hiểu'].map((r, i) => `<button class="reason ${S.sheet.reason === i ? 'on' : ''}" role="radio" aria-checked="${S.sheet.reason === i}" data-act="reason" data-arg="${i}">${r}</button>`).join('')}</div>`,
      actions: [['Huỷ', 'closeSheet', '', 'ghost'], ['Gửi báo sai', 'sendReport', ctx, 'primary']]
    }),
    mockSubmit: () => {
      const left = S.mock.len - Object.keys(S.mock.ans).length;
      return {
        title: 'Nộp bài?',
        body: `<p>${left ? `Còn ${left} câu chưa làm. Câu chưa làm tính là sai.` : `Chị đã làm hết ${S.mock.len} câu.`}</p>`,
        actions: [['Làm tiếp', 'closeSheet', '', 'ghost'], ['Nộp bài', 'mockDoSubmit', '', 'primary']]
      };
    },
    /* Built-in word list: no AI call, no cost. */
    word: () => {
      const w = S.sheet.w;
      const g = D.glossary[w] || ['', 'Chưa có trong từ điển của app'];
      return {
        title: 'Nghĩa của từ',
        body: `<p class="wd-ja jt" lang="ja">${g[0] && g[0] !== w ? `<ruby>${esc(w)}<rt>${esc(g[0])}</rt></ruby>` : esc(w)}</p>
          <p class="wd-vn">${esc(g[1])}</p>
          <p class="wd-free">${ic('check', 'ic-xs')}<span>Miễn phí · từ điển có sẵn trong app, không dùng AI</span></p>`,
        actions: S.sheet.qi != null ? [['Dịch cả câu', 'sentence', S.sheet.qi, 'ghost'], ['Đóng', 'closeSheet', '', 'primary']] : [['Đóng', 'closeSheet', '', 'primary']]
      };
    },
    sentence: () => {
      const q = D.mockQs[Number(S.sheet.qi)];
      return {
        title: `Dịch cả câu · 問${Number(S.sheet.qi) + 1}`,
        body: `<p class="wd-sent" lang="ja">${esc(q.q)}</p>
          <p class="wd-vn">${esc(q.vi)}</p>
          <p class="wd-free">${ic('pen', 'ic-xs')}<span>Bản dịch đội soạn sẵn, cô Linh đã duyệt · miễn phí, không dùng AI</span></p>`,
        actions: [['Đóng', 'closeSheet', '', 'primary']]
      };
    }
  };

  /* ================= ACTIONS ================= */
  const REASONS = ['Đáp án sai', 'Nguồn không khớp', 'Giải thích khó hiểu'];
  const ctxQ = (ctx) => {
    if (ctx === 'cap') return { q: D.captureQs[S.cap.q], st: qState(S.cap.st, S.cap.q) };
    if (ctx === 'drill') return { q: D.lessonQs[S.quick.list[S.quick.i]], st: qState(S.quick.st, S.quick.i) };
    const L = S.lesson;
    if (L.mode === 'review') return { q: D.lessonQs[L.reviewQ], st: qState(L.st, 'r' + L.reviewQ) };
    return { q: D.lessonQs[L.q], st: qState(L.st, L.q) };
  };
  /* Once a lesson question is finished, keep its latest result for quick review (on the phone only). */
  function remember(ctx) {
    const qi = ctxIdx(ctx);
    if (qi == null) return;
    const { q, st } = ctxQ(ctx);
    if (!isDone(q, st)) return;
    S.hist[qi] = qResult(q, st) === 'ok' ? 'right' : 'wrong';
  }
  const QUICK = [
    ['wrong', 'Câu sai lần trước', 'Lần trước chưa đúng ngay lần đầu', 'x'],
    ['new', 'Câu chưa làm', 'Có trong bài HACCP nhưng chị chưa làm', 'list'],
    ['red', 'Đánh dấu đỏ', 'Chưa hiểu', null],
    ['yellow', 'Đánh dấu vàng', 'Chưa chắc', null],
    ['green', 'Đánh dấu xanh', 'Đã chắc · ôn để giữ', null]
  ];
  function quickList(f) {
    return D.lessonQs.map((_, i) => i).filter((i) => {
      if (f === 'wrong') return S.hist[i] === 'wrong';
      if (f === 'new') return !S.hist[i];
      return S.marks[i] === f;
    });
  }
  const now = () => { const t = 21 * 60 + S.ledger.length; return `21:${String(t % 60).padStart(2, '0')} CN 22/11`; };
  let capTimer = null; let mockTimer = null;

  const A = {
    nav(arg, el) {
      if (el && el.dataset.tabnav) return tab(arg);
      if (el && el.dataset.replace) { S.screen = arg; render({ enter: true }); return; }
      go(arg);
    },
    back() { back(); },
    tab(arg) { tab(arg); },
    pickExam(arg) { S.exam = arg; render(); },
    onbNext() {
      if (S.onb.step < 3) { S.onb.step++; render({ enter: true, focus: true }); return; }
      S.diag = { i: -1, ans: [] };
      go('diag');
    },
    scanShift() {
      S.onb.photo = 'scanning'; render();
      setTimeout(() => { if (S.screen === 'onb' && S.onb.photo === 'scanning') { S.onb.photo = 'read'; render({ focus: true }); toast('Đã đọc 10 ca. Ảnh không được lưu.'); } }, reduceMotion ? 300 : 1300);
    },
    rescan() { S.onb.photo = 'none'; render({ focus: true }); },
    diagStart() { S.diag.i = 0; render({ enter: true, focus: true }); },
    diagPick(arg) { S.diag.ans[S.diag.i] = Number(arg); render(); },
    diagNext() {
      const qs = D.diag[S.exam];
      if (S.diag.i + 1 < qs.length) { S.diag.i++; render({ enter: true, focus: true }); return; }
      S.diagDone = true; go('map'); toast('Sensei Agent đã vẽ bản đồ năng lực.');
    },
    backToHanh() { S.exam = 'gaishoku'; S.diag = { i: -1, ans: [] }; go('map'); toast('Chuyển sang chị Hạnh · 外食業2号'); },
    planLater() { toast('Kế hoạch đang chờ chị duyệt. Sensei Agent chưa gửi nhắc nào.'); },
    approvePlan() { S.planApproved = true; S.stack = []; render({ focus: true }); toast('Bắt đầu học. Cô Linh sẽ xem kế hoạch trong 24 giờ.'); },
    teacherApprovePlan() { S.teacherPlan = 'approved'; render({ focus: true }); toast('Cô Linh đã duyệt, sửa 1 chỗ nhỏ (dưới 20%).'); },
    classDate() { S.examDate = D.klass.examDate; render(); toast('Đã dùng ngày thi lớp gợi ý.'); },
    askTeacher(from) {
      S.tq = freshTq(from);
      const lessonQ0 = from === 'lesson' && S.lesson.mode !== 'review' && S.lesson.q === 0;
      S.tq.text = from === 'lesson' && !lessonQ0 ? 'Em chưa hiểu câu này ạ, cô giải thích giúp em.' : TQ_TEXT[from];
      go('askTeacher');
    },
    tqLine(arg) { S.tq.include[arg] = !S.tq.include[arg]; render(); },
    tqSend() {
      if (!S.tq.text.trim()) { toast('Chị viết câu hỏi trước nhé.'); const t = $('#tqText'); if (t) t.focus(); return; }
      S.tq.stage = 'waiting'; render({ enter: true, focus: true }); toast('Đã gửi cô Linh.');
    },
    tqReply() { S.tq.stage = 'replied'; render({ focus: true }); toast('Cô Linh đã trả lời.'); },
    groupSet(arg) {
      S.group = arg; render();
      toast(arg === 'joined' ? 'Đã vào nhóm “Tối muộn”. Nhóm chỉ thấy chị đã học hôm nay chưa.' : arg === 'later' ? 'Để sau. Tham gia lúc nào cũng được.' : 'Đã rời nhóm. Nhóm không còn thấy gì của chị.');
    },
    privTab(arg) { S.privTab = arg; render({ focus: true }); },
    chatConsent() {
      S.chatConsent = !S.chatConsent;
      S.ledger.push({ t: now(), off: !S.chatConsent, what: 'Cô Linh đọc mẫu hội thoại (ẩn tên)' });
      render(); toast(S.chatConsent ? 'Đã bật: cô Linh đọc mẫu hội thoại, ẩn tên.' : 'Đã tắt: cô Linh không đọc hội thoại.');
    },
    me() { go('me'); },
    capKind(arg) { if (S.cap.kind !== arg) S.cap = freshCap(arg); render({ focus: true }); },
    pickDoc(arg) {
      if (arg !== 'pdf') { toast('Word/Excel được đổi sang PDF trước khi đọc. Demo chỉ mở file PDF mẫu.'); return; }
      A.shoot();
    },
    shareCap() { S.capShared = true; render(); toast('Đã đề xuất cho lớp. Cô Linh duyệt rồi mới dùng chung.'); },
    slot(arg) {
      if (arg === 'cards') { S.cards = { i: 0, flipped: false, known: 0 }; go('cards'); }
      if (arg === 'lesson') { S.lesson = freshLesson(); go('lesson'); }
      if (arg === 'capture') { if (S.cap.stage === 'done') S.cap = freshCap(); go('capture'); }
      if (arg === 'review') {
        const L = S.lesson;
        let qi = 0;
        D.lessonQs.some((q, i) => { const st = L.st[i]; if (st && st.tries[0] !== q.a) { qi = i; return true; } return false; });
        S.lesson = Object.assign(freshLesson(), { mode: 'review', phase: 'quiz', reviewQ: qi, st: L.st });
        delete S.lesson.st['r' + qi];
        go('lesson');
      }
    },
    toggleLog() { S.logOpen = !S.logOpen; render(); },
    finishSlot(arg) { S.done[arg] = true; if (arg === 'capture') S.cap = Object.assign(freshCap(S.cap.kind), { stage: 'done' }); tab('today'); toast(`Xong. Đã học ${minutesDone()}/19 phút hôm nay.`); },
    flip() { S.cards.flipped = !S.cards.flipped; render(); },
    rate(arg) { if (arg === '1') S.cards.known++; S.cards.i++; S.cards.flipped = false; render({ enter: true, focus: true }); },
    lessonCard(arg) {
      const L = S.lesson; const n = L.card + Number(arg);
      if (n < 0) return;
      if (n >= D.lessonCards.length) { L.phase = 'quiz'; L.q = 0; } else L.card = n;
      render({ enter: true, focus: true });
    },
    lessonNext() {
      const L = S.lesson;
      if (L.q + 1 >= D.lessonQs.length) L.phase = 'done';
      else if ((L.q + 1) % ROUND === 0) L.phase = 'round';
      else L.q++;
      render({ enter: true, focus: true });
    },
    lessonRound() { const L = S.lesson; L.phase = 'quiz'; L.q++; render({ enter: true, focus: true }); },
    answer(arg) {
      const [ctx, i] = arg.split(':');
      const { q, st } = ctxQ(ctx);
      if (isDone(q, st) || st.tries.includes(Number(i))) return;
      st.tries.push(Number(i));
      remember(ctx);
      render({ focusFb: true });
    },
    mark(arg) {
      const [qi, c] = arg.split(':');
      const same = S.marks[qi] === c;
      if (same) delete S.marks[qi]; else S.marks[qi] = c;
      render();
      toast(same ? 'Đã bỏ đánh dấu.' : `Đã đánh dấu “${MARKS.find((m) => m[0] === c)[1]}”. Dấu này chỉ lưu trên điện thoại của chị.`);
    },
    quick(arg) {
      S.quick = Object.assign(freshQuick(), { f: arg, list: quickList(arg) });
      render({ enter: true, focus: true });
    },
    quickNext() { S.quick.i++; render({ enter: true, focus: true }); },
    quickMenu() { S.quick = freshQuick(); render({ enter: true, focus: true }); },
    word(arg, el) {
      const host = el && el.closest('[data-long]');
      openSheet('word', { w: arg, qi: host ? host.dataset.arg : null });
    },
    sentence(arg) { openSheet('sentence', { qi: arg }); },
    mockLen(arg) { const n = Number(arg); if (S.mock.len === n) { toast(`Đang chọn ${n} câu.`); return; } S.mock =Object.assign(freshMock(n), { fullAsked: S.mock.fullAsked }); render(); },
    mockFull() { S.mock.fullAsked = true; render(); toast('Đã ghi. Đề đủ 55 câu được gợi ý vào ngày nghỉ, chị vẫn tự quyết có làm hay không.'); },
    askAnswer(ctx) {
      const { q, st } = ctxQ(ctx);
      st.asked = true;
      st.hint = Math.max(st.hint, 1);
      st.thread.push({ kind: 'tpl', html: `Sensei Agent chưa đưa đáp án khi chị chưa thử: tự nhớ lại giúp nhớ lâu hơn. Chị chọn thử một đáp án nhé. Gợi ý bậc 1: ${jp(q.hints[0])}` });
      render();
    },
    hint(ctx) {
      const { q, st } = ctxQ(ctx);
      if (st.hint >= 3) return;
      st.hint++;
      st.thread.push({ kind: 'hint', lvl: st.hint, html: jp(q.hints[st.hint - 1]) });
      render();
    },
    reveal(ctx) { const { st } = ctxQ(ctx); st.reveal = true; remember(ctx); render({ focusFb: true }); },
    level(arg) { const [ctx, l] = arg.split(':'); ctxQ(ctx).st.level = Number(l); render(); },
    report(ctx) { openSheet('report', { ctx: ctx, reason: 0 }); },
    reason(arg) { S.sheet.reason = Number(arg); render(); },
    sendReport(ctx) {
      const { q, st } = ctxQ(ctx);
      st.reported = true;
      S.reports.push({ q: q.q, a: q.opts[q.a], src: q.src, reason: REASONS[S.sheet.reason] });
      closeSheet();
      toast('Đã gửi cô Linh xem lại. Cảm ơn chị!');
    },
    shoot() {
      S.cap.stage = 'processing'; S.cap.step = 0; render({ focus: true });
      clearTimeout(capTimer);
      const tick = () => {
        if (S.screen !== 'capture' || S.cap.stage !== 'processing') return;
        if (S.cap.step < 2) { S.cap.step++; render(); capTimer = setTimeout(tick, reduceMotion ? 150 : 650); return; }
        S.cap.stage = 'preview'; render({ focus: true, enter: true });
      };
      capTimer = setTimeout(tick, reduceMotion ? 150 : 650);
    },
    mask(arg) { S.cap.masks[arg] = !S.cap.masks[arg]; render(); },
    sendPhoto() { S.cap.stage = 'sent'; render({ focus: true, enter: true }); toast('Đã gửi. Ảnh gốc không được lưu.'); },
    askDelete() { openSheet('delPhoto'); },
    delPhoto() { S.cap = freshCap(S.cap.kind); S.done.capture = false; closeSheet(); render({ focus: true }); toast('Đã xoá. Không còn gì từ ảnh này.'); },
    capQuiz() { S.cap.stage = 'quiz'; S.cap.q = 0; render({ enter: true, focus: true }); },
    capNext() { if (S.cap.q < 2) S.cap.q++; else S.cap.stage = 'done'; render({ enter: true, focus: true }); },
    askChip(arg) { sendChat(arg); },
    openLessonQ() { S.lesson = Object.assign(freshLesson(), { phase: 'quiz', q: 0 }); go('lesson'); },
    reDiff() { S.re.stage = 'diff'; render({ enter: true, focus: true }); },
    approveRe() { S.re.approved = true; S.re.kept = false; render(); toast('Đã duyệt kế hoạch tuần 23–29/11.'); },
    keepRe() { S.re.kept = true; render(); toast('Giữ kế hoạch cũ. Sensei Agent không đổi gì.'); },
    mockStart() { S.mock.started = true; render({ enter: true, focus: true }); startMockTimer(); },
    mockPick(arg) { S.mock.ans[S.mock.q] = Number(arg); render(); },
    mockGo(arg) { S.mock.q = Number(arg); render({ enter: true, focus: true }); },
    mockSubmit() { openSheet('mockSubmit'); },
    mockDoSubmit() { closeSheet(false); submitMock(); },
    mockRetry() { S.mock = freshMock(); render({ enter: true, focus: true }); },
    toggle(arg) {
      S.consent[arg] = !S.consent[arg];
      const m = METRICS.find((x) => x.k === arg);
      S.ledger.push({ t: now(), off: !S.consent[arg], what: m.label });
      render();
      toast(S.consent[arg] ? `Đã bật: ${m.label}` : `Đã tắt: ${m.label}`);
    },
    revokeAll() {
      METRICS.forEach((m) => { if (S.consent[m.k]) { S.consent[m.k] = false; S.ledger.push({ t: now(), off: true, what: m.label }); } });
      render(); toast('Đã thu hồi tất cả. Chị Mai sẽ không thấy gì khi tải lại.');
    },
    mentorPreview() {
      if (!S.mentorSnap) { S.mentorSnap = Object.assign({}, S.consent); S.mentorAt = '09:00 T2 23/11'; }
      go('mentor');
    },
    mentorReload() {
      S.mentorSnap = Object.assign({}, S.consent);
      S.mentorAt = `09:0${Math.min(9, S.ledger.length % 10)} T2 23/11`;
      render({ focus: true });
      const n = METRICS.filter((m) => S.mentorSnap[m.k]).length;
      toast(n ? `Đã tải lại: chị Hạnh chia sẻ ${n}/4 số.` : 'Đã tải lại: chị Hạnh không chia sẻ số nào.');
    },
    leaveRole(arg) { S.stack = []; S.screen = arg; render({ enter: true, focus: true }); },
    askWipe() { openSheet('wipe'); },
    wipe() { clearInterval(mockTimer); S = fresh(); render({ enter: true, focus: true }); toast('Đã xoá toàn bộ dữ liệu. Demo quay về màn đầu.'); updateHash(''); },
    closeSheet() { closeSheet(); },
    go(arg) { preset(arg); closeGuide(); },
    scene(arg) { const n = Number(arg); const sc = D.scenes.find((s) => s.n === n); if (sc) { preset(sc.steps[0].go); } },
    resetAll() { clearInterval(mockTimer); S = fresh(); render({ enter: true, focus: true }); updateHash(''); closeGuide(); toast('Đã đặt lại demo từ đầu.'); },
    guide() { openGuide(); },
    prevScene() { stepScene(-1); },
    nextScene() { stepScene(1); },
    closeGuide() { closeGuide(); }
  };

  function sendChat(text) {
    const t = String(text || '').trim();
    if (!t) { toast('Chị nhập câu hỏi trước nhé.'); return; }
    S.chat.push({ from: 'me', text: t });
    const kind = LEGAL.test(t) ? 'legal' : ANSWER.test(t) ? 'answer' : /haccp/i.test(t) ? 'haccp' : 'noai';
    S.chat.push({ from: 'bot', kind: kind });
    render({ scrollEnd: true });
  }

  function startMockTimer() {
    clearInterval(mockTimer);
    mockTimer = setInterval(() => {
      const M = S.mock;
      if (!M.started || M.submitted) { clearInterval(mockTimer); return; }
      M.left = Math.max(0, M.left - 1);
      const el = document.getElementById('mockTime');
      if (el) { el.textContent = mmss(M.left); el.classList.toggle('low', M.left < 60); }
      if (M.left === 0) { submitMock(); toast('Hết giờ. Bài đã được nộp.'); }
    }, 1000);
  }
  function submitMock() { S.mock.submitted = true; clearInterval(mockTimer); if (S.screen === 'mock') render({ enter: true, focus: true }); }

  /* ================= NAVIGATION ================= */
  const TOP = ['today', 'plan', 'map', 'capture', 'class', 'ask'];
  function go(screen) {
    if (S.screen !== screen) S.stack.push(S.screen);
    S.screen = screen;
    render({ enter: true, focus: true });
  }
  function back() {
    const prev = S.stack.pop();
    S.screen = prev || 'today';
    render({ enter: true, focus: true, backward: true });
  }
  function tab(screen) { S.stack = []; S.screen = screen; render({ enter: true, focus: true }); }
  function openSheet(type, extra) { S.sheet = Object.assign({ type: type }, extra || {}); render({ sheetFocus: true }); }
  function closeSheet(rerender) {
    const had = S.sheet; S.sheet = null;
    if (rerender !== false) render();
    if (had && lastFocusSel) { const el = document.querySelector(lastFocusSel); if (el && !el.disabled) el.focus({ preventScroll: true }); }
  }
  let lastFocusSel = null;

  /* ================= PRESETS (demo guide jumps) ================= */
  function story() {
    if (!S.planApproved) {
      S.exam = 'gaishoku'; S.onb = { step: 3, adult: true, photo: 'read' }; S.diagDone = true; S.diag = { i: -1, ans: [] };
      S.planApproved = true; S.teacherPlan = 'approved';
    }
    S.exam = 'gaishoku';
    S.sheet = null;
  }
  /* Lesson question 1 tried once (A, wrong) with hint 1: the moment a learner asks the teacher. */
  function stuckOnQ1() {
    const q = D.lessonQs[0];
    S.lesson = Object.assign(freshLesson(), { phase: 'quiz', q: 0 });
    S.lesson.st[0] = { tries: [0], hint: 1, asked: true, reveal: false, level: 1, reported: false,
      thread: [{ kind: 'tpl', html: `Sensei Agent chưa đưa đáp án khi chị chưa thử: tự nhớ lại giúp nhớ lâu hơn. Chị chọn thử một đáp án nhé. Gợi ý bậc 1: ${jp(q.hints[0])}` }] };
  }
  /* Fill lesson answers with given results (ok | help | miss) and keep them in the quick-review history. */
  function seedLesson(res) {
    res.forEach((r, i) => {
      const q = D.lessonQs[i];
      const wrong = (q.a + 1) % q.opts.length;
      S.lesson.st[i] = { tries: r === 'ok' ? [q.a] : r === 'help' ? [wrong, q.a] : [wrong], hint: r === 'help' ? 1 : 0, asked: false, reveal: r === 'miss', level: 1, reported: false, thread: [] };
      S.hist[i] = r === 'ok' ? 'right' : 'wrong';
    });
  }
  const PRESETS = {
    invite() { S = fresh(); },
    onb1() { S = fresh(); S.onb.step = 1; },
    onb3() { S = fresh(); S.onb = { step: 3, adult: true, photo: 'none' }; },
    diag() { S = fresh(); S.onb = { step: 3, adult: true, photo: 'read' }; S.diag = { i: 0, ans: [] }; S.screen = 'diag'; },
    map() { S = fresh(); S.onb = { step: 3, adult: true, photo: 'read' }; S.diagDone = true; S.screen = 'map'; },
    plan() { S = fresh(); S.onb = { step: 3, adult: true, photo: 'read' }; S.diagDone = true; S.screen = 'plan'; },
    'plan-provisional'() { story(); S.re = { stage: 'notice', approved: false, kept: false }; S.teacherPlan = 'pending'; S.screen = 'plan'; },
    'plan-approved'() { story(); S.re = { stage: 'notice', approved: false, kept: false }; S.teacherPlan = 'approved'; S.screen = 'plan'; },
    today() { story(); S.screen = 'today'; },
    lesson() { story(); S.lesson = freshLesson(); S.screen = 'lesson'; },
    'lesson-q'() { story(); S.lesson = Object.assign(freshLesson(), { phase: 'quiz', q: 0 }); S.screen = 'lesson'; },
    'lesson-expl'() {
      story();
      const q = D.lessonQs[0];
      S.lesson = Object.assign(freshLesson(), { phase: 'quiz', q: 0 });
      S.lesson.st[0] = { tries: [0, 2], hint: 1, asked: true, reveal: false, level: 1, reported: false,
        thread: [{ kind: 'tpl', html: `Sensei Agent chưa đưa đáp án khi chị chưa thử: tự nhớ lại giúp nhớ lâu hơn. Chị chọn thử một đáp án nhé. Gợi ý bậc 1: ${jp(q.hints[0])}` }] };
      S.screen = 'lesson';
    },
    'ask-teacher'() { story(); stuckOnQ1(); S.tq = freshTq('lesson'); S.screen = 'askTeacher'; },
    'ask-teacher-reply'() { story(); stuckOnQ1(); S.tq = Object.assign(freshTq('lesson'), { stage: 'replied' }); S.screen = 'askTeacher'; },
    class() { story(); S.group = 'none'; S.classSeen = false; S.screen = 'class'; },
    cap() { story(); S.cap = freshCap(); S.screen = 'capture'; },
    'upload-doc'() { story(); S.cap = freshCap('doc'); S.screen = 'capture'; },
    'cap-preview'() { story(); S.cap = Object.assign(freshCap(), { stage: 'preview', step: 2 }); S.screen = 'capture'; },
    'cap-sent'() { story(); S.cap = Object.assign(freshCap(), { stage: 'sent', step: 4 }); S.screen = 'capture'; },
    replan() { story(); S.re = { stage: 'notice', approved: false, kept: false }; S.screen = 'replan'; },
    'replan-diff'() { story(); S.re = { stage: 'diff', approved: false, kept: false }; S.screen = 'replan'; },
    ask() { story(); S.chat = []; S.screen = 'ask'; },
    'ask-visa'() { story(); S.chat = [{ from: 'me', text: 'Em muốn đổi visa thì làm sao?' }, { from: 'bot', kind: 'legal' }]; S.screen = 'ask'; },
    'privacy-tiers'() { story(); S.privTab = 'linh'; S.screen = 'privacy'; },
    privacy() { story(); S.privTab = 'mai'; S.consent = { minutes: false, streak: false, syllabus: false, mock: false }; S.ledger = []; S.mentorSnap = null; S.screen = 'privacy'; },
    mentor() {
      story();
      if (!METRICS.some((m) => S.consent[m.k])) {
        ['minutes', 'streak', 'syllabus'].forEach((k) => { S.consent[k] = true; S.ledger.push({ t: now(), off: false, what: METRICS.find((m) => m.k === k).label }); });
      }
      S.mentorSnap = Object.assign({}, S.consent); S.mentorAt = '09:00 T2 23/11';
      S.privTab = 'mai'; S.screen = 'mentor';
    },
    'privacy-revoke'() {
      story();
      if (!METRICS.some((m) => S.consent[m.k])) {
        ['minutes', 'streak', 'syllabus'].forEach((k) => { S.consent[k] = true; S.ledger.push({ t: now(), off: false, what: METRICS.find((m) => m.k === k).label }); });
      }
      if (!S.mentorSnap) { S.mentorSnap = Object.assign({}, S.consent); S.mentorAt = '09:00 T2 23/11'; }
      S.privTab = 'mai'; S.screen = 'privacy';
    },
    eval() { story(); S.screen = 'eval'; },
    'lesson-round'() { story(); S.lesson = Object.assign(freshLesson(), { phase: 'round', q: ROUND - 1 }); seedLesson(['ok', 'help', 'ok', 'miss', 'ok']); S.screen = 'lesson'; },
    'lesson-stars'() { story(); S.lesson = Object.assign(freshLesson(), { phase: 'done', q: D.lessonQs.length - 1 }); seedLesson(['ok', 'help', 'ok', 'miss', 'ok', 'ok', 'ok', 'help', 'ok', 'ok']); S.screen = 'lesson'; },
    quick() { story(); S.hist = { 0: 'wrong', 1: 'right', 2: 'wrong', 3: 'right', 4: 'right' }; S.marks = { 0: 'red', 2: 'yellow', 3: 'green' }; S.quick = freshQuick(); S.screen = 'quick'; },
    pass() { story(); S.screen = 'pass'; },
    dict() {
      story(); clearInterval(mockTimer);
      S.mock = Object.assign(freshMock(10), { started: true, submitted: true, ans: { 0: 1, 1: 2, 2: 0, 3: 2, 4: 1, 5: 2, 6: 0, 7: 1 } });
      S.screen = 'mock';
    },
    mock() { story(); clearInterval(mockTimer); S.mock = freshMock(); S.screen = 'mock'; },
    review() { story(); S.screen = 'review'; },
    wipe() { story(); S.screen = 'me'; S.sheet = { type: 'wipe' }; }
  };
  function preset(key) {
    if (!PRESETS[key]) return;
    clearTimeout(capTimer);
    if (key !== 'mock') clearInterval(mockTimer);
    PRESETS[key]();
    clearTimeout(toastTimer); $('#toast').classList.remove('show');
    S.stack = [];
    if (['lesson', 'lesson-q', 'lesson-expl', 'lesson-round', 'lesson-stars', 'cards', 'quick', 'pass'].includes(key)) S.stack = ['today'];
    if (['replan', 'replan-diff'].includes(key)) S.stack = ['plan'];
    if (['ask-teacher', 'ask-teacher-reply'].includes(key)) S.stack = ['today', 'lesson'];
    if (['privacy', 'privacy-tiers', 'privacy-revoke', 'eval'].includes(key)) S.stack = ['me'];
    if (['mock', 'dict'].includes(key)) S.stack = ['today'];
    if (['mentor', 'review'].includes(key)) S.stack = ['me'];
    updateHash(key);
    render({ enter: true, focus: true, sheetFocus: !!S.sheet });
  }
  function updateHash(key) {
    try { history.replaceState(null, '', key ? `#p=${key}` : location.pathname + location.search); } catch (e) { /* file:// may refuse; the jump still works */ }
  }

  /* ================= WHERE AM I (guide highlight) ================= */
  function where() {
    const s = S.screen;
    if (s === 'onb') return { scene: 1, step: S.onb.step === 0 ? 0 : S.onb.step >= 3 ? 2 : 1 };
    if (s === 'diag') return { scene: 1, step: 3 };
    const planStep = () => (!S.planApproved ? 0 : S.teacherPlan === 'approved' ? 2 : 1);
    if (s === 'map') return S.planApproved ? { scene: 2, step: planStep() } : { scene: 1, step: 4 };
    if (s === 'plan') return { scene: 2, step: planStep() };
    if (s === 'today' || s === 'cards') return { scene: 3, step: 0 };
    if (s === 'lesson') {
      const L = S.lesson;
      if (L.mode !== 'review' && L.phase === 'cards') return { scene: 3, step: 1 };
      if (L.mode !== 'review' && (L.phase === 'round' || L.phase === 'done')) return { scene: 3, step: 3, extra: 'lesson-stars' };
      const { q, st } = ctxQ('lesson');
      return { scene: 3, step: isDone(q, st) ? 3 : 2 };
    }
    if (s === 'quick') return { extra: 'quick' };
    if (s === 'pass') return { extra: 'pass' };
    if (s === 'askTeacher') return { scene: 4, step: S.tq.stage === 'draft' ? 0 : 1 };
    if (s === 'class') return { scene: 4, step: 2 };
    if (s === 'capture') {
      if (S.cap.kind === 'doc') return { scene: 5, step: 3 };
      return { scene: 5, step: S.cap.stage === 'poster' ? 0 : ['processing', 'preview'].includes(S.cap.stage) ? 1 : 2 };
    }
    if (s === 'replan') return { scene: 6, step: S.re.stage === 'notice' ? 0 : 1 };
    if (s === 'ask') return { scene: 7, step: S.chat.some((m) => m.kind === 'legal') ? 1 : 0 };
    if (s === 'privacy') return { scene: 8, step: S.privTab === 'linh' ? 0 : S.mentorSnap ? 3 : 1 };
    if (s === 'mentor') return { scene: 8, step: 2 };
    if (s === 'eval') return { scene: 9, step: 0 };
    if (s === 'mock') return { extra: S.mock.submitted ? 'dict' : 'mock' };
    if (s === 'review') return { extra: 'review' };
    if (s === 'me') return { extra: S.sheet && S.sheet.type === 'wipe' ? 'wipe' : null };
    return {};
  }

  /* ================= RENDER ================= */
  /* Five tabs at most; “Tôi” lives on the avatar in the tenant bar. */
  const TABS = [['today', 'sun', 'Hôm nay'], ['plan', 'cal', 'Kế hoạch'], ['capture', 'camera', 'Chụp'], ['class', 'school', 'Lớp'], ['ask', 'chat', 'Hỏi']];
  const SETUP = ['onb', 'diag'];
  let lastScreen = null;

  function render(opts) {
    opts = opts || {};
    const active = document.activeElement;
    const keep = active && active.dataset && active.dataset.act ? `[data-act="${active.dataset.act}"][data-arg="${active.dataset.arg || ''}"]` : null;
    const view = $('#view');
    const sameScreen = lastScreen === S.screen;
    const scroll = view.scrollTop;
    const scr = SCREENS[S.screen]();
    const inSetup = SETUP.includes(S.screen) || (!S.planApproved && (S.screen === 'map' || S.screen === 'plan'));
    const role = scr.role;

    /* status + badge clocks */
    const c = clock();
    $('#sb-time').textContent = c.t;
    $('#sb-day').textContent = c.label;
    $('#badge-clock').textContent = `${c.label} · ${c.t}`;

    /* role banner */
    const rb = $('#rolebar');
    if (role) {
      rb.hidden = false;
      rb.innerHTML = role === 'mentor'
        ? `${ic('users', 'ic-sm')}<span>Đang xem với vai <b>chị Mai · đơn vị hỗ trợ</b> (chỉ đọc)</span>`
        : `${ic('school', 'ic-sm')}<span>Việc này đã chuyển sang <b>web giáo viên</b></span>`;
    } else { rb.hidden = true; rb.innerHTML = ''; }

    /* tenant bar: the center's brand on every learner screen (white-label) */
    const tn = $('#tenant');
    if (role) { tn.hidden = true; tn.innerHTML = ''; } else {
      tn.hidden = false;
      const meOn = scr.tab === 'me';
      tn.innerHTML = `<span class="center-logo" aria-hidden="true">${D.center.mark}</span>
        <p class="tenant-t"><b>${esc(D.center.name)}</b><span>${esc(D.klass.title)} · cô Linh</span></p>
        ${inSetup ? '' : meOn ? '<span class="tenant-me on" role="img" aria-label="Đang ở trang Tôi">H</span>' : '<button class="tenant-me" data-act="me" aria-label="Tôi: hồ sơ, ai thấy gì">H</button>'}`;
    }

    /* app bar */
    const showBack = !!scr.back || (S.stack.length > 0 && !TOP.includes(S.screen)) || (inSetup && S.screen !== 'onb') || (S.screen === 'onb' && S.onb.step > 0);
    $('#appbar').innerHTML = `${showBack ? `<button class="iconbtn" data-act="${S.screen === 'onb' ? 'onbBack' : inSetup ? 'setupBack' : 'back'}" aria-label="Quay lại">${ic('back')}</button>` : '<span class="appbar-pad" aria-hidden="true"></span>'}
      <div class="appbar-t"><p class="appbar-title">${scr.title}</p>${scr.sub ? `<p class="appbar-sub">${scr.sub}</p>` : ''}</div>
      <button class="appbar-guide" data-act="guide" aria-controls="guide" aria-expanded="false">${ic('list', 'ic-sm')}<span class="js-pos">Kịch bản</span></button>
      ${inSetup && setupIndex() > 0 ? `<div class="setup-prog" aria-hidden="true">${Array.from({ length: 6 }, (_, i) => `<span class="${i < setupIndex() ? 'on' : ''}"></span>`).join('')}</div>` : ''}`;

    /* screen */
    view.innerHTML = `<div class="screen ${opts.enter && !reduceMotion ? (opts.backward ? 'enter-back' : 'enter') : ''}" data-screen="${S.screen}">${scr.body}</div>`;
    if (opts.enter || !sameScreen) view.scrollTop = 0; else view.scrollTop = scroll;
    if (opts.scrollEnd) {
      const mine = $$('#view .msg.me'); const last = mine[mine.length - 1];
      const k = view.getBoundingClientRect().height / view.offsetHeight || 1; // the phone frame is scaled on desktop
      view.scrollTop = last ? view.scrollTop + (last.getBoundingClientRect().top - view.getBoundingClientRect().top) / k - 12 : view.scrollHeight;
    }

    /* dock */
    const dock = $('#dock');
    dock.innerHTML = scr.dock || '';
    dock.hidden = !scr.dock;

    /* tab bar */
    const tb = $('#tabbar');
    const showTabs = !inSetup && !role;
    tb.hidden = !showTabs;
    if (showTabs) {
      const cur = scr.tab || '';
      if (S.screen === 'class') S.classSeen = true;
      tb.innerHTML = TABS.map((t) => {
        const dot = t[0] === 'class' && !S.classSeen;
        return `<button class="tab ${t[0] === 'capture' ? 'tab-cam' : ''} ${cur === t[0] ? 'on' : ''}" data-act="tab" data-arg="${t[0]}" ${cur === t[0] ? 'aria-current="page"' : ''} ${dot ? 'aria-label="Lớp, có tin mới từ cô Linh"' : ''}><span class="tab-ic">${ic(t[1])}${dot ? '<i class="tab-dot" aria-hidden="true"></i>' : ''}</span><span class="tab-l">${t[2]}</span></button>`;
      }).join('');
    }

    /* sheet */
    const sheetEl = $('#sheet');
    if (S.sheet) {
      const sh = SHEETS[S.sheet.type](S.sheet.ctx);
      sheetEl.hidden = false;
      sheetEl.innerHTML = `<div class="scrim" data-act="closeSheet"></div>
        <div class="sheet-card" role="dialog" aria-modal="true" aria-labelledby="sheetT"><span class="grab" aria-hidden="true"></span>
          <h2 class="h2" id="sheetT">${sh.title}</h2>${sh.body}
          <div class="row2">${sh.actions.map((a) => `<button class="btn ${a[3]}" data-act="${a[1]}" data-arg="${a[2]}">${a[0]}</button>`).join('')}</div></div>`;
      $('#view').setAttribute('inert', ''); dock.setAttribute('inert', ''); tb.setAttribute('inert', ''); $('#appbar').setAttribute('inert', '');
    } else {
      sheetEl.hidden = true; sheetEl.innerHTML = '';
      $('#view').removeAttribute('inert'); dock.removeAttribute('inert'); tb.removeAttribute('inert'); $('#appbar').removeAttribute('inert');
    }

    /* focus */
    if (S.sheet && opts.sheetFocus) {
      lastFocusSel = keep;
      const b = $('#sheet .sheet-card .row2 button'); if (b) b.focus(); // the safe choice (Huỷ) gets focus, never the destructive one
    } else if (opts.focusFb) {
      const fb = $('#view [data-focus]'); if (fb) fb.focus({ preventScroll: false });
    } else if (opts.focus) {
      const h = $('#view h1'); if (h) h.focus({ preventScroll: true });
    } else if (keep) {
      const el = document.querySelector(keep); if (el && !el.disabled) el.focus({ preventScroll: true });
    }

    lastScreen = S.screen;
    updateGuide();
  }
  function setupIndex() {
    if (S.screen === 'onb') return S.onb.step; // 0 = the invite, before the six setup steps
    if (S.screen === 'diag') return 4;
    if (S.screen === 'map') return 5;
    return 6;
  }
  A.onbBack = () => { if (S.onb.step > 0) { S.onb.step--; if (S.onb.photo === 'scanning') S.onb.photo = 'none'; render({ enter: true, backward: true, focus: true }); } };
  A.setupBack = () => {
    if (S.screen === 'diag') {
      if (S.diag.i > 0) { S.diag.i--; render({ enter: true, backward: true, focus: true }); return; }
      if (S.diag.i === 0) { S.diag.i = -1; render({ enter: true, backward: true, focus: true }); return; }
      S.screen = 'onb'; S.onb.step = 3; render({ enter: true, backward: true, focus: true }); return;
    }
    if (S.screen === 'map') { S.screen = 'diag'; S.diag.i = D.diag[S.exam].length - 1; render({ enter: true, backward: true, focus: true }); return; }
    if (S.screen === 'plan') { S.screen = 'map'; render({ enter: true, backward: true, focus: true }); }
  };

  /* ================= GUIDE ================= */
  function buildGuide() {
    const tlinks = (sc) => (sc.teacher ? `<ul class="tlinks">${sc.teacher.map((t) => `<li><a class="step-link" href="${esc(t.href)}" target="_blank" rel="noopener">${ic('school', 'ic-xs')}<span>${t.label}</span>${ic('ext', 'ic-xs')}</a></li>`).join('')}</ul>` : '');
    const scenes = D.scenes.map((sc) => `<li class="scene" data-scene="${sc.n}">
      <div class="scene-top"><span class="scene-n mono">${String(sc.n).padStart(2, '0')}</span>
        <div class="scene-tt"><h3>${sc.title}</h3><p class="scene-proves">Chứng minh: ${sc.proves}</p></div><span class="scene-dur mono">${sc.dur}</span></div>
      <ol class="steps">${sc.steps.map((st, i) => `<li><button class="step" data-act="go" data-arg="${st.go}" data-step="${i}"><span class="step-dot" aria-hidden="true"></span>${st.label}</button></li>`).join('')}</ol>
      ${tlinks(sc)}
    </li>`).join('');
    const extras = D.extras.map((x) => `<li><button class="step extra" data-act="go" data-arg="${x.go}" data-extra="${x.go}"><span class="step-dot" aria-hidden="true"></span><span>${x.label}<em>${x.note}</em></span></button></li>`).join('');
    const surfaces = D.surfaces.map((x) => `<li><a class="step-link surface" href="${esc(x.href)}" target="_blank" rel="noopener"><span>${x.label}<em>${x.note}</em></span>${ic('ext', 'ic-xs')}</a></li>`).join('');
    $('#guide-body').innerHTML = `
      <ol class="scenes">${scenes}</ol>
      <div class="extras"><p class="eyebrow on-dark">Ngoài kịch bản</p><ul class="steps">${extras}</ul>
        <p class="eyebrow on-dark gap">Các màn khác của Sensei Agent (mở tab mới)</p><ul class="steps">${surfaces}</ul></div>
      <button class="btn on-dark-ghost block" data-act="resetAll">${ic('refresh', 'ic-sm')}Làm lại demo từ đầu</button>`;
  }
  function updateGuide() {
    const w = where();
    $$('#guide .scene').forEach((el) => {
      const on = Number(el.dataset.scene) === w.scene;
      el.classList.toggle('on', on);
      $$('.step', el).forEach((b) => {
        const cur = on && Number(b.dataset.step) === w.step;
        b.classList.toggle('cur', cur);
        if (cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
    });
    $$('#guide .step.extra').forEach((b) => {
      const cur = b.dataset.extra === w.extra;
      b.classList.toggle('cur', cur);
      if (cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    const pos = $('#guide-pos');
    pos.textContent = w.scene ? `Cảnh ${w.scene}/${D.scenes.length}` : 'Ngoài kịch bản';
    $$('.js-pos').forEach((el) => { el.textContent = w.scene ? `Cảnh ${w.scene}/${D.scenes.length}` : 'Ngoài kịch bản'; });
    $('#prevScene').disabled = !w.scene || w.scene <= 1;
    $('#nextScene').disabled = w.scene >= D.scenes.length;
    if (w.scene || w.extra) {
      const cur = w.scene ? $(`#guide .scene[data-scene="${w.scene}"]`) : $(`#guide .step.extra[data-extra="${w.extra}"]`);
      const body = $('#guide-body');
      if (cur && body && isDesktop()) {
        const top = cur.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop;
        if (top < body.scrollTop || top + cur.offsetHeight > body.scrollTop + body.clientHeight) body.scrollTo({ top: Math.max(0, top - 12), behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }
  }
  const isDesktop = () => window.innerWidth >= 1024;
  function stepScene(dir) {
    const w = where();
    let n = w.scene ? w.scene + dir : 1;
    n = Math.max(1, Math.min(D.scenes.length, n));
    const sc = D.scenes.find((s) => s.n === n);
    preset(sc.steps[0].go);
  }
  function openGuide() {
    const g = $('#guide');
    g.classList.add('open'); g.removeAttribute('inert');
    $('#guide-scrim').hidden = false;
    $$('[data-act="guide"]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
    const cur = $('#guide .step.cur') || $('#guide .step');
    if (cur) {
      cur.focus({ preventScroll: true });
      const scene = cur.closest('.scene'); const body = $('#guide-body');
      if (scene && body) body.scrollTop = scene.offsetTop - body.offsetTop - 8;
    }
  }
  function closeGuide() {
    if (isDesktop()) return;
    const g = $('#guide');
    if (!g.classList.contains('open')) return;
    g.classList.remove('open'); g.setAttribute('inert', '');
    $('#guide-scrim').hidden = true;
    $$('[data-act="guide"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  }
  function syncGuideMode() {
    const g = $('#guide');
    if (isDesktop()) { g.classList.remove('open'); g.removeAttribute('inert'); $('#guide-scrim').hidden = true; }
    else if (!g.classList.contains('open')) g.setAttribute('inert', '');
  }

  /* ================= TOAST ================= */
  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }

  /* ================= FIT PHONE ================= */
  function fit() {
    const root = document.documentElement;
    if (window.innerWidth <= 480) { root.style.setProperty('--s', '1'); return; }
    const topbar = window.innerWidth < 1024 ? 64 : 0;
    const availH = window.innerHeight - 32 - topbar;
    const availW = window.innerWidth < 1024 ? window.innerWidth - 32 : 460;
    const s = Math.min(1, availH / 868, availW / 414);
    root.style.setProperty('--s', Math.max(0.55, s).toFixed(4));
  }

  /* ================= EVENTS ================= */
  /* Long-press on a sentence (data-long) runs that action, e.g. translate the whole sentence. The click that follows is swallowed. */
  let pressTimer = null; let pressFired = false; let pressAt = null;
  document.addEventListener('pointerdown', (e) => {
    const host = e.target.closest('[data-long]');
    pressFired = false;
    clearTimeout(pressTimer);
    if (!host) return;
    pressAt = [e.clientX, e.clientY];
    pressTimer = setTimeout(() => { pressFired = true; const fn = A[host.dataset.long]; if (fn) fn(host.dataset.arg, host); }, 550);
  });
  /* scrolling or lifting the finger cancels the long-press */
  document.addEventListener('pointermove', (e) => { if (pressAt && Math.hypot(e.clientX - pressAt[0], e.clientY - pressAt[1]) > 10) clearTimeout(pressTimer); });
  ['pointerup', 'pointercancel'].forEach((t) => document.addEventListener(t, () => { clearTimeout(pressTimer); pressAt = null; }));
  document.addEventListener('contextmenu', (e) => { if (e.target.closest('[data-long]')) e.preventDefault(); });
  document.addEventListener('click', (e) => {
    if (pressFired) { pressFired = false; e.preventDefault(); return; }
    const el = e.target.closest('[data-act]');
    if (!el) return;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    const fn = A[el.dataset.act];
    if (!fn) return;
    e.preventDefault();
    fn(el.dataset.arg, el, e);
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'examDate') { if (e.target.value) S.examDate = e.target.value; render(); }
    if (e.target.id === 'adult') { S.onb.adult = e.target.checked; render(); const a = $('#adult'); if (a) a.focus(); }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'tqText') S.tq.text = e.target.value;
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-form="chat"]');
    if (!f) return;
    e.preventDefault();
    const inp = $('#chatIn');
    const v = inp.value;
    sendChat(v);
    const again = $('#chatIn'); if (again && !v.trim()) again.focus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (S.sheet) { closeSheet(); return; }
      closeGuide(); return;
    }
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (S.sheet) return;
    if (e.key === 'ArrowRight' && !e.target.closest('[role="tablist"],[role="radiogroup"]')) { stepScene(1); }
    if (e.key === 'ArrowLeft' && !e.target.closest('[role="tablist"],[role="radiogroup"]')) { stepScene(-1); }
  });
  window.addEventListener('resize', () => { fit(); syncGuideMode(); });

  /* ================= INIT ================= */
  buildGuide();
  fit();
  syncGuideMode();
  const m = /[#&]p=([\w-]+)/.exec(location.hash);
  if (m && PRESETS[m[1]]) preset(m[1]); else render();
  // typing a new #p=… in the address bar jumps too (replaceState in updateHash does not fire this)
  window.addEventListener('hashchange', () => {
    const h = /[#&]p=([\w-]+)/.exec(location.hash);
    if (h && PRESETS[h[1]]) preset(h[1]);
  });
  window.SENPAI_DEBUG = { get state() { return S; }, preset: preset, acts: Object.keys(A) };
})();
