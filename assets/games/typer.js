/* =========================================================================
   typer.js — 醫學名詞速打 / Term Typer   (照 reaction.js 結構撰寫)

   玩法:點「開始」→ 60 秒倒數開始,畫面顯示一個醫學名詞(含中文提示),
   在輸入框打出英文單字,完全相符(忽略大小寫/前後空白)即 +1 分並跳下一個。
   可「跳過」換下一個(無懲罰)。時間到鎖定輸入,顯示答對數與約略分數,
   記錄最佳(答對數越高越好)。

   遵守契約:IIFE 封裝、window.GAMES.push、mount(root, ctx)、
   一次注入的 scoped CSS(前綴 g-typer-)、ctx.t 雙語、ctx.load/save 持久化、
   ctx.esc 跳脫、回傳 cleanup 清掉 timer 與 listener。
   ========================================================================= */
(function () {
  "use strict";

  var ACCENT = "#00838F";
  var ROUND_SEC = 60;

  /* ---- 30 個短醫學英文名詞 + 中文提示;使用者打英文 ---- */
  var TERMS = [
    { en: "stethoscope", zh: "聽診器" },
    { en: "insulin",     zh: "胰島素" },
    { en: "vaccine",     zh: "疫苗" },
    { en: "x-ray",       zh: "X 光" },
    { en: "scalpel",     zh: "手術刀" },
    { en: "thermometer", zh: "體溫計" },
    { en: "antibody",    zh: "抗體" },
    { en: "diagnosis",   zh: "診斷" },
    { en: "surgery",     zh: "手術" },
    { en: "oxygen",      zh: "氧氣" },
    { en: "plasma",      zh: "血漿" },
    { en: "neuron",      zh: "神經元" },
    { en: "vitamin",     zh: "維生素" },
    { en: "syringe",     zh: "針筒" },
    { en: "pulse",       zh: "脈搏" },
    { en: "antibiotic",  zh: "抗生素" },
    { en: "bandage",     zh: "繃帶" },
    { en: "biopsy",      zh: "切片" },
    { en: "catheter",    zh: "導管" },
    { en: "enzyme",      zh: "酵素" },
    { en: "fracture",    zh: "骨折" },
    { en: "glucose",     zh: "葡萄糖" },
    { en: "hormone",     zh: "荷爾蒙" },
    { en: "implant",     zh: "植入物" },
    { en: "kidney",      zh: "腎臟" },
    { en: "ligament",    zh: "韌帶" },
    { en: "marrow",      zh: "骨髓" },
    { en: "platelet",    zh: "血小板" },
    { en: "tendon",      zh: "肌腱" },
    { en: "ventilator",  zh: "呼吸器" }
  ];

  /* ---- scoped CSS:整支遊戲只注入一次,所有 class 前綴 g-typer- ---- */
  function injectCSS() {
    if (document.getElementById("g-typer-css")) return;
    var s = document.createElement("style");
    s.id = "g-typer-css";
    s.textContent = [
      ".g-typer-wrap{width:100%;max-width:560px;margin:0 auto;}",
      ".g-typer-card{background:var(--surface-container);border:1px solid var(--outline-variant);",
        "border-radius:var(--radius-lg);padding:24px 20px;text-align:center;",
        "display:flex;flex-direction:column;align-items:center;gap:10px;}",
      ".g-typer-hint{font-size:1rem;color:var(--on-surface-variant);font-weight:600;min-height:1.4em;}",
      ".g-typer-term{font-size:2rem;font-weight:800;color:var(--on-surface);letter-spacing:.5px;",
        "word-break:break-word;line-height:1.15;min-height:1.2em;}",
      ".g-typer-prompt{font-size:.9rem;color:var(--on-surface-variant);font-weight:500;min-height:1.3em;}",
      ".g-typer-input{width:100%;max-width:340px;box-sizing:border-box;margin-top:4px;",
        "padding:12px 14px;font:inherit;font-size:1.15rem;font-weight:600;text-align:center;",
        "color:var(--on-surface);background:var(--surface);caret-color:" + ACCENT + ";",
        "border:2px solid var(--outline-variant);border-radius:var(--radius);outline:none;",
        "transition:border-color .12s,box-shadow .12s;}",
      ".g-typer-input:focus{border-color:" + ACCENT + ";}",
      ".g-typer-input.g-typer-ok{border-color:var(--success);box-shadow:0 0 0 3px color-mix(in srgb,var(--success) 30%,transparent);}",
      ".g-typer-input:disabled{opacity:.6;cursor:not-allowed;}",
      ".g-typer-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:6px;}",
      ".g-typer-final{font-size:.95rem;font-weight:600;color:var(--on-surface);margin:4px 0 0;text-align:center;min-height:1.3em;}"
    ].join("");
    document.head.appendChild(s);
  }

  /* ---- 答對數 → 評語(可調)。higher = better ---- */
  function gradeTyper(n, t) {
    if (n >= 25) return t({ zh: "⌨️ 醫學打字機,神速!", en: "⌨️ Typewriter god speed!" });
    if (n >= 18) return t({ zh: "🚀 手速驚人", en: "🚀 Blazing fingers" });
    if (n >= 12) return t({ zh: "👍 相當熟練", en: "👍 Nicely fluent" });
    if (n >= 6)  return t({ zh: "🙂 還算順手", en: "🙂 Getting there" });
    return t({ zh: "🐢 慢慢來,熟能生巧", en: "🐢 Slow and steady" });
  }

  (window.GAMES = window.GAMES || []).push({
    id: "typer",
    icon: "keyboard",
    accent: ACCENT,
    category: { zh: "速度", en: "Speed" },
    title:   { zh: "醫學名詞速打", en: "Term Typer" },
    tagline: { zh: "60 秒內盡量打對醫學名詞,測你的手速。",
               en: "Type as many medical terms correctly as you can in 60s." },

    mount: function (root, ctx) {
      injectCSS();
      var t = ctx.t;
      var best = Number(ctx.load("best", 0)) || 0;  // 0 = 尚無紀錄

      root.innerHTML =
        '<div class="g-typer-wrap gu-center">' +
          '<div class="gu-statbar">' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-typer-correct">0</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "答對", en: "Correct" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-typer-time">' + ROUND_SEC + '</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "剩餘 (秒)", en: "Time Left" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-typer-best">' +
              (best ? best : "—") + '</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "最佳", en: "Best" })) + '</span></div>' +
          '</div>' +
          '<div class="g-typer-card">' +
            '<div class="g-typer-hint" id="g-typer-hint"></div>' +
            '<div class="g-typer-term" id="g-typer-term">' +
              ctx.esc(t({ zh: "準備好了嗎?", en: "Ready?" })) + '</div>' +
            '<div class="g-typer-prompt" id="g-typer-prompt">' +
              ctx.esc(t({ zh: "按「開始」後輸入上方英文單字", en: "Press Start, then type the English word above" })) + '</div>' +
            '<input class="g-typer-input" id="g-typer-input" type="text" inputmode="text" ' +
              'autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" ' +
              'aria-label="' + ctx.esc(t({ zh: "輸入醫學名詞", en: "Type the medical term" })) + '" disabled />' +
            '<div class="g-typer-row">' +
              '<button class="gu-btn gu-btn--primary" id="g-typer-start" type="button">' +
                ctx.esc(t({ zh: "開始", en: "Start" })) + '</button>' +
              '<button class="gu-btn gu-btn--tonal" id="g-typer-skip" type="button" disabled>' +
                ctx.esc(t({ zh: "跳過", en: "Skip" })) + '</button>' +
            '</div>' +
            '<p class="g-typer-final gu-hint" id="g-typer-final"></p>' +
          '</div>' +
        '</div>';

      var hintEl    = root.querySelector("#g-typer-hint");
      var termEl    = root.querySelector("#g-typer-term");
      var promptEl  = root.querySelector("#g-typer-prompt");
      var inputEl   = root.querySelector("#g-typer-input");
      var startBtn  = root.querySelector("#g-typer-start");
      var skipBtn   = root.querySelector("#g-typer-skip");
      var correctEl = root.querySelector("#g-typer-correct");
      var timeEl    = root.querySelector("#g-typer-time");
      var bestEl    = root.querySelector("#g-typer-best");
      var finalEl   = root.querySelector("#g-typer-final");

      var running = false;
      var correct = 0;
      var timeLeft = ROUND_SEC;
      var tick = null;        // 1 秒倒數 interval
      var okTimer = null;     // 綠框閃一下的 timer
      var current = null;     // 目前題目

      function pickTerm() {
        current = TERMS[Math.floor(Math.random() * TERMS.length)];
        hintEl.textContent = current.zh;
        termEl.textContent = current.en;
        inputEl.value = "";
      }

      function flashOk() {
        inputEl.classList.add("g-typer-ok");
        if (okTimer) clearTimeout(okTimer);
        okTimer = setTimeout(function () {
          inputEl.classList.remove("g-typer-ok");
          okTimer = null;
        }, 280);
      }

      function nextTerm(animate) {
        if (animate) flashOk();
        pickTerm();
      }

      function onInput() {
        if (!running || !current) return;
        var typed = inputEl.value.trim().toLowerCase();
        if (typed === current.en.toLowerCase()) {
          correct++;
          correctEl.textContent = correct;
          nextTerm(true);
        }
      }

      function onSkip() {
        if (!running) return;
        nextTerm(false);
        inputEl.focus();
      }

      function endRound() {
        running = false;
        if (tick) { clearInterval(tick); tick = null; }
        inputEl.disabled = true;
        skipBtn.disabled = true;
        startBtn.disabled = false;
        startBtn.textContent = t({ zh: "再玩一次", en: "Play again" });
        hintEl.textContent = "";
        termEl.textContent = t({ zh: "時間到!", en: "Time's up!" });

        // 約略分數:答對數對應 WPM(每詞當 1 字,換算每分鐘字數)
        var wpm = Math.round(correct * (60 / ROUND_SEC));
        if (correct > best) { best = correct; ctx.save("best", best); bestEl.textContent = best; }

        promptEl.textContent = t({
          zh: "答對 " + correct + " 個 ・ 約 " + wpm + " WPM",
          en: correct + " correct ・ ~" + wpm + " WPM"
        });
        finalEl.textContent = gradeTyper(correct, t);
      }

      function tickDown() {
        timeLeft--;
        if (timeLeft <= 0) {
          timeLeft = 0;
          timeEl.textContent = "0";
          endRound();
          return;
        }
        timeEl.textContent = timeLeft;
      }

      function startRound() {
        if (running) return;
        running = true;
        correct = 0;
        timeLeft = ROUND_SEC;
        correctEl.textContent = "0";
        timeEl.textContent = ROUND_SEC;
        finalEl.textContent = "";
        promptEl.textContent = t({ zh: "打出上方英文單字,答對自動換下一個", en: "Type the word above — auto-advances on a match" });
        inputEl.disabled = false;
        skipBtn.disabled = false;
        startBtn.disabled = true;
        startBtn.textContent = t({ zh: "進行中…", en: "Running…" });
        pickTerm();
        inputEl.focus();
        if (tick) clearInterval(tick);
        tick = setInterval(tickDown, 1000);
      }

      startBtn.addEventListener("click", startRound);
      skipBtn.addEventListener("click", onSkip);
      inputEl.addEventListener("input", onInput);

      /* cleanup:關閉或語言切換時,清掉倒數 / 閃光 timer 與 listener */
      return function cleanup() {
        if (tick) clearInterval(tick);
        if (okTimer) clearTimeout(okTimer);
        startBtn.removeEventListener("click", startRound);
        skipBtn.removeEventListener("click", onSkip);
        inputEl.removeEventListener("input", onInput);
      };
    }
  });
})();
