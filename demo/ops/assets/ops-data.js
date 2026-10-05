/* Sample data for the Sensei Agent ops prototype. Every number here is a sample ("số mẫu"), every name is fictional.
   Month-to-date figures are for day 17 of a 30-day month; forecast = used / 17 * 30.
   Standard-tier AI cost per learner ≈ $1.8/month comes from senpai-system-design.md §7. */
(function () {
  var today = 'Thứ Ba 17/11/2026';

  var tenants = [
    { id: 'hoa-anh-dao', classCount: 3, name: 'Trung tâm Hoa Anh Đào', short: 'Hoa Anh Đào', mono: 'H',
      kind: 'Trung tâm dạy online cho người Việt ở Nhật', pack: 'Sensei Agent cho trung tâm', tier: 'Tiêu chuẩn',
      since: '02/10/2026', admin: 'Chị Thu (quản trị trung tâm)', seats: 60, active: 48, teachers: 2,
      classes: [{ n: '外食業2号 · K12', t: 'Cô Linh', k: 18 }, { n: '外食業2号 · K13', t: 'Cô Linh', k: 14 }, { n: 'IT Passport · IP05', t: 'Thầy Nam', k: 16 }],
      budget: 120, used: 49, forecast: 86, reportRate: 1.8, guard: 23, queue: 19, queueHours: 12, health: 'ok' },
    { id: 'den-long', classCount: 6, name: 'Học viện Đèn Lồng', short: 'Đèn Lồng', mono: 'Đ',
      kind: 'Đã có app luyện đề IT Passport riêng', pack: 'Sensei Agent module (gắn vào app có sẵn · mô phỏng)', tier: 'Tiêu chuẩn',
      since: '20/10/2026', admin: 'Quản trị Học viện Đèn Lồng', seats: 150, active: 120, teachers: 5,
      classes: [{ n: 'IT Passport · 6 lớp', t: '5 giáo viên', k: 120 }],
      budget: 260, used: 131, forecast: 231, reportRate: 2.1, guard: 51, queue: 12, queueHours: 9, health: 'ok' },
    { id: 'ben-may', classCount: 4, name: 'Trung tâm Bến Mây', short: 'Bến Mây', mono: 'B',
      kind: 'Trung tâm ở Nagoya, lớp buổi tối', pack: 'Sensei Agent cho trung tâm', tier: 'Cao cấp',
      since: '05/10/2026', admin: 'Quản trị Trung tâm Bến Mây', seats: 80, active: 64, teachers: 3,
      classes: [{ n: '介護 · 2 lớp', t: '2 giáo viên', k: 34 }, { n: '外食業2号 · 2 lớp', t: '1 giáo viên', k: 30 }],
      budget: 250, used: 168, forecast: 296, reportRate: 1.2, guard: 30, queue: 4, queueHours: 4, health: 'cap' },
    { id: 'ngoc-vy', classCount: 1, name: 'Cô Ngọc Vy', short: 'Cô Ngọc Vy', mono: 'V',
      kind: 'Giáo viên tự do = trung tâm 1 người', pack: 'Sensei Agent cho trung tâm', tier: 'Tiêu chuẩn',
      since: '11/10/2026', admin: 'Cô Ngọc Vy (tự quản trị)', seats: 10, active: 9, teachers: 1,
      classes: [{ n: 'N3 + 外食業 · 1 lớp', t: 'Cô Ngọc Vy', k: 9 }],
      budget: 25, used: 9, forecast: 16, reportRate: 0.9, guard: 4, queue: 1, queueHours: 3, health: 'ok' },
    { id: 'sen-hong', classCount: 1, name: 'Trung tâm Sen Hồng', short: 'Sen Hồng', mono: 'S',
      kind: 'Đang dùng thử 30 ngày, ở Fukuoka', pack: 'Sensei Agent cho trung tâm · dùng thử', tier: 'Tiêu chuẩn',
      since: '01/11/2026', admin: 'Quản trị Trung tâm Sen Hồng', seats: 20, active: 16, teachers: 1,
      classes: [{ n: '外食業2号 · 1 lớp', t: '1 giáo viên', k: 16 }],
      budget: 40, used: 12, forecast: 21, reportRate: 6.4, guard: 9, queue: 9, queueHours: 30, health: 'watch' }
  ];

  var health = {
    ok: { t: 'Ổn', cls: 'ok', icon: 'check' },
    watch: { t: 'Báo sai cao', cls: 'warn', icon: 'flag' },
    cap: { t: 'Sắp chạm trần', cls: 'warn', icon: 'alert' },
    paused: { t: 'Đã tạm khoá', cls: 'off', icon: 'pause' }
  };

  // Hoa Anh Đào month-to-date cost by agent; shares follow the §7 split (tutor ≈ 59%, verifier ≈ 28%, planner ≈ 11%).
  var agentCost = [
    { a: 'Gia sư', m: 'Haiku 4.5', v: 30 },
    { a: 'Kiểm chứng', m: 'Sonnet 5', v: 14 },
    { a: 'Lập kế hoạch', m: 'Sonnet 5', v: 5.8 },
    { a: 'Đọc tài liệu', m: 'Gemini 3.5 Flash-Lite', v: 1.2 },
    { a: 'Trợ lý lớp', m: 'Haiku 4.5', v: 1.0 }
  ];

  var roles = [
    { id: 'planner', a: 'Lập kế hoạch', d: 'Cân kế hoạch ngược từ ngày thi, giải thích đánh đổi', std: 'Sonnet 5', pre: 'Sonnet 5' },
    { id: 'tutor', a: 'Gia sư', d: 'Soạn bài, dạy bằng gợi ý từng bậc', std: 'Haiku 4.5', pre: 'Sonnet 5' },
    { id: 'verifier', a: 'Kiểm chứng', d: 'Soát câu hỏi và lời giải với nguồn, không xem đáp án', std: 'Sonnet 5', pre: 'Sonnet 5', locked: true },
    { id: 'reader', a: 'Đọc tài liệu', d: 'Đọc ảnh/PDF, nhận loại tài liệu, gắn mục đề cương', std: 'Gemini 3.5 Flash-Lite', pre: 'Gemini 3.5 Flash-Lite' },
    { id: 'assistant', a: 'Trợ lý lớp', d: 'Tóm tắt lớp mỗi sáng, soạn nháp tin cho giáo viên', std: 'Haiku 4.5', pre: 'Sonnet 5' }
  ];

  var evalSuites = [
    { id: 'H1', name: 'Trả lời có nguồn', what: '150 câu (75 IT Passport, 75 外食業)', target: 'Đúng ≥ 95% · trích dẫn hợp lệ 100% · ý có nguồn đỡ ≥ 95%' },
    { id: 'H2', name: 'Cài lỗi vào câu hỏi', what: '100 cặp câu lỗi và câu sạch', target: 'Bắt lỗi ≥ 95% · loại nhầm câu sạch ≤ 10%' },
    { id: 'H3', name: 'Câu hỏi ngoài nguồn', what: '50 câu kho nguồn không trả lời được', target: 'Từ chối đúng cách ≥ 90%' },
    { id: 'H4', name: 'Visa, pháp lý', what: '100 câu: 50 hoàn cảnh riêng, 50 kiến thức trong đề', target: 'Bắt câu hoàn cảnh riêng ≥ 95% · chuyển hướng nhầm ≤ 10%' },
    { id: 'N1', name: 'Không làm hộ', what: '60 hội thoại đòi đáp án', target: 'Lộ đáp án trước lần thử đầu: 0 · chất lượng gợi ý ≥ 4/5' },
    { id: 'P1', name: 'Che dữ liệu cá nhân', what: '40 ảnh có tên, số điện thoại hư cấu', target: 'Regex ≥ 99% · tên ≥ 90% · khuôn mặt ≥ 95%' },
    { id: 'E1', name: 'Giải thích theo trình độ', what: '120 lời giải: 2 kỳ thi × 20 câu × 3 trình độ', target: 'Mọi tiêu chí ≥ 3,5/5 · khoảng cách công bằng L1 ≥ L3 − 0,5' }
  ];

  // Which suite applies to which model, by the role the model plays (senpai-system-design.md §2.1, §5.5).
  var evalModels = [
    { id: 'sonnet', n: 'Sonnet 5', role: 'Kiểm chứng, Lập kế hoạch · Gia sư và Trợ lý lớp ở gói Cao cấp', sets: ['H1', 'H2', 'H3', 'N1', 'E1'] },
    { id: 'haiku', n: 'Haiku 4.5', role: 'Gia sư, Trợ lý lớp ở gói Tiêu chuẩn · phân loại câu visa/pháp lý', sets: ['H1', 'H3', 'H4', 'N1', 'E1'] },
    { id: 'flash', n: 'Gemini 3.5 Flash-Lite', role: 'Đọc tài liệu ở mọi gói', sets: ['P1'] },
    { id: 'cand', n: 'Ứng viên mới', role: 'Ví dụ: model mở tự chạy trên máy chủ ở Nhật. Chưa xét', sets: ['H1', 'H2', 'H3', 'H4', 'N1', 'P1', 'E1'], candidate: true }
  ];

  var guards = [
    { k: 'Hỏi visa, hợp đồng, lương của chính mình', r: 'Trả mẫu câu cố định + số điện thoại chính thức', n: 40 },
    { k: 'Đòi đáp án trước khi tự thử', r: 'Mời chọn thử + gợi ý bậc 1', n: 56 },
    { k: 'Câu hỏi ngoài tài liệu nguồn', r: '“Tài liệu chính thức không nói về điều này”', n: 12 },
    { k: 'Ảnh là hợp đồng hoặc giấy tờ cư trú', r: 'Dừng, không tạo bài, xoá ảnh khỏi bộ nhớ', n: 6 },
    { k: 'Gợi ý trùng đáp án đúng', r: 'Sinh lại, lần hai dùng gợi ý dựng sẵn', n: 3 }
  ];

  var pii = [{ k: 'Tên người', n: 34 }, { k: 'Số điện thoại', n: 9 }, { k: 'Email', n: 2 }, { k: 'Số giấy tờ', n: 1 }];

  var incidents = [
    { id: 'inc-sen-hong', when: '15/11 · 09:40', what: 'Sen Hồng: tỉ lệ báo sai 6,4‰, gấp khoảng 3 lần mức chung', where: 'Chất lượng nội dung', state: 'open', next: 'Hỏi quản trị Sen Hồng xem giáo viên đã duyệt hàng chờ chưa (9 mục, chờ 30 giờ)' },
    { id: 'inc-ben-may', when: '16/11 · 07:05', what: 'Bến Mây: dự báo chi phí AI cuối tháng $296, vượt trần $250', where: 'Chi phí', state: 'open', next: 'Quyết định nâng trần hay để hệ thống tự hạ về câu dựng sẵn khi chạm trần' },
    { id: 'inc-latency', when: '17/11 · 08:12–08:27', what: 'Gia sư phản hồi chậm (p95 trên 6 giây) ở một nhà cung cấp', where: 'Model gateway', state: 'done', next: 'Đã tự trả gợi ý dựng sẵn trong 15 phút; nhà cung cấp hồi phục' }
  ];

  window.OPS_DATA = { today: today, tenants: tenants, health: health, agentCost: agentCost, roles: roles,
    evalSuites: evalSuites, evalModels: evalModels, guards: guards, pii: pii, incidents: incidents };
})();
