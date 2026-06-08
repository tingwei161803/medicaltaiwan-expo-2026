/* =========================================================================
   Medical Taiwan 2026 · data.js

   ONE shared data file, loaded by every page (.html). The whole multi-page
   site is config-driven from two globals:

     window.SITE_META  = { title:{en,zh}, subtitle:{en,zh} }
     window.SITE_PAGES = [ { slug, layout, icon, title:{en,zh}, ...layoutData } ]

   Each entry of SITE_PAGES becomes one real .html page:
     slug "home" -> index.html  (layout "hub"),  slug "x" -> x.html
   The cross-page nav lists every page in this order. app.js reads
   document.body.dataset.page, finds the matching entry, and renders
   entry.layout into <main id="page"> using that entry's own data.

   非官方整理:資料整理自官方網站與公開報導,展期、攤位、活動細節以官方公告為準。
   ========================================================================= */

window.SITE_META = {
  title:    { en: "Medical Taiwan 2026", zh: "Medical Taiwan 2026" },
  subtitle: { en: "Taiwan International Medical & Healthcare Expo — a visitor guide.",
              zh: "台灣國際醫療暨健康照護展 — 參觀導覽。" }
  /* footer 由 shell.js 自動渲染成「© <年份> <網站標題>」 */
};

window.SITE_PAGES = [

  /* ===================== HOME / HUB ===================== */
  {
    slug: "home", layout: "hub", icon: "home",
    title:    { en: "Overview", zh: "展會總覽" },
    subtitle: {
      en: "The 20th Taiwan International Medical & Healthcare Expo (Medical Taiwan) — Asia-Pacific's benchmark medical fair, focused on the greater-health industry. June 25–27, 2026 at TWTC Hall 1, Taipei. Three pillars: Innovative Care, Smart Healthcare, and the Medical Supplies Hub.",
      zh: "台灣國際醫療暨健康照護展(Medical Taiwan)第 20 屆 — 亞太指標性醫療展,聚焦大健康產業。2026 年 6 月 25–27 日於台北世貿一館登場。三大主軸:創新長照、智慧醫療、醫材廊道。"
    },
    stats: [
      { value: 20,    label: { en: "Edition", zh: "屆次" } },
      { value: 330,   label: { en: "Exhibitors (approx.)", zh: "參展商(約)" } },
      { value: 530,   label: { en: "Booths", zh: "展位數" } },
      { value: 9,     label: { en: "Exhibit zones", zh: "主題展區" } },
      { value: 1000,  label: { en: "Overseas buyers (approx.)", zh: "海外買主(約)" } },
      { value: 10000, label: { en: "Pro visitors (approx.)", zh: "專業觀眾(約)" } }
    ]
  },

  /* ===================== ABOUT / BENTO HIGHLIGHTS ===================== */
  {
    slug: "about", layout: "bento", icon: "auto_awesome",
    title:    { en: "Highlights", zh: "展會亮點" },
    subtitle: { en: "What makes the 2026 edition worth a visit, at a glance.",
                zh: "一眼看懂 2026 年這一屆的看點。" },
    tiles: [
      { size: "lg", accent: true, icon: "category", value: "3",
        title: { en: "Three pillars", zh: "三大主軸" },
        body:  { en: "Innovative Care · Smart Healthcare · Medical Supplies Hub — the spine of the 2026 show floor.",
                 zh: "創新長照 · 智慧醫療 · 醫材廊道 —— 構成 2026 年展場的三大主軸。" } },
      { size: "tall", icon: "groups", value: "330",
        title: { en: "Scale", zh: "參展規模" },
        body:  { en: "Around 330 exhibitors in 530 booths, ~1,000 overseas buyers and ~10,000 professional visitors.",
                 zh: "約 330 家參展商、530 個展位,迎接約 1,000 名海外買主與 10,000 名專業觀眾。" } },
      { size: "sm", icon: "workspace_premium", value: "20",
        title: { en: "20th edition", zh: "第 20 屆" },
        body:  { en: "Medical Taiwan reaches its 20th year.", zh: "Medical Taiwan 邁入第 20 屆。" } },
      { size: "sm", icon: "event", value: "3",
        title: { en: "3 show days", zh: "展期 3 天" },
        body:  { en: "Jun 25–27 · TWTC Hall 1.", zh: "6/25–27 · 台北世貿一館。" } },
      { size: "wide", icon: "fiber_new",
        title: { en: "Two brand-new zones", zh: "兩大全新專區" },
        body:  { en: "Sports Medicine and Precision Medicine debut alongside the established pavilions.",
                 zh: "運動醫學與精準醫療兩大新展區首度登場,與既有專館並列。" } },
      { size: "md", accent: true, icon: "trending_up", value: "$103.7B",
        title: { en: "Precision-medicine market", zh: "精準醫療商機" },
        body:  { en: "Projected global precision-medicine market by 2032.",
                 zh: "2032 年全球精準醫療市場預估規模。" } },
      { size: "md", icon: "smart_toy",
        title: { en: "AI Smart Healthcare Pavilion", zh: "AI 智慧醫療主題館" },
        body:  { en: "Medical-device association × ITRI: smart operating rooms, ICU and image analysis.",
                 zh: "醫材公會攜手工研院,聚焦智慧手術室、ICU 與影像分析。" } },
      { size: "sm", icon: "public", value: "1,000+",
        title: { en: "Overseas buyers", zh: "海外買主" },
        body:  { en: "International buyers expected on-site.", zh: "約千名國際買主到場洽談。" } },
      { size: "sm", icon: "restaurant",
        title: { en: "Concurrent: Food Taipei", zh: "同期:Food Taipei" },
        body:  { en: "Food Taipei runs alongside, with a Healthy Food zone.",
                 zh: "台北國際食品展同期登場,設「食在健康館」。" } }
    ]
  },

  /* ===================== PAVILIONS / GALLERY ===================== */
  {
    slug: "pavilions", layout: "gallery", icon: "view_quilt",
    title:    { en: "Exhibit Zones", zh: "主題展區" },
    subtitle: { en: "Nine specialized zones, grouped under the three pillars. Tap a card for detail.",
                zh: "九大主題展區,依三大主軸分組。點卡片看詳情。" },
    categories: [
      { key: "care",  en: "Innovative Care",     zh: "創新長照" },
      { key: "smart", en: "Smart Healthcare",    zh: "智慧醫療" },
      { key: "hub",   en: "Medical Supplies Hub", zh: "醫材廊道" }
    ],
    items: [
      { slug: "smart-ltc", category: "care",
        title:   { en: "Smart Long-term Care", zh: "智慧長照" },
        summary: { en: "Home care, monitoring and resource-sharing platforms.",
                   zh: "居家照護、智慧監測與資源共享平台。" },
        tags: ["長照", "居家照護", "監測"],
        overview:{ en: "Integrated hardware-and-software solutions for community and home care — home-based medical devices, smart monitoring systems and resource-sharing platforms that extend care beyond the hospital.",
                   zh: "結合軟硬體的社區與居家照護解決方案 —— 從居家醫療設備、智慧監測系統到資源共享平台,把照護延伸到醫院之外。" } },
      { slug: "assistive", category: "care",
        title:   { en: "Assistive Devices & Orthotics", zh: "智慧輔具與輔助器材" },
        summary: { en: "Mobility, rehab and daily-living assistive technology.",
                   zh: "行動、復健與日常生活輔具。" },
        tags: ["輔具", "復健", "行動"],
        overview:{ en: "Wheelchairs, mobility aids, rehabilitation equipment and assistive products that support independent living and ageing-in-place.",
                   zh: "輪椅、行動輔具、復健器材與生活輔助產品,支持自立生活與在地老化。" } },
      { slug: "sports-med", category: "care",
        title:   { en: "Sports Medicine (new)", zh: "運動醫學(新增)" },
        summary: { en: "Injury prevention, rehabilitation and recovery tech.",
                   zh: "運動傷害預防、復健與恢復科技。" },
        tags: ["新專區", "運動醫學", "復健"],
        overview:{ en: "A brand-new 2026 zone covering prevention and rehabilitation technologies — from movement assessment to recovery devices bridging clinical care and athletic performance.",
                   zh: "2026 年全新登場的專區,涵蓋運動傷害的預防與復健科技 —— 從動作評估到恢復裝置,串連臨床照護與運動表現。" } },
      { slug: "ai-health", category: "smart",
        title:   { en: "AI & Smart Healthcare", zh: "AI 智慧醫療" },
        summary: { en: "AI-assisted diagnosis, smart OR/ICU, imaging analysis.",
                   zh: "AI 輔助診斷、智慧手術室/ICU、影像分析。" },
        tags: ["AI", "智慧手術室", "影像"],
        overview:{ en: "The AI Smart Healthcare Pavilion — co-staged by the medical-device industry association and ITRI — spotlights smart operating rooms, ICU solutions and clinical image analysis, plus hospital information-system integration.",
                   zh: "AI 智慧醫療主題館由醫材公會攜手工研院聯合展出,聚焦智慧手術室、ICU 解決方案與臨床影像分析,並涵蓋醫院資訊系統整合。" } },
      { slug: "precision", category: "smart",
        title:   { en: "Precision Medicine (new)", zh: "精準醫療(新增)" },
        summary: { en: "Pharma R&D, regenerative medicine, clinical-trial services.",
                   zh: "新藥研發、再生醫療與臨床試驗服務。" },
        tags: ["新專區", "精準醫療", "再生醫療"],
        overview:{ en: "A new 2026 zone spotlighting pharmaceutical development, regenerative medicine and clinical-trial services — riding a global precision-medicine market projected to reach US$103.7 billion by 2032.",
                   zh: "2026 年新設展區,聚焦新藥開發、再生醫療與臨床試驗服務 —— 對應 2032 年預估達 1,037 億美元的全球精準醫療市場。" } },
      { slug: "mnovator", category: "smart",
        title:   { en: "M-novator Startup Zone", zh: "M-novator 新創專區" },
        summary: { en: "10 startups from 5 countries showcasing breakthrough tech.",
                   zh: "集結 5 國 10 家新創的突破性技術。" },
        tags: ["新創", "穿戴", "遠距"],
        overview:{ en: "A startup showcase gathering 10 ventures from 5 countries — early cancer detection, contactless ECG, AI wearable health-management services and remote wound-imaging analysis.",
                   zh: "集結來自 5 國 10 家新創的展示專區 —— 涵蓋癌症早期檢測、非接觸式心電圖、AI 穿戴裝置健康管理,以及傷口照護遠距影像分析。" } },
      { slug: "equipment", category: "hub",
        title:   { en: "Hospital Equipment & Consumables", zh: "醫療器材與耗材" },
        summary: { en: "Hospital equipment and medical consumables.",
                   zh: "醫院設備與醫療耗材。" },
        tags: ["醫材", "耗材", "設備"],
        overview:{ en: "The core of the Medical Supplies Hub — hospital equipment and the consumables that keep wards, clinics and operating rooms running.",
                   zh: "醫材廊道的核心 —— 醫院設備與維持病房、診所、手術室運作的各式醫療耗材。" } },
      { slug: "components", category: "hub",
        title:   { en: "Components & Accessories", zh: "醫療零組件與配件" },
        summary: { en: "Medical components, parts and accessories supply chain.",
                   zh: "醫療零組件、零件與配件供應鏈。" },
        tags: ["供應鏈", "零組件", "OEM"],
        overview:{ en: "Upstream supply-chain players — medical components, parts and accessories for device makers and OEM/ODM partners.",
                   zh: "上游供應鏈 —— 提供給醫材製造商與 OEM/ODM 夥伴的醫療零組件、零件與配件。" } },
      { slug: "international", category: "hub",
        title:   { en: "International Pavilions", zh: "國際館" },
        summary: { en: "Overseas exhibitors and country pavilions.",
                   zh: "海外參展商與國家主題館。" },
        tags: ["國際", "國家館", "進出口"],
        overview:{ en: "Country and regional pavilions bringing overseas exhibitors to meet Taiwanese and Asia-Pacific buyers face to face.",
                   zh: "由各國家與區域組成的主題館,把海外參展商帶到現場,與台灣及亞太買主面對面洽談。" } }
    ]
  },

  /* ===================== EXHIBITORS / TABLE ===================== */
  {
    slug: "exhibitors", layout: "table", icon: "storefront",
    title:    { en: "Featured Exhibitors", zh: "焦點展商" },
    subtitle: { en: "A selection of notable exhibitors and their highlights. The full ~330-company directory and floor plan are on the official site. Sort by any column; filter by zone.",
                zh: "精選代表性展商與其亮點。完整約 330 家名單與平面圖請見官網。可點欄位排序、依展區篩選。" },
    columns: [
      { key: "company", label: { en: "Company", zh: "公司" }, type: "text" },
      { key: "zone",    label: { en: "Zone", zh: "展區" }, type: "tag", filter: true },
      { key: "highlight", label: { en: "Highlight", zh: "技術亮點" }, type: "text" }
    ],
    rows: [
      { company: { en: "EBM Technologies (商之器)", zh: "商之器科技" },
        zone:    { en: "AI & Smart Healthcare", zh: "AI 智慧醫療" },
        highlight:{ en: "Advanced medical-imaging software (PACS / cloud imaging).", zh: "高階醫療影像軟體(PACS / 雲端影像)。" } },
      { company: { en: "Point Robotics (炳碩生醫)", zh: "炳碩生醫" },
        zone:    { en: "AI & Smart Healthcare", zh: "AI 智慧醫療" },
        highlight:{ en: "Surgical navigation and surgery-assist robotics.", zh: "手術導航系統與手術輔助機器人。" } },
      { company: { en: "優必達", zh: "優必達" },
        zone:    { en: "AI & Smart Healthcare", zh: "AI 智慧醫療" },
        highlight:{ en: "Artificial-intelligence and robotics technology.", zh: "人工智慧與機器人技術。" } },
      { company: { en: "HIWIN (上銀)", zh: "上銀科技" },
        zone:    { en: "Sports Medicine", zh: "運動醫學" },
        highlight:{ en: "Rehabilitation-training robotics.", zh: "復健訓練機器人。" } },
      { company: { en: "Scivision Biotech (科妍)", zh: "科妍生技" },
        zone:    { en: "Medical Supplies Hub", zh: "醫材廊道" },
        highlight:{ en: "Bio-implant materials (e.g. hyaluronic acid).", zh: "生物植入醫材(如玻尿酸)。" } },
      { company: { en: "華新醫材", zh: "華新醫材" },
        zone:    { en: "Medical Supplies Hub", zh: "醫材廊道" },
        highlight:{ en: "Wound care and bio-implant medical materials.", zh: "創傷照護與生物植入醫材。" } },
      { company: { en: "康力得生技", zh: "康力得生技" },
        zone:    { en: "Medical Supplies Hub", zh: "醫材廊道" },
        highlight:{ en: "Wound care and bio-implant medical materials.", zh: "創傷照護與生物植入醫材。" } }
    ]
  },

  /* ===================== SCHEDULE / TIMELINE ===================== */
  {
    slug: "schedule", layout: "timeline", icon: "calendar_month",
    title:    { en: "Schedule & Events", zh: "展期與活動" },
    subtitle: { en: "Show days and the main forums. Exact forum times follow the official announcement (expected May 2026).",
                zh: "展期與重點論壇。論壇確切時間以官網公告為準(預計 2026 年 5 月公布)。" },
    events: [
      { date:  { en: "2026.06.25 (Thu)", zh: "2026.06.25(四)" },
        title: { en: "Day 1 · Opening", zh: "Day 1 · 開幕日" },
        body:  { en: "09:30–17:30. Show opens; international buyer matchmaking and new-product launches kick off.",
                 zh: "09:30–17:30。展覽開幕,國際買主洽談與新品發表同步啟動。" } },
      { date:  { en: "During the show", zh: "展期間" },
        title: { en: "International Trend Forum", zh: "國際趨勢論壇" },
        body:  { en: "Theme: Hospital at Home (HaH) — the global shift toward home-based acute care.",
                 zh: "主題:在宅醫療(Hospital at Home, HaH)趨勢 —— 全球將急性照護帶回家中的轉變。" } },
      { date:  { en: "2026.06.26 (Fri)", zh: "2026.06.26(五)" },
        title: { en: "Day 2 · Domestic Market Forum", zh: "Day 2 · 國內市場論壇" },
        body:  { en: "09:30–17:30. Theme: implementing smart healthcare and sustainable health — AI for precise detection, clinical workload relief and long-term care.",
                 zh: "09:30–17:30。主軸:智慧醫療落實與健康永續 —— AI 於精準偵測、臨床減壓與長照應用。" } },
      { date:  { en: "During the show", zh: "展期間" },
        title: { en: "Long-term Care Forum", zh: "長照論壇" },
        body:  { en: "Industry leaders and experts share innovative care models and hands-on experience.",
                 zh: "業界專家分享創新照護模式與實務經驗。" } },
      { date:  { en: "During the show", zh: "展期間" },
        title: { en: "RX FOR FUTURE Focus Forum", zh: "焦點論壇 · RX FOR FUTURE" },
        body:  { en: "A focus forum co-hosted with Business Weekly on the future of the healthcare industry.",
                 zh: "與《商業周刊》合作的焦點論壇,探討醫療產業的未來趨勢。" } },
      { date:  { en: "2026.06.27 (Sat)", zh: "2026.06.27(六)" },
        title: { en: "Day 3 · Closing", zh: "Day 3 · 閉幕日" },
        body:  { en: "09:30–16:30. Final visiting day.", zh: "09:30–16:30。最後參觀日。" } }
    ]
  },

  /* ===================== FORUM / ARTICLE ===================== */
  {
    slug: "forum", layout: "article", icon: "forum",
    title:    { en: "Forums", zh: "重點論壇" },
    subtitle: { en: "The professional forum programme around Medical Taiwan 2026.",
                zh: "Medical Taiwan 2026 期間的專業論壇規劃。" },
    sections: [
      { id: "overview", heading: { en: "Overview", zh: "論壇總覽" }, blocks: [
        { type: "p", text: { en: "Beyond the show floor, Medical Taiwan 2026 runs a professional forum programme spanning international trends, the domestic market, long-term care and a flagship focus forum. Together they frame how AI, home-based care and precision medicine are reshaping healthcare delivery.",
                              zh: "除了展場,Medical Taiwan 2026 規劃了一系列專業論壇,橫跨國際趨勢、國內市場、長照與焦點論壇。整體勾勒出 AI、在宅醫療與精準醫療如何重塑醫療服務樣貌。" } },
        { type: "p", text: { en: "Forum schedules and registration are published on the official site (expected May 2026); the lines below summarise the announced themes.",
                              zh: "論壇議程與報名於官網公布(預計 2026 年 5 月);以下整理目前已揭露的主題方向。" } }
      ] },
      { id: "intl", heading: { en: "International Trend Forum — Hospital at Home", zh: "國際趨勢論壇 — 在宅醫療" }, blocks: [
        { type: "p", text: { en: "The international forum centres on Hospital at Home (HaH): delivering hospital-grade acute care in the patient's own home. It looks at the care models, devices and remote-monitoring infrastructure that make HaH viable, and what it means for an ageing Asia-Pacific.",
                              zh: "國際趨勢論壇聚焦「在宅醫療(Hospital at Home, HaH)」:把醫院等級的急性照護帶進病人家中。探討讓 HaH 可行的照護模式、設備與遠距監測基礎建設,以及對高齡化亞太的意義。" } },
        { type: "ul", items: { en: ["Home-based acute and post-acute care models", "Remote monitoring and connected devices", "Reimbursement and operational challenges"],
                               zh: ["居家急性與急性後期照護模式", "遠距監測與連網裝置", "給付與營運上的挑戰"] } }
      ] },
      { id: "domestic", heading: { en: "Domestic Market Forum — Smart Healthcare & Sustainable Health", zh: "國內市場論壇 — 智慧醫療落實與健康永續" }, blocks: [
        { type: "p", text: { en: "The domestic forum tackles turning smart-healthcare promise into everyday practice, with sustainability in mind. Sessions examine AI for precise detection, AI that relieves clinical workload, and AI applied to long-term care.",
                              zh: "國內市場論壇處理如何把智慧醫療的潛力落實為日常實務,並兼顧永續。場次涵蓋 AI 於精準偵測、AI 為臨床減壓,以及 AI 在長照的應用。" } },
        { type: "quote", text: { en: "From pilot to practice: AI earns its place when it lightens clinicians' load and reaches patients at home.",
                                 zh: "從試點到日常:當 AI 真正減輕臨床負擔、並觸及在宅病人,它才站得住腳。" } }
      ] },
      { id: "ltc", heading: { en: "Long-term Care Forum", zh: "長照論壇" }, blocks: [
        { type: "p", text: { en: "The long-term care forum gathers industry leaders and experts to share innovative care models and practical, on-the-ground experience — connecting the Smart Long-term Care and Assistive Devices zones on the show floor.",
                              zh: "長照論壇邀集業界領袖與專家,分享創新照護模式與第一線實務經驗 —— 與展場上的智慧長照、智慧輔具展區相互呼應。" } }
      ] },
      { id: "rx", heading: { en: "RX FOR FUTURE Focus Forum", zh: "焦點論壇 RX FOR FUTURE" }, blocks: [
        { type: "p", text: { en: "A flagship focus forum co-hosted with Business Weekly looks ahead at where the healthcare industry is heading — strategy, investment and the technologies that will define the next decade of care.",
                              zh: "與《商業周刊》合作的焦點論壇,前瞻醫療產業的走向 —— 策略、投資,以及將定義下一個十年照護的技術。" } },
        { type: "p", text: { en: "Official forum page: bw.businessweekly.com.tw/event/2026/MedicalTaiwanForum",
                             zh: "焦點論壇官方頁面:bw.businessweekly.com.tw/event/2026/MedicalTaiwanForum" } }
      ] }
    ]
  },

  /* ===================== VISIT / FAQ ===================== */
  {
    slug: "visit", layout: "faq", icon: "info",
    title:    { en: "Visitor Info", zh: "參觀資訊" },
    subtitle: { en: "Dates, location, transport, registration and on-site services. Search the questions below.",
                zh: "日期、地點、交通、報名與現場服務。可搜尋下方問題。" },
    qa: [
      { q: { en: "When is it, and what are the opening hours?", zh: "展覽日期與開放時間?" },
        a: { en: "June 25–27, 2026. Thu & Fri 09:30–17:30; Sat 09:30–16:30.",
             zh: "2026 年 6 月 25–27 日。週四、週五 09:30–17:30;週六 09:30–16:30。" } },
      { q: { en: "Where is the venue?", zh: "展覽地點在哪裡?" },
        a: { en: "Taipei World Trade Center (TWTC) Hall 1, No. 5, Sec. 5, Xinyi Rd., Xinyi District, Taipei.",
             zh: "台北世貿一館(TWTC Hall 1),臺北市信義區信義路五段 5 號。" } },
      { q: { en: "How do I get there?", zh: "怎麼前往(交通)?" },
        a: { en: "MRT Red Line to Taipei 101/World Trade Center Station (R03), Exit 1 or 5. By HSR, take it to Taipei Station then transfer to the MRT.",
             zh: "搭乘捷運紅線至「台北101/世貿」站(R03),由出口 1 或 5 步行可達。搭高鐵者請至台北站轉乘捷運。" } },
      { q: { en: "How do I get in / register?", zh: "如何入場 / 報名?" },
        a: { en: "Free online pre-registration on the official site gives you a QR-code badge; on-site registration is also available at the counter. This is a professional B2B trade fair.",
             zh: "於官網免費線上預先登記可取得 QR Code 入場證;現場亦設報名櫃台。本展為專業 B2B 商貿展。" } },
      { q: { en: "Is there fast-track entry for healthcare professionals?", zh: "醫事人員可以快速入場嗎?" },
        a: { en: "Yes. Healthcare professionals (physicians, nurses, therapists, etc.) can submit the designated form for expedited entry with ID verification.",
             zh: "可以。醫事人員(醫師、護理師、治療師等)可填寫指定表單,經證件查驗後快速入場。" } },
      { q: { en: "Can children under 12 enter?", zh: "12 歲以下兒童可以進場嗎?" },
        a: { en: "No. During June 25–27, 2026, children aged 12 and under are not admitted to the show floor.",
             zh: "不開放。2026 年 6 月 25 至 27 日展覽期間,不開放 12 歲(含)以下兒童進入展場。" } },
      { q: { en: "Is there accessible / priority entry?", zh: "有無障礙與優先入場服務嗎?" },
        a: { en: "Yes. Persons with disabilities, wheelchair users and visitors aged 65+ receive priority entry, each with one companion.",
             zh: "有。身心障礙者、輪椅使用者與 65 歲以上長者可享優先入場,並各得一名陪同者。" } },
      { q: { en: "How do group visits work?", zh: "團體參觀怎麼辦理?" },
        a: { en: "Groups of 10 or more, and academic groups, can arrange a visit by emailing medicaltaiwan@taitra.org.tw.",
             zh: "10 人(含)以上團體與學術團體,可寄信至 medicaltaiwan@taitra.org.tw 安排參觀。" } },
      { q: { en: "What about parking?", zh: "開車前往的停車資訊?" },
        a: { en: "On-site parking is about NT$100/hour (08:00–22:00); additional overnight fees apply.",
             zh: "現場停車約每小時 NT$100(08:00–22:00),逾時/過夜另計費用。" } },
      { q: { en: "What on-site services are available?", zh: "現場有哪些服務設施?" },
        a: { en: "Accessible restrooms (near Gate 6, 1F), convenience stores and restaurants (2F), luggage storage (B1), mobile charging stations (B1) and a Muslim prayer room (7F).",
             zh: "無障礙廁所(1 樓 6 號門附近)、便利商店與餐廳(2 樓)、行李寄放(B1)、手機充電站(B1),以及穆斯林祈禱室(7 樓)。" } },
      { q: { en: "How do I contact the organizer?", zh: "聯絡方式?" },
        a: { en: "TAITRA: phone +886-2-2725-5200, email medicaltaiwan@taitra.org.tw, official site www.medicaltaiwan.com.tw.",
             zh: "外貿協會(TAITRA):電話 02-2725-5200,信箱 medicaltaiwan@taitra.org.tw,官網 www.medicaltaiwan.com.tw。" } },
      { q: { en: "Are there concurrent shows?", zh: "同期還有其他展覽嗎?" },
        a: { en: "Yes — Food Taipei runs alongside, including a Healthy Food zone focused on health foods and precision nutrition.",
             zh: "有 —— 台北國際食品展(Food Taipei)同期舉辦,並設「食在健康館」,聚焦保健食品與精準營養。" } }
    ]
  }
];
