# Medical Taiwan 2026 · 台灣國際醫療暨健康照護展 導覽

> 把第 20 屆台灣國際醫療暨健康照護展(Medical Taiwan 2026)的官方資訊,整理成一個多頁、可互動、中英雙語的靜態導覽站 —— 從展會總覽、展會亮點、九大主題展區、醫療 AI 廠商深度頁,到焦點展商、展期活動、重點論壇、參觀路線、參觀資訊,以及一整牆醫療主題的休閒小遊戲。

本站把官方網站與公開報導裡關於 Medical Taiwan 2026 的內容,整理成 10 個彼此串連的頁面(含 14 款瀏覽器小遊戲的「遊戲中心」)。純 HTML / CSS / JS、零建置,可直接部署到 GitHub Pages。展期、攤位、活動與報名等細節以官方公告為準。

---

## 🔗 線上版 / Live

| | |
|---|---|
| 🌐 網站 | <https://tingwei161803.github.io/medicaltaiwan-expo-2026/> |

頂部的**跨頁導覽列**可在 10 頁之間切換;每頁皆支援中文 / English 與深 / 淺色,設定跨頁延續,右上角並有到 GitHub 點星星的連結。展區與醫療 AI 廠商頁可用 `#<slug>` 深連結(例如 [`…/medical-ai.html#ebm`](https://tingwei161803.github.io/medicaltaiwan-expo-2026/medical-ai.html#ebm))。

---

## 📄 頁面 / Pages

| 頁面 | 檔案 | 版型 | 內容 |
|------|------|------|------|
| 展會總覽 | `index.html` | hub | 一句話定位、關鍵數字(屆次 / 展商 / 展位 / 展區 / 買主 / 觀眾)+ 通往各頁的入口卡 |
| 展會亮點 | `about.html` | bento | 三大主軸、參展規模、兩大新專區、AI 智慧醫療主題館、精準醫療商機、同期 Food Taipei |
| 主題展區 | `pavilions.html` | gallery | 九大主題展區,依三大主軸篩選 + 搜尋,點卡片看詳情 |
| 醫療 AI 廠商 | `medical-ai.html` | medical | 聚焦醫療 AI 的廠商、主題館與論壇/趨勢主題(含生成式 AI/LLM、代理型 AI),依次分類篩選 + 搜尋;點開看「公司簡介 / 醫療 AI 切入點 / 技術與產品 / 應用場景」多面向介紹 + 展區位置 |
| 參展商名錄 | `exhibitors.html` | table | **整理自官方名單的全部約 276 家參展商**,可依名稱/產品搜尋、依展區篩選(19 區)、點欄位排序 |
| 展期與活動 | `schedule.html` | timeline | 6/25–27 三天展期與重點論壇時間軸 |
| 重點論壇 | `forum.html` | article | 國際趨勢論壇(在宅醫療)、國內市場論壇、長照論壇、RX FOR FUTURE,附目錄與閱讀進度 |
| 參觀路線 | `routes.html` | routes | 醫療 AI 參觀動線:7 條預設路線(影像、機器人、AI 平台、生成式 AI/LLM、代理型 AI、前沿 AI、新創)或自由組合次分類,即時產生依展區分組的可走動線 |
| 參觀資訊 | `visit.html` | faq | 日期時間、地點交通、報名與快速入場、停車、現場服務與聯絡的常見問答(可搜尋) |
| 遊戲中心 | `games.html` | arcade | 14 款醫療主題休閒小遊戲(反應力、記憶、知識問答、貪食蛇、2048、拼圖、呼吸節律…),依分類篩選、點卡片進入遊玩;全部在瀏覽器內執行、記錄最佳成績 |

> 三大主軸:創新長照、智慧醫療、醫材廊道。九大展區:智慧長照、智慧輔具、運動醫學、AI 智慧醫療、精準醫療、M-novator 新創、醫療器材與耗材、零組件與配件、國際館。

---

## ✨ 功能特色

- 🧭 **跨頁導覽列** — 10 頁一鍵切換,自動高亮目前頁
- 🎮 **遊戲中心** — 14 款醫療主題小遊戲(反應力 / 記憶 / 知識問答 / 貪食蛇 / 2048 / 拼圖 / 呼吸節律…),純前端、可離線、`localStorage` 記錄最佳成績;採「外掛式」契約,每款遊戲是一支自我註冊到 `window.GAMES`、自帶 scoped CSS 的獨立模組,新增一款只需丟一支 `assets/games/<id>.js`
- 🌏 **全頁雙語** — 中文 / English 一鍵切換,卡片、詳情、導覽與靜態文案整頁同步、無殘留
- 🌗 **深 / 淺色模式** — 醫療專業藍綠(teal)配色,`localStorage` 記憶,跨頁延續
- 🩺 **醫療 AI 深度頁** — 次分類篩選(含生成式 AI/LLM、代理型 AI)、廠商卡片亮點,點開看「公司簡介 / 醫療 AI 切入點 / 技術與產品 / 應用場景」多面向雙語介紹 + 展區位置
- 🗂️ **全參展商名錄** — 整理自官網的**全部約 276 家**參展商,可依名稱/產品即時搜尋、依展區(19 區)篩選、點欄位排序
- 🗺️ **參觀路線產生器** — 7 條預設路線(含生成式 AI/LLM、代理型 AI、前沿 AI)或自由組合次分類,即時產生依展區分組、可走的醫療 AI 參觀動線
- 🔍 **搜尋 / 篩選** — 展區與醫療 AI 頁即時搜尋 + 分類篩選;名錄頁可全文搜尋、依展區篩選、排序;論壇頁可搜尋問答
- 🗂️ **詳情對話框 + 深連結** — 卡片點開看完整介紹,`#<slug>` 可直接分享
- ⭐ **GitHub 星星連結** — 右上角一鍵到 GitHub 點星星,線上版顯示即時星數
- 📊 **多種版型** — hub / bento / gallery / medical / table / timeline / article / routes / faq / arcade,依每頁資料形狀呈現
- 📱 **響應式** — 手機 / 平板 / 桌機皆適配,375px 無水平溢出
- ⚡ **純靜態** — 無後端、載入快、可離線瀏覽;含 SEO / Open Graph / JSON-LD(Event)

---

## 📂 結構 / Structure

```
medicaltaiwan-expo-2026/
├── index.html        # 展會總覽(hub)
├── about.html        # 展會亮點(bento)
├── pavilions.html    # 主題展區(gallery)
├── medical-ai.html   # 醫療 AI 廠商(medical)
├── exhibitors.html   # 參展商名錄(table,載入 data/exhibitors.js)
├── schedule.html     # 展期與活動(timeline)
├── forum.html        # 重點論壇(article)
├── routes.html       # 參觀路線(routes)
├── visit.html        # 參觀資訊(faq)
├── games.html        # 遊戲中心(arcade,載入 assets/games/*.js)
├── assets/
│   ├── styles.css    # MD3 設計 token(淺/深,醫療藍綠)+ 全部版型樣式
│   ├── games.css     # 遊戲中心外殼(卡片牆 / 遊戲舞台)+ 共享遊戲 UI 工具 class(.gu-*)
│   ├── shell.js      # 共用 chrome:appbar(含 GitHub 星數)/ 跨頁 nav / footer / dialog / 語言+主題狀態
│   ├── app.js        # 版型引擎:依 body[data-page] 選 renderer 渲染進 #page(含 arcade)
│   └── games/        # 小遊戲模組:每支自我註冊到 window.GAMES、自帶 scoped CSS
│       ├── _CONTRACT.md   # 遊戲模組契約(新增遊戲的規格)
│       ├── reaction.js    # 急診反應力(參考實作)
│       └── …             # memory / whack / quiz / simon / sort / snake / cells2048 /
│                          #   steady / breath / rhythm / slidepuzzle / typer / guess
├── data/
│   ├── data.js       # 主資料檔:SITE_META + SITE_PAGES[](每頁載入同一份)
│   └── exhibitors.js # 全部約 276 家參展商名錄(僅 exhibitors.html 載入)
├── .nojekyll
└── README.md
```

> 整站由 `data/data.js` 的 `SITE_PAGES[]` 驅動:每一筆 = 一頁。新增一頁 = 複製一個 `.html`、改 `data-page`、在 `SITE_PAGES` 加一筆。每個可見字串都是 `{en, zh}`,語言切換才能整站重繪。
>
> **遊戲中心(arcade)** 再下一層用「外掛式」契約:`app.js` 的 `arcade` renderer 從 `window.GAMES` 動態長出卡片牆與遊戲舞台,每款遊戲是一支 `assets/games/<id>.js`,載入時 `window.GAMES.push({ id, icon, title, tagline, category, accent, mount(root, ctx) })` 把自己註冊上去並自帶前綴 `g-<id>-` 的 scoped CSS。**新增一款遊戲 = 丟一支 `assets/games/<id>.js` + 在 `games.html` 加一行 `<script>`**,完全不必動到共用檔。詳見 [`assets/games/_CONTRACT.md`](assets/games/_CONTRACT.md)。

---

## 📦 主要資料來源

- Medical Taiwan 官方網站(展覽簡介、參觀資訊、Fact Sheet、活動一覽) — <https://www.medicaltaiwan.com.tw/zh-tw/index.html>
- 2026 展覽平面圖 — <https://booth.e-taitra.com.tw/map/v2/zh-TW/2026HL>
- 2026 焦點論壇(RX FOR FUTURE,商業周刊) — <https://bw.businessweekly.com.tw/event/2026/MedicalTaiwanForum/>
- 公開報導,例如 [TechNews 科技新報](https://technews.tw/2026/05/14/ai-powered-healthcare-medical-taiwan-2026/)、[StockFeel 股感](https://www.stockfeel.com.tw/2026-%E5%8F%B0%E7%81%A3%E9%86%AB%E7%99%82%E6%9A%A8%E5%81%A5%E5%BA%B7%E7%85%A7%E8%AD%B7%E5%B1%95-medicaltaiwan/) 等

> ⚠️ **非官方**:本站為個人整理之非官方資源,與 Medical Taiwan、外貿協會(TAITRA)及各參展單位無關。展期、場館、攤位、活動與報名等細節以官方公告為準;焦點展商為精選代表性廠商,完整約 330 家名單請見官網。如有錯誤或出入,請以官方來源為準。

---

## 🛠 本機使用

```bash
# 1. clone 專案
git clone git@github.com:tingwei161803/medicaltaiwan-expo-2026.git
cd medicaltaiwan-expo-2026

# 2a. 直接開啟首頁
open index.html

# 2b. 或啟動本機伺服器(建議,跨頁連結才正常)
uv run python -m http.server 4173
# 然後瀏覽 http://localhost:4173
```

> 純靜態網站,瀏覽不需安裝任何依賴。依個人偏好,所有 Python 操作一律使用 `uv`(不用裸 `python3` / `pip`)。

---

## 📝 聲明 / License

- 本站為非官方整理,內容著作權歸原始來源(Medical Taiwan / TAITRA 與各參展單位)所有。
- 程式碼以 MIT 授權釋出。
- 本站使用 Google Analytics 4(GA4 property:`Medical Taiwan 2026 Expo Guide - GA4`)蒐集匿名流量數據,以了解造訪概況;不蒐集可識別個人身分的資訊。
- 如為權利人且希望調整或移除內容,請開 issue 聯絡。
