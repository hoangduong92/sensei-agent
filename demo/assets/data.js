/* Sensei Agent prototype: sample content.
   Every fact below comes from an official page opened on 2026-09-27; see `src` on each item.
   {漢字|かな} renders as ruby (furigana). Questions marked `team: true` are written by the team. */
window.SENPAI_DATA = (function () {
  var JF = 'https://www.jfnet.or.jp/wp/wp-content/uploads/2025/09/';

  var sources = {
    hyg2: { label: 'JF · 特定技能2号 衛生管理テキスト (2023)', url: JF + 'ssw2_jf_hygiene_controls_text_ja_v231227.pdf' },
    prep2: { label: 'JF · 特定技能2号 飲食物調理テキスト (2023)', url: JF + 'ssw2_jf_preparation_of_food_and_drink_text_ja_v231227.pdf' },
    cs2: { label: 'JF · 特定技能2号 接客全般テキスト (2023)', url: JF + 'ssw2_jf_customer_service_text_ja_v231227.pdf' },
    sm2: { label: 'JF · 特定技能2号 店舗運営テキスト (2023)', url: JF + 'ssw2_jf_store_management_text_ja_v231227.pdf' },
    hyg1ja: { label: 'JF · 特定技能1号 衛生管理テキスト v1.2', url: JF + 'jf_hygiene_controls_text_ja_v1.2.pdf' },
    hyg1vi: { label: 'JF · Giáo trình Quản lý vệ sinh số 1 v1.2 (bản tiếng Việt, tham khảo)', url: JF + 'jf_hygiene_controls_text_vi_v1.2.pdf' },
    otaff: { label: 'OTAFF · 外食業特定技能2号評価試験', url: 'https://otaff.or.jp/tokutei/gaisyoku-2/' },
    otaffVi: { label: 'OTAFF · Hướng dẫn kỳ thi 外食2号 (tiếng Việt, 1/4/2026)', url: 'https://otaff.or.jp/tokutei/wp-content/uploads/2026/04/ベトナム語148142-03_1-3-試験案内（外食2号）.pdf' },
    ipR7: { label: 'IPA · 令和7年度 ITパスポート試験 公開問題', url: 'https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2025r07_ip_qs.pdf' },
    ipGen: { label: 'IPA · ITパスポート試験 生成AIに関するサンプル問題', url: 'https://www.ipa.go.jp/shiken/syllabus/t6hhco000000wyrz-att/ip_generativeai_sample.pdf' },
    ipKubun: { label: 'IPA · ITパスポート試験 (IP)', url: 'https://www.ipa.go.jp/shiken/kubun/ip.html' },
    ipYoukou: { label: 'IPA · 試験要綱 Ver.5.6', url: 'https://www.ipa.go.jp/shiken/syllabus/rcu1hd00000141gq-att/youkou_ver5_6.pdf' },
    isa: { label: 'ISA · 外国人在留総合インフォメーションセンター', url: 'https://www.moj.go.jp/isa/consultation/center/index.html' },
    bastani: { label: 'Bastani et al. (2025), PNAS 122(26)', url: 'https://doi.org/10.1073/pnas.2422633122' },
    mediapipe: { label: 'Google · MediaPipe Face Detector (web)', url: 'https://developers.google.com/edge/mediapipe/solutions/vision/face_detector/web_js' },
    isaYoryo: { label: 'ISA · 特定技能外国人受入れに関する運用要領 (8/2026)', url: 'https://www.moj.go.jp/isa/content/001468647.pdf' }
  };

  /* White-label tenant and class (sample data, fictional names). */
  var center = { name: 'Trung tâm Hoa Anh Đào', mark: '桜' };
  var klass = { code: 'K12', title: '外食業2号 · K12', teacher: 'cô Linh', students: 18, invite: 'HAD-K12-7Q4', examDate: '2027-02-21' };

  var exams = {
    gaishoku: {
      id: 'gaishoku',
      ja: '{外食業|がいしょくぎょう}{特定技能|とくていぎのう}2{号|ごう}',
      short: '外食業2号',
      vn: 'Kỹ năng đặc định số 2 · ngành nhà hàng',
      meta: '3 lựa chọn · 70 phút · đạt 65% (163/250) · kèm JLPT N3',
      who: 'Lớp K12 của cô Linh ôn kỳ thi này',
      total: 250, pass: 163,
      src: ['otaff', 'otaffVi'],
      areas: [
        { id: 'hyg', ja: '{衛生管理|えいせいかんり}', vn: 'Quản lý vệ sinh', pts: 80, split: 'Lý thuyết 10 câu · 40đ, thực hành 5 câu · 40đ', p: 0.35 },
        { id: 'sm', ja: '{店舗運営|てんぽうんえい}', vn: 'Vận hành cửa hàng', pts: 80, split: 'Lý thuyết 10 câu · 40đ, thực hành 5 câu · 40đ', p: 0.40 },
        { id: 'prep', ja: '{飲食物調理|いんしょくぶつちょうり}', vn: 'Chế biến món ăn, đồ uống', pts: 30, split: 'Lý thuyết 5 câu · 10đ, thực hành 5 câu · 20đ', p: 0.70 },
        { id: 'cs', ja: '{接客全般|せっきゃくぜんぱん}', vn: 'Phục vụ khách hàng', pts: 60, split: 'Lý thuyết 10 câu · 30đ, thực hành 5 câu · 30đ', p: 0.75 }
      ]
    },
    ip: {
      id: 'ip',
      ja: 'ITパスポート',
      short: 'IT Passport',
      vn: 'Chứng chỉ IT quốc gia cơ bản',
      meta: '4 lựa chọn · 100 câu · 120 phút · thi trên máy',
      who: 'Anh Tuấn · lớp IP05, thầy Nam',
      src: ['ipKubun', 'ipYoukou'],
      areas: [
        { id: 'tech', ja: 'テクノロジ{系|けい}', vn: 'Công nghệ', pts: 42, split: '42 / 92 câu tính điểm', p: 0.30 },
        { id: 'strat', ja: 'ストラテジ{系|けい}', vn: 'Chiến lược, kinh doanh', pts: 32, split: '32 / 92 câu tính điểm', p: 0.55 },
        { id: 'mgmt', ja: 'マネジメント{系|けい}', vn: 'Quản lý dự án, dịch vụ', pts: 18, split: '18 / 92 câu tính điểm', p: 0.40 }
      ]
    }
  };

  var diag = {
    gaishoku: [
      { area: 'hyg', q: 'Ba nguyên tắc phòng ngộ độc thực phẩm là つけない · {増|ふ}やさない · và gì nữa?',
        opts: ['やっつける (tiêu diệt)', '{捨|す}てない (không vứt đi)', '{触|さわ}らない (không chạm vào)'], a: 0,
        src: { k: 'hyg2', page: 3, pdf: 7 } },
      { area: 'prep', q: '{先入|さきい}れ{先出|さきだ}し nghĩa là gì?',
        opts: ['Dùng nguyên liệu mới nhập trước', 'Dùng nguyên liệu cũ trước, mới sau', 'Nấu món khách gọi trước trước'], a: 1,
        src: { k: 'prep2', page: 18, pdf: 22 } },
      { area: 'cs', q: 'Nhãn hạn nào nói về AN TOÀN: quá ngày thì không nên ăn?',
        opts: ['{賞味期限|しょうみきげん}', '{製造日|せいぞうび}', '{消費期限|しょうひきげん}'], a: 2,
        src: { k: 'cs2', page: 9, pdf: 13 } },
      { area: 'sm', q: '{人時売上高|にんじうりあげだか} được tính thế nào?',
        opts: ['{粗利益|あらりえき} ÷ tổng giờ công', 'Doanh thu 1 ngày ÷ tổng giờ công 1 ngày', 'Số khách ÷ tổng giờ công'], a: 1,
        src: { k: 'sm2', page: 3, pdf: 7 } }
    ],
    ip: [
      { verbatim: true, cite: '出典：令和7年度 ITパスポート試験 公開問題 問4',
        q: '投資の優先度などの経営の戦略を策定するために，経済価値，希少性，模倣困難性及び組織の四つの要素で評価することによって，自社のもつ資源を分析する手法として，最も適切なものはどれか。',
        gist: 'Phân tích nguồn lực của công ty theo 4 yếu tố (giá trị kinh tế, độ hiếm, khó bắt chước, tổ chức) là phương pháp nào?',
        opts: ['4P', 'PPM', 'SWOT分析', 'VRIO分析'], labels: ['ア', 'イ', 'ウ', 'エ'], a: 3, src: { k: 'ipR7' } },
      { verbatim: true, cite: '出典：令和7年度 ITパスポート試験 公開問題 問7',
        q: '新しい概念やアイディアの実証を目的とした，開発の前段階における検証を表す用語はどれか。',
        gist: 'Thuật ngữ chỉ bước kiểm chứng trước khi phát triển, để chứng minh một khái niệm hay ý tưởng mới?',
        opts: ['CRM', 'PoC', 'RAS', 'SLA'], labels: ['ア', 'イ', 'ウ', 'エ'], a: 1, src: { k: 'ipR7' } },
      { verbatim: true, cite: '出典：ITパスポート試験 生成AIに関するサンプル問題 問2',
        q: '生成AIが，学習データの誤りや不足などによって，事実とは異なる情報や無関係な情報を，もっともらしい情報として生成する事象を指す用語として，最も適切なものはどれか。',
        gist: 'AI tạo sinh đưa ra thông tin sai hoặc không liên quan nhưng trông như thật, vì dữ liệu học sai hoặc thiếu. Hiện tượng này gọi là gì?',
        opts: ['アノテーション', 'ディープフェイク', 'バイアス', 'ハルシネーション'], labels: ['ア', 'イ', 'ウ', 'エ'], a: 3, src: { k: 'ipGen' } }
    ]
  };

  var lessonCards = [
    { ja: '{食中毒|しょくちゅうどく}{予防|よぼう}の3{原則|げんそく}', vn: '3 nguyên tắc phòng ngộ độc thực phẩm',
      rows: [
        ['つけない', 'Không để bám vào: rửa tay, giữ dụng cụ và nơi làm sạch sẽ.'],
        ['{増|ふ}やさない', 'Không để sinh sôi: không để thực phẩm lâu ở nhiệt độ phòng.'],
        ['やっつける', 'Tiêu diệt: nấu chín đủ nhiệt.']
      ],
      note: 'O157, norovirus: chỉ khoảng 10–100 con đã gây bệnh ({少量感染|しょうりょうかんせん}, nhiễm với lượng nhỏ). Vì vậy つけない rất quan trọng.',
      src: { k: 'hyg2', page: 3, pdf: 7 } },
    { ja: '{増|ふ}やさない', vn: 'Không để vi khuẩn sinh sôi',
      rows: [
        ['{低温|ていおん}', 'Bảo quản lạnh: 10℃ trở xuống.'],
        ['{高温|こうおん}', 'Giữ nóng: 60℃ trở lên.']
      ],
      note: 'Virus (ví dụ norovirus) không sinh sôi trong thực phẩm, nên nguyên tắc này không áp dụng cho virus. Với virus, つけない là quan trọng nhất.',
      src: { k: 'hyg2', page: 3, pdf: 7 } },
    { ja: 'やっつける', vn: 'Tiêu diệt bằng nhiệt',
      rows: [
        ['{中心部|ちゅうしんぶ}', 'Tâm thực phẩm phải đạt 75℃, giữ ít nhất 1 phút.'],
        ['ノロウイルス', 'Thực phẩm có nguy cơ nhiễm norovirus: 85–90℃, ít nhất 90 giây.']
      ],
      note: 'Đo ở TÂM thực phẩm, không phải ở bề mặt.',
      src: { k: 'hyg2', page: 4, pdf: 8 } },
    { ja: 'HACCPに{沿|そ}った{衛生管理|えいせいかんり}', vn: '4 việc mọi cơ sở phải làm',
      rows: [
        ['{衛生管理計画|えいせいかんりけいかく}', 'Lập kế hoạch quản lý vệ sinh, phổ biến cho nhân viên.'],
        ['{手順書|てじゅんしょ}', 'Viết quy trình cụ thể khi cần (lau rửa, khử trùng...).'],
        ['{記録|きろく}と{保存|ほぞん}', 'Ghi chép việc đã làm và lưu lại.'],
        ['{定期的|ていきてき}な{検証|けんしょう}', 'Định kỳ xem lại, sửa khi cần.']
      ],
      note: 'Tiêu đề trong giáo trình: すべての{営業者|えいぎょうしゃ}が{実施|じっし}しなければならないこと.',
      src: { k: 'hyg2', page: 5, pdf: 9 } }
  ];

  var lessonQs = [
    { area: 'hyg', q: 'Nấu để diệt vi khuẩn (やっつける): TÂM thực phẩm cần đạt mức nào?',
      opts: ['60℃ trong 1 phút', '75℃ trong 10 giây', '75℃, ít nhất 1 phút'], a: 2, peer: 61,
      hints: [
        'Xem lại thẻ “やっつける”: giáo trình 2号 衛生管理, trang 4, câu có chữ {中心部|ちゅうしんぶ} (tâm thực phẩm).',
        'Ví dụ tương tự, số khác: thực phẩm có nguy cơ norovirus cần 85–90℃ trong ít nhất 90 giây. Tức là cần đủ cả NHIỆT ĐỘ lẫn THỜI GIAN.',
        'Loại A: 60℃ là mức GIỮ NÓNG để vi khuẩn không tăng ({増|ふ}やさない), không phải mức nấu để diệt.'
      ], elim: 0,
      expl: [
        'Đáp án C. Muốn diệt vi khuẩn, tâm thực phẩm phải đạt 75℃ và giữ ít nhất 1 phút. 60℃ chỉ là mức giữ nóng.',
        'Đáp án C. {中心部|ちゅうしんぶ} (tâm) đạt 75℃ trong 1{分間|ふんかん}{以上|いじょう} (ít nhất 1 phút). Nguy cơ norovirus: 85〜90℃, 90{秒間|びょうかん}{以上|いじょう}.',
        '{正解|せいかい}はC。{食品|しょくひん}の{中心部|ちゅうしんぶ}を75℃で1{分間|ふんかん}{以上|いじょう}{加熱|かねつ}する（ノロウイルス{汚染|おせん}のおそれのある{食品|しょくひん}は85～90℃で90{秒間|びょうかん}{以上|いじょう}）。'
      ],
      src: { k: 'hyg2', page: 4, pdf: 8 } },
    { area: 'hyg', q: 'Theo nguyên tắc {増|ふ}やさない, nên bảo quản thực phẩm ở nhiệt độ nào?',
      opts: ['10℃ trở xuống, hoặc 60℃ trở lên', 'Khoảng 20–30℃', 'Khoảng 30–50℃'], a: 0, peer: 72,
      hints: [
        'Xem lại thẻ “{増|ふ}やさない”: trang 3, bảo quản ở nhiệt độ THẤP hoặc CAO.',
        'Ví dụ tương tự: tủ lạnh giữ lạnh để vi khuẩn không tăng; tủ giữ nóng giữ món đã nấu thật nóng. Nhiệt độ phòng thì ngược lại.',
        'Loại B: 20–30℃ là nhiệt độ phòng. Giáo trình nói để thực phẩm lâu ở nhiệt độ phòng thì vi khuẩn tăng.'
      ], elim: 1,
      expl: [
        'Đáp án A. Giữ lạnh từ 10℃ trở xuống, hoặc giữ nóng từ 60℃ trở lên, để vi khuẩn không tăng.',
        'Đáp án A. {低温|ていおん}（10℃{以下|いか}） hoặc {高温|こうおん}（60℃{以上|いじょう}） khi {保管|ほかん} (bảo quản).',
        '{正解|せいかい}はA。{保存|ほぞん}する{食品|しょくひん}は{低温|ていおん}（10℃{以下|いか}）あるいは{高温|こうおん}（60℃{以上|いじょう}）で{保管|ほかん}する。'
      ],
      src: { k: 'hyg2', page: 3, pdf: 7 } },
    { area: 'hyg', q: 'Vì sao nguyên tắc {増|ふ}やさない KHÔNG áp dụng cho norovirus?',
      opts: ['Norovirus chết ngay ở 10℃', 'Virus không sinh sôi trong thực phẩm', 'Norovirus chỉ có trong nước uống'], a: 1, peer: 48,
      hints: [
        'Xem lại thẻ “{増|ふ}やさない”: phần bắt đầu bằng ただし (tuy nhiên) ở trang 3.',
        'Ví dụ tương tự: “không để tăng” chỉ có nghĩa với thứ CÓ THỂ tăng lên trong thực phẩm, như vi khuẩn.',
        'Loại A: giáo trình không nói norovirus chết ở 10℃. 10℃ là mức giữ lạnh để vi khuẩn chậm tăng.'
      ], elim: 0,
      expl: [
        'Đáp án B. Virus không tăng lên trong thực phẩm, nên “không để tăng” không dùng được. Với norovirus, quan trọng nhất là không để bám vào (つけない).',
        'Đáp án B. ウイルスは{食品中|しょくひんちゅう}で{増|ふ}えない, nên {原則|げんそく} {増|ふ}やさない không áp dụng. Chỉ 10–100 con đã lây ({少量感染|しょうりょうかんせん}), nên つけない là chính.',
        '{正解|せいかい}はB。ウイルスは{食品中|しょくひんちゅう}で{増|ふ}えないため、この{原則|げんそく}は{適用|てきよう}できない。'
      ],
      src: { k: 'hyg2', page: 3, pdf: 7 } },
    { area: 'hyg', q: 'Theo HACCP, việc nào MỌI cơ sở kinh doanh ăn uống đều phải làm?',
      opts: ['Lập kế hoạch vệ sinh, ghi chép và lưu, kiểm tra định kỳ', 'Chỉ cần treo poster rửa tay', 'Chỉ cơ sở lớn mới phải làm HACCP'], a: 0, peer: 66,
      hints: [
        'Xem lại thẻ “HACCP”: trang 5, mục すべての{営業者|えいぎょうしゃ}が{実施|じっし}しなければならないこと.',
        'Ví dụ tương tự: giống sổ an toàn ở chỗ làm. Có kế hoạch, có ghi chép, có người xem lại định kỳ.',
        'Loại C: tiêu đề mục ghi すべての{営業者|えいぎょうしゃ}, nghĩa là MỌI cơ sở.'
      ], elim: 2,
      expl: [
        'Đáp án A. Mọi cơ sở phải: lập kế hoạch quản lý vệ sinh, viết quy trình khi cần, ghi chép và lưu, kiểm tra định kỳ.',
        'Đáp án A. ①{衛生管理計画|えいせいかんりけいかく}の{作成|さくせい} ②{手順書|てじゅんしょ} (khi cần) ③{記録|きろく}と{保存|ほぞん} ④{定期的|ていきてき}な{検証|けんしょう}.',
        '{正解|せいかい}はA。すべての{営業者|えいぎょうしゃ}は{衛生管理計画|えいせいかんりけいかく}の{作成|さくせい}、{記録|きろく}と{保存|ほぞん}、{定期的|ていきてき}な{検証|けんしょう}などをおこなわなければならない。'
      ],
      src: { k: 'hyg2', page: 5, pdf: 9 } },
    { area: 'hyg', q: 'O157 hay norovirus: ăn vào khoảng bao nhiêu con thì đã có thể bị nhiễm?',
      opts: ['Ít nhất 1 triệu con', 'Khoảng 10 đến 100 con', 'Ít nhất 10.000 con'], a: 1, peer: 54,
      hints: [
        'Xem lại thẻ “3 {原則|げんそく}”: trang 3, từ {少量感染|しょうりょうかんせん} (nhiễm với lượng nhỏ).',
        'Ví dụ tương tự: vì lượng rất nhỏ đã gây bệnh, một chút dính trên tay cũng đủ. Vì vậy rửa tay (つけない) rất quan trọng.',
        'Loại A: nếu cần tới hàng triệu con thì đã không gọi là {少量|しょうりょう} (lượng nhỏ).'
      ], elim: 0,
      expl: [
        'Đáp án B. Chỉ khoảng 10 đến 100 con đã gây bệnh. Giáo trình gọi đây là nhiễm với lượng nhỏ.',
        'Đáp án B. 10{個|こ}から100{個|こ}{程度|ていど} → {少量感染|しょうりょうかんせん} (nhiễm với lượng nhỏ).',
        '{正解|せいかい}はB。O157やノロウイルスは、10{個|こ}から100{個|こ}{程度|ていど}の{少|すく}ない{量|りょう}を{摂取|せっしゅ}するだけで{感染|かんせん}する（{少量感染|しょうりょうかんせん}）。'
      ],
      src: { k: 'hyg2', page: 3, pdf: 7 } },
    /* Round 2: the same four cards, asked from another side. */
    { area: 'hyg', q: 'Nguyên tắc つけない (không để bám vào) nghĩa là làm gì?',
      opts: ['Rửa tay, giữ dụng cụ và nơi làm sạch sẽ', 'Để thực phẩm trong tủ lạnh', 'Nấu chín thật kỹ'], a: 0, peer: 83,
      hints: [
        'Xem lại thẻ “3 {原則|げんそく}”: trang 3, dòng つけない.',
        'Ví dụ tương tự: “không để tăng” là giữ lạnh hoặc giữ nóng; “tiêu diệt” là nấu chín. Vậy “không để bám vào” là chặn vi khuẩn từ tay, dụng cụ.',
        'Loại C: nấu chín là やっつける (tiêu diệt), không phải つけない.'
      ], elim: 2,
      expl: [
        'Đáp án A. つけない là không để vi khuẩn bám vào thực phẩm: rửa tay, giữ dụng cụ và nơi làm việc sạch sẽ.',
        'Đáp án A. つけない: {手洗|てあら}い (rửa tay), giữ dụng cụ và nơi làm {清潔|せいけつ} (sạch sẽ). {増|ふ}やさない là giữ lạnh, giữ nóng; やっつける là {加熱|かねつ}.',
        '{正解|せいかい}はA。つけない：{手|て}を{洗|あら}い、{器具|きぐ}や{調理場|ちょうりば}を{清潔|せいけつ}に{保|たも}つ。'
      ],
      src: { k: 'hyg2', page: 3, pdf: 7 } },
    { area: 'hyg', q: 'Thực phẩm có nguy cơ nhiễm norovirus: cần nấu thế nào?',
      opts: ['75℃ trong 1 phút là đủ', '85–90℃, ít nhất 90 giây', '60℃ trong 30 phút'], a: 1, peer: 57,
      hints: [
        'Xem lại thẻ “やっつける”: trang 4, dòng ノロウイルス.',
        'Ví dụ tương tự: thực phẩm thường cần tâm đạt 75℃ trong ít nhất 1 phút. Norovirus cần nhiệt CAO hơn và LÂU hơn.',
        'Loại C: 60℃ là mức giữ nóng, không phải mức nấu để diệt.'
      ], elim: 2,
      expl: [
        'Đáp án B. Thực phẩm có nguy cơ nhiễm norovirus cần nấu 85–90℃ trong ít nhất 90 giây, cao hơn mức 75℃ thông thường.',
        'Đáp án B. ノロウイルス{汚染|おせん}のおそれ → 85〜90℃, 90{秒間|びょうかん}{以上|いじょう}. Thực phẩm thường: 75℃, 1{分間|ふんかん}{以上|いじょう}.',
        '{正解|せいかい}はB。ノロウイルス{汚染|おせん}のおそれのある{食品|しょくひん}は85～90℃で90{秒間|びょうかん}{以上|いじょう}{加熱|かねつ}する。'
      ],
      src: { k: 'hyg2', page: 4, pdf: 8 } },
    { area: 'hyg', q: 'Kiểm tra món đã nấu đủ nhiệt chưa: đo nhiệt độ ở đâu?',
      opts: ['Trên bề mặt món ăn', 'Ở tâm (giữa) thực phẩm', 'Không khí trong nồi'], a: 1, peer: 79,
      hints: [
        'Xem lại thẻ “やっつける”: trang 4, từ {中心部|ちゅうしんぶ}.',
        'Ví dụ tương tự: miếng thịt dày có thể chín bên ngoài mà bên trong còn sống. Chỗ nóng chậm nhất mới là chỗ cần đo.',
        'Loại C: giáo trình nói nhiệt độ của thực phẩm, không nói không khí.'
      ], elim: 2,
      expl: [
        'Đáp án B. Đo ở tâm thực phẩm, không phải ở bề mặt. Tâm phải đạt 75℃ và giữ ít nhất 1 phút.',
        'Đáp án B. {中心部|ちゅうしんぶ} = tâm thực phẩm. Tâm đạt 75℃, 1{分間|ふんかん}{以上|いじょう}.',
        '{正解|せいかい}はB。{食品|しょくひん}の{中心部|ちゅうしんぶ}の{温度|おんど}をはかる。{表面|ひょうめん}ではない。'
      ],
      src: { k: 'hyg2', page: 4, pdf: 8 } },
    { area: 'hyg', q: 'Theo HACCP, {記録|きろく}と{保存|ほぞん} nghĩa là gì?',
      opts: ['Cất thực phẩm vào tủ lạnh', 'Ghi chép việc đã làm và lưu lại', 'Ghi tên khách đặt bàn'], a: 1, peer: 69,
      hints: [
        'Xem lại thẻ “HACCP”: trang 5, việc thứ 3.',
        'Ví dụ tương tự: ghi nhiệt độ tủ lạnh vào sổ mỗi sáng, rồi giữ sổ đó lại. Vừa “ghi” vừa “lưu”.',
        'Loại C: HACCP nói về vệ sinh, không nói thông tin khách.'
      ], elim: 2,
      expl: [
        'Đáp án B. 記録と保存 là ghi chép những việc vệ sinh đã làm, rồi lưu lại.',
        'Đáp án B. {記録|きろく} = ghi chép, {保存|ほぞん} = lưu giữ. Đây là 1 trong 4 việc mọi cơ sở phải làm.',
        '{正解|せいかい}はB。{実施|じっし}したことを{記録|きろく}し、その{記録|きろく}を{保存|ほぞん}する。'
      ],
      src: { k: 'hyg2', page: 5, pdf: 9 } },
    { area: 'hyg', q: 'Việc thứ 4 của HACCP, {定期的|ていきてき}な{検証|けんしょう}, nghĩa là gì?',
      opts: ['Định kỳ xem lại cách làm, sửa khi cần', 'Mỗi năm khám sức khoẻ một lần', 'Định kỳ đổi nhà cung cấp'], a: 0, peer: 74,
      hints: [
        'Xem lại thẻ “HACCP”: trang 5, việc thứ 4.',
        'Ví dụ tương tự: {定期券|ていきけん} là vé tháng, dùng lặp lại theo kỳ. {検証|けんしょう} là kiểm tra xem có đúng không.',
        'Loại C: giáo trình không nói gì về đổi nhà cung cấp.'
      ], elim: 2,
      expl: [
        'Đáp án A. Định kỳ xem lại việc vệ sinh có làm đúng kế hoạch không, sửa khi cần.',
        'Đáp án A. {定期的|ていきてき} = định kỳ, {検証|けんしょう} = kiểm chứng, xem lại; {見直|みなお}す = sửa lại khi cần.',
        '{正解|せいかい}はA。{衛生管理|えいせいかんり}が{計画|けいかく}どおりにできているか{定期的|ていきてき}に{確認|かくにん}し、{必要|ひつよう}なら{見直|みなお}す。'
      ],
      src: { k: 'hyg2', page: 5, pdf: 9 } }
  ];

  /* Stars per syllabus item (衛生管理). `stars: null` = computed from today's lesson; the others are sample history. */
  var syllabus = [
    { id: 'law', ja: '{食品衛生法|しょくひんえいせいほう}', vn: 'Luật Vệ sinh thực phẩm', stars: 1, src: { k: 'hyg2', page: 1, pdf: 5 } },
    { id: 'fp', ja: '{食中毒|しょくちゅうどく}{予防|よぼう}・HACCP', vn: 'Phòng ngộ độc thực phẩm, HACCP', stars: null, src: { k: 'hyg2', page: 3, pdf: 7 } },
    { id: '5s', ja: '5S', vn: 'Sàng lọc, sắp xếp, giữ sạch', stars: 2, src: { k: 'hyg2', page: 4, pdf: 8 } }
  ];

  /* Anonymous average mastery of Sensei Agent users who reported passing (sample numbers; the real app shows it only once enough people report). */
  var passers = { hyg: 0.78, sm: 0.74, prep: 0.80, cs: 0.85 };

  var captureQs = [
    { area: 'hyg', q: 'Poster ghi 2{度洗|どあら}い. Nghĩa là gì?',
      opts: ['Rửa lần lượt từng tay', 'Rửa tay 2 lần: lặp lại bước イ đến ケ', 'Rửa tay trong 2 phút'], a: 1,
      hints: ['Nhìn dòng cuối của poster, trong ngoặc: イ～ケまでをくりかえす.', 'くりかえす = lặp lại.', 'Loại C: poster không nói về số phút.'], elim: 2,
      expl: ['Đáp án B. Rửa 2 lần hiệu quả hơn: lặp lại từ bước イ (lấy xà phòng) đến ケ (xả sạch).',
        'Đáp án B. 2{度洗|どあら}いが{効果的|こうかてき}: lặp lại (くりかえす) bước イ～ケ.',
        '{正解|せいかい}はB。2{度洗|どあら}いが{効果的|こうかてき}です（イ～ケまでをくりかえす）。'],
      src: { k: 'hyg1ja', page: 11, pdf: 16 } },
    { area: 'hyg', q: 'Bước cuối cùng (サ) trên poster là gì?',
      opts: ['Lau khô tay', 'Rửa cổ tay', 'Sát khuẩn bằng cồn'], a: 2,
      hints: ['Tìm chữ サ trên poster.', 'アルコール = cồn.', 'Loại B: rửa cổ tay là bước ク.'], elim: 1,
      expl: ['Đáp án C. Sau khi lau khô tay (コ), bước cuối là sát khuẩn bằng cồn (サ).',
        'Đáp án C. サ．アルコールによる{消毒|しょうどく} (sát khuẩn bằng cồn).',
        '{正解|せいかい}はC。{最後|さいご}はアルコールによる{消毒|しょうどく}。'],
      src: { k: 'hyg1ja', page: 11, pdf: 16 } },
    { area: 'hyg', q: 'Câu mở rộng từ giáo trình: khi nào PHẢI rửa tay?',
      opts: ['Trước khi nấu, và trước, sau khi chạm trứng, thịt, cá sống', 'Chỉ khi tay trông bẩn', 'Chỉ lúc hết ca'], a: 0,
      hints: ['Giáo trình số 1 (bản tiếng Việt), trang 2, nguyên tắc “Không để bám vào”.', 'Ví dụ tương tự: sau khi đi vệ sinh cũng phải rửa tay.', 'Loại B: vi khuẩn bám vào tay mà mắt thường không thấy.'], elim: 1,
      expl: ['Đáp án A. Rửa tay trước khi nấu, trước và sau khi chạm trứng, thịt, cá sống, và sau khi đi vệ sinh.',
        'Đáp án A. つけない (không để bám vào): rửa tay trước khi nấu, trước và sau khi chạm {生|なま}の{卵|たまご}・{肉|にく}・{魚|さかな}.',
        '{正解|せいかい}はA。{調理|ちょうり}の{前|まえ}、{生|なま}の{卵|たまご}・{肉|にく}・{魚|さかな}を{扱|あつか}う{前後|ぜんご}、トイレの{後|あと}に{手|て}を{洗|あら}う。'],
      src: { k: 'hyg1vi', page: 2, pdf: 6 } }
  ];

  var flashcards = [
    { ja: '{整理|せいり}', vn: 'Sàng lọc: bỏ thứ không cần, biết rõ số lượng thứ cần.', src: { k: 'hyg2', page: 4, pdf: 8 } },
    { ja: '{整頓|せいとん}', vn: 'Sắp xếp: để đúng chỗ quy định, cần là lấy ra được ngay.', src: { k: 'hyg2', page: 4, pdf: 8 } },
    { ja: '{先入|さきい}れ{先出|さきだ}し', vn: 'Dùng nguyên liệu theo thứ tự: cũ trước, mới sau.', src: { k: 'prep2', page: 18, pdf: 22 } },
    { ja: '{消費期限|しょうひきげん}', vn: 'Hạn về AN TOÀN. Quá hạn thì không ăn.', src: { k: 'cs2', page: 9, pdf: 13 } },
    { ja: '{賞味期限|しょうみきげん}', vn: 'Hạn giữ CHẤT LƯỢNG (ngon nhất).', src: { k: 'cs2', page: 9, pdf: 13 } },
    { ja: 'QSC', vn: 'Quality · Service · Cleanliness: chất lượng · phục vụ · sạch sẽ.', src: { k: 'sm2', page: 1, pdf: 5 } }
  ];

  /* Mock exam: Japanese stems without furigana, like the real exam. The first 10 cover all four areas.
     `vi` = the team's Vietnamese translation of the stem (shown after submitting). `peer` = sample % of other learners right. */
  var mockQs = [
    { area: 'hyg', q: '5S活動のうち、必要なものを必要な時に必要な量だけ取り出せるように、定めた場所に保管することを何というか。',
      vi: 'Trong hoạt động 5S, việc cất đồ ở chỗ đã quy định, để khi cần là lấy ra được đúng thứ, đúng lúc, đúng lượng, gọi là gì?',
      opts: ['整理', '整頓', '清掃'], a: 1, peer: 58, src: { k: 'hyg2', page: 4, pdf: 8 } },
    { area: 'cs', q: '特定原材料8品目に含まれないものはどれか。',
      vi: 'Thứ nào KHÔNG thuộc 8 loại nguyên liệu gây dị ứng bắt buộc ghi nhãn?',
      opts: ['えび', '米', 'くるみ'], a: 1, peer: 71, src: { k: 'cs2', page: 8, pdf: 12 } },
    { area: 'prep', q: '食器洗浄機のすすぎ温度の基本はどれか。',
      vi: 'Nhiệt độ nước tráng cơ bản của máy rửa bát là bao nhiêu?',
      opts: ['40～50℃', '60～70℃', '80～90℃'], a: 2, peer: 44, src: { k: 'prep2', page: 9, pdf: 13 } },
    { area: 'sm', q: 'QSCの「C」が表すものはどれか。',
      vi: 'Chữ “C” trong QSC nghĩa là gì?',
      opts: ['Cleanliness（清潔さ）', 'Cost（コスト）', 'Customer（顧客）'], a: 0, peer: 82, src: { k: 'sm2', page: 1, pdf: 5 } },
    { area: 'hyg', q: '食品衛生法の目的として正しいものはどれか。',
      vi: 'Mục đích của Luật Vệ sinh thực phẩm là gì?',
      opts: ['飲食店の売上を増やすこと', '食品の価格を安定させること', '飲食に起因する衛生上の危害の発生を防止し、国民の健康の保護を図ること'], a: 2, peer: 76,
      src: { k: 'hyg2', page: 1, pdf: 5 } },
    { area: 'hyg', q: '食中毒予防の3原則に含まれないものはどれか。',
      vi: 'Điều nào KHÔNG nằm trong 3 nguyên tắc phòng ngộ độc thực phẩm?',
      opts: ['つけない', '増やさない', '冷やさない'], a: 2, peer: 88, src: { k: 'hyg2', page: 3, pdf: 7 } },
    { area: 'prep', q: '先入れ先出しの説明として正しいものはどれか。',
      vi: 'Giải thích nào về 先入れ先出し là đúng?',
      opts: ['先に仕入れたものから先に使う', '新しく仕入れたものから先に使う', '値段の高いものから先に使う'], a: 0, peer: 85, src: { k: 'prep2', page: 18, pdf: 22 } },
    { area: 'cs', q: '安全に食べられる期限を表すものはどれか。',
      vi: 'Cái nào cho biết thời hạn ăn được AN TOÀN?',
      opts: ['賞味期限', '消費期限', '製造日'], a: 1, peer: 63, src: { k: 'cs2', page: 9, pdf: 13 } },
    { area: 'sm', q: '人時売上高を求める計算式として正しいものはどれか。',
      vi: 'Công thức tính 人時売上高 (doanh thu trên mỗi giờ công) nào đúng?',
      opts: ['売上高 ÷ 総労働時間', '粗利益 ÷ 客数', '客数 ÷ 総労働時間'], a: 0, peer: 52, src: { k: 'sm2', page: 3, pdf: 7 } },
    { area: 'hyg', q: '加熱調理で、食品の中心部の温度と時間の目安として正しいものはどれか。',
      vi: 'Khi nấu, mức nhiệt độ và thời gian ở tâm thực phẩm nào là đúng?',
      opts: ['60℃で1分間以上', '75℃で1分間以上', '75℃で10秒間'], a: 1, peer: 61, src: { k: 'hyg2', page: 4, pdf: 8 } },
    { area: 'hyg', q: '食品を低温で保存するときの温度の目安はどれか。',
      vi: 'Khi bảo quản lạnh thực phẩm, mức nhiệt độ nào là đúng?',
      opts: ['10℃以下', '20℃以下', '30℃以下'], a: 0, peer: 70, src: { k: 'hyg2', page: 3, pdf: 7 } },
    { area: 'hyg', q: 'ノロウイルス汚染のおそれのある食品の加熱の目安はどれか。',
      vi: 'Thực phẩm có nguy cơ nhiễm norovirus cần nấu ở mức nào?',
      opts: ['60℃で30分間以上', '75℃で10秒間以上', '85～90℃で90秒間以上'], a: 2, peer: 49, src: { k: 'hyg2', page: 4, pdf: 8 } },
    { area: 'hyg', q: 'O157やノロウイルスは、どのくらいの量で感染することがあるか。',
      vi: 'O157 hay norovirus có thể gây nhiễm với lượng khoảng bao nhiêu?',
      opts: ['10～100個程度', '1万個程度', '100万個以上'], a: 0, peer: 55, src: { k: 'hyg2', page: 3, pdf: 7 } },
    { area: 'hyg', q: 'HACCPに沿った衛生管理で、すべての営業者が実施しなければならないことはどれか。',
      vi: 'Trong quản lý vệ sinh theo HACCP, việc nào mọi cơ sở kinh doanh đều phải làm?',
      opts: ['衛生管理計画の作成', '外国語メニューの作成', '大型冷蔵庫の購入'], a: 0, peer: 66, src: { k: 'hyg2', page: 5, pdf: 9 } },
    { area: 'cs', q: 'おいしく食べられる期限を表すものはどれか。',
      vi: 'Cái nào cho biết thời hạn ăn NGON nhất?',
      opts: ['消費期限', '賞味期限', '製造日'], a: 1, peer: 68, src: { k: 'cs2', page: 9, pdf: 13 } },
    { area: 'hyg', q: '手洗いの手順で、最後に行うことはどれか。',
      vi: 'Trong các bước rửa tay, việc làm sau cùng là gì?',
      opts: ['流水で手を洗う', '手首を洗う', 'アルコールによる消毒'], a: 2, peer: 80, src: { k: 'hyg1ja', page: 11, pdf: 16 } },
    { area: 'hyg', q: '手洗いをより効果的にする方法はどれか。',
      vi: 'Cách nào giúp rửa tay hiệu quả hơn?',
      opts: ['1回だけ素早く洗う', '2度洗いをする', '水だけで洗う'], a: 1, peer: 77, src: { k: 'hyg1ja', page: 11, pdf: 16 } },
    { area: 'hyg', q: '5S活動のうち、必要なものと不要なものを分け、不要なものを処分することを何というか。',
      vi: 'Trong hoạt động 5S, việc chia đồ cần và đồ không cần, rồi bỏ đồ không cần, gọi là gì?',
      opts: ['整理', '整頓', '清潔'], a: 0, peer: 59, src: { k: 'hyg2', page: 4, pdf: 8 } },
    { area: 'hyg', q: '食品の中で増えないものはどれか。',
      vi: 'Thứ nào KHÔNG tăng lên trong thực phẩm?',
      opts: ['細菌', 'ウイルス', 'どちらも増える'], a: 1, peer: 47, src: { k: 'hyg2', page: 3, pdf: 7 } },
    { area: 'sm', q: 'QSCの「Q」が表すものはどれか。',
      vi: 'Chữ “Q” trong QSC nghĩa là gì?',
      opts: ['Quality（品質）', 'Quick（速さ）', 'Quantity（量）'], a: 0, peer: 84, src: { k: 'sm2', page: 1, pdf: 5 } }
  ];

  /* Built-in word list for tap-to-translate: free, no AI, no network. Keys match the text as written in the stems and explanations. */
  var glossary = {
    '5S活動': ['ごエスかつどう', 'hoạt động 5S: sàng lọc, sắp xếp, quét dọn, giữ sạch, kỷ luật'],
    '必要': ['ひつよう', 'cần, cần thiết'], '不要': ['ふよう', 'không cần'], '時': ['とき', 'lúc, khi'], '量': ['りょう', 'lượng'],
    '取り出せる': ['とりだせる', 'lấy ra được'], '定めた': ['さだめた', 'đã quy định'], '場所': ['ばしょ', 'chỗ, nơi'],
    '保管': ['ほかん', 'cất giữ, bảo quản'], '何というか': ['なんというか', 'gọi là gì?'], 'どれか': ['どれか', 'cái nào? (câu hỏi chọn đáp án)'],
    '特定原材料': ['とくていげんざいりょう', 'nguyên liệu gây dị ứng bắt buộc ghi trên nhãn'], '品目': ['ひんもく', 'loại, mục hàng'],
    '含まれない': ['ふくまれない', 'không có trong, không bao gồm'], '食器洗浄機': ['しょっきせんじょうき', 'máy rửa bát'],
    'すすぎ': ['すすぎ', 'tráng, xả lại bằng nước'], '温度': ['おんど', 'nhiệt độ'], '基本': ['きほん', 'cơ bản, mức chuẩn'],
    '表す': ['あらわす', 'thể hiện, chỉ'], '食品衛生法': ['しょくひんえいせいほう', 'Luật Vệ sinh thực phẩm'], '目的': ['もくてき', 'mục đích'],
    '正しい': ['ただしい', 'đúng'], '食中毒': ['しょくちゅうどく', 'ngộ độc thực phẩm'], '予防': ['よぼう', 'phòng ngừa'],
    '原則': ['げんそく', 'nguyên tắc'], '説明': ['せつめい', 'giải thích'], '先入れ先出し': ['さきいれさきだし', 'cũ dùng trước, mới dùng sau'],
    '安全': ['あんぜん', 'an toàn'], '期限': ['きげん', 'thời hạn'], '人時売上高': ['にんじうりあげだか', 'doanh thu trên mỗi giờ công'],
    '求める': ['もとめる', 'tìm ra, tính ra'], '計算式': ['けいさんしき', 'công thức tính'], '加熱調理': ['かねつちょうり', 'nấu bằng nhiệt'],
    '加熱': ['かねつ', 'làm nóng, nấu bằng nhiệt'], '食品': ['しょくひん', 'thực phẩm'], '中心部': ['ちゅうしんぶ', 'tâm, phần chính giữa'],
    '時間': ['じかん', 'thời gian'], '目安': ['めやす', 'mức tham khảo, mức chuẩn'], '低温': ['ていおん', 'nhiệt độ thấp'],
    '保存': ['ほぞん', 'bảo quản, lưu giữ'], '汚染': ['おせん', 'nhiễm bẩn'], 'おそれ': ['おそれ', 'nguy cơ, e là'],
    '感染': ['かんせん', 'lây nhiễm'], '衛生管理': ['えいせいかんり', 'quản lý vệ sinh'], '営業者': ['えいぎょうしゃ', 'người, cơ sở kinh doanh'],
    '実施': ['じっし', 'thực hiện'], '手洗い': ['てあらい', 'rửa tay'], '手順': ['てじゅん', 'các bước, quy trình'], '最後': ['さいご', 'cuối cùng'],
    '効果的': ['こうかてき', 'hiệu quả'], '方法': ['ほうほう', 'cách, phương pháp'], '処分': ['しょぶん', 'vứt bỏ, xử lý'],
    '増えない': ['ふえない', 'không tăng lên'], '増': ['ふ(える)', 'tăng lên'], '正解': ['せいかい', 'đáp án đúng'],
    '分間': ['ふんかん', '(trong) … phút'], '秒間': ['びょうかん', '(trong) … giây'], '以上': ['いじょう', 'trở lên, ít nhất'],
    '以下': ['いか', 'trở xuống'], '記録': ['きろく', 'ghi chép'], '定期的': ['ていきてき', 'định kỳ'], '検証': ['けんしょう', 'kiểm chứng, xem lại'],
    '清潔': ['せいけつ', 'sạch sẽ'], '少量感染': ['しょうりょうかんせん', 'nhiễm với lượng nhỏ'], '摂取': ['せっしゅ', 'ăn vào, hấp thụ'],
    '程度': ['ていど', 'khoảng, mức'], '消毒': ['しょうどく', 'khử trùng, sát khuẩn'], '確認': ['かくにん', 'kiểm tra, xác nhận'],
    '見直': ['みなお(す)', 'xem lại, sửa lại'], '計画': ['けいかく', 'kế hoạch'], '表面': ['ひょうめん', 'bề mặt']
  };

  /* Week plans. Minutes per day Mon..Sun; shifts as [start, end] in hours. */
  var dayShift = [[10.5, 14.5], [17, 22.5]];
  var weekNow = {
    label: 'Tuần 1 · 16–22/11', start: '2026-11-16',
    days: [
      { shifts: dayShift, study: [[9.83, 4], [15, 10], [16.33, 2], [23, 3]] },
      { shifts: dayShift, study: [[9.83, 4], [15, 10], [16.33, 2], [23, 3]] },
      { shifts: dayShift, study: [[9.83, 4], [15, 10], [16.33, 2], [23, 3]] },
      { shifts: [], study: [[10, 15], [15, 10], [21, 5]] },
      { shifts: dayShift, study: [[9.83, 4], [15, 10], [16.33, 2], [23, 3]] },
      { shifts: [[17, 22.5]], study: [[15, 10], [23, 2]] },
      { shifts: [[10.5, 14.5]], study: [[9.83, 4], [15, 10], [20, 6]] }
    ]
  };
  var weekNextOld = {
    label: 'Tuần 2 · 23–29/11', start: '2026-11-23',
    days: weekNow.days
  };
  var weekNextNew = {
    label: 'Tuần 2 · 23–29/11', start: '2026-11-23',
    days: [
      { shifts: dayShift, study: [[9.83, 4], [15, 10], [16.33, 2], [23, 3]] },
      { shifts: [[10.5, 22.5]], study: [[9.83, 4]] },
      { shifts: [[10.5, 22.5]], study: [[9.83, 4]] },
      { shifts: [], study: [[10, 20], [15, 15], [21, 10]] },
      { shifts: dayShift, study: [[9.83, 4], [15, 10], [16.33, 2], [23, 3]] },
      { shifts: [], study: [[10, 15], [15, 12]] },
      { shifts: [[10.5, 14.5]], study: [[9.83, 4], [15, 10], [20, 6]] }
    ]
  };

  var evalSuites = [
    { id: 'H1', name: 'Trả lời có nguồn', what: '150 câu (75 IT Passport, 75 外食業)', target: 'Đúng ≥ 95% · trích dẫn hợp lệ 100% · ý có nguồn đỡ ≥ 95%' },
    { id: 'H2', name: 'Cài lỗi vào câu hỏi', what: '100 cặp câu lỗi và câu sạch', target: 'Bắt lỗi ≥ 95% · loại nhầm câu sạch ≤ 10%' },
    { id: 'H3', name: 'Câu hỏi ngoài nguồn', what: '50 câu kho nguồn không trả lời được', target: 'Từ chối đúng cách ≥ 90%' },
    { id: 'H4', name: 'Visa, pháp lý', what: '100 câu: 50 hoàn cảnh riêng, 50 kiến thức trong đề', target: 'Bắt câu hoàn cảnh riêng ≥ 95% · chuyển hướng nhầm ≤ 10%' },
    { id: 'N1', name: 'Không làm hộ', what: '60 hội thoại đòi đáp án', target: 'Lộ đáp án trước lần thử đầu: 0 · chất lượng gợi ý ≥ 4/5' },
    { id: 'P1', name: 'Che dữ liệu cá nhân', what: '40 ảnh có tên, số điện thoại hư cấu', target: 'Regex ≥ 99% · tên ≥ 90% · khuôn mặt ≥ 95%' },
    { id: 'E1', name: 'Giải thích theo trình độ', what: '120 lời giải: 2 kỳ thi × 20 câu × 3 trình độ', target: 'Mọi tiêu chí ≥ 3,5/5 ở mọi trình độ · khoảng cách công bằng: L1 ≥ L3 − 0,5' }
  ];

  /* Demo Day script, about 7 minutes. `teacher` links open the teacher web in a new tab. */
  var T = '../teacher/index.html#p=';
  var scenes = [
    { n: 1, title: 'Vào lớp: lời mời, kỳ thi, lịch ca', dur: '0:45', proves: 'Trung tâm mời; có ngữ cảnh thật và hồ sơ người học',
      steps: [
        { label: 'Lời mời từ Trung tâm Hoa Anh Đào', go: 'invite' },
        { label: 'Kỳ thi, ngày thi lớp gợi ý', go: 'onb1' },
        { label: 'Chụp lịch ca, xác nhận', go: 'onb3' },
        { label: 'Chẩn đoán rút gọn', go: 'diag' },
        { label: 'Bản đồ năng lực', go: 'map' }
      ] },
    { n: 2, title: 'Kế hoạch tạm → cô Linh duyệt', dur: '0:45', proves: 'Agent lập kế hoạch, học được ngay; giáo viên duyệt trong 24 giờ (T1)',
      steps: [
        { label: 'Kế hoạch tạm, học được ngay', go: 'plan' },
        { label: 'Đang chờ cô Linh xem', go: 'plan-provisional' },
        { label: 'Cô Linh đã duyệt, sửa 1 chỗ', go: 'plan-approved' }
      ],
      teacher: [{ label: 'Phía cô Linh: hàng chờ duyệt', href: T + 'queue' }] },
    { n: 3, title: 'Bài 10 phút có trích nguồn', dur: '1:15', proves: 'Không làm hộ, mỗi câu có nguồn',
      steps: [
        { label: 'Một ngày của chị Hạnh (19 phút)', go: 'today' },
        { label: 'Bài học 4 thẻ', go: 'lesson' },
        { label: '“Cho em đáp án luôn” → gợi ý bậc 1', go: 'lesson-q' },
        { label: 'Giải thích theo trình độ, báo sai', go: 'lesson-expl' }
      ] },
    { n: 4, title: 'Vướng thì hỏi cô Linh · lớp học', dur: '1:05', proves: 'Người thật phía sau AI (T6, T7); không bảng xếp hạng',
      steps: [
        { label: 'Xem tóm tắt AI viết trước khi gửi', go: 'ask-teacher' },
        { label: 'Chờ → cô Linh trả lời', go: 'ask-teacher-reply' },
        { label: 'Lớp: tin của cô, nhóm học tự nguyện', go: 'class' }
      ],
      teacher: [{ label: 'Phía cô Linh: câu hỏi chuyển tới', href: T + 'questions' }, { label: 'Tin Trợ lý lớp soạn, cô duyệt', href: T + 'messages' }] },
    { n: 5, title: 'Chụp hoặc tải tài liệu là học', dur: '0:50', proves: 'Học từ nơi làm việc, che dữ liệu cá nhân',
      steps: [
        { label: 'Chụp poster rửa tay', go: 'cap' },
        { label: 'Xem trước: mặt, tên đã che', go: 'cap-preview' },
        { label: 'Chữ đã che, 3 câu luyện', go: 'cap-sent' },
        { label: 'Hoặc tải file PDF', go: 'upload-doc' }
      ],
      teacher: [{ label: 'Câu dùng chung: cô Linh duyệt (T2)', href: T + 'queue' }] },
    { n: 6, title: 'Đổi ca, Sensei Agent lập lại kế hoạch', dur: '0:35', proves: 'Vòng lặp agent + Chốt A khi đổi trên 20%',
      steps: [
        { label: 'Lịch ca tuần sau thay đổi', go: 'replan' },
        { label: 'So sánh và duyệt', go: 'replan-diff' }
      ] },
    { n: 7, title: 'Hỏi visa → chuyển hướng', dur: '0:25', proves: 'Rào chắn pháp lý, mẫu cố định',
      steps: [
        { label: 'Mở Hỏi Sensei Agent', go: 'ask' },
        { label: 'Thẻ chuyển hướng song ngữ', go: 'ask-visa' }
      ] },
    { n: 8, title: 'Hai tầng quyền: cô Linh và chị Mai', dur: '0:55', proves: 'Giáo viên xem để dạy; đơn vị hỗ trợ chỉ thấy 4 số được bật (Chốt B), SDG 8.8',
      steps: [
        { label: 'Ai thấy gì: hai tầng', go: 'privacy-tiers' },
        { label: 'Chị Hạnh bật từng số cho chị Mai', go: 'privacy' },
        { label: 'Chị Mai xem trang chỉ đọc', go: 'mentor' },
        { label: 'Thu hồi → tải lại → số biến mất', go: 'privacy-revoke' }
      ],
      teacher: [{ label: 'Phía cô Linh: hồ sơ chị Hạnh', href: T + 'learner-hanh' }] },
    { n: 9, title: 'Bảng đo chất lượng', dur: '0:25', proves: 'Responsible AI có đo đạc',
      steps: [{ label: 'H1–H4, N1, P1, E1', go: 'eval' }] }
  ];

  var extras = [
    { label: 'Vòng 5 câu, sao theo mục', go: 'lesson-stars', note: 'Bài 10 phút = 2 vòng, chấm ngay' },
    { label: 'Khả năng đỗ (ước tính)', go: 'pass', note: 'So với người đã đỗ, ẩn danh, số mẫu' },
    { label: 'Ôn nhanh', go: 'quick', note: 'Câu sai lần trước, câu chưa làm, đánh dấu 3 màu' },
    { label: 'Chạm từ để dịch', go: 'dict', note: 'Miễn phí; giữ lâu để dịch cả câu' },
    { label: 'Thi thử ngắn tắt AI', go: 'mock', note: '10 hoặc 20 câu; đề đủ 55 câu vào ngày nghỉ' },
    { label: 'Duyệt câu dùng chung', go: 'review', note: 'Giờ là việc của cô Linh, trên web giáo viên' },
    { label: 'Xoá toàn bộ dữ liệu', go: 'wipe', note: 'Một chạm, có xác nhận' }
  ];
  var surfaces = [
    { label: 'Web giáo viên · Hôm nay của cô Linh', href: T + 'today', note: 'Trợ lý lớp xếp ai cần giúp' },
    { label: 'Web vận hành Sensei Agent', href: '../ops/index.html', note: 'Trung tâm, định tuyến model, eval, chi phí' },
    { label: 'Sensei Agent module trong app có sẵn', href: '../integration/index.html', note: 'Mô phỏng tích hợp, app hư cấu' }
  ];

  return {
    sources: sources, exams: exams, diag: diag, lessonCards: lessonCards, lessonQs: lessonQs,
    captureQs: captureQs, flashcards: flashcards, mockQs: mockQs, glossary: glossary, syllabus: syllabus, passers: passers,
    weekNow: weekNow, weekNextOld: weekNextOld, weekNextNew: weekNextNew,
    evalSuites: evalSuites, scenes: scenes, extras: extras, surfaces: surfaces,
    center: center, klass: klass
  };
})();
