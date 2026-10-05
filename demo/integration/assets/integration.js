/* Sensei Agent integration mock: a fictional center's IT Passport quiz app ("Đèn Lồng IT Pass"), before and after the
   Sensei Agent module is embedded, plus a plain-language "how it connects" page. Hash router (#p=<page>), no network, no AI. */
(function () {
  'use strict';
  var main = document.getElementById('main');
  var state = { consent: true, share: false, hint: 0, picks: [], askSent: false, beforePick: null };

  var ROUTES = ['before', 'before-quiz', 'after', 'after-consent', 'after-tutor', 'after-ask', 'how'];
  var STEPS = [
    { p: 'before', n: 1, t: 'Trước', d: 'App của trung tâm như hiện nay' },
    { p: 'after', n: 2, t: 'Sau', d: 'Cùng app, có gia sư Sensei Agent' },
    { p: 'how', n: 3, t: 'Cách nối', d: 'Dữ liệu đi đâu, ai giữ' }
  ];

  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ic = function (n, cls) { return '<svg class="ic ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + n + '"></use></svg>'; };
  var mk = function (n, tone) { return '<span class="mk ' + (tone || '') + '" aria-hidden="true">' + n + '</span>'; };
  var btn = function (label, act, arg, cls, extra) {
    return '<button class="' + cls + '" data-act="' + act + '"' + (arg != null ? ' data-arg="' + esc(arg) + '"' : '') + (extra || '') + '>' + label + '</button>';
  };

  var Q = {
    stem: 'Một chuỗi siêu thị muốn biết khách thường mua những món nào <b>cùng nhau</b> trong một lần mua, để đặt các kệ đó gần nhau. Nên dùng cách phân tích nào?',
    opts: [
      { k: 'A', t: 'バスケット分析', v: 'phân tích giỏ hàng' },
      { k: 'B', t: 'ABC分析', v: 'phân tích ABC' },
      { k: 'C', t: 'SWOT分析', v: 'phân tích SWOT' },
      { k: 'D', t: 'PPM', v: 'ma trận danh mục sản phẩm' }
    ],
    ans: 'A',
    hints: [
      { t: 'Gợi ý 1 · khái niệm', b: 'Câu hỏi nói về những món <b>đi cùng nhau</b> trong một lần mua, không phải món nào bán chạy nhất.', src: 'Nguồn: giáo trình Học viện Đèn Lồng, chương “Phân tích dữ liệu” (mẫu)' },
      { t: 'Gợi ý 2 · ví dụ tương tự', b: 'Cửa hàng thấy ai mua mì gói thường mua thêm trứng, nên đặt hai kệ gần nhau. Cách phân tích nào nhìn vào “giỏ” của từng lần mua?' },
      { t: 'Gợi ý 3 · loại một đáp án', b: 'Loại C: SWOT xem điểm mạnh, điểm yếu, cơ hội, rủi ro của cả công ty, không nhìn vào từng lần mua.' }
    ]
  };

  /* ---------- the fictional center's app ---------- */
  function statusbar() { return '<div class="sb" aria-hidden="true"><span>12:40</span><span class="island"></span><span class="sb-r"><span class="sig"></span><span class="bat"></span></span></div>'; }
  function ltHeader(title, back) {
    return '<header class="lt-bar">' + (back ? btn(ic('back'), 'go', back, 'lt-icon', ' aria-label="Quay lại"') : '<span class="lt-logo" aria-hidden="true">' + ic('lantern') + '</span>') +
      '<div class="lt-bar-t"><b>' + title + '</b>' + (back ? '' : '<em>Học viện Đèn Lồng</em>') + '</div>' +
      (back ? '' : '<span class="lt-av" aria-hidden="true">K</span>') + '</header>';
  }
  function ltTabs() {
    var tabs = [['home', 'Trang chủ'], ['list', 'Bộ đề'], ['chart', 'Kết quả'], ['user', 'Tôi']];
    return '<nav class="lt-tabs" aria-label="Điều hướng của app Đèn Lồng">' + tabs.map(function (t, i) {
      return i === 0 ? '<span class="lt-tab on" aria-current="page">' + ic(t[0]) + '<span>' + t[1] + '</span></span>' :
        btn(ic(t[0]) + '<span>' + t[1] + '</span>', 'toast', 'Mô phỏng chỉ dựng màn Trang chủ của app Đèn Lồng.', 'lt-tab');
    }).join('') + '</nav>';
  }
  function scoreCard(marker) {
    var f = [['ストラテジ系', 'Chiến lược', 55], ['マネジメント系', 'Quản lý', 70], ['テクノロジ系', 'Công nghệ', 64]];
    return '<section class="lt-card lt-score">' + (marker || '') + '<p class="lt-k">Lần làm gần nhất · Đề tổng hợp 4</p><p class="lt-big"><b>31</b>/50 câu đúng <span>62%</span></p>' +
      '<ul class="lt-fields">' + f.map(function (x) { return '<li><span><span lang="ja">' + x[0] + '</span><em>' + x[1] + '</em></span><span class="lt-fbar"><i style="width:' + x[2] + '%"></i></span><b>' + x[2] + '%</b></li>'; }).join('') + '</ul></section>';
  }
  function quizList(marker) {
    var q = [['Bộ đề 13', 'Chiến lược · 20 câu', 'Chưa làm', true], ['Bộ đề 12', 'Công nghệ · 20 câu', '13/20'], ['Bộ đề 11', 'Quản lý · 20 câu', '15/20'], ['Đề tổng hợp 4', '50 câu · 60 phút', '31/50']];
    return '<section class="lt-sec">' + (marker || '') + '<h3 class="lt-h">Bộ đề của em</h3><ul class="lt-quiz">' + q.map(function (x) {
      return '<li><span class="lt-qi" aria-hidden="true">' + ic('list', 'ic-sm') + '</span><span class="lt-qt"><b>' + x[0] + '</b><em>' + x[1] + '</em></span>' +
        (x[3] ? btn('Làm bài', 'go', 'before-quiz', 'lt-btn sm') : '<span class="lt-qs">' + x[2] + '</span>') + '</li>';
    }).join('') + '</ul></section>';
  }
  function hello() { return '<section class="lt-hello"><p>Chào Khoa</p><h2>Ôn thi IT Passport</h2><p>Ngày thi em đặt: 14/12/2026 · còn 27 ngày</p></section>'; }

  function phone(inner, opts) {
    opts = opts || {};
    return '<div class="device-box"><div class="device"><div class="phone' + (opts.sp ? ' sp-mode' : '') + '" role="region" aria-label="Màn hình app Đèn Lồng IT Pass">' + statusbar() +
      '<div class="badge-strip">' + ic('info', 'ic-xs') + 'Prototype thiết kế · dữ liệu mẫu · chưa nối AI</div>' + inner + '<span class="home-ind" aria-hidden="true"></span></div></div></div>';
  }

  /* ---------- screens ---------- */
  var S = {};

  S.before = function () {
    return phone(ltHeader('Đèn Lồng IT Pass') + '<div class="ph-body lt">' + hello() + scoreCard(mk(1, 'lt')) + quizList(mk(2, 'lt')) + '</div>' + ltTabs());
  };

  S['before-quiz'] = function () {
    var p = state.beforePick;
    var opts = Q.opts.map(function (o) {
      var cls = p ? (o.k === Q.ans ? ' right' : o.k === p ? ' wrong' : '') : '';
      return '<li>' + btn('<b>' + o.k + '</b><span><span lang="ja">' + o.t + '</span><em>' + o.v + '</em></span>', 'beforePick', o.k, 'lt-opt' + cls, p ? ' disabled data-why="Đã chọn"' : '') + '</li>';
    }).join('');
    var res = p ? '<div class="lt-result ' + (p === Q.ans ? 'ok' : 'no') + '">' + mk(3, 'lt') + '<b>' + (p === Q.ans ? 'Đúng' : 'Sai') + '</b><span>Đáp án: ' + Q.ans + '</span></div>' +
      '<p class="lt-note">App chỉ báo đúng hay sai. Không có giải thích, không biết học gì tiếp.</p>' +
      '<div class="lt-row">' + btn('Làm lại', 'beforeReset', null, 'lt-btn ghost') + btn('Câu tiếp', 'toast', 'Mô phỏng có một câu mẫu.', 'lt-btn') + '</div>' : '<p class="lt-note">Chọn một đáp án.</p>';
    return phone(ltHeader('Bộ đề 13 · Câu 4/20', 'before') + '<div class="ph-body lt"><div class="lt-prog"><i style="width:20%"></i></div><p class="lt-stem">' + Q.stem + '</p><ul class="lt-opts">' + opts + '</ul>' + res + '</div>');
  };

  S.after = function () {
    var card = state.consent ?
      '<section class="sp-card">' + mk(1) +
        '<p class="sp-tag"><span class="sp-seal" aria-hidden="true">先</span>Gia sư Sensei Agent · trong app Đèn Lồng</p>' +
        '<h2 class="sp-h">Hôm nay 12 phút</h2>' +
        '<p class="sp-why">' + mk(2) + 'Mảng <b>Chiến lược</b> đang 55%, thấp nhất trong 3 mảng. Hôm nay tập trung vào đó.</p>' +
        '<ol class="sp-plan"><li><span>3′</span>Ôn 5 thẻ đến hạn</li><li><span>6′</span>Bài: phân tích dữ liệu bán hàng</li><li><span>3′</span>3 câu Chiến lược, có gợi ý từng bậc</li></ol>' +
        '<p class="sp-approve">' + mk(3, 'shu') + ic('gate', 'ic-sm') + 'Thầy Quang đã duyệt kế hoạch tuần này (16/11)</p>' +
        btn('Bắt đầu 12 phút' + ic('next', 'ic-sm'), 'go', 'after-tutor', 'sp-btn primary block') + '</section>' :
      '<section class="sp-card invite"><p class="sp-tag"><span class="sp-seal" aria-hidden="true">先</span>Mới · Gia sư Sensei Agent</p><p class="sp-why">Học viện Đèn Lồng vừa thêm gia sư AI. Bật để có kế hoạch mỗi ngày và gợi ý khi làm sai.</p>' +
        btn('Xem và bật', 'go', 'after-consent', 'sp-btn primary block') + '</section>';
    var priv = btn(ic('shield', 'ic-sm') + '<span>Quyền riêng tư của gia sư Sensei Agent</span>' + ic('next', 'ic-sm'), 'go', 'after-consent', 'sp-row');
    return phone(ltHeader('Đèn Lồng IT Pass') + '<div class="ph-body lt">' + hello() + card + scoreCard() + quizList() + priv + '</div>' + ltTabs());
  };

  S['after-consent'] = function () {
    var yes = ['Điểm các bộ đề em đã làm trong app này', 'Ngày thi em đặt', 'Số phút rảnh mỗi ngày em nhập'];
    var no = ['Mật khẩu (em đăng nhập bằng tài khoản Đèn Lồng)', 'Học phí, thanh toán, danh bạ, ảnh trong máy'];
    var toggle = '<label class="sp-toggle"><input type="checkbox" data-act="share"' + (state.share ? ' checked' : '') + '><span class="sp-sw" aria-hidden="true"></span><span><b>Cho thầy Quang đọc mẫu hội thoại</b><em>Để kiểm chất lượng gia sư. Tên em được ẩn. Mặc định: tắt.</em></span></label>';
    var acts = state.consent ?
      btn('Lưu lựa chọn', 'saveConsent', null, 'sp-btn shu block') + btn('Tắt gia sư Sensei Agent', 'revoke', null, 'sp-btn danger-ghost block') :
      btn('Đồng ý và bật gia sư', 'agree', null, 'sp-btn shu block') + btn('Để sau', 'later', null, 'sp-btn ghost block');
    return phone('<header class="sp-bar">' + btn(ic('back'), 'go', 'after', 'sp-icon', ' aria-label="Quay lại"') + '<div class="sp-bar-t"><b>Gia sư Sensei Agent</b><em>Quyền riêng tư</em></div></header>' +
      '<div class="ph-body sp">' +
        '<h2 class="sp-title">' + (state.consent ? 'Em đang bật gia sư Sensei Agent' : 'Bật gia sư Sensei Agent?') + '</h2>' +
        '<p class="sp-lead">Học viện Đèn Lồng dùng Sensei Agent làm gia sư trong app này. Em chọn cho gì, và tắt được bất cứ lúc nào.</p>' +
        '<div class="sp-box">' + mk(1) + '<p class="sp-l yes">' + ic('check', 'ic-xs') + 'Sensei Agent được nhận</p><ul>' + yes.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
        '<p class="sp-l no">' + ic('x', 'ic-xs') + 'Sensei Agent không nhận</p><ul>' + no.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
        '<div class="sp-box">' + mk(2) + '<p class="sp-l">' + ic('lantern', 'ic-xs') + 'App Đèn Lồng thấy gì từ Sensei Agent</p><ul><li>Số phút học, mức vững từng mảng</li><li><b>Không</b> thấy hội thoại của em với gia sư</li></ul></div>' +
        toggle.replace('<label class="sp-toggle">', '<label class="sp-toggle">' + mk(3, 'shu')) +
        '<div class="sp-acts">' + acts + '</div>' +
      '</div>', { sp: true });
  };

  S['after-tutor'] = function () {
    var solved = state.picks.indexOf(Q.ans) >= 0;
    var tried = state.picks.length > 0;
    var hints = Q.hints.map(function (h, i) {
      var open = i < state.hint;
      if (open) return '<li class="hint open"><p class="hint-t">' + ic('bulb', 'ic-sm') + h.t + '</p><p>' + h.b + '</p>' + (h.src ? '<p class="hint-src">' + ic('book', 'ic-xs') + h.src + '</p>' : '') + '</li>';
      if (i === state.hint && !solved) return '<li>' + btn(ic('bulb', 'ic-sm') + h.t, 'hint', null, 'hint-btn') + '</li>';
      return '<li>' + btn(ic('lock', 'ic-sm') + h.t, 'noop', null, 'hint-btn', ' disabled data-why="' + (solved ? 'Đã làm đúng' : 'Mở gợi ý trước đó trước') + '" title="' + (solved ? 'Đã làm đúng' : 'Mở gợi ý trước đó trước') + '"') + '</li>';
    }).join('');
    var opts = Q.opts.map(function (o) {
      var was = state.picks.indexOf(o.k) >= 0;
      var cls = was ? (o.k === Q.ans ? ' right' : ' wrong') : '';
      return '<li>' + btn('<b>' + o.k + '</b><span><span lang="ja">' + o.t + '</span><em>' + o.v + '</em></span>', 'pick', o.k, 'sp-opt' + cls, (was || solved) ? ' disabled data-why="' + (was ? 'Đã chọn' : 'Đã làm đúng') + '"' : '') + '</li>';
    }).join('');
    var fb = '';
    if (solved) {
      fb = '<div class="sp-fb ok">' + ic('check', 'ic-sm') + '<div><b>Đúng rồi' + (state.hint ? ', nhờ ' + state.hint + ' gợi ý' : '') + '</b><p><span lang="ja">バスケット分析</span> (phân tích giỏ hàng) xem những món nằm chung trong một lần mua. <span lang="ja">ABC分析</span> chỉ xếp món theo doanh thu, nên không trả lời được “món nào đi cùng nhau”.</p>' +
        '<p class="hint-src">' + ic('book', 'ic-xs') + 'Nguồn: giáo trình Học viện Đèn Lồng, chương “Phân tích dữ liệu” (mẫu)</p></div></div>' +
        '<div class="sp-row2">' + btn(ic('flag', 'ic-sm') + 'Báo sai', 'toast', 'Đã ghi báo sai. Thầy Quang sẽ xem câu này (mô phỏng).', 'sp-btn ghost sm') + btn('Câu tiếp' + ic('next', 'ic-sm'), 'toast', 'Mô phỏng có một câu mẫu.', 'sp-btn primary sm') + '</div>';
    } else if (tried) {
      fb = '<div class="sp-fb no">' + ic('x', 'ic-sm') + '<div><b>Chưa đúng</b><p>' + (state.hint < 3 ? 'Thử mở gợi ý tiếp theo, rồi chọn lại.' : 'Em đã mở hết gợi ý. Chọn lại, hoặc hỏi thầy Quang.') + '</p></div></div>';
    }
    return phone('<header class="sp-bar">' + btn(ic('back'), 'go', 'after', 'sp-icon', ' aria-label="Về app Đèn Lồng"') + '<div class="sp-bar-t"><b>Gia sư Sensei Agent</b><em>Bước 3/3 · câu Chiến lược</em></div><span class="sp-min">3′</span></header>' +
      '<div class="ph-body sp"><div class="sp-prog"><i style="width:75%"></i></div>' +
        '<p class="sp-stem">' + Q.stem + '</p>' +
        '<div class="hints-wrap">' + mk(1) + '<ol class="hints">' + hints + '</ol></div>' +
        '<ul class="sp-opts">' + opts + '</ul>' + fb +
        '<div class="sp-ask">' + mk(2, 'shu') + '<p>Vẫn vướng? Thầy Quang trả lời trong ngày.</p>' + btn(ic('chat', 'ic-sm') + 'Hỏi thầy Quang', 'go', 'after-ask', 'sp-btn shu-ghost block') + '</div>' +
      '</div>', { sp: true });
  };

  S['after-ask'] = function () {
    // opened straight from a link, before trying the question: show a sample attempt so the summary reads true
    var fresh = !state.picks.length && !state.hint;
    var hintsUsed = fresh ? 2 : state.hint;
    var picked = fresh ? 'B (mẫu)' : state.picks.length ? state.picks.join(' rồi ') : 'chưa chọn';
    var body = state.askSent ?
      '<div class="sp-sent">' + ic('check', 'ic-lg') + '<h2 class="sp-title">Đã gửi thầy Quang</h2><p class="sp-lead">Thầy thường trả lời trong ngày. Câu trả lời hiện ở đây và có thông báo. Em cứ học tiếp.</p>' +
        '<p class="sp-status">' + ic('clock', 'ic-sm') + 'Đang chờ thầy Quang · gửi lúc 12:41</p>' + btn('Về trang chủ Đèn Lồng', 'go', 'after', 'sp-btn primary block') + '</div>' :
      '<h2 class="sp-title">Hỏi thầy Quang</h2><p class="sp-lead">Gia sư gửi kèm tóm tắt, để thầy không phải hỏi lại từ đầu.</p>' +
      '<div class="sp-box">' + mk(1) + '<p class="sp-l">' + ic('bulb', 'ic-xs') + 'Tóm tắt do gia sư soạn</p><ul><li>Câu: phân tích giỏ hàng · mảng Chiến lược</li><li>Đã mở ' + hintsUsed + '/3 gợi ý · đã chọn: ' + picked + '</li><li>Chỗ vướng: phân biệt <span lang="ja">ABC分析</span> với <span lang="ja">バスケット分析</span></li></ul></div>' +
      '<label class="sp-field"><span>Em muốn hỏi thêm</span><textarea rows="3">Em chưa hiểu khi nào thì dùng ABC分析 ạ.</textarea></label>' +
      '<p class="sp-fine">' + mk(2) + 'Thầy Quang thấy tóm tắt này và câu hỏi của em. Thầy không thấy các hội thoại khác của em. App Đèn Lồng chỉ nhận tin “có câu hỏi mới”, không nhận nội dung.</p>' +
      '<div class="sp-acts">' + btn(ic('send', 'ic-sm') + 'Gửi thầy Quang', 'send', null, 'sp-btn shu block') + btn('Huỷ', 'go', 'after-tutor', 'sp-btn ghost block') + '</div>';
    return phone('<header class="sp-bar">' + btn(ic('back'), 'go', 'after-tutor', 'sp-icon', ' aria-label="Quay lại bài"') + '<div class="sp-bar-t"><b>Gia sư Sensei Agent</b><em>Chuyển sang người thật</em></div></header><div class="ph-body sp">' + body + '</div>', { sp: true });
  };

  /* ---------- explanation panel ---------- */
  var PANEL = {
    before: { eye: 'Bước 1 · App như hiện nay', title: 'App luyện đề của Học viện Đèn Lồng', lead: 'Trung tâm hư cấu, đã có app riêng với 120 học viên IT Passport. Họ không muốn bỏ app để chuyển sang app khác.',
      pts: [[1, 'lt', 'Chỉ có điểm', 'Khoa biết mình đúng 62%, nhưng không biết hôm nay nên học gì với 12 phút rảnh.'], [2, 'lt', 'Tự chọn bộ đề', 'Học viên tự đoán nên làm bộ nào. Giáo viên không biết ai đang vướng ở đâu.'], [3, 'lt', 'Chỉ đúng hoặc sai', 'Bấm “Làm bài” để thấy: sai thì app hiện đáp án, không giải thích vì sao.']],
      next: ['Làm thử một câu', 'before-quiz'], next2: ['Xem cùng app khi có Sensei Agent', 'after'] },
    'before-quiz': { eye: 'Bước 1 · App như hiện nay', title: 'Làm bài: chỉ biết đúng hay sai', lead: 'Chọn một đáp án trong điện thoại. Đây là chỗ học viên hay bỏ cuộc: sai mà không hiểu vì sao.',
      pts: [[3, 'lt', 'Không có lời giải', 'App chỉ hiện đáp án đúng. Muốn hỏi thì nhắn nhóm chat của lớp, câu hỏi dễ trôi mất.']],
      next: ['Xem cùng câu này khi có Sensei Agent', 'after-tutor'], next2: ['Về trang chủ app', 'before'] },
    after: { eye: 'Bước 2 · Cùng app, có Sensei Agent', title: 'Gia sư nằm ngay trong app cũ', lead: 'Khoa vẫn mở app Đèn Lồng, vẫn đăng nhập như cũ. Phần màu chàm là khối Sensei Agent nhúng vào.',
      pts: [[1, '', 'Kế hoạch hôm nay', '“Hôm nay 12 phút” do agent Lập kế hoạch soạn, vừa với số phút Khoa có.'], [2, '', 'Dùng điểm của app cũ', 'Lý do dựa trên điểm các bộ đề Khoa đã làm trong app Đèn Lồng, gửi sang Sensei Agent khi Khoa đồng ý.'], [3, 'shu', 'Giáo viên duyệt', 'Thầy Quang, giáo viên của trung tâm, duyệt kế hoạch. Màu son = chỗ con người quyết.']],
      next: ['Bắt đầu: gia sư gợi ý từng bậc', 'after-tutor'], next2: ['Màn đồng ý khi bật lần đầu', 'after-consent'] },
    'after-consent': { eye: 'Bước 2 · Đồng ý trước khi dữ liệu đi', title: 'Học viên bật, học viên tắt', lead: 'Màn này hiện lần đầu Khoa mở gia sư. Chưa đồng ý thì app Đèn Lồng không gửi gì sang Sensei Agent.',
      pts: [[1, '', 'Nói rõ cho gì, không cho gì', 'Chỉ điểm bộ đề, ngày thi, số phút rảnh. Không mật khẩu, không thanh toán.'], [2, '', 'Trung tâm thấy gì', 'App Đèn Lồng nhận số tổng hợp. Không đọc được hội thoại với gia sư.'], [3, 'shu', 'Quyền của học viên', 'Cho giáo viên đọc mẫu hội thoại là lựa chọn riêng, mặc định tắt.']],
      next: ['Vào bài với gia sư', 'after-tutor'], next2: ['Dữ liệu đi đâu, ai giữ', 'how'] },
    'after-tutor': { eye: 'Bước 2 · Gia sư không làm hộ', title: 'Cùng câu hỏi, nhưng có đường đi', lead: 'Thử trong điện thoại: mở gợi ý từng bậc, chọn đáp án. Lời giải chỉ hiện sau khi Khoa tự chọn.',
      pts: [[1, '', 'Gợi ý 3 bậc', 'Khái niệm → ví dụ tương tự → loại một đáp án sai. Gợi ý bám giáo trình của chính trung tâm.'], [2, 'shu', 'Chuyển sang người thật', 'Vướng thì bấm “Hỏi thầy Quang”. Câu hỏi vào web giáo viên của Sensei Agent, kèm tóm tắt.']],
      next: ['Hỏi thầy Quang', 'after-ask'], next2: ['Về trang chủ app', 'after'] },
    'after-ask': { eye: 'Bước 2 · Hỏi thầy Quang', title: 'Người thật trả lời, AI chỉ tóm tắt', lead: 'Gia sư soạn tóm tắt để thầy Quang đỡ hỏi lại. Khoa xem được đúng những gì sẽ gửi đi.',
      pts: [[1, '', 'Tóm tắt minh bạch', 'Câu nào, mở mấy gợi ý, chọn gì, vướng chỗ nào. Không kèm hội thoại khác.'], [2, '', 'Ai nhận gì', 'Thầy Quang nhận nội dung trong web giáo viên. App Đèn Lồng chỉ nhận tin báo, không có nội dung.']],
      next: ['Dữ liệu đi đâu, ai giữ', 'how'], next2: ['Phía thầy Quang: web giáo viên', '../teacher/index.html#p=messages'] }
  };

  var PANEL_OFF = { eye: 'Bước 2 · Gia sư đang tắt', title: 'Chưa đồng ý thì chưa có gì chạy', lead: 'Khoa đã tắt hoặc chưa bật gia sư. App Đèn Lồng chạy như cũ, chỉ hiện một thẻ mời. Không có điểm nào được gửi sang Sensei Agent.',
    pts: [], next: ['Xem màn đồng ý', 'after-consent'], next2: ['Dữ liệu đi đâu, ai giữ', 'how'] };

  function panel(p) {
    var d = p === 'after' && !state.consent ? PANEL_OFF : PANEL[p];
    var nextBtn = function (n, cls) { return n[1].indexOf('.html') > 0 ? '<a class="btn ' + cls + '" href="' + n[1] + '">' + n[0] + ic('ext', 'ic-sm') + '</a>' : btn(n[0] + ic('next', 'ic-sm'), 'go', n[1], 'btn ' + cls); };
    return '<aside class="panel" aria-labelledby="pT"><p class="eyebrow">' + d.eye + '</p><h1 id="pT" class="h1" tabindex="-1">' + d.title + '</h1><p class="lead">' + d.lead + '</p>' +
      '<ol class="pts">' + d.pts.map(function (x) { return '<li>' + mk(x[0], x[1]) + '<div><b>' + x[2] + '</b><p>' + x[3] + '</p></div></li>'; }).join('') + '</ol>' +
      '<div class="legend"><span><i class="sw lt"></i>App của trung tâm (Đèn Lồng)</span><span><i class="sw sp"></i>Khối Sensei Agent nhúng vào</span><span><i class="sw shu"></i>Con người quyết</span></div>' +
      '<div class="panel-next"><p class="eyebrow">Bước tiếp</p>' + nextBtn(d.next, 'primary block') + nextBtn(d.next2, 'ghost block') + '</div></aside>';
  }

  /* ---------- how it connects ---------- */
  function how() {
    var flows = [
      { n: 1, t: 'Đăng nhập chung', k: 'OIDC SSO', from: 'Học viên → máy chủ Đèn Lồng → Sensei Agent',
        d: 'Khoa đăng nhập bằng tài khoản Đèn Lồng như mọi ngày. Máy chủ Đèn Lồng xác nhận “đây là học viên của lớp IT Passport” và đưa Sensei Agent một mã ẩn danh. Sensei Agent không thấy mật khẩu hay email.' },
      { n: 2, t: 'Khung nhúng', k: 'widget / WebView', from: 'Điện thoại ↔ Sensei Agent, đi thẳng',
        d: 'Màn gia sư là trang của Sensei Agent hiện bên trong app. Nội dung học đi thẳng giữa điện thoại và Sensei Agent. App Đèn Lồng chỉ “đóng khung”, không đọc được bên trong.' },
      { n: 3, t: 'API giữa hai máy chủ', k: 'API', from: 'Máy chủ Đèn Lồng ↔ Sensei Agent',
        d: 'Đèn Lồng gửi điểm bộ đề và ngày thi, chỉ khi học viên đã đồng ý. Đèn Lồng lấy về số tổng hợp: số phút học, mức vững từng mảng.' },
      { n: 4, t: 'Sensei Agent báo tin', k: 'webhooks', from: 'Sensei Agent → máy chủ Đèn Lồng',
        d: 'Khi có việc xảy ra, Sensei Agent báo: học viên bật hoặc tắt đồng ý, kế hoạch đổi, có câu hỏi mới cho thầy. Tin báo chỉ có loại việc và mã ẩn danh, không có nội dung.' }
    ];
    var own = [
      ['Tài khoản, học phí, danh sách lớp', 'Học viện Đèn Lồng', 'yes', 'Có, là dữ liệu của họ'],
      ['Điểm các bộ đề trong app', 'Học viện Đèn Lồng · Sensei Agent nhận bản sao khi học viên đồng ý', 'yes', 'Có'],
      ['Kế hoạch học, mức vững từng mảng', 'Sensei Agent, giữ thay học viên', 'part', 'Chỉ số tổng hợp'],
      ['Hội thoại với gia sư', 'Sensei Agent, giữ thay học viên', 'no', 'Không. Thầy Quang đọc mẫu chỉ khi học viên bật'],
      ['Câu hỏi gửi thầy Quang', 'Sensei Agent, trong web giáo viên', 'no', 'Không. Chỉ nhận tin “có câu hỏi mới”'],
      ['Ảnh tài liệu học viên chụp', 'Không ai giữ: đọc xong là xoá', 'no', 'Không'],
      ['Mật khẩu', 'Học viện Đèn Lồng', 'no', 'Sensei Agent không bao giờ thấy']
    ];
    var tag = { yes: ['ok', 'check'], part: ['part', 'info'], no: ['no', 'lock'] };
    return '<div class="how">' +
      '<header class="how-head"><p class="eyebrow">Bước 3 · Cách nối</p><h1 class="h1" tabindex="-1">Gắn Sensei Agent vào app có sẵn: 4 đường nối</h1>' +
      '<p class="lead">Trung tâm giữ app, giữ học viên, giữ dữ liệu của mình. Sensei Agent thêm gia sư và kế hoạch học. Giai đoạn hackathon: chỉ mô phỏng, chưa có API thật.</p></header>' +
      '<figure class="diagram" aria-label="Sơ đồ 4 đường nối giữa điện thoại, máy chủ Đèn Lồng và Sensei Agent">' + diagram() + '<figcaption>Màu xanh ngọc: thuộc Học viện Đèn Lồng. Màu chàm: thuộc Sensei Agent. Số trong vòng tròn khớp với 4 thẻ bên dưới.</figcaption></figure>' +
      '<ol class="flows">' + flows.map(function (f) { return '<li class="flow"><span class="fnum">' + f.n + '</span><div><p class="flow-t">' + f.t + ' <code>' + f.k + '</code></p><p class="flow-from">' + f.from + '</p><p>' + f.d + '</p></div></li>'; }).join('') + '</ol>' +
      '<div class="how-grid">' +
        '<section class="card" aria-labelledby="oT"><h2 id="oT" class="card-h2">Ai giữ dữ liệu nào</h2><div class="own" role="table" aria-label="Ai giữ dữ liệu nào">' +
          '<div class="own-r own-h" role="row"><span role="columnheader">Dữ liệu</span><span role="columnheader">Ai giữ</span><span role="columnheader">App Đèn Lồng đọc được?</span></div>' +
          own.map(function (r) { var t = tag[r[2]]; return '<div class="own-r" role="row"><b role="cell">' + r[0] + '</b><span role="cell">' + r[1] + '</span><span role="cell" class="own-can ' + t[0] + '">' + ic(t[1], 'ic-xs') + r[3] + '</span></div>'; }).join('') + '</div></section>' +
        '<aside class="how-side">' +
          '<section class="card sp-dark"><h2 class="card-h2">' + ic('shield', 'ic-sm') + 'Học viên luôn tắt được</h2><p>Khoa tắt gia sư trong màn quyền riêng tư. Sensei Agent báo tin cho Đèn Lồng (đường 4), Đèn Lồng ngừng gửi điểm (đường 3). Dữ liệu học của Khoa ở Sensei Agent được xoá theo yêu cầu.</p>' + btn('Xem màn đồng ý', 'go', 'after-consent', 'btn ghost-dark sm') + '</section>' +
          '<section class="card"><h2 class="card-h2">' + ic('info', 'ic-sm') + 'Trung tâm cần làm gì</h2><ol class="todo"><li>Bật đăng nhập chung cho Sensei Agent từ máy chủ của mình</li><li>Thêm một màn khung nhúng vào app</li><li>Gọi API gửi điểm, nhận số tổng hợp</li><li>Nhận tin báo từ Sensei Agent</li></ol><p class="fine">Mức công sức thật: chưa đo, sẽ ước lượng khi có trung tâm thử nghiệm.</p></section>' +
          '<section class="card"><h2 class="card-h2">' + ic('server', 'ic-sm') + 'Phía đội Sensei Agent thấy gì</h2><p class="fine">Học viện Đèn Lồng là một trung tâm trong web vận hành, chỉ có số tổng hợp.</p><a class="btn ghost sm block" href="../ops/index.html#p=tenant-den-long">Mở web vận hành' + ic('ext', 'ic-sm') + '</a></section>' +
        '</aside>' +
      '</div>' +
      '<div class="how-next">' + btn(ic('back', 'ic-sm') + 'Xem lại app khi có Sensei Agent', 'go', 'after', 'btn ghost') + '<a class="btn primary" href="../teacher/index.html#p=admin-plan">Gói và chi phí phía trung tâm' + ic('ext', 'ic-sm') + '</a></div>' +
    '</div>';
  }

  function diagram() {
    var num = function (x, y, n) { return '<g class="dn"><circle cx="' + x + '" cy="' + y + '" r="15"/><text x="' + x + '" y="' + (y + 5.5) + '" text-anchor="middle">' + n + '</text></g>'; };
    return '<svg viewBox="0 0 1000 440" class="dg" role="img" aria-labelledby="dgT"><title id="dgT">Điện thoại học viên chạy app Đèn Lồng có khung Sensei Agent bên trong; máy chủ Đèn Lồng ở giữa; Sensei Agent bên phải. Bốn đường nối được đánh số.</title>' +
      '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#3A4458"/></marker></defs>' +
      // phone
      '<rect x="30" y="30" width="220" height="380" rx="34" class="d-phone"/>' +
      '<text x="140" y="64" text-anchor="middle" class="d-cap">Điện thoại của Khoa</text>' +
      '<rect x="46" y="80" width="188" height="316" rx="16" class="d-lt"/>' +
      '<text x="140" y="106" text-anchor="middle" class="d-lt-t">App Đèn Lồng IT Pass</text>' +
      '<text x="140" y="128" text-anchor="middle" class="d-small">bộ đề · điểm · tài khoản</text>' +
      '<rect x="60" y="232" width="160" height="152" rx="12" class="d-sp"/>' +
      '<text x="140" y="264" text-anchor="middle" class="d-sp-t">Khung Sensei Agent</text>' +
      '<text x="140" y="288" text-anchor="middle" class="d-sp-s">kế hoạch · gia sư</text>' +
      '<text x="140" y="310" text-anchor="middle" class="d-sp-s">hỏi thầy Quang</text>' +
      // center server
      '<rect x="340" y="30" width="220" height="190" rx="18" class="d-lt"/>' +
      '<text x="450" y="62" text-anchor="middle" class="d-lt-t">Máy chủ Đèn Lồng</text>' +
      '<text x="450" y="92" text-anchor="middle" class="d-small">tài khoản, học phí, lớp</text>' +
      '<text x="450" y="114" text-anchor="middle" class="d-small">điểm các bộ đề</text>' +
      // teacher
      '<rect x="340" y="258" width="220" height="74" rx="16" class="d-sp-lite"/>' +
      '<text x="450" y="289" text-anchor="middle" class="d-sp-dark">Thầy Quang</text>' +
      '<text x="450" y="312" text-anchor="middle" class="d-small">web giáo viên của Sensei Agent</text>' +
      // senpai
      '<rect x="770" y="30" width="200" height="380" rx="18" class="d-sp"/>' +
      '<text x="870" y="64" text-anchor="middle" class="d-sp-t">Sensei Agent</text>' +
      '<text x="870" y="86" text-anchor="middle" class="d-sp-s">máy chủ ở Tokyo</text>' +
      '<text x="870" y="140" text-anchor="middle" class="d-sp-s">5 agent + bộ điều phối</text>' +
      '<text x="870" y="164" text-anchor="middle" class="d-sp-s">kế hoạch, mức vững</text>' +
      '<text x="870" y="188" text-anchor="middle" class="d-sp-s">hội thoại</text>' +
      '<text x="870" y="210" text-anchor="middle" class="d-sp-s">(giữ thay học viên)</text>' +
      '<text x="870" y="234" text-anchor="middle" class="d-sp-s">sổ đồng ý</text>' +
      // 1 login: phone -> center, center -> senpai
      '<path d="M234 150 L340 150" class="d-line" marker-end="url(#ah)"/>' + '<text x="287" y="140" text-anchor="middle" class="d-lab">đăng nhập</text>' +
      '<path d="M560 62 L770 62" class="d-line" marker-end="url(#ah)"/>' + '<text x="665" y="52" text-anchor="middle" class="d-lab">mã ẩn danh</text>' +
      num(287, 174, 1) + num(665, 84, 1) +
      // 3 API
      '<path d="M560 128 L770 128" class="d-line" marker-start="url(#ah)" marker-end="url(#ah)"/>' + '<text x="665" y="118" text-anchor="middle" class="d-lab">điểm ⇄ số tổng hợp</text>' + num(665, 150, 3) +
      // 4 webhook
      '<path d="M770 196 L560 196" class="d-line dash" marker-end="url(#ah)"/>' + '<text x="665" y="186" text-anchor="middle" class="d-lab">tin báo, không nội dung</text>' + num(665, 216, 4) +
      // teacher link
      '<path d="M770 295 L560 295" class="d-line" marker-start="url(#ah)" marker-end="url(#ah)"/>' + '<text x="665" y="285" text-anchor="middle" class="d-lab">câu hỏi, trả lời</text>' +
      // 2 widget: phone frame <-> senpai, straight under everything
      '<path d="M220 372 L770 372" class="d-line bold" marker-start="url(#ah)" marker-end="url(#ah)"/>' + '<text x="495" y="362" text-anchor="middle" class="d-lab">nội dung học đi thẳng, app Đèn Lồng không đọc</text>' + num(495, 396, 2) +
      '</svg>';
  }

  /* ---------- actions ---------- */
  var toastEl = document.getElementById('toast'), toastT;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 3400); }

  var ACTS = {
    go: function (p) { if (location.hash === '#p=' + p) render(); else location.hash = 'p=' + p; },
    noop: function () {},
    toast: toast,
    beforePick: function (k) { state.beforePick = k; render(); },
    beforeReset: function () { state.beforePick = null; render(); },
    hint: function () { state.hint = Math.min(3, state.hint + 1); render(); },
    pick: function (k) { state.picks.push(k); render(); },
    share: function () { state.share = !state.share; },
    agree: function () { state.consent = true; ACTS.go('after'); toast('Đã bật gia sư Sensei Agent. Em tắt được bất cứ lúc nào.'); },
    later: function () { state.consent = false; ACTS.go('after'); },
    saveConsent: function () { ACTS.go('after'); toast(state.share ? 'Đã lưu: thầy Quang được đọc mẫu hội thoại (tên ẩn).' : 'Đã lưu: thầy Quang không đọc hội thoại.'); },
    revoke: function () { state.consent = false; state.share = false; ACTS.go('after'); toast('Đã tắt gia sư. Sensei Agent đã báo cho app Đèn Lồng ngừng gửi điểm.'); },
    send: function () { state.askSent = true; render(); toast('Đã gửi thầy Quang (mô phỏng).'); }
  };

  /* ---------- router ---------- */
  function current() { var m = /p=([\w-]+)/.exec(location.hash); var p = m ? m[1] : 'before'; return ROUTES.indexOf(p) >= 0 ? p : 'before'; }

  var lastPage = null;
  function render() {
    var p = current();
    var group = p === 'how' ? 'how' : p.indexOf('after') === 0 ? 'after' : 'before';
    document.getElementById('steps').innerHTML = STEPS.map(function (s) {
      var on = s.p === group;
      return '<a class="step' + (on ? ' on' : '') + '" href="#p=' + s.p + '"' + (on ? ' aria-current="step"' : '') + '><span class="step-n">' + s.n + '</span><span><b>' + s.t + '</b><em>' + s.d + '</em></span></a>';
    }).join('');
    main.className = 'stage ' + (p === 'how' ? 'is-how' : 'is-phone');
    main.innerHTML = p === 'how' ? how() : '<div class="phone-col">' + S[p]() + '</div>' + panel(p);
    document.title = (p === 'how' ? 'Cách nối' : PANEL[p].title) + ' · Sensei Agent mô phỏng tích hợp';
    fit();
    if (lastPage !== p) {
      var body = main.querySelector('.ph-body'); if (body) body.scrollTop = 0;
      if (lastPage !== null) { window.scrollTo(0, 0); var h = main.querySelector('.h1'); if (h) h.focus({ preventScroll: true }); }
      lastPage = p;
    }
  }

  // scale the phone frame to fit the viewport height on desktop
  function fit() {
    var box = main.querySelector('.device-box');
    if (!box) return;
    var avail = window.innerHeight - document.querySelector('.hdr').offsetHeight - 40;
    var s = window.innerWidth <= 760 ? 1 : Math.max(0.72, Math.min(1, avail / 868));
    document.documentElement.style.setProperty('--s', s.toFixed(3));
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    var fn = ACTS[b.dataset.act];
    if (!fn) return;
    if (b.tagName !== 'INPUT') e.preventDefault();
    fn(b.dataset.arg);
  });
  window.addEventListener('hashchange', render);
  window.addEventListener('resize', fit);
  window.INT_DEBUG = { acts: Object.keys(ACTS), pages: ROUTES.slice() };
  render();
})();
