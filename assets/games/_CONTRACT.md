# 遊戲模組契約 / Game Module Contract

每個小遊戲 = **一支獨立、自給自足的 `.js` 檔**,放在 `assets/games/<id>.js`。
它在載入時把自己 `push` 進全域 `window.GAMES`,「遊戲中心」頁(`games.html`,layout `arcade`)
會自動把它列成一張卡片,點開後呼叫你的 `mount()`。

> 你只會新增 **一個檔案**:`assets/games/<id>.js`。**不要**修改 `data.js` / `app.js` /
> `styles.css` / `games.html` —— 整合那一步由主程式統一處理。

---

## 1. 註冊格式

```js
(function () {
  "use strict";
  (window.GAMES = window.GAMES || []).push({
    id: "reaction",                                   // 唯一、kebab-case、=檔名
    icon: "bolt",                                     // Material Symbols Rounded 名稱(已載入)
    accent: "#00696E",                                // 卡片點綴色(可省略,預設用 --primary)
    category: { zh: "反應力", en: "Reflex" },          // 分類(用於篩選 chip)
    title:   { zh: "急診反應力", en: "ER Reflex" },     // 遊戲名
    tagline: { zh: "綠燈亮起就出手,看你多快。",          // 卡片上的一句話
               en: "Tap the instant it turns green." },
    mount: function (root, ctx) {
      // 在 root 裡蓋出整個遊戲;見下方 §2、§3
      // 可回傳一個 cleanup 函式 () => void(關閉/語言切換時會被呼叫,用來清 timer/listener)
      return function cleanup() {};
    }
  });
})();
```

## 2. `mount(root, ctx)` 參數

- `root` —— 一個**乾淨的空 `<div>`**,你把遊戲整個蓋在裡面(`root.innerHTML = ...`)。
- `ctx` —— 工具箱:
  - `ctx.lang` —— `"zh"` 或 `"en"`(目前語言)。
  - `ctx.t(obj)` —— 把 `{zh, en}` 取出目前語言字串;傳純字串則原樣回傳。
  - `ctx.esc(s)` —— HTML escape(把使用者/動態字串塞進 innerHTML 前用)。
  - `ctx.load(key, fallback)` —— 讀取本遊戲的持久化資料(已用 `id` 命名空間;sandbox 安全)。
  - `ctx.save(key, value)` —— 寫入持久化資料(例如最高分;JSON 可序列化)。
  - `ctx.close()` —— 結束遊戲、回到遊戲中心卡片牆(你的「返回」鈕可呼叫它,但頁面頂端已有返回鈕)。

> **語言切換**:當使用者切 中/英,整個遊戲會以新語言**重新 `mount`**(舊的先 cleanup)。
> 所以你**不需要**自己處理 i18n 重繪 —— 在 `mount` 當下用 `ctx.t` / `ctx.lang` 建好文字即可。
> 代價是切語言會重置進行中的一局,這可接受。

## 3. 硬性規則(務必遵守,否則整合會出問題)

1. **單檔、純 vanilla JS**:不得引入任何外部函式庫 / CDN / npm。只用瀏覽器原生 API。
2. **CSS 自帶且命名空間化**:在 `mount` 內注入**一次** `<style>`,所有 class 前綴 `g-<id>-`
   (例:`g-reaction-board`)。**禁止**使用未前綴的全域 class,以免撞到別的遊戲或全站樣式。
   注入範式(只注入一次):
   ```js
   if (!document.getElementById("g-reaction-css")) {
     var s = document.createElement("style");
     s.id = "g-reaction-css";
     s.textContent = "/* ...scoped rules... */";
     document.head.appendChild(s);
   }
   ```
3. **顏色一律用全站 MD3 token**(深淺色才會自動跟著切換),不要寫死 `#fff`/`#000` 當背景/文字:
   - 背景層:`--background` / `--surface` / `--surface-container` / `--surface-container-high` / `--surface-variant`
   - 文字:`--on-surface` / `--on-surface-variant` / `--on-background`
   - 主色:`--primary` / `--on-primary` / `--primary-container` / `--on-primary-container`
   - 次/三色:`--secondary` / `--secondary-container` / `--tertiary` / `--tertiary-container`
   - 狀態:`--error` / `--success` / `--outline` / `--outline-variant`
   - 圓角:`--radius-sm`(8) / `--radius`(16) / `--radius-lg`(28);字體:`--font-body`
   - 點綴色可用你 `accent` 那個顏色寫死沒關係(那是你自己的)。
4. **雙語**:所有給使用者看的文字都要 `ctx.t({zh, en})`,中英都要寫,不可只有一種。
5. **響應式**:手機 375px 寬不可水平溢出;觸控可玩(用 `pointerdown`/`click`,別只綁 hover)。
   遊戲區建議 `width:100%; max-width:560px; margin:0 auto;`。
6. **不可污染全域**:除了 `window.GAMES.push`,不要新增其他 `window.*`;所有變數包在 IIFE 內。
   用 `let`/`var` 區域變數;事件 listener 與 `setInterval`/`requestAnimationFrame`
   一律在回傳的 cleanup 內清掉(避免關閉後仍在跑 / 記憶體洩漏)。
7. **無障礙**:互動元素用 `<button>`;裝飾性 icon 加 `aria-hidden="true"`。
8. **音效可選**:若用 WebAudio,必須使用者手勢觸發、`try/catch` 包住、預設可關;靜音不可報錯。
9. **檔尾不要有 `console.log`** 殘留;不可 `alert()`。

## 4. 可用的共享 UI class(選用,讓各遊戲外觀一致)

`games.css` 已提供這些**全站前綴 `gu-`** 的工具 class,你可以直接用(它們已吃 MD3 token):

- `gu-panel` —— 一塊 surface 卡片容器(padding + 圓角 + 邊框)。
- `gu-btn` / `gu-btn gu-btn--primary` / `gu-btn gu-btn--tonal` —— 按鈕(次要 / 主要 / tonal)。
- `gu-row` —— flex 橫向排列、置中、gap。
- `gu-stat` —— 數據格(大數字 + 標籤),內含 `gu-stat__v`(值)`gu-stat__k`(標籤)。
- `gu-statbar` —— 一排 `gu-stat` 的容器(計分板)。
- `gu-title` —— 遊戲內標題;`gu-hint` —— 灰色小提示字。
- `gu-center` —— 置中欄(flex column, align center)。

> 這些是「選用」;你也可以全用自己 `g-<id>-` 前綴的 class。但分數板/按鈕用 `gu-` 比較統一。

## 5. 範本

`assets/games/reaction.js` 是**官方參考實作**,請先讀它,照同樣結構寫你的遊戲。

## 6. 驗收清單(交件前自己過一遍)

- [ ] 檔案在 `assets/games/<id>.js`,IIFE 包好,`window.GAMES.push({...})` 正確。
- [ ] `id`、`icon`、`category`、`title`、`tagline` 都有,且 title/tagline/category 中英齊全。
- [ ] `mount(root, ctx)` 能在 root 內完整跑起來;回傳 cleanup 清掉所有 timer/listener。
- [ ] CSS 注入一次、全部 `g-<id>-` 前綴;顏色用 MD3 token,深/淺色都正常。
- [ ] 375px 不溢出、可觸控、無 console 殘留、無外部相依。
- [ ] 用 `node -c assets/games/<id>.js`(或瀏覽器)確認語法無誤。
