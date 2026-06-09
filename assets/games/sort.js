/* =========================================================================
   sort.js — 展區歸位挑戰 / Zone Sorter   ★ 知識類小遊戲

   玩法:畫面中央出現一件展品(大 emoji + 名稱),底下有 4 個展區按鈕。
   把它丟進正確的主題展區 → +1 並閃綠;答錯 → 閃紅且不扣分(維持友善)。
   立刻換下一件隨機展品,45 秒倒數結束後出總分。記錄最高分(越高越好)。

   照 reaction.js(契約黃金範本)同樣結構寫:IIFE 封裝、window.GAMES.push、
   mount(root, ctx)、一次注入的 scoped CSS(前綴 g-sort-)、ctx.t 雙語、
   ctx.load/save 持久化、回傳 cleanup 清掉所有 timer/listener。
   ========================================================================= */
(function () {
  "use strict";

  /* ---- 四個簡化展區(答案按鈕的 key);名稱雙語 ---- */
  var ZONES = [
    { key: "care",      label: { zh: "智慧長照",   en: "Smart Elderly Care" } },
    { key: "ai",        label: { zh: "AI 智慧醫療", en: "AI Smart Healthcare" } },
    { key: "precision", label: { zh: "精準醫療",   en: "Precision Medicine" } },
    { key: "devices",   label: { zh: "醫療器材",   en: "Medical Devices" } }
  ];

  /* ---- 展品題庫(約 16 件),每件對應一個展區 key ---- */
  var BANK = [
    { name: { zh: "居家照護床",   en: "Home care bed" },           zone: "care",      icon: "🛏️" },
    { name: { zh: "輪椅",         en: "Wheelchair" },              zone: "care",      icon: "♿" },
    { name: { zh: "跌倒偵測手環", en: "Fall-detection wristband" },zone: "care",      icon: "⌚" },
    { name: { zh: "助行器",       en: "Walker" },                  zone: "care",      icon: "🦯" },

    { name: { zh: "AI 影像判讀",  en: "AI image reading" },        zone: "ai",        icon: "🧠" },
    { name: { zh: "智慧手術室",   en: "Smart operating room" },    zone: "ai",        icon: "🤖" },
    { name: { zh: "AI 問診助理",  en: "AI triage assistant" },     zone: "ai",        icon: "💬" },
    { name: { zh: "病歷語音轉寫", en: "Voice-to-EHR scribe" },     zone: "ai",        icon: "🎙️" },

    { name: { zh: "基因定序",     en: "Genome sequencing" },       zone: "precision", icon: "🧬" },
    { name: { zh: "液態切片",     en: "Liquid biopsy" },           zone: "precision", icon: "🩸" },
    { name: { zh: "標靶藥物",     en: "Targeted therapy" },        zone: "precision", icon: "🎯" },
    { name: { zh: "腫瘤生物標記", en: "Tumor biomarker" },         zone: "precision", icon: "🔬" },

    { name: { zh: "手術縫線",     en: "Surgical suture" },         zone: "devices",   icon: "🧵" },
    { name: { zh: "血壓計",       en: "Blood pressure monitor" },  zone: "devices",   icon: "🩺" },
    { name: { zh: "注射針筒",     en: "Syringe" },                 zone: "devices",   icon: "💉" },
    { name: { zh: "聽診器",       en: "Stethoscope" },             zone: "devices",   icon: "🩻" }
  ];

  var ROUND_SECONDS = 45;

  /* ---- 分數 → 評語(可調)。higher = better ---- */
  function gradeScore(n, t) {
    if (n >= 30) return t({ zh: "🏆 展務總監,閉眼都歸對", en: "🏆 Floor director — flawless" });
    if (n >= 22) return t({ zh: "🥇 對展區瞭若指掌", en: "🥇 You know the floor cold" });
    if (n >= 14) return t({ zh: "👍 歸位手感不錯", en: "👍 Nice sorting instinct" });
    if (n >= 7)  return t({ zh: "🙂 再多逛幾圈就熟了", en: "🙂 A few more laps and you've got it" });
    return t({ zh: "🗺️ 先看看展區地圖吧", en: "🗺️ Maybe check the floor map first" });
  }

  /* ---- scoped CSS:整支遊戲只注入一次,所有 class 前綴 g-sort- ---- */
  function injectCSS() {
    if (document.getElementById("g-sort-css")) return;
    var s = document.createElement("style");
    s.id = "g-sort-css";
    s.textContent = [
      ".g-sort-wrap{width:100%;max-width:560px;margin:0 auto;}",
      ".g-sort-stage{border-radius:var(--radius-lg);background:var(--surface-container);",
        "border:1px solid var(--outline-variant);padding:24px 16px;text-align:center;",
        "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;",
        "min-height:172px;transition:background .12s,box-shadow .12s;box-sizing:border-box;}",
      ".g-sort-stage--ok{background:var(--success);box-shadow:0 0 0 3px var(--success) inset;}",
      ".g-sort-stage--no{background:var(--error);box-shadow:0 0 0 3px var(--error) inset;}",
      ".g-sort-icon{font-size:3.4rem;line-height:1;}",
      ".g-sort-name{font-size:1.45rem;font-weight:700;color:var(--on-surface);}",
      ".g-sort-stage--ok .g-sort-name,.g-sort-stage--no .g-sort-name{color:#fff;}",
      ".g-sort-ask{font-size:.95rem;font-weight:500;color:var(--on-surface-variant);}",
      ".g-sort-stage--ok .g-sort-ask,.g-sort-stage--no .g-sort-ask{color:#fff;opacity:.95;}",
      ".g-sort-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;}",
      ".g-sort-zone{width:100%;min-height:60px;border-radius:var(--radius);cursor:pointer;",
        "border:1px solid var(--outline-variant);background:var(--primary-container);",
        "color:var(--on-primary-container);font:inherit;font-weight:700;font-size:1rem;",
        "padding:12px 8px;display:flex;align-items:center;justify-content:center;text-align:center;",
        "line-height:1.25;transition:transform .06s,filter .12s;-webkit-tap-highlight-color:transparent;}",
      ".g-sort-zone:active{transform:scale(.97);}",
      ".g-sort-zone:focus-visible{outline:3px solid var(--primary);outline-offset:2px;}",
      ".g-sort-zone:disabled{opacity:.6;cursor:default;}",
      ".g-sort-grade{font-size:.95rem;font-weight:600;margin:10px 0 0;text-align:center;}",
      ".g-sort-over{display:flex;flex-direction:column;align-items:center;gap:6px;}",
      ".g-sort-final{font-size:2.6rem;font-weight:800;color:var(--on-surface);line-height:1;}"
    ].join("");
    document.head.appendChild(s);
  }

  (window.GAMES = window.GAMES || []).push({
    id: "sort",
    icon: "category",
    accent: "#6750A4",
    category: { zh: "知識", en: "Knowledge" },
    title:   { zh: "展區歸位挑戰", en: "Zone Sorter" },
    tagline: { zh: "把展品歸到正確的主題展區,跟時間賽跑。",
               en: "Drop each product into its right expo zone, against the clock." },

    mount: function (root, ctx) {
      injectCSS();
      var t = ctx.t;
      var best = Number(ctx.load("best", 0)) || 0;   // 越高越好;0 = 尚無紀錄

      root.innerHTML =
        '<div class="gu-center">' +
          '<div class="gu-statbar">' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-sort-score">0</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "分數", en: "Score" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-sort-time">' + ROUND_SECONDS + '</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "剩餘秒數", en: "Time left" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-sort-best">' +
              (best ? best : "—") + '</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "最佳", en: "Best" })) + '</span></div>' +
          '</div>' +
          '<div class="g-sort-wrap">' +
            '<div class="g-sort-stage" id="g-sort-stage">' +
              '<div class="g-sort-icon" id="g-sort-icon" aria-hidden="true">🎯</div>' +
              '<div class="g-sort-name" id="g-sort-name">' +
                ctx.esc(t({ zh: "展區歸位挑戰", en: "Zone Sorter" })) + '</div>' +
              '<div class="g-sort-ask" id="g-sort-ask">' +
                ctx.esc(t({ zh: "45 秒內把展品歸到正確展區", en: "Sort items into the right zone in 45s" })) +
              '</div>' +
            '</div>' +
            '<div class="g-sort-grid" id="g-sort-grid"></div>' +
          '</div>' +
          '<p class="g-sort-grade gu-hint" id="g-sort-grade"></p>' +
          '<div class="gu-row" id="g-sort-controls"></div>' +
        '</div>';

      var stageEl = root.querySelector("#g-sort-stage");
      var iconEl  = root.querySelector("#g-sort-icon");
      var nameEl  = root.querySelector("#g-sort-name");
      var askEl   = root.querySelector("#g-sort-ask");
      var gridEl  = root.querySelector("#g-sort-grid");
      var gradeEl = root.querySelector("#g-sort-grade");
      var ctrlEl  = root.querySelector("#g-sort-controls");
      var scoreEl = root.querySelector("#g-sort-score");
      var timeEl  = root.querySelector("#g-sort-time");
      var bestEl  = root.querySelector("#g-sort-best");

      var score = 0;
      var timeLeft = ROUND_SECONDS;
      var current = null;            // 目前展品
      var running = false;
      var tick = null;               // 倒數 setInterval
      var flashTimer = null;         // 綠/紅閃光 setTimeout
      var zoneBtns = [];             // 4 個展區按鈕
      var startBtn = null;           // 開始 / 再玩一次

      var askText = t({ zh: "屬於哪個展區?", en: "Which zone is it?" });

      /* ---- 建出 4 個展區按鈕(2×2),只建一次 ---- */
      ZONES.forEach(function (z) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "g-sort-zone";
        b.textContent = t(z.label);
        b.setAttribute("data-zone", z.key);
        b.disabled = true;
        b.addEventListener("click", onZone);
        gridEl.appendChild(b);
        zoneBtns.push(b);
      });

      function setZonesEnabled(on) {
        zoneBtns.forEach(function (b) { b.disabled = !on; });
      }

      function clearFlash() {
        if (flashTimer) { clearTimeout(flashTimer); flashTimer = null; }
        stageEl.classList.remove("g-sort-stage--ok", "g-sort-stage--no");
      }

      function flash(ok) {
        clearFlash();
        stageEl.classList.add(ok ? "g-sort-stage--ok" : "g-sort-stage--no");
        flashTimer = setTimeout(function () {
          stageEl.classList.remove("g-sort-stage--ok", "g-sort-stage--no");
          flashTimer = null;
        }, 180);
      }

      function nextItem() {
        current = BANK[Math.floor(Math.random() * BANK.length)];
        iconEl.textContent = current.icon;
        nameEl.textContent = t(current.name);
        askEl.textContent = askText;
      }

      function onZone(e) {
        if (!running || !current) return;
        var picked = e.currentTarget.getAttribute("data-zone");
        if (picked === current.zone) {        // 答對 → +1、閃綠
          score += 1;
          scoreEl.textContent = score;
          flash(true);
        } else {                              // 答錯 → 閃紅、不扣分(友善)
          flash(false);
        }
        nextItem();                           // 立刻換下一件
      }

      function setControls(label, handler) {
        ctrlEl.innerHTML = "";
        var b = document.createElement("button");
        b.type = "button";
        b.className = "gu-btn gu-btn--primary";
        b.textContent = label;
        b.addEventListener("click", handler);
        ctrlEl.appendChild(b);
        startBtn = b;
      }

      function endRound() {
        running = false;
        if (tick) { clearInterval(tick); tick = null; }
        clearFlash();
        setZonesEnabled(false);
        current = null;
        if (score > best) { best = score; ctx.save("best", best); bestEl.textContent = best; }

        iconEl.textContent = "🏁";
        nameEl.innerHTML = '<span class="g-sort-over">' +
          '<span class="g-sort-final">' + score + '</span>' +
          '<span>' + ctx.esc(t({ zh: "分", en: "points" })) + '</span></span>';
        askEl.textContent = t({ zh: "時間到!", en: "Time's up!" });
        gradeEl.textContent = gradeScore(score, t);
        setControls(t({ zh: "再玩一次", en: "Play again" }), startRound);
      }

      function startRound() {
        if (tick) { clearInterval(tick); tick = null; }
        clearFlash();
        score = 0;
        timeLeft = ROUND_SECONDS;
        running = true;
        scoreEl.textContent = "0";
        timeEl.textContent = String(timeLeft);
        gradeEl.textContent = "";
        ctrlEl.innerHTML = "";
        startBtn = null;
        setZonesEnabled(true);
        nextItem();

        tick = setInterval(function () {
          timeLeft -= 1;
          if (timeLeft <= 0) {
            timeLeft = 0;
            timeEl.textContent = "0";
            endRound();
            return;
          }
          timeEl.textContent = String(timeLeft);
        }, 1000);
      }

      /* 初始畫面:展示一顆「開始」按鈕,展區鈕先停用 */
      setControls(t({ zh: "開始", en: "Start" }), startRound);

      /* cleanup:關閉或語言切換時,清掉倒數 / 閃光 timer 與所有 listener */
      return function cleanup() {
        if (tick) { clearInterval(tick); tick = null; }
        if (flashTimer) { clearTimeout(flashTimer); flashTimer = null; }
        zoneBtns.forEach(function (b) { b.removeEventListener("click", onZone); });
        // 控制鈕的 listener 隨節點移除一併消失;此處不再持有額外全域引用
      };
    }
  });
})();
