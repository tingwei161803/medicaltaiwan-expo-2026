# Medical Taiwan 2026 · 台灣國際醫療暨健康照護展 導覽

> 把第 20 屆台灣國際醫療暨健康照護展(Medical Taiwan 2026)的官方資訊,整理成一個多頁、可互動、中英雙語的靜態導覽站 —— 從展會總覽、展會亮點、九大主題展區,到焦點展商、展期活動、重點論壇與參觀資訊。

本站把官方網站與公開報導裡關於 Medical Taiwan 2026 的內容,整理成 7 個彼此串連的頁面。純 HTML / CSS / JS、零建置,可直接部署到 GitHub Pages。展期、攤位、活動與報名等細節以官方公告為準。

---

## 🔗 線上版 / Live

| | |
|---|---|
| 🌐 網站 | <https://tingwei161803.github.io/medicaltaiwan-expo-2026/> |

頂部的**跨頁導覽列**可在 7 頁之間切換;每頁皆支援中文 / English 與深 / 淺色,設定跨頁延續。展區頁可用 `#<slug>` 深連結到特定展區(例如 [`…/pavilions.html#precision`](https://tingwei161803.github.io/medicaltaiwan-expo-2026/pavilions.html#precision))。

---

## 📄 頁面 / Pages

| 頁面 | 檔案 | 版型 | 內容 |
|------|------|------|------|
| 展會總覽 | `index.html` | hub | 一句話定位、關鍵數字(屆次 / 展商 / 展位 / 展區 / 買主 / 觀眾)+ 通往各頁的入口卡 |
| 展會亮點 | `about.html` | bento | 三大主軸、參展規模、兩大新專區、AI 智慧醫療主題館、精準醫療商機、同期 Food Taipei |
| 主題展區 | `pavilions.html` | gallery | 九大主題展區,依三大主軸篩選 + 搜尋,點卡片看詳情 |
| 焦點展商 | `exhibitors.html` | table | 代表性展商與技術亮點,可依展區篩選、點欄位排序 |
| 展期與活動 | `schedule.html` | timeline | 6/25–27 三天展期與重點論壇時間軸 |
| 重點論壇 | `forum.html` | article | 國際趨勢論壇(在宅醫療)、國內市場論壇、長照論壇、RX FOR FUTURE,附目錄與閱讀進度 |
| 參觀資訊 | `visit.html` | faq | 日期時間、地點交通、報名與快速入場、停車、現場服務與聯絡的常見問答(可搜尋) |

> 三大主軸:創新長照、智慧醫療、醫材廊道。九大展區:智慧長照、智慧輔具、運動醫學、AI 智慧醫療、精準醫療、M-novator 新創、醫療器材與耗材、零組件與配件、國際館。

---

## ✨ 功能特色

- 🧭 **跨頁導覽列** — 7 頁一鍵切換,自動高亮目前頁
- 🌏 **全頁雙語** — 中文 / English 一鍵切換,卡片、詳情、導覽與靜態文案整頁同步、無殘留
- 🌗 **深 / 淺色模式** — 醫療專業藍綠(teal)配色,`localStorage` 記憶,跨頁延續
- 🔍 **搜尋 / 篩選** — 展區頁即時搜尋 + 依主軸篩選;展商頁可排序、依展區篩選;論壇頁可搜尋問答
- 🗂️ **詳情對話框 + 深連結** — 展區卡片點開看完整介紹,`#<slug>` 可直接分享
- 📊 **多種版型** — hub / bento / gallery / table / timeline / article / faq,依每頁資料形狀呈現
- 📱 **響應式** — 手機 / 平板 / 桌機皆適配,375px 無水平溢出
- ⚡ **純靜態** — 無後端、載入快、可離線瀏覽;含 SEO / Open Graph / JSON-LD(Event)

---

## 📂 結構 / Structure

```
medicaltaiwan-expo-2026/
├── index.html        # 展會總覽(hub)
├── about.html        # 展會亮點(bento)
├── pavilions.html    # 主題展區(gallery)
├── exhibitors.html   # 焦點展商(table)
├── schedule.html     # 展期與活動(timeline)
├── forum.html        # 重點論壇(article)
├── visit.html        # 參觀資訊(faq)
├── assets/
│   ├── styles.css    # MD3 設計 token(淺/深,醫療藍綠)+ 全部版型樣式
│   ├── shell.js      # 共用 chrome:appbar / 跨頁 nav / footer / dialog / 語言+主題狀態
│   └── app.js        # 版型引擎:依 body[data-page] 選 renderer 渲染進 #page
├── data/
│   └── data.js       # 唯一資料檔:SITE_META + SITE_PAGES[](每頁載入同一份)
├── .nojekyll
└── README.md
```

> 整站由 `data/data.js` 的 `SITE_PAGES[]` 驅動:每一筆 = 一頁。新增一頁 = 複製一個 `.html`、改 `data-page`、在 `SITE_PAGES` 加一筆。每個可見字串都是 `{en, zh}`,語言切換才能整站重繪。

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
