/* =========================================================================
   guess.js — 生命徵象大搜查 / Vital Guess   ★ 邏輯 / Logic

   玩法:系統偷偷選一個隱藏的「心率讀數」(預設 1–100)。在輸入框打一個數字
   送出 → 系統告訴你「再高一點 / 再低一點」,並依距離給冷熱提示(很接近 / 接近 /
   有點遠 / 很遠)。用二分法收斂,步數越少越神。猜中後依步數給評語。
   BEST = 猜中所需「最少步數」(越少越好)。

   結構照官方範本 reaction.js:IIFE 封裝、window.GAMES.push、mount(root, ctx)、
   一次注入的 scoped CSS(前綴 g-guess-)、ctx.t 雙語、ctx.load/save 持久化、
   回傳 cleanup 清掉所有 listener。
   ========================================================================= */
(function () {
  "use strict";

  /* ---- scoped CSS:整支遊戲只注入一次,所有 class 前綴 g-guess- ---- */
  function injectCSS() {
    if (document.getElementById("g-guess-css")) return;
    var s = document.createElement("style");
    s.id = "g-guess-css";
    s.textContent = [
      ".g-guess-wrap{width:100%;max-width:560px;margin:0 auto;}",
      ".g-guess-prompt{font-size:1.05rem;font-weight:600;color:var(--on-surface);",
        "text-align:center;margin:4px 0 12px;line-height:1.5;}",
      ".g-guess-prompt b{color:var(--primary);}",
      /* 輸入列:number input + 送出鈕 */
      ".g-guess-form{display:flex;gap:8px;align-items:stretch;justify-content:center;",
        "flex-wrap:wrap;margin:0 auto 10px;}",
      ".g-guess-input{flex:1 1 140px;min-width:0;max-width:240px;font:inherit;font-size:1.15rem;",
        "font-weight:700;text-align:center;padding:10px 12px;border-radius:var(--radius-sm);",
        "border:1.5px solid var(--outline-variant);background:var(--surface-container);",
        "color:var(--on-surface);outline:none;-moz-appearance:textfield;}",
      ".g-guess-input:focus{border-color:var(--primary);}",
      ".g-guess-input::-webkit-outer-spin-button,.g-guess-input::-webkit-inner-spin-button{",
        "-webkit-appearance:none;margin:0;}",
      /* 回饋區 */
      ".g-guess-feedback{min-height:1.5em;text-align:center;font-weight:700;font-size:1.05rem;",
        "margin:6px 0 4px;display:flex;align-items:center;justify-content:center;gap:6px;",
        "flex-wrap:wrap;color:var(--on-surface);}",
      ".g-guess-feedback .material-symbols-rounded{font-size:1.3rem;line-height:1;}",
      ".g-guess-dir--up{color:var(--primary);}",
      ".g-guess-dir--down{color:var(--secondary);}",
      ".g-guess-note{color:var(--error);font-size:.9rem;font-weight:600;text-align:center;",
        "min-height:1.2em;margin:0 0 6px;}",
      ".g-guess-hot{font-weight:800;}",
      ".g-guess-hot--burning{color:var(--error);}",
      ".g-guess-hot--warm{color:#E8730C;}",
      ".g-guess-hot--cool{color:var(--secondary);}",
      ".g-guess-hot--cold{color:var(--outline);}",
      /* 過往猜測列表 */
      ".g-guess-list{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-direction:column;",
        "gap:6px;max-height:210px;overflow-y:auto;}",
      ".g-guess-li{display:flex;align-items:center;justify-content:space-between;gap:8px;",
        "padding:8px 12px;border-radius:var(--radius-sm);background:var(--surface-container);",
        "border:1px solid var(--outline-variant);font-size:.92rem;color:var(--on-surface);}",
      ".g-guess-li__num{font-weight:800;font-variant-numeric:tabular-nums;}",
      ".g-guess-li__hint{display:flex;align-items:center;gap:6px;color:var(--on-surface-variant);}",
      ".g-guess-li__hint .material-symbols-rounded{font-size:1.1rem;line-height:1;}",
      ".g-guess-win{color:var(--success);}",
      /* 過關面板 */
      ".g-guess-grade{font-size:1rem;font-weight:700;text-align:center;margin:8px 0 4px;",
        "color:var(--success);}",
      /* 難度切換 */
      ".g-guess-diff{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:0 0 10px;}",
      ".g-guess-diffbtn{font:inherit;font-size:.85rem;font-weight:600;cursor:pointer;",
        "padding:6px 14px;border-radius:999px;border:1.5px solid var(--outline-variant);",
        "background:transparent;color:var(--on-surface-variant);}",
      ".g-guess-diffbtn[aria-pressed=\"true\"]{background:var(--primary);color:var(--on-primary);",
        "border-color:var(--primary);}"
    ].join("");
    document.head.appendChild(s);
  }

  /* ---- 步數 → 評語(可調)。fewer = better ---- */
  function gradeGuesses(n, t) {
    if (n <= 5) return t({ zh: "🎯 神準!二分法大師", en: "🎯 Pinpoint! Bisection master" });
    if (n <= 7) return t({ zh: "👍 不錯,手感很穩", en: "👍 Nice — steady hands" });
    return t({ zh: "🙂 過關!下次再少幾步", en: "🙂 Cleared! Trim a few next time" });
  }

  (window.GAMES = window.GAMES || []).push({
    id: "guess",
    icon: "search",
    accent: "#455A64",
    category: { zh: "邏輯", en: "Logic" },
    title:   { zh: "生命徵象大搜查", en: "Vital Guess" },
    tagline: { zh: "用二分法猜出隱藏的數值,步數越少越神。",
               en: "Home in on the hidden value — fewer guesses, higher rank." },

    mount: function (root, ctx) {
      injectCSS();
      var t = ctx.t;

      /* best = 猜中所需「最少步數」,越少越好。0 / 無紀錄 = 尚無 */
      var best = Number(ctx.load("best", 0)) || 0;

      /* 難度:max 為上界(含)。預設 1–100。 */
      var ranges = [100, 1000];
      var rangeMax = 100;

      var lo = 1, hi = rangeMax;   // 目前仍可能的範圍(僅顯示用)
      var target = 0;              // 隱藏數值
      var count = 0;               // 已猜步數
      var won = false;
      var guesses = [];            // {num, dir:'up'|'down'|'win', hot}

      function pick() {
        target = lo + Math.floor(Math.random() * (hi - lo + 1));
      }

      function reset() {
        lo = 1; hi = rangeMax;
        count = 0; won = false; guesses = [];
        pick();
      }
      reset();

      root.innerHTML =
        '<div class="g-guess-wrap gu-center">' +
          '<div class="g-guess-diff" id="g-guess-diff" role="group" ' +
            'aria-label="' + ctx.esc(t({ zh: "難度", en: "Difficulty" })) + '">' +
            '<button class="g-guess-diffbtn" id="g-guess-diff-0" type="button" aria-pressed="true">1–100</button>' +
            '<button class="g-guess-diffbtn" id="g-guess-diff-1" type="button" aria-pressed="false">1–1000</button>' +
          '</div>' +

          '<div class="gu-statbar">' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-guess-count">0</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "已猜步數", en: "Guesses" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-guess-range">1–100</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "範圍", en: "Range" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-guess-best">' +
              (best ? best : "—") + '</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "最佳步數", en: "Best" })) + '</span></div>' +
          '</div>' +

          '<p class="g-guess-prompt" id="g-guess-prompt"></p>' +

          '<form class="g-guess-form" id="g-guess-form" autocomplete="off">' +
            '<input class="g-guess-input" id="g-guess-input" type="number" inputmode="numeric" ' +
              'min="1" max="100" step="1" ' +
              'aria-label="' + ctx.esc(t({ zh: "輸入猜測值", en: "Enter your guess" })) + '" ' +
              'placeholder="?">' +
            '<button class="gu-btn gu-btn--primary" id="g-guess-submit" type="submit">' +
              ctx.esc(t({ zh: "送出", en: "Guess" })) + '</button>' +
          '</form>' +

          '<p class="g-guess-note" id="g-guess-note"></p>' +
          '<div class="g-guess-feedback" id="g-guess-feedback"></div>' +
          '<p class="g-guess-grade" id="g-guess-grade" style="display:none;"></p>' +
          '<button class="gu-btn gu-btn--tonal" id="g-guess-again" type="button" style="display:none;">' +
            ctx.esc(t({ zh: "再玩一次", en: "Play again" })) + '</button>' +

          '<ul class="g-guess-list" id="g-guess-list" aria-live="polite"></ul>' +
        '</div>';

      var diff0   = root.querySelector("#g-guess-diff-0");
      var diff1   = root.querySelector("#g-guess-diff-1");
      var countEl = root.querySelector("#g-guess-count");
      var rangeEl = root.querySelector("#g-guess-range");
      var bestEl  = root.querySelector("#g-guess-best");
      var prompt  = root.querySelector("#g-guess-prompt");
      var form    = root.querySelector("#g-guess-form");
      var input   = root.querySelector("#g-guess-input");
      var submit  = root.querySelector("#g-guess-submit");
      var note    = root.querySelector("#g-guess-note");
      var feedback = root.querySelector("#g-guess-feedback");
      var gradeEl = root.querySelector("#g-guess-grade");
      var again   = root.querySelector("#g-guess-again");
      var listEl  = root.querySelector("#g-guess-list");

      function icon(name) {
        return '<span class="material-symbols-rounded" aria-hidden="true">' + name + '</span>';
      }

      /* 距離 → 冷熱提示(依範圍大小縮放) */
      function hotHint(dist) {
        var span = rangeMax;
        var r = dist / span;
        if (r <= 0.03) return { cls: "burning", txt: t({ zh: "很接近!", en: "Burning hot" }), icon: "local_fire_department" };
        if (r <= 0.08) return { cls: "warm",    txt: t({ zh: "接近",     en: "Warm" }),         icon: "device_thermostat" };
        if (r <= 0.20) return { cls: "cool",    txt: t({ zh: "有點遠",   en: "Cool" }),         icon: "air" };
        return { cls: "cold", txt: t({ zh: "很遠", en: "Cold" }), icon: "ac_unit" };
      }

      function renderPrompt() {
        if (won) {
          prompt.innerHTML = ctx.esc(t({ zh: "答案就是 ", en: "The reading was " })) +
            '<b>' + ctx.esc(String(target)) + '</b> bpm';
          return;
        }
        prompt.innerHTML =
          ctx.esc(t({ zh: "我偷偷量了一個心率讀數,介於 ", en: "I logged a hidden heart-rate reading between " })) +
          '<b>' + ctx.esc(String(lo)) + '</b>' +
          ctx.esc(t({ zh: " 到 ", en: " and " })) +
          '<b>' + ctx.esc(String(hi)) + '</b> bpm — ' +
          ctx.esc(t({ zh: "猜猜看?", en: "what is it?" }));
      }

      function renderList() {
        var html = "";
        for (var i = guesses.length - 1; i >= 0; i--) {
          var g = guesses[i];
          var dirIcon, dirTxt, hintHtml;
          if (g.dir === "win") {
            hintHtml = '<span class="g-guess-li__hint g-guess-win">' + icon("check_circle") +
              ctx.esc(t({ zh: "答對!", en: "Correct!" })) + '</span>';
          } else {
            dirIcon = g.dir === "up" ? "arrow_upward" : "arrow_downward";
            dirTxt = g.dir === "up"
              ? t({ zh: "再高一點", en: "Higher" })
              : t({ zh: "再低一點", en: "Lower" });
            hintHtml = '<span class="g-guess-li__hint">' + icon(dirIcon) + ctx.esc(dirTxt) +
              ' · <b class="g-guess-hot g-guess-hot--' + g.hot.cls + '">' + ctx.esc(g.hot.txt) + '</b></span>';
          }
          html += '<li class="g-guess-li">' +
            '<span class="g-guess-li__num">#' + (i + 1) + ' · ' + ctx.esc(String(g.num)) + '</span>' +
            hintHtml + '</li>';
        }
        listEl.innerHTML = html;
      }

      function endRound() {
        won = true;
        input.disabled = true;
        submit.disabled = true;
        again.style.display = "";
        gradeEl.style.display = "";
        gradeEl.textContent = t({ zh: "🎉 ", en: "🎉 " }) +
          t({ zh: "用 ", en: "Solved in " }) + count +
          t({ zh: " 步破案 — ", en: " guesses — " }) + gradeGuesses(count, t);
        feedback.className = "g-guess-feedback g-guess-dir--up";
        feedback.innerHTML = icon("celebration") +
          '<span>' + ctx.esc(t({ zh: "命中!就是 ", en: "Got it! It was " })) +
          ctx.esc(String(target)) + ' bpm</span>';
        if (!best || count < best) {
          best = count;
          ctx.save("best", best);
          bestEl.textContent = best;
        }
      }

      function submitGuess() {
        if (won) return;
        note.textContent = "";
        var raw = input.value.trim();
        if (raw === "") {
          note.textContent = t({ zh: "請先輸入一個數字", en: "Type a number first" });
          return;
        }
        var n = Number(raw);
        if (!isFinite(n) || Math.floor(n) !== n) {
          note.textContent = t({ zh: "請輸入整數", en: "Whole numbers only" });
          return;
        }
        if (n < 1 || n > rangeMax) {
          note.textContent = t({ zh: "超出範圍:1–", en: "Out of range: 1–" }) + rangeMax;
          return;
        }

        count++;
        countEl.textContent = count;

        if (n === target) {
          guesses.push({ num: n, dir: "win" });
          renderList();
          endRound();
          return;
        }

        var dir, dirTxt, dirCls;
        if (n < target) {
          dir = "up"; dirCls = "g-guess-dir--up";
          dirTxt = t({ zh: "再高一點", en: "Higher" });
          if (n + 1 > lo) lo = n + 1;
        } else {
          dir = "down"; dirCls = "g-guess-dir--down";
          dirTxt = t({ zh: "再低一點", en: "Lower" });
          if (n - 1 < hi) hi = n - 1;
        }
        var hot = hotHint(Math.abs(target - n));
        guesses.push({ num: n, dir: dir, hot: hot });

        feedback.className = "g-guess-feedback " + dirCls;
        feedback.innerHTML =
          icon(dir === "up" ? "arrow_upward" : "arrow_downward") +
          '<span>' + ctx.esc(dirTxt) + '</span>' +
          ' <span class="g-guess-hot g-guess-hot--' + hot.cls + '">' +
            icon(hot.icon) + ctx.esc(hot.txt) + '</span>';

        rangeEl.textContent = lo + "–" + hi;
        renderPrompt();
        renderList();
        input.value = "";
        input.focus();
      }

      function startNewRound() {
        reset();
        input.disabled = false;
        submit.disabled = false;
        input.value = "";
        again.style.display = "none";
        gradeEl.style.display = "none";
        gradeEl.textContent = "";
        note.textContent = "";
        feedback.className = "g-guess-feedback";
        feedback.innerHTML = "";
        countEl.textContent = "0";
        rangeEl.textContent = lo + "–" + hi;
        renderPrompt();
        renderList();
        input.focus();
      }

      function setDifficulty(idx) {
        rangeMax = ranges[idx];
        diff0.setAttribute("aria-pressed", idx === 0 ? "true" : "false");
        diff1.setAttribute("aria-pressed", idx === 1 ? "true" : "false");
        input.setAttribute("max", String(rangeMax));
        startNewRound();
      }

      /* ---- 事件 ---- */
      function onSubmit(e) {
        e.preventDefault();
        submitGuess();
      }
      function onAgain() { startNewRound(); }
      function onDiff0() { setDifficulty(0); }
      function onDiff1() { setDifficulty(1); }

      form.addEventListener("submit", onSubmit);
      again.addEventListener("click", onAgain);
      diff0.addEventListener("click", onDiff0);
      diff1.addEventListener("click", onDiff1);

      /* 初始畫面 */
      renderPrompt();
      rangeEl.textContent = lo + "–" + hi;

      /* cleanup:語言切換 / 關閉時清掉所有 listener */
      return function cleanup() {
        form.removeEventListener("submit", onSubmit);
        again.removeEventListener("click", onAgain);
        diff0.removeEventListener("click", onDiff0);
        diff1.removeEventListener("click", onDiff1);
      };
    }
  });
})();
