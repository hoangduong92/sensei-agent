/* Sensei Agent ops prototype: hash router (#p=<page>), static sample data, no network, no real AI. */
(function () {
  'use strict';
  var D = window.OPS_DATA;
  var view = document.getElementById('view');
  var state = { paused: {}, capRaised: {}, capKept: {}, resolved: {} };

  var NAV = [
    { p: 'tenants', t: 'Các trung tâm', s: 'Trung tâm', icon: 'building' },
    { p: 'routing', t: 'Định tuyến model', s: 'Model', icon: 'route' },
    { p: 'eval', t: 'Bảng eval', s: 'Eval', icon: 'flask' },
    { p: 'cost', t: 'Chi phí AI', s: 'Chi phí', icon: 'coin' },
    { p: 'incidents', t: 'Sự cố & rào chắn', s: 'Sự cố', icon: 'shield' }
  ];

  /* ---------- helpers ---------- */
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ic = function (n, cls) { return '<svg class="ic ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + n + '"></use></svg>'; };
  var usd = function (v) { return '$' + String(Math.round(v * 10) / 10).replace('.', ','); };
  var dec = function (v) { return (Math.round(v * 10) / 10).toFixed(1).replace('.', ','); };
  var permille = function (v) { return dec(v) + '<small class="unit">‰</small>'; };
  var sample = '<span class="tag-sample">số mẫu</span>';
  var byId = function (id) { return D.tenants.filter(function (t) { return t.id === id; })[0]; };
  var budgetOf = function (t) { return state.capRaised[t.id] || t.budget; };
  var healthOf = function (t) {
    if (state.paused[t.id]) return D.health.paused;
    if (t.health === 'cap' && (state.capRaised[t.id] || state.capKept[t.id])) return D.health.ok;
    if (t.health === 'watch' && state.resolved['inc-sen-hong']) return D.health.ok;
    return D.health[t.health];
  };
  var pill = function (h) { return '<span class="pill ' + h.cls + '">' + ic(h.icon, 'ic-xs') + h.t + '</span>'; };
  var btn = function (label, act, arg, cls, extra) {
    return '<button class="btn ' + (cls || 'ghost') + '" data-act="' + act + '"' + (arg != null ? ' data-arg="' + esc(arg) + '"' : '') + (extra || '') + '>' + label + '</button>';
  };
  var totals = function () {
    var r = { active: 0, seats: 0, used: 0, budget: 0, forecast: 0, guard: 0, reportW: 0 };
    D.tenants.forEach(function (t) { r.active += t.active; r.seats += t.seats; r.used += t.used; r.budget += budgetOf(t); r.forecast += t.forecast; r.guard += t.guard; r.reportW += t.reportRate * t.active; });
    r.report = Math.round(r.reportW / r.active * 10) / 10;
    return r;
  };

  function head(o) {
    return '<header class="phead">' +
      '<div class="phead-t"><p class="eyebrow">' + o.eyebrow + '</p><h1 class="h1" tabindex="-1">' + o.title + '</h1>' +
      '<p class="lead">' + o.lead + '</p></div>' + (o.side || '') + '</header>';
  }

  function decisions(items) {
    if (!items.length) return '<section class="decide done" aria-label="Việc cần quyết">' + ic('check', 'ic-sm') + '<p><b>Không còn việc cần quyết.</b> Các trung tâm đang chạy trong trần chi phí và mức báo sai bình thường.</p></section>';
    return '<section class="decide" aria-labelledby="decT"><p class="decide-h" id="decT"><span class="shu-dot" aria-hidden="true"></span>' + items.length + ' việc cần người vận hành quyết hôm nay</p><ol class="decide-list">' +
      items.map(function (d) { return '<li><div><p class="decide-t">' + d.t + '</p><p class="decide-b">' + d.b + '</p></div>' + btn(d.cta + ic('next', 'ic-sm'), 'go', d.go, 'shu sm') + '</li>'; }).join('') + '</ol></section>';
  }

  function openDecisions() {
    var out = [];
    var bm = byId('ben-may');
    if (!state.capRaised[bm.id] && !state.capKept[bm.id] && !state.paused[bm.id]) out.push({ t: 'Bến Mây sắp vượt trần chi phí AI', b: 'Dự báo cuối tháng ' + usd(bm.forecast) + ', trần ' + usd(bm.budget) + ' (số mẫu). Nâng trần hay để hệ thống tự hạ về câu dựng sẵn?', cta: 'Xem và quyết', go: 'cost' });
    if (!state.resolved['inc-sen-hong']) out.push({ t: 'Sen Hồng có tỉ lệ báo sai cao', b: '6,4‰, gấp khoảng 3 lần mức chung (số mẫu). Hàng chờ giáo viên 9 mục, chờ 30 giờ.', cta: 'Xem sự cố', go: 'incidents' });
    return out;
  }

  function costBar(t, big) {
    var b = budgetOf(t), max = Math.max(b, t.forecast) * 1.04;
    var over = t.forecast > b;
    return '<div class="cbar' + (big ? ' big' : '') + '" role="img" aria-label="Đã dùng ' + usd(t.used) + ', dự báo ' + usd(t.forecast) + ', trần ' + usd(b) + '">' +
      '<span class="cbar-fc' + (over ? ' over' : '') + '" style="width:' + (t.forecast / max * 100).toFixed(1) + '%"></span>' +
      '<span class="cbar-used" style="width:' + (t.used / max * 100).toFixed(1) + '%"></span>' +
      '<span class="cbar-cap" style="left:' + (b / max * 100).toFixed(1) + '%"><i>trần</i></span></div>';
  }

  /* ---------- pages ---------- */
  var PAGES = {};

  PAGES.tenants = function () {
    var T = totals();
    var rows = D.tenants.map(function (t) {
      var h = healthOf(t);
      return '<a class="trow" href="#p=tenant-' + t.id + '">' +
        '<span class="tcell tname"><span class="mono-av" aria-hidden="true">' + t.mono + '</span><span><b>' + t.name + '</b><em>' + t.kind + '</em></span></span>' +
        '<span class="tcell"><span class="tlabel">Gói</span><span class="tier ' + (t.tier === 'Cao cấp' ? 'pre' : '') + '">' + t.tier + '</span><em class="tsub">' + t.pack + '</em></span>' +
        '<span class="tcell"><span class="tlabel">Học viên đang học</span><b class="num">' + t.active + '</b><em class="tsub num">/ ' + t.seats + ' chỗ</em></span>' +
        '<span class="tcell tcost"><span class="tlabel">Chi phí AI tháng này</span><span class="num tcost-n"><b>' + usd(t.used) + '</b> · dự báo ' + usd(t.forecast) + ' / trần ' + usd(budgetOf(t)) + '</span>' + costBar(t) + '</span>' +
        '<span class="tcell"><span class="tlabel">Tình trạng</span>' + pill(h) + '</span>' +
        '<span class="tgo" aria-hidden="true">' + ic('next', 'ic-sm') + '</span></a>';
    }).join('');
    return head({ eyebrow: 'Vận hành Sensei Agent · ' + D.today, title: 'Các trung tâm đang dùng Sensei Agent',
      lead: 'Mỗi trung tâm là một khách hàng (tenant). Đội vận hành chỉ thấy số tổng hợp của từng trung tâm, không thấy nội dung học của học viên.' }) +
      decisions(openDecisions()) +
      '<section class="kpis" aria-label="Tổng quan">' +
        kpi('Trung tâm', D.tenants.length, '1 giáo viên tự do · 1 đang dùng thử', true) +
        kpi('Học viên đang học', T.active, 'trên ' + T.seats + ' chỗ đã mua', true) +
        kpi('Chi phí AI tháng này', usd(T.used), 'dự báo ' + usd(T.forecast) + ' / trần ' + usd(T.budget), true) +
        kpi('Báo sai trung bình', permille(T.report), 'câu bị báo sai trên 1.000 câu đã hiển thị', true) +
      '</section>' +
      '<section class="card flush" aria-labelledby="tlT"><div class="card-h"><h2 id="tlT">Danh sách trung tâm</h2>' + sample + '</div>' +
      '<div class="thead" aria-hidden="true"><span>Trung tâm</span><span>Gói</span><span>Học viên</span><span>Chi phí AI tháng này</span><span>Tình trạng</span><span></span></div>' +
      '<div class="tlist">' + rows + '</div>' +
      '<p class="card-foot">' + ic('info', 'ic-sm') + '<span>Bấm một trung tâm để xem số tổng hợp. Thanh chi phí: <span class="lg lg-used"></span>đã dùng · <span class="lg lg-fc"></span>dự báo cuối tháng · <span class="lg lg-cap"></span>trần.</span></p></section>';
  };

  function kpi(label, value, sub, isSample) {
    return '<div class="kpi"><p class="kpi-l">' + label + '</p><p class="kpi-v num">' + value + '</p><p class="kpi-s">' + sub + (isSample ? ' ' + sample : '') + '</p></div>';
  }

  function tenantPage(t) {
    var h = healthOf(t), b = budgetOf(t);
    var scale = t.used / 52;
    var costRows = D.agentCost.map(function (c) {
      var v = Math.round(c.v * scale * 10) / 10;
      return '<li><span class="ac-a">' + c.a + '<em>' + (t.tier === 'Cao cấp' && (c.a === 'Gia sư' || c.a === 'Trợ lý lớp') ? 'Sonnet 5' : c.m) + '</em></span><span class="ac-bar"><i style="width:' + (c.v / 30 * 100).toFixed(1) + '%"></i></span><b class="num">' + usd(v) + '</b></li>';
    }).join('');
    var classRows = t.classes.map(function (c) { return '<li><span>' + c.n + '<em>' + c.t + '</em></span><b class="num">' + c.k + ' <small>học viên</small></b></li>'; }).join('');
    var paused = state.paused[t.id];
    return head({ eyebrow: '<a href="#p=tenants" class="back-link">' + ic('back', 'ic-xs') + 'Các trung tâm</a>', title: t.name,
      lead: t.kind + ' · ' + t.pack + ' · dùng từ ' + t.since + '.',
      side: '<div class="phead-side"><span class="tier ' + (t.tier === 'Cao cấp' ? 'pre' : '') + '">Gói ' + t.tier + '</span>' + pill(h) + '</div>' }) +
      (paused ? '<p class="banner off">' + ic('pause', 'ic-sm') + '<span><b>Trung tâm đang tạm khoá (mô phỏng).</b> Học viên vẫn mở được app và bài đã tải, nhưng không gọi AI mới. ' + '</span>' + btn('Mở khoá lại', 'unpause', t.id, 'ghost sm') + '</p>' : '') +
      '<div class="split">' +
        '<div class="split-main">' +
          '<section class="kpis k4" aria-label="Số tổng hợp">' +
            kpi('Học viên đang học', t.active, 'trên ' + t.seats + ' chỗ đã mua', true) +
            kpi('Lớp', t.classCount, t.teachers + ' giáo viên', true) +
            kpi('Hàng chờ giáo viên', t.queue, 'trung vị chờ ' + t.queueHours + ' giờ', true) +
            kpi('Báo sai', permille(t.reportRate), 'câu bị báo sai trên 1.000 câu hiển thị', true) +
          '</section>' +
          '<section class="card" aria-labelledby="cT"><div class="card-h"><h2 id="cT">Chi phí AI tháng này</h2>' + sample + '</div>' +
            '<p class="big-cost num"><b>' + usd(t.used) + '</b> đã dùng · dự báo cuối tháng ' + usd(t.forecast) + ' · trần ' + usd(b) + '</p>' + costBar(t, true) +
            '<h3 class="h3">Theo agent</h3><ol class="agent-cost">' + costRows + '</ol>' +
            '<p class="fine">Tỉ lệ giữa các agent theo mô hình chi phí trong thiết kế hệ thống §7 (Gia sư ≈ 59%, Kiểm chứng ≈ 28%, Lập kế hoạch ≈ 11%). Trợ lý lớp là agent mới, con số là số mẫu.</p></section>' +
          '<section class="card" aria-labelledby="clT"><div class="card-h"><h2 id="clT">Lớp và số học viên</h2>' + sample + '</div><ul class="class-list">' + classRows + '</ul>' +
            '<p class="fine">Chỉ có số đếm. Tên học viên, điểm, kế hoạch từng người nằm ở web giáo viên, đội vận hành không mở được.</p></section>' +
          '<section class="card" aria-labelledby="gT"><div class="card-h"><h2 id="gT">Rào chắn đã chặn trong tháng</h2>' + sample + '</div>' +
            '<p class="big-cost num"><b>' + t.guard + '</b> sự kiện · chỉ lưu nhãn loại, không lưu câu hỏi</p>' + btn('Xem theo loại' + ic('next', 'ic-sm'), 'go', 'incidents', 'ghost sm') + '</section>' +
        '</div>' +
        '<aside class="split-side">' + seeBox() +
          '<section class="card" aria-labelledby="dT"><div class="card-h"><h2 id="dT">Người vận hành quyết</h2></div>' +
            '<p class="fine">Chỉ đội vận hành làm được hai việc này. Mỗi quyết định được ghi lại kèm tên người bấm.</p>' +
            '<div class="stack">' + btn(ic('coin', 'ic-sm') + 'Đổi trần chi phí AI', 'capDialog', t.id, 'shu block') +
            (paused ? '' : btn(ic('pause', 'ic-sm') + 'Tạm khoá trung tâm', 'pauseDialog', t.id, 'danger-ghost block')) + '</div>' +
            '<p class="fine">Gói chất lượng, số chỗ, thương hiệu, giáo viên: do quản trị trung tâm tự làm.</p>' +
            '<a class="btn ghost block sm" href="../teacher/index.html#p=admin-plan">' + ic('ext', 'ic-sm') + 'Quản trị trung tâm thấy gì</a></section>' +
        '</aside>' +
      '</div>';
  }

  function seeBox() {
    var yes = ['Số học viên đang học, số chỗ, số lớp, số giáo viên', 'Chi phí AI theo agent và theo gói', 'Tỉ lệ báo sai, số câu tự ẩn chờ giáo viên', 'Số sự kiện rào chắn theo nhãn loại', 'Log kỹ thuật không có dữ liệu cá nhân: thời gian phản hồi, lỗi'];
    var no = ['Tên, lịch ca, ngày thi của từng học viên', 'Hội thoại học viên với gia sư AI', 'Câu trả lời, điểm, kế hoạch học của từng người', 'Ảnh và tài liệu học viên chụp (hệ thống không lưu ảnh)', 'Nội dung giáo trình riêng của trung tâm'];
    return '<section class="see" aria-labelledby="seeT"><h2 id="seeT" class="see-h">' + ic('eye', 'ic-sm') + 'Sensei Agent thấy gì, không thấy gì</h2>' +
      '<p class="see-sub">Áp dụng cho đội vận hành Sensei Agent, ở mọi trung tâm.</p>' +
      '<p class="see-l yes">' + ic('check', 'ic-xs') + 'Thấy</p><ul class="see-list yes">' + yes.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      '<p class="see-l no">' + ic('eye-off', 'ic-xs') + 'Không thấy</p><ul class="see-list no">' + no.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      '<p class="see-foot">Giáo viên xem chi tiết để dạy. Đơn vị hỗ trợ / công ty chỉ thấy 4 số học viên tự bật. Đội vận hành chỉ thấy số tổng hợp.</p></section>';
  }

  PAGES.routing = function () {
    var cell = function (r, tier) {
      var m = tier === 'std' ? r.std : r.pre;
      if (r.locked) return '<td><div class="mcell locked"><b>' + m + '</b><span class="mstat">' + ic('lock', 'ic-xs') + 'Khoá ở mọi gói</span></div></td>';
      return '<td><div class="mcell"><b>' + m + '</b><span class="mstat">' + ic('clock', 'ic-xs') + 'Dự kiến · chờ eval</span>' + btn('Đổi model', 'modelDialog', r.id + ':' + tier, 'ghost xs', ' aria-label="Đổi model cho ' + r.a + ', gói ' + (tier === 'std' ? 'Tiêu chuẩn' : 'Cao cấp') + '"') + '</div></td>';
    };
    var rows = D.roles.map(function (r) {
      return '<tr' + (r.locked ? ' class="row-locked"' : '') + '><th scope="row"><b>' + r.a + '</b><em>' + r.d + '</em></th>' + cell(r, 'std') + cell(r, 'pre') + '</tr>';
    }).join('');
    return head({ eyebrow: 'Định tuyến model', title: 'Vai nào chạy model nào, ở từng gói',
      lead: 'Trung tâm chỉ chọn gói chất lượng (Tiêu chuẩn hoặc Cao cấp), không chọn tên model. Đội vận hành quyết model cho từng vai, và chỉ sau khi model qua bộ eval.' }) +
      '<section class="gate-flow" aria-label="Một model vào gói như thế nào">' +
        step(1, 'route', 'Nối qua lớp trung gian', 'Agent gọi model qua model gateway đội tự viết, đổi nhà cung cấp không phải sửa agent') +
        step(2, 'flask', 'Chạy đủ 7 bộ eval', 'H1–H4, N1, P1, E1 cho những vai model sẽ đảm nhận') +
        step(3, 'check', 'Đạt mọi mục tiêu', 'Thiếu một bộ là không vào gói. Hiện tại: chưa đo') +
        step(4, 'gate', 'Người vận hành duyệt', 'Người bấm duyệt, hệ thống ghi lại. Không tự động', true) +
      '</section>' +
      '<div class="split">' +
        '<div class="split-main"><section class="card flush" aria-labelledby="mT"><div class="card-h"><h2 id="mT">Bảng định tuyến</h2><span class="tag-plan">bản dự kiến</span></div>' +
          '<div class="mtable-wrap"><table class="mtable"><thead><tr><th scope="col">Vai (agent)</th><th scope="col">Gói Tiêu chuẩn</th><th scope="col">Gói Cao cấp</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
          '<p class="card-foot">' + ic('lock', 'ic-sm') + '<span><b>Kiểm chứng luôn dùng model mạnh ở mọi gói.</b> Gói rẻ hơn không được hạ sàn chất lượng. Hai gói chỉ khác model của Gia sư và Trợ lý lớp.</span></p></section></div>' +
        '<aside class="split-side">' +
          '<section class="card warnbox" aria-labelledby="dsT"><div class="card-h"><h2 id="dsT">' + ic('lock', 'ic-sm') + 'DeepSeek: chỉ dữ liệu giả · hộp cát</h2></div>' +
            '<p>Ủy ban Bảo vệ Thông tin Cá nhân Nhật Bản (PPC) cảnh báo: dữ liệu người dùng dịch vụ DeepSeek được lưu trên máy chủ ở Trung Quốc và chịu luật của Trung Quốc.</p>' +
            '<blockquote lang="ja">当該サービスの利用に伴いDeepSeek社が取得した個人情報を含むデータは、中華人民共和国に所在するサーバに保存される</blockquote>' +
            '<p class="fine">PPC, 「DeepSeekに関する情報提供」, 3/2/2025, cập nhật 5/3/2025. <a href="https://www.ppc.go.jp/news/careful_information/250203_alert_deepseek/" target="_blank" rel="noopener">Mở trang PPC' + ic('ext', 'ic-xs') + '</a></p>' +
            '<p><b>Luật của Sensei Agent:</b> dữ liệu người học thật không bao giờ đi tới API DeepSeek. Đội chỉ dùng DeepSeek trong hộp cát của đội, với câu hỏi tự soạn, để thử prompt cho rẻ. Gateway đọc nhãn dữ liệu của trung tâm (giả / thật) và chặn bằng code, không phụ thuộc người nhớ. Kiểm chứng vẫn dùng model mạnh, kể cả trong hộp cát.</p></section>' +
          '<section class="card" aria-labelledby="gwT"><div class="card-h"><h2 id="gwT">' + ic('server', 'ic-sm') + 'Model gateway làm gì</h2></div>' +
            '<ul class="dots"><li>Một cửa gọi mọi nhà cung cấp, agent không biết tên model</li><li>Ghi token và chi phí theo trung tâm, theo agent</li><li>Chặn gọi khi trung tâm chạm trần chi phí</li><li>Chỉ dùng bản trả phí của nhà cung cấp, loại không dùng dữ liệu để huấn luyện</li></ul>' +
            btn('Xem bảng eval' + ic('next', 'ic-sm'), 'go', 'eval', 'ghost sm') + '</section>' +
        '</aside>' +
      '</div>';
  };

  function step(n, icon, t, d, human) {
    return '<div class="gstep' + (human ? ' human' : '') + '"><span class="gstep-n">' + (human ? ic(icon, 'ic-sm') : n) + '</span><div><p class="gstep-t">' + t + '</p><p class="gstep-d">' + d + '</p></div></div>';
  }

  PAGES.eval = function () {
    var cols = D.evalModels.map(function (m) { return '<th scope="col" class="' + (m.candidate ? 'cand' : '') + '"><b>' + m.n + '</b><em>' + m.role + '</em></th>'; }).join('');
    var rows = D.evalSuites.map(function (s) {
      return '<tr><th scope="row"><span class="suite-id">' + s.id + '</span><b>' + s.name + '</b><em>' + s.what + '</em><span class="suite-t">Mục tiêu: ' + s.target + '</span></th>' +
        D.evalModels.map(function (m) {
          if (m.sets.indexOf(s.id) < 0) return '<td class="na"><span class="na-t">Không áp dụng</span></td>';
          return '<td><span class="pill ' + (m.candidate ? 'off' : 'wait') + '">' + ic('clock', 'ic-xs') + (m.candidate ? 'Chưa xét' : 'Chưa đo') + '</span></td>';
        }).join('') + '</tr>';
    }).join('');
    var cards = D.evalSuites.map(function (s) {
      var on = D.evalModels.filter(function (m) { return !m.candidate && m.sets.indexOf(s.id) >= 0; }).map(function (m) { return '<span class="chipm">' + m.n + ' · Chưa đo</span>'; }).join('');
      return '<li class="ecard"><p class="ecard-h"><span class="suite-id">' + s.id + '</span><b>' + s.name + '</b></p><p class="fine">' + s.what + '</p><p class="suite-t">Mục tiêu: ' + s.target + '</p><div class="chipms">' + on + '</div></li>';
    }).join('');
    return head({ eyebrow: 'Eval · điều kiện để model vào gói', title: 'Model nào đã qua bộ kiểm tra',
      lead: 'Mỗi ô là một model chạy một bộ kiểm tra. Model chỉ được bật cho một vai khi mọi bộ áp dụng cho vai đó đạt mục tiêu.' }) +
      '<div class="empty">' + ic('clock', 'ic-lg') + '<div><p class="empty-t">Chưa có số đo nào</p><p class="empty-b">Lần chạy đầu: 4–5/11/2026, công bố ở Demo Day 7/11. Trang này không hiện con số tự đặt ra. Dưới đây là mục tiêu đội đặt trước.</p></div>' +
        btn('Chạy bộ eval', 'noop', null, 'ghost sm', ' disabled data-why="Prototype chưa nối AI" title="Prototype chưa nối AI, eval chạy thật từ 25/10/2026" aria-describedby="evalWhy"') + '<p id="evalWhy" class="sr-only">Prototype chưa nối AI, eval chạy thật từ 25/10/2026</p></div>' +
      '<section class="card flush eval-desk" aria-labelledby="eT"><div class="card-h"><h2 id="eT">Bảng eval theo model × bộ kiểm tra</h2></div><div class="mtable-wrap"><table class="mtable etable"><thead><tr><th scope="col">Bộ kiểm tra</th>' + cols + '</tr></thead><tbody>' + rows + '</tbody></table></div></section>' +
      '<ol class="ecards" aria-label="Các bộ kiểm tra">' + cards + '</ol>' +
      '<div class="notes">' +
        '<p class="note">' + ic('info', 'ic-sm') + '<span><b>Khoảng cách công bằng (E1):</b> điểm giải thích cho người mới học tiếng Nhật (L1) không được thấp hơn điểm cho người đã khá (L3) quá 0,5.</span></p>' +
        '<p class="note warn">' + ic('alert', 'ic-sm') + '<span><b>Còn thiếu:</b> Trợ lý lớp chưa có bộ eval riêng trong thiết kế hệ thống. Đề xuất bộ C1: tóm tắt lớp khớp số liệu thật, tin nháp không lộ dữ liệu học viên khác. Chưa có trong kế hoạch.</span></p>' +
      '</div>';
  };

  PAGES.cost = function () {
    var T = totals();
    var bm = byId('ben-may');
    var rows = D.tenants.map(function (t) {
      var b = budgetOf(t), over = t.forecast > b;
      return '<li class="crow"><div class="crow-h"><b>' + t.short + '</b><span class="tier sm ' + (t.tier === 'Cao cấp' ? 'pre' : '') + '">' + t.tier + '</span>' + (over ? '<span class="pill warn">' + ic('alert', 'ic-xs') + 'Dự báo vượt trần</span>' : '') + '</div>' +
        costBar(t) + '<p class="crow-n num">' + usd(t.used) + ' đã dùng · dự báo ' + usd(t.forecast) + ' · trần ' + usd(b) + ' · <span>' + usd(t.forecast / t.active) + '/học viên</span></p></li>';
    }).join('');
    var decided = state.capRaised[bm.id] ? 'Đã nâng trần Bến Mây lên ' + usd(state.capRaised[bm.id]) + '.' : state.capKept[bm.id] ? 'Đã giữ trần Bến Mây. Khi chạm trần, hệ thống tự hạ về câu dựng sẵn.' : '';
    return head({ eyebrow: 'Chi phí AI', title: 'Chi phí AI theo trung tâm',
      lead: 'Mỗi trung tâm có một trần chi phí AI mỗi tháng. Chạm trần thì app vẫn chạy, chỉ bớt phần gọi AI.' }) +
      '<section class="kpis" aria-label="Tổng chi phí">' +
        kpi('Đã dùng tháng này', usd(T.used), 'ngày 17/30', true) +
        kpi('Dự báo cuối tháng', usd(T.forecast), 'theo tốc độ hiện tại', true) +
        kpi('Tổng trần', usd(T.budget), '5 trung tâm', true) +
        kpi('Mốc thiết kế', '≈ $1,8', 'mỗi học viên/tháng, gói Tiêu chuẩn (thiết kế §7, chưa gồm hạ tầng)') +
      '</section>' +
      '<div class="split">' +
        '<div class="split-main"><section class="card" aria-labelledby="ctT"><div class="card-h"><h2 id="ctT">Theo trung tâm</h2>' + sample + '</div><ol class="clist">' + rows + '</ol>' +
          '<p class="card-foot">' + ic('info', 'ic-sm') + '<span><span class="lg lg-used"></span>đã dùng · <span class="lg lg-fc"></span>dự báo cuối tháng · <span class="lg lg-cap"></span>trần. Gói Cao cấp tốn hơn vì Gia sư và Trợ lý lớp dùng model mạnh (con số Cao cấp là số mẫu, chưa tính trong thiết kế).</span></p></section>' +
          '<section class="card" aria-labelledby="capT"><div class="card-h"><h2 id="capT">Khi chạm trần thì sao</h2></div><ol class="ladder">' +
            '<li><span class="ld-n">80%</span><div><b>Báo sớm</b><p>Quản trị trung tâm và đội vận hành nhận thông báo. Chưa đổi gì với học viên.</p></div></li>' +
            '<li><span class="ld-n">1 người</span><div><b>Một học viên dùng quá 200k token Gia sư trong ngày</b><p>Người đó chuyển sang câu đã kiểm chứng có sẵn và gợi ý dựng sẵn đến hết ngày (thiết kế §7.2f).</p></div></li>' +
            '<li><span class="ld-n">100%</span><div><b>Cả trung tâm chạm trần</b><p>Cả trung tâm dùng câu dựng sẵn. Ôn thẻ, thi thử, nhắc lịch vẫn chạy vì không cần AI.</p></div></li>' +
            '<li class="human"><span class="ld-n">' + ic('gate', 'ic-sm') + '</span><div><b>Nâng trần: người vận hành quyết</b><p>Quản trị trung tâm đề nghị, đội vận hành duyệt. Không có nâng trần tự động.</p></div></li>' +
          '</ol><p class="note">' + ic('lock', 'ic-sm') + '<span><b>Không bao giờ</b> hạ Kiểm chứng sang model yếu hơn để tiết kiệm.</span></p></section>' +
        '</div>' +
        '<aside class="split-side"><section class="card decision" aria-labelledby="bmT"><div class="card-h"><h2 id="bmT"><span class="shu-dot" aria-hidden="true"></span>Cần quyết: Bến Mây</h2>' + sample + '</div>' +
          '<p>Gói Cao cấp, 64 học viên. Dự báo cuối tháng <b>' + usd(bm.forecast) + '</b>, trần <b>' + usd(budgetOf(bm)) + '</b>. Nếu giữ trần, khoảng ngày 26 cả trung tâm sẽ chuyển sang câu dựng sẵn.</p>' +
          (decided ? '<p class="banner ok">' + ic('check', 'ic-sm') + '<span>' + decided + '</span></p>' + btn('Hoàn tác', 'undoCap', bm.id, 'ghost block sm') :
          '<div class="stack">' + btn('Nâng trần lên $300', 'raiseCap', bm.id, 'shu block') + btn('Giữ trần $250', 'keepCap', bm.id, 'ghost block') + '</div>') +
          '<p class="fine">Cả hai lựa chọn đều được ghi lại kèm người quyết và gửi cho quản trị Bến Mây.</p></section></aside>' +
      '</div>';
  };

  PAGES.incidents = function () {
    var T = totals();
    var maxR = 7;
    var rep = D.tenants.map(function (t) {
      return '<li><span class="rr-n">' + t.short + '</span><span class="rr-bar"><i class="' + (t.reportRate > 4 ? 'hi' : '') + '" style="width:' + (t.reportRate / maxR * 100).toFixed(1) + '%"></i><s style="left:' + (T.report / maxR * 100).toFixed(1) + '%" title="Mức chung"></s></span><b class="num">' + permille(t.reportRate) + '</b></li>';
    }).join('');
    var gmax = Math.max.apply(null, D.guards.map(function (g) { return g.n; }));
    var guards = D.guards.map(function (g) {
      return '<li><div class="g-t"><b>' + g.k + '</b><em>→ ' + g.r + '</em></div><span class="g-bar"><i style="width:' + (g.n / gmax * 100).toFixed(1) + '%"></i></span><b class="num">' + g.n + '</b></li>';
    }).join('');
    var pii = D.pii.map(function (p) { return '<li><b class="num">' + p.n + '</b><span>' + p.k + '</span></li>'; }).join('');
    var inc = D.incidents.map(function (i) {
      var done = i.state === 'done' || state.resolved[i.id];
      return '<li class="inc' + (done ? ' done' : '') + '"><div class="inc-top"><span class="inc-when num">' + i.when + '</span><span class="inc-where">' + i.where + '</span>' +
        (done ? '<span class="pill ok">' + ic('check', 'ic-xs') + 'Đã xử lý</span>' : '<span class="pill warn">' + ic('alert', 'ic-xs') + 'Đang mở</span>') + '</div>' +
        '<p class="inc-what">' + i.what + '</p><p class="inc-next"><b>' + (done ? 'Kết quả: ' : 'Bước tiếp: ') + '</b>' + i.next + '</p>' +
        (done ? '' : '<div class="inc-act">' + (i.id === 'inc-ben-may' ? btn('Quyết ở trang Chi phí' + ic('next', 'ic-sm'), 'go', 'cost', 'ghost sm') :
          btn('Gửi ghi chú cho quản trị trung tâm', 'notify', i.id, 'ghost sm') + btn(ic('check', 'ic-sm') + 'Đánh dấu đã xử lý', 'resolve', i.id, 'shu sm')) + '</div>') + '</li>';
    }).join('');
    return head({ eyebrow: 'Sự cố & rào chắn', title: 'Chất lượng và an toàn, chỉ bằng nhãn',
      lead: 'Đội vận hành thấy tỉ lệ báo sai và số lần rào chắn chặn theo loại. Không thấy câu hỏi hay hội thoại nào.' }) +
      '<section class="kpis" aria-label="Tổng quan chất lượng">' +
        kpi('Báo sai trung bình', permille(T.report), 'câu bị báo sai trên 1.000 câu đã hiển thị', true) +
        kpi('Câu tự ẩn, chờ giáo viên', 5, 'câu có từ 2 báo sai trở lên', true) +
        kpi('Rào chắn đã chặn', T.guard, 'tháng này, 5 trung tâm', true) +
        kpi('Thông tin cá nhân đã che', 46, 'đếm theo loại, không lưu giá trị', true) +
      '</section>' +
      '<div class="split">' +
        '<div class="split-main">' +
          '<section class="card" aria-labelledby="iT"><div class="card-h"><h2 id="iT">Sự cố</h2>' + sample + '</div><ol class="incs">' + inc + '</ol></section>' +
          '<section class="card" aria-labelledby="gT2"><div class="card-h"><h2 id="gT2">Rào chắn đã chặn, theo loại</h2>' + sample + '</div><ol class="guards">' + guards + '</ol>' +
          '<p class="card-foot">' + ic('lock', 'ic-sm') + '<span>Hệ thống chỉ ghi nhãn loại và thời điểm. Không ghi văn bản câu hỏi, không ghi tên học viên.</span></p></section>' +
        '</div>' +
        '<aside class="split-side">' +
          '<section class="card" aria-labelledby="rT"><div class="card-h"><h2 id="rT">Báo sai theo trung tâm</h2>' + sample + '</div><ol class="rrows">' + rep + '</ol><p class="fine">‰ = số câu bị báo sai trên 1.000 câu đã hiển thị. Vạch dọc: mức chung ' + dec(T.report) + '‰.</p></section>' +
          '<section class="card" aria-labelledby="pT"><div class="card-h"><h2 id="pT">Thông tin cá nhân đã che</h2>' + sample + '</div><ul class="pii">' + pii + '</ul><p class="fine">Khuôn mặt được làm mờ ngay trên điện thoại, máy chủ không nhận nên không đếm.</p></section>' +
        '</aside>' +
      '</div>';
  };

  /* ---------- dialogs ---------- */
  var dialog = document.getElementById('dialog');
  var lastFocus = null;
  function openDialog(title, body, actions) {
    lastFocus = document.activeElement;
    dialog.innerHTML = '<div class="scrim" data-act="closeDialog"></div><div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dlgT">' +
      '<div class="dlg-h"><h2 id="dlgT">' + title + '</h2><button class="icon-btn" data-act="closeDialog" aria-label="Đóng">' + ic('x') + '</button></div>' +
      '<div class="dlg-b">' + body + '</div><div class="dlg-f">' + actions + '</div></div>';
    dialog.hidden = false;
    var f = dialog.querySelector('.dlg-f .btn:not([disabled])') || dialog.querySelector('.icon-btn');
    if (f) f.focus();
  }
  function closeDialog() { dialog.hidden = true; dialog.innerHTML = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); }

  var toastEl = document.getElementById('toast'), toastT;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 3600); }

  var ACTS = {
    go: function (p) { location.hash = 'p=' + p; },
    noop: function () {},
    closeDialog: closeDialog,
    capDialog: function (id) {
      var t = byId(id);
      openDialog('Đổi trần chi phí AI · ' + t.short,
        '<p>Trần hiện tại <b class="num">' + usd(budgetOf(t)) + '</b>/tháng, dự báo cuối tháng <b class="num">' + usd(t.forecast) + '</b> (số mẫu).</p>' +
        '<fieldset class="radios"><legend>Trần mới</legend>' + [1, 1.25, 1.5].map(function (k, i) {
          var v = Math.round(budgetOf(t) * k / 5) * 5;
          return '<label><input type="radio" name="cap" value="' + v + '"' + (i === 1 ? ' checked' : '') + '><span class="num">' + usd(v) + (i === 0 ? ' (giữ nguyên)' : '') + '</span></label>';
        }).join('') + '</fieldset><p class="fine">Quyết định được ghi lại kèm tên người bấm và gửi cho quản trị trung tâm.</p>',
        btn('Huỷ', 'closeDialog', null, 'ghost') + btn('Lưu trần mới', 'saveCap', id, 'shu'));
    },
    saveCap: function (id) {
      var v = +(dialog.querySelector('input[name=cap]:checked') || {}).value;
      var t = byId(id);
      if (v && v !== t.budget) state.capRaised[id] = v; else delete state.capRaised[id];
      closeDialog(); render(); toast('Đã lưu trần ' + usd(budgetOf(t)) + ' cho ' + t.short + ' (mô phỏng).');
    },
    pauseDialog: function (id) {
      var t = byId(id);
      openDialog('Tạm khoá ' + t.name + '?',
        '<p>Khi tạm khoá, học viên vẫn mở app và xem bài đã tải, nhưng hệ thống không gọi AI mới. Dùng khi có sự cố an toàn hoặc hợp đồng dừng.</p><p class="fine">Quản trị trung tâm nhận thông báo ngay. Mở khoá lại được bất cứ lúc nào.</p>',
        btn('Huỷ', 'closeDialog', null, 'ghost') + btn(ic('pause', 'ic-sm') + 'Tạm khoá', 'pause', id, 'danger'));
    },
    pause: function (id) { state.paused[id] = true; closeDialog(); render(); toast('Đã tạm khoá ' + byId(id).short + ' (mô phỏng).'); },
    unpause: function (id) { delete state.paused[id]; render(); toast('Đã mở khoá ' + byId(id).short + '.'); },
    modelDialog: function (arg) {
      var parts = arg.split(':'), r = D.roles.filter(function (x) { return x.id === parts[0]; })[0], tier = parts[1] === 'std' ? 'Tiêu chuẩn' : 'Cao cấp';
      var cur = parts[1] === 'std' ? r.std : r.pre;
      var opts = [
        { n: cur, s: 'Đang dự kiến cho vai này · eval: chưa đo', on: true },
        { n: cur === 'Sonnet 5' ? 'Haiku 4.5' : 'Sonnet 5', s: 'Chưa qua eval cho vai ' + r.a },
        { n: 'Model mở tự chạy ở Nhật (ứng viên)', s: 'Chưa xét · phải qua đủ 7 bộ eval' },
        { n: 'DeepSeek API', s: 'Chỉ dữ liệu giả · hộp cát của đội. Trung tâm có học viên thật: bị chặn (PPC 3/2/2025)', no: true }
      ];
      openDialog('Đổi model · ' + r.a + ' · gói ' + tier,
        '<ul class="mopts">' + opts.map(function (o) {
          return '<li class="' + (o.on ? 'on' : '') + (o.no ? ' no' : '') + '"><span class="mo-ic">' + ic(o.on ? 'check' : o.no ? 'x' : 'lock', 'ic-sm') + '</span><span><b>' + o.n + '</b><em>' + o.s + '</em></span></li>';
        }).join('') + '</ul><p class="note">' + ic('info', 'ic-sm') + '<span>Chưa model nào có kết quả eval, nên chưa đổi được. Khi có số đo, chỉ model đạt mọi bộ áp dụng mới chọn được.</span></p>',
        btn('Xem bảng eval', 'goEval', null, 'ghost') + btn('Duyệt đổi model', 'noop', null, 'shu', ' disabled data-why="Chưa model nào qua eval" title="Chưa model nào qua eval"'));
    },
    goEval: function () { closeDialog(); location.hash = 'p=eval'; },
    raiseCap: function (id) { state.capRaised[id] = 300; delete state.capKept[id]; render(); toast('Đã nâng trần Bến Mây lên $300 (mô phỏng).'); },
    keepCap: function (id) { state.capKept[id] = true; delete state.capRaised[id]; render(); toast('Đã giữ trần $250. Quản trị Bến Mây đã được báo (mô phỏng).'); },
    undoCap: function (id) { delete state.capRaised[id]; delete state.capKept[id]; render(); toast('Đã hoàn tác quyết định.'); },
    notify: function () { toast('Đã gửi ghi chú cho quản trị trung tâm (mô phỏng). Ghi chú chỉ gồm số tổng hợp.'); },
    resolve: function (id) { state.resolved[id] = true; render(); toast('Đã đánh dấu sự cố là đã xử lý.'); }
  };

  /* ---------- router ---------- */
  function current() {
    var m = /p=([\w-]+)/.exec(location.hash);
    var p = m ? m[1] : 'tenants';
    if (p.indexOf('tenant-') === 0 && byId(p.slice(7))) return p;
    return PAGES[p] ? p : 'tenants';
  }

  function navHtml(active, short) {
    return NAV.map(function (n) {
      var on = n.p === active;
      return '<a class="nav-i' + (on ? ' on' : '') + '" href="#p=' + n.p + '"' + (on ? ' aria-current="page"' : '') + '>' + ic(n.icon) + '<span>' + (short ? n.s : n.t) + '</span>' +
        (!short && n.p === 'tenants' && openDecisions().length ? '<span class="nav-badge" aria-label="' + openDecisions().length + ' việc cần quyết">' + openDecisions().length + '</span>' : '') + '</a>';
    }).join('');
  }

  var lastPage = null;
  function render() {
    var p = current();
    var isTenant = p.indexOf('tenant-') === 0;
    var active = isTenant ? 'tenants' : p;
    var navItem = NAV.filter(function (n) { return n.p === active; })[0];
    document.getElementById('sideNav').innerHTML = navHtml(active);
    document.getElementById('bottomNav').innerHTML = navHtml(active, true);
    var crumb = '<a href="#p=tenants">Vận hành</a><span aria-hidden="true">/</span>' + (isTenant ? '<a href="#p=tenants">Các trung tâm</a><span aria-hidden="true">/</span><b aria-current="page">' + byId(p.slice(7)).short + '</b>' : '<b aria-current="page">' + navItem.t + '</b>');
    document.getElementById('crumbs').innerHTML = crumb;
    view.innerHTML = isTenant ? tenantPage(byId(p.slice(7))) : PAGES[p]();
    document.title = (isTenant ? byId(p.slice(7)).short : navItem.t) + ' · Vận hành Sensei Agent';
    if (lastPage !== p) {
      window.scrollTo(0, 0);
      if (lastPage !== null) { var h = view.querySelector('.h1'); if (h) h.focus({ preventScroll: true }); }
      lastPage = p;
    }
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    var fn = ACTS[b.dataset.act];
    if (fn) { e.preventDefault(); fn(b.dataset.arg); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dialog.hidden) closeDialog(); });
  window.addEventListener('hashchange', render);
  window.OPS_DEBUG = { acts: Object.keys(ACTS), pages: Object.keys(PAGES).concat(D.tenants.map(function (t) { return 'tenant-' + t.id; })) };
  render();
})();
