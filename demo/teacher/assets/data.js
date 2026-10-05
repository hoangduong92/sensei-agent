/* Sensei Agent teacher + center-admin prototype: sample data only.
   Every person and the centre are fictional. Numbers for chị Hạnh match the learner prototype (../assets/data.js):
   diagnostic estimate 126/250, pass mark 163, exam 21/2/2027, 138 study minutes a week, 19 minutes on a normal day.
   "Today" in every surface is Tuesday 17/11/2026, 08:05. */
window.T_DATA = (function () {
  var JF = 'https://www.jfnet.or.jp/wp/wp-content/uploads/2025/09/';
  var src = {
    hyg2: { label: 'JF · 特定技能2号 衛生管理テキスト (2023)', url: JF + 'ssw2_jf_hygiene_controls_text_ja_v231227.pdf' },
    prep2: { label: 'JF · 特定技能2号 飲食物調理テキスト (2023)', url: JF + 'ssw2_jf_preparation_of_food_and_drink_text_ja_v231227.pdf' },
    cs2: { label: 'JF · 特定技能2号 接客全般テキスト (2023)', url: JF + 'ssw2_jf_customer_service_text_ja_v231227.pdf' },
    sm2: { label: 'JF · 特定技能2号 店舗運営テキスト (2023)', url: JF + 'ssw2_jf_store_management_text_ja_v231227.pdf' },
    hyg1ja: { label: 'JF · 特定技能1号 衛生管理テキスト v1.2', url: JF + 'jf_hygiene_controls_text_ja_v1.2.pdf' },
    otaff: { label: 'OTAFF · 外食業特定技能2号評価試験', url: 'https://otaff.or.jp/tokutei/gaisyoku-2/' }
  };

  var center = { name: 'Trung tâm Hoa Anh Đào', short: 'Hoa Anh Đào', learners: 48, seats: 60, plan: 'Tiêu chuẩn' };

  var teachers = [
    { id: 'linh', name: 'Cô Linh', full: 'Trần Thuỳ Linh', role: 'Giáo viên', classes: ['k12', 'k13'], learners: 32, pending: 15, oldest: '12 giờ', reply: '3 giờ', status: 'Đang dạy' },
    { id: 'nam', name: 'Thầy Nam', full: 'Phạm Hoài Nam', role: 'Giáo viên', classes: ['ip05'], learners: 16, pending: 4, oldest: '5 giờ', reply: '6 giờ', status: 'Đang dạy' }
  ];

  var classes = [
    { id: 'k12', name: '外食業2号 · K12', exam: '外食業2号', teacher: 'Cô Linh', n: 18, examDate: '21/2/2027', studiedYesterday: 15, avgMin: 21, onTrack: 13, help: 5, tentative: 3, nextMock: '10/1/2027', code: 'HAD-K12-4F8' },
    { id: 'k13', name: '外食業2号 · K13', exam: '外食業2号', teacher: 'Cô Linh', n: 14, examDate: '18/4/2027', studiedYesterday: 12, avgMin: 18, onTrack: 14, help: 0, tentative: 0, nextMock: '7/3/2027', code: 'HAD-K13-9P2' },
    { id: 'ip05', name: 'IT Passport · IP05', exam: 'IT Passport', teacher: 'Thầy Nam', n: 16, examDate: 'theo từng người', studiedYesterday: 11, avgMin: 24, onTrack: 12, help: 2, tentative: 1, nextMock: '5/12/2026', code: 'HAD-IP05-2K7' }
  ];

  /* Class K12 roster. est = estimated score /250 (pass 163). syl = % of syllabus covered. min7 = minutes in last 7 days.
     plan: 'tam' = provisional plan waiting for the teacher (T1), 'ok' = approved. flag.k: idle | late | repeat | new */
  var roster = [
    { id: 'hanh', name: 'Nguyễn Thị Hạnh', call: 'chị Hạnh', est: 126, proj: 165, syl: 4, min7: 19, last: 'Tối qua', plan: 'tam', joined: '16/11', flag: { k: 'new', t: 'Kế hoạch tạm chờ cô duyệt · còn 12 giờ' } },
    { id: 'duy', name: 'Trần Văn Duy', call: 'anh Duy', est: 118, proj: 162, syl: 3, min7: 15, last: 'Tối qua', plan: 'tam', joined: '16/11', flag: { k: 'new', t: 'Kế hoạch tạm chờ cô duyệt · còn 13 giờ' } },
    { id: 'vy', name: 'Lê Thị Vy', call: 'chị Vy', est: 141, proj: 171, syl: 3, min7: 22, last: 'Tối qua', plan: 'tam', joined: '16/11', flag: { k: 'new', t: 'Kế hoạch tạm chờ cô duyệt · còn 14 giờ' } },
    { id: 'quan', name: 'Phạm Minh Quân', call: 'anh Quân', est: 139, proj: 160, syl: 38, min7: 64, last: '14/11', plan: 'ok', joined: '5/10', flag: { k: 'idle', t: 'Bỏ học 3 ngày (từ 14/11)' } },
    { id: 'ngoc', name: 'Đỗ Thị Ngọc', call: 'chị Ngọc', est: 144, proj: 151, syl: 41, min7: 88, last: 'Tối qua', plan: 'ok', joined: '5/10', flag: { k: 'late', t: 'Không kịp: dự kiến 151/163 vào 21/2' } },
    { id: 'phuc', name: 'Vũ Hoàng Phúc', call: 'anh Phúc', est: 150, proj: 168, syl: 47, min7: 131, last: 'Tối qua', plan: 'ok', joined: '5/10', flag: { k: 'repeat', t: 'Sai 4 lần liền: 人時売上高' } },
    { id: 'thang', name: 'Bùi Đức Thắng', call: 'anh Thắng', est: 147, proj: 166, syl: 44, min7: 72, last: '15/11', plan: 'ok', joined: '5/10', flag: { k: 'idle', t: 'Bỏ học 2 ngày (từ 15/11)' } },
    { id: 'tam', name: 'Hoàng Minh Tâm', call: 'anh Tâm', est: 135, proj: 158, syl: 36, min7: 95, last: 'Tối qua', plan: 'ok', joined: '5/10', flag: { k: 'late', t: 'Không kịp: dự kiến 158/163 vào 21/2' } },
    { id: 'lananh', name: 'Ngô Lan Anh', call: 'chị Lan Anh', est: 171, proj: 192, syl: 58, min7: 142, last: 'Sáng nay', plan: 'ok', joined: '5/10' },
    { id: 'hung', name: 'Trịnh Văn Hùng', call: 'anh Hùng', est: 165, proj: 184, syl: 55, min7: 120, last: 'Tối qua', plan: 'ok', joined: '5/10' },
    { id: 'trang', name: 'Mai Thu Trang', call: 'chị Trang', est: 168, proj: 187, syl: 52, min7: 150, last: 'Tối qua', plan: 'ok', joined: '5/10' },
    { id: 'khoa', name: 'Lý Minh Khoa', call: 'anh Khoa', est: 160, proj: 178, syl: 50, min7: 115, last: 'Tối qua', plan: 'ok', joined: '5/10' },
    { id: 'yen', name: 'Đặng Hải Yến', call: 'chị Yến', est: 175, proj: 196, syl: 61, min7: 160, last: 'Sáng nay', plan: 'ok', joined: '5/10' },
    { id: 'son', name: 'Phan Thanh Sơn', call: 'anh Sơn', est: 158, proj: 176, syl: 49, min7: 104, last: 'Tối qua', plan: 'ok', joined: '5/10' },
    { id: 'huong', name: 'Cao Thị Hương', call: 'chị Hương', est: 163, proj: 181, syl: 53, min7: 126, last: 'Tối qua', plan: 'ok', joined: '5/10' },
    { id: 'duc', name: 'Tạ Minh Đức', call: 'anh Đức', est: 170, proj: 189, syl: 57, min7: 138, last: 'Tối qua', plan: 'ok', joined: '5/10' },
    { id: 'thuy', name: 'Lâm Thị Thuỷ', call: 'chị Thuỷ', est: 166, proj: 183, syl: 54, min7: 118, last: 'Tối qua', plan: 'ok', joined: '5/10' },
    { id: 'long', name: 'Hồ Văn Long', call: 'anh Long', est: 161, proj: 177, syl: 51, min7: 110, last: 'Tối qua', plan: 'ok', joined: '5/10' }
  ];

  /* Chị Hạnh's detail: same numbers as the learner prototype (area % from its data.js: 35 / 40 / 70 / 75). */
  var hanh = {
    age: 26, job: 'Phục vụ nhà hàng · Osaka', exam: '外食業2号', examDate: '21/2/2027', weeks: 13, est: 126, pass: 163, total: 250,
    weekMin: 138, dayMin: 19, shifts: 'Ca trưa 10:30–14:30 · ca tối 17:00–22:30',
    areas: [
      { ja: '衛生管理', vn: 'Quản lý vệ sinh', pts: 80, p: 35 },
      { ja: '店舗運営', vn: 'Vận hành cửa hàng', pts: 80, p: 40 },
      { ja: '飲食物調理', vn: 'Chế biến món ăn, đồ uống', pts: 30, p: 70 },
      { ja: '接客全般', vn: 'Phục vụ khách hàng', pts: 60, p: 75 }
    ],
    week: [['T2', 19], ['T3', 19], ['T4', 19], ['T5', 30], ['T6', 19], ['T7', 12], ['CN', 20]],
    phases: [
      { w: 'Tuần 1–5', t: '衛生管理 + 店舗運営', why: 'Hai phần 80 điểm, đang yếu nhất' },
      { w: 'Tuần 6–10', t: '飲食物調理 + 接客全般, ôn giãn cách', why: 'Giữ phần đã khá, không để quên' },
      { w: 'Tuần 11–12', t: 'Thi thử của lớp (tắt AI) 10/1 và 31/1', why: 'Đo thật, không có gợi ý' },
      { w: 'Tuần 13', t: 'Ôn nhẹ các câu hay sai', why: 'Tuần cuối trước ngày thi' }
    ],
    mistakes: [
      { ja: '人時売上高', what: 'Chọn “粗利益 ÷ giờ công” thay vì “doanh thu ÷ giờ công”', n: '2/2 lần sai', s: 'sm2', page: 3 },
      { ja: '中心部 75℃・1分', what: 'Nhầm 60℃ (mức giữ nóng) với mức nấu để diệt khuẩn', n: '1/2 lần sai', s: 'hyg2', page: 4 },
      { ja: '消費期限 / 賞味期限', what: 'Lẫn hạn an toàn với hạn giữ chất lượng', n: '1/2 lần sai', s: 'cs2', page: 9 }
    ],
    log: [
      { t: '16/11 20:12', who: 'Công cụ đọc lịch ca', what: 'Đọc 10 ca từ ảnh lịch làm việc; chị Hạnh sửa 1 ca rồi xác nhận.', why: 'Để xếp bài vào giờ trống. Ảnh không được lưu.', k: 'tool' },
      { t: '16/11 20:20', who: 'Công cụ chẩn đoán', what: 'Bài chẩn đoán 15 phút, câu chọn đều 4 phần đề cương.', why: 'Biết chị hổng phần nào trước khi lập kế hoạch.', k: 'tool' },
      { t: '16/11 20:36', who: 'Agent Lập kế hoạch', what: 'Ước tính 126/250 (cần 163). Lập kế hoạch tạm 13 tuần, 138 phút/tuần, 19 phút ngày thường.', why: '衛生管理 và 店舗運営 mỗi phần 80 điểm mà mới nắm 35% và 40%, nên xếp trước.', k: 'ai' },
      { t: '16/11 20:37', who: 'Bộ điều phối', what: 'Cho chị học ngay theo kế hoạch tạm, gửi cô duyệt trong 24 giờ.', why: 'Luật lớp K12: không chặn học khi chờ duyệt.', k: 'rule' },
      { t: '16/11 20:38', who: 'Agent Kiểm chứng', what: 'Soát 5 câu bài đầu với giáo trình JF 2号 衛生管理 tr.3–5: 5/5 khớp nguồn.', why: 'Câu chưa qua Kiểm chứng không được hiện cho học viên.', k: 'ai' },
      { t: '16/11 23:02', who: 'Agent Gia sư', what: 'Chị xin đáp án câu 1. Gia sư đưa gợi ý bậc 1, không đưa đáp án.', why: 'Luật lớp: 3 bậc gợi ý trước khi giải thích.', k: 'ai' },
      { t: '16/11 23:04', who: 'Chị Hạnh', what: 'Bấm “Em muốn hỏi cô Linh”. AI gửi kèm tóm tắt ngữ cảnh.', why: 'Chị muốn người thật giải thích.', k: 'human' },
      { t: '17/11 06:00', who: 'Agent Trợ lý lớp', what: 'Xếp chị vào “cần cô hôm nay”.', why: 'Kế hoạch tạm còn 12 giờ nữa là hết hạn duyệt.', k: 'ai' }
    ]
  };

  /* T1: provisional plans */
  var t1 = [
    { id: 'hanh', who: 'Nguyễn Thị Hạnh', est: 126, weekMin: 138, weeks: 13, left: '12 giờ', first: '衛生管理 → 店舗運営', why: 'Hai phần 80 điểm đang ở 35% và 40%. Nếu giữ nhịp 19 phút ngày thường, dự kiến khoảng 165/250 vào 21/2 (ước tính mẫu).' },
    { id: 'duy', who: 'Trần Văn Duy', est: 118, weekMin: 160, weeks: 13, left: '13 giờ', first: '店舗運営 → 衛生管理', why: 'Điểm thấp nhất lớp; kế hoạch cần 160 phút/tuần mới kịp. Anh Duy làm ca đêm, bài xếp sau 6:00 sáng.' },
    { id: 'vy', who: 'Lê Thị Vy', est: 141, weekMin: 120, weeks: 13, left: '14 giờ', first: '店舗運営 → 飲食物調理', why: '衛生管理 đã 60%; 店舗運営 còn 38% nên đi trước.' }
  ];

  /* T2: questions proposed for the shared bank */
  var t2 = [
    { id: 'q1', from: 'Sinh từ ảnh chụp poster rửa tay (tên, mặt đã che)', area: '衛生管理', q: 'Poster ghi 2度洗い. Nghĩa là gì?', opts: ['Rửa lần lượt từng tay', 'Rửa tay 2 lần: lặp lại bước イ đến ケ', 'Rửa tay trong 2 phút'], a: 1, s: 'hyg1ja', page: 11 },
    { id: 'q2', from: 'Agent Gia sư soạn từ giáo trình JF', area: '店舗運営', q: '人時売上高 được tính thế nào?', opts: ['粗利益 ÷ tổng giờ công', 'Doanh thu 1 ngày ÷ tổng giờ công 1 ngày', 'Số khách ÷ tổng giờ công'], a: 1, s: 'sm2', page: 3 },
    { id: 'q3', from: 'Agent Gia sư soạn từ giáo trình JF', area: '接客全般', q: '特定原材料8品目に含まれないものはどれか。', opts: ['えび', '米', 'くるみ'], a: 1, s: 'cs2', page: 8 },
    { id: 'q4', from: 'Agent Gia sư soạn từ giáo trình JF', area: '飲食物調理', q: '食器洗浄機のすすぎ温度の基本はどれか。', opts: ['40～50℃', '60～70℃', '80～90℃'], a: 2, s: 'prep2', page: 9 }
  ];

  /* T3: reported as wrong, or marked "not sure" by Kiểm chứng */
  var t3 = [
    { id: 'r1', kind: 'report', title: '2 học viên báo sai · câu đã tự ẩn', q: 'Theo nguyên tắc 増やさない, nên bảo quản thực phẩm ở nhiệt độ nào?', ans: '10℃ trở xuống, hoặc 60℃ trở lên',
      reports: ['“Ở quán em tủ lạnh để 5℃ mà cô?” · Học viên K12', '“Sao lại 60℃, em tưởng phải sôi?” · Học viên K12'],
      check: 'Kiểm chứng soát lại: khớp giáo trình JF 2号 衛生管理 tr.3. Hai lời báo có vẻ là hiểu nhầm, không phải câu sai.', s: 'hyg2', page: 3 },
    { id: 'r2', kind: 'unsure', title: 'Kiểm chứng đánh dấu “không chắc”', q: 'Nước rửa tay nên ở khoảng bao nhiêu độ để diệt khuẩn tốt nhất?', ans: 'Khoảng 40℃',
      reports: [],
      check: 'Không tìm thấy con số 40℃ trong giáo trình nào của lớp. Giáo trình chỉ nói cách rửa và rửa 2 lần. Câu chưa hiện cho học viên.', s: 'hyg1ja', page: 11 }
  ];

  /* T4 + curriculum */
  var upload = {
    file: 'HoaAnhDao_On-tap_Tenpo-unei.pdf', pages: 24, by: 'Cô Linh', at: '16/11 17:40',
    map: [
      { pages: 'tr.1–4', what: 'Doanh thu, lợi nhuận, 人時売上高', to: '店舗運営 · 計数管理', conf: 'Chắc' },
      { pages: 'tr.5–9', what: 'QSC và kiểm tra cửa hàng', to: '店舗運営 · 店舗管理', conf: 'Chắc' },
      { pages: 'tr.10–15', what: 'Quản lý nhân viên, ca làm', to: '店舗運営 · 人材管理', conf: 'Chắc' },
      { pages: 'tr.16–21', what: 'Bài tập tự soạn của trung tâm', to: '店舗運営 · 計数管理', conf: 'Chắc' },
      { pages: 'tr.22–24', what: 'Mẹo đi thi, lịch học', to: 'Không thuộc đề cương', conf: 'Không dùng làm nguồn' }
    ]
  };
  var materials = [
    { name: 'Giáo trình JF 特定技能2号 (4 cuốn, công khai)', kind: 'Nguồn chung của Sensei Agent', status: 'Đang dùng', note: 'Đội Sensei Agent nạp sẵn, có trang để trích dẫn' },
    { name: 'HoaAnhDao_Tu-vung-Eisei.pdf · 18 trang', kind: 'Của trung tâm', status: 'Đang dùng', note: 'Cô Linh xác nhận 2/11' }
  ];

  /* T7: messages drafted by Trợ lý lớp */
  var msgs = [
    { id: 'quan', to: 'Phạm Minh Quân', why: 'Không mở app 3 ngày (từ 14/11). Trước đó học đều 20 phút/ngày.', kind: 'Nhắc nhẹ',
      text: 'Chào anh Quân, mấy hôm nay chắc anh bận ca nhiều. Hôm nay anh chỉ cần 6 thẻ ôn (4 phút) là giữ được nhịp. Nếu lịch ca đổi, anh chụp lại lịch để Sensei Agent xếp lại nhé. Cô Linh.' },
    { id: 'ngoc', to: 'Đỗ Thị Ngọc', why: 'Theo nhịp hiện tại dự kiến 151/163 vào 21/2. Thêm 10 phút mỗi Chủ nhật thì dự kiến đạt 163.', kind: 'Đề xuất đổi kế hoạch',
      text: 'Chị Ngọc ơi, chị đang tiến bộ đều. Để chắc đỗ ngày 21/2, cô đề xuất thêm 10 phút vào mỗi Chủ nhật cho phần 衛生管理. Chị xem và bấm duyệt trong app nếu đồng ý nhé, chị quyết. Cô Linh.' },
    { id: 'phuc', to: 'Vũ Hoàng Phúc', why: 'Sai 4 lần liền câu 人時売上高 (店舗運営), cùng một kiểu nhầm với 粗利益.', kind: 'Góp ý bài',
      text: 'Anh Phúc, cô thấy anh hay nhầm 人時売上高 với lợi nhuận gộp. Mẹo: 売上 là doanh thu, chia cho tổng giờ công. Cô gửi anh bài 10 phút về phần này, anh làm tối nay nhé. Cô Linh.' }
  ];

  /* T6: learners asking a human */
  var qs = [
    { id: 'hanh', who: 'Nguyễn Thị Hạnh', at: '16/11 23:04', q: 'Cô ơi, 中心部 75℃ 1 phút là tính từ lúc nào ạ? Lúc bỏ vào nồi hay lúc đo được 75℃?',
      ctx: ['Đang học bài 10 phút “衛生管理 · やっつける” (tối 16/11).', 'Đã nhận gợi ý bậc 1 và 2, chọn A (60℃) rồi đổi sang C (đúng).', 'Vẫn hỏi lại vì chưa rõ mốc tính 1 phút.'],
      src: 'JF 2号 衛生管理 tr.4', draft: 'Chào chị Hạnh, 1 phút tính từ lúc TÂM thực phẩm đã đạt 75℃, không phải từ lúc bỏ vào nồi. Chị đo ở giữa miếng thịt nhé. ' },
    { id: 'vy', who: 'Lê Thị Vy', at: '17/11 07:31', q: 'Em chụp thực đơn ở quán, trên hộp sữa ghi 賞味期限. Quá ngày đó có dùng được không ạ?',
      ctx: ['Hỏi sau “Chụp là học” với ảnh hộp sữa (chữ đã che, ảnh gốc không lưu).', 'Sensei Agent đã giải thích 賞味期限 = hạn giữ chất lượng; chị Vy muốn cô xác nhận.', 'Không có câu hỏi visa/pháp lý.'],
      src: 'JF 2号 接客全般 tr.9', draft: 'Chị Vy, 賞味期限 là hạn giữ chất lượng, không phải hạn an toàn. Nhưng ở quán, chị làm theo quy định của quán. ' }
  ];

  /* T5: anonymised sampled conversations (only learners who consented) */
  var samples = [
    { id: 's1', who: 'Học viên #A7', when: '16/11 22:48', topic: 'Bài 衛生管理 · xin đáp án',
      lines: [['hv', 'Cho em đáp án luôn đi, em mệt rồi.'], ['ai', 'Chị làm được mà. Gợi ý 1: xem lại thẻ “やっつける”, câu có chữ 中心部 (tâm thực phẩm).'], ['hv', 'C ạ?'], ['ai', 'Đúng rồi. 75℃ ở tâm, giữ ít nhất 1 phút. Nguồn: JF 2号 衛生管理 tr.4.']] },
    { id: 's2', who: 'Học viên #C2', when: '15/11 16:20', topic: 'Chụp là học · bảng quy trình vệ sinh',
      lines: [['hv', '[ảnh đã che tên] Chữ 次亜塩素酸ナトリウム là gì ạ?'], ['ai', 'Là natri hypoclorit, chất khử trùng dùng pha loãng để lau dụng cụ. Trong đề hay hỏi cách pha loãng.'], ['hv', 'Pha bao nhiêu ạ?'], ['ai', 'Em chưa tìm thấy con số này trong giáo trình của lớp, nên không đoán. Chị hỏi cô Linh nhé.']] },
    { id: 's3', who: 'Học viên #F5', when: '14/11 09:55', topic: 'Giải thích theo trình độ (L2)',
      lines: [['hv', 'QSC là gì?'], ['ai', 'Quality · Service · Cleanliness: chất lượng, phục vụ, sạch sẽ (JF 2号 店舗運営 tr.1).'], ['hv', 'Cho em ví dụ ở quán.'], ['ai', 'Món ra đúng vị (Q), chào khách khi vào (S), bàn lau sạch trước khi mời khách ngồi (C).']] }
  ];

  var agents = [
    { n: 'Lập kế hoạch', who: 'Học viên (Chốt A), giáo viên (T1)' },
    { n: 'Gia sư', who: 'Qua Kiểm chứng' },
    { n: 'Kiểm chứng', who: 'Giáo viên (T2, T3)' },
    { n: 'Đọc tài liệu', who: 'Học viên, giáo viên (T4)' },
    { n: 'Trợ lý lớp', who: 'Giáo viên (T7)' }
  ];

  return { src: src, center: center, teachers: teachers, classes: classes, roster: roster, hanh: hanh, t1: t1, t2: t2, t3: t3,
    upload: upload, materials: materials, msgs: msgs, qs: qs, samples: samples, agents: agents };
})();
