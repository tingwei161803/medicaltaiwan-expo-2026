/* =========================================================================
   reaction.js — 急診反應力測驗 / ER Reflex   ★ 參考實作(其他遊戲照此結構寫)

   玩法:點「開始」→ 畫面變紅,等待隨機 1–4 秒 → 轉綠的瞬間點下去,
   量你的反應時間(ms)。太早點(紅燈時)= 犯規重來。記錄最佳成績。

   這支檔案是契約的黃金範本,示範:IIFE 封裝、window.GAMES.push、
   mount(root, ctx)、一次注入的 scoped CSS(前綴 g-reaction-)、
   ctx.t 雙語、ctx.load/save 持久化、回傳 cleanup 清掉所有 timer/listener。
   ========================================================================= */
(function () {
  "use strict";

  /* ---- scoped CSS:整支遊戲只注入一次,所有 class 前綴 g-reaction- ---- */
  function injectCSS() {
    if (document.getElementById("g-reaction-css")) return;
    var s = document.createElement("style");
    s.id = "g-reaction-css";
    s.textContent = [
      ".g-reaction-pad{width:100%;max-width:560px;margin:0 auto;height:300px;border-radius:var(--radius-lg);",
        "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;cursor:pointer;",
        "user-select:none;color:#fff;font-weight:700;text-align:center;border:none;font:inherit;font-weight:700;",
        "transition:background .08s;padding:20px;}",
      ".g-reaction-pad__big{font-size:1.5rem;}",
      ".g-reaction-pad__sub{font-size:.95rem;font-weight:500;opacity:.92;}",
      ".g-reaction-wait{background:#B3261E;}",      /* 紅:等待 */
      ".g-reaction-go{background:#2E7D32;}",        /* 綠:出手 */
      ".g-reaction-idle{background:var(--tertiary);}",
      ".g-reaction-early{background:#8E4585;}",     /* 太早 */
      ".g-reaction-result{background:var(--primary);}",
      ".g-reaction-grade{font-size:.95rem;font-weight:600;margin:0;text-align:center;}"
    ].join("");
    document.head.appendChild(s);
  }

  /* ---- 反應時間 → 評語(可調)。lower ms = better ---- */
  function gradeReaction(ms, t) {
    if (ms < 200) return t({ zh: "⚡ 超人反射!", en: "⚡ Superhuman!" });
    if (ms < 270) return t({ zh: "🏥 急診等級,極快", en: "🏥 ER-grade, lightning fast" });
    if (ms < 350) return t({ zh: "👍 反應不錯", en: "👍 Solid reflex" });
    if (ms < 450) return t({ zh: "🙂 一般水準", en: "🙂 About average" });
    return t({ zh: "🐢 喝杯咖啡再來", en: "🐢 Maybe grab a coffee first" });
  }

  (window.GAMES = window.GAMES || []).push({
    id: "reaction",
    icon: "bolt",
    accent: "#B3261E",
    category: { zh: "反應力", en: "Reflex" },
    title:   { zh: "急診反應力", en: "ER Reflex" },
    tagline: { zh: "綠燈亮起就出手,測你的反應有多快。",
               en: "Tap the instant it turns green — how fast are you?" },

    mount: function (root, ctx) {
      injectCSS();
      var t = ctx.t;
      var best = Number(ctx.load("best", 0)) || 0;  // 0 = 尚無紀錄

      root.innerHTML =
        '<div class="gu-center">' +
          '<div class="gu-statbar">' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-reaction-last">—</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "本次 (ms)", en: "Last (ms)" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-reaction-best">' +
              (best ? best : "—") + '</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "最佳 (ms)", en: "Best (ms)" })) + '</span></div>' +
          '</div>' +
          '<button class="g-reaction-pad g-reaction-idle" id="g-reaction-pad" type="button">' +
            '<span class="g-reaction-pad__big" id="g-reaction-big">' +
              ctx.esc(t({ zh: "點此開始", en: "Tap to start" })) + '</span>' +
            '<span class="g-reaction-pad__sub" id="g-reaction-sub">' +
              ctx.esc(t({ zh: "等變綠燈再點,別搶快", en: "Wait for green, don't jump the gun" })) + '</span>' +
          '</button>' +
          '<p class="g-reaction-grade gu-hint" id="g-reaction-grade"></p>' +
        '</div>';

      var pad   = root.querySelector("#g-reaction-pad");
      var big   = root.querySelector("#g-reaction-big");
      var sub   = root.querySelector("#g-reaction-sub");
      var grade = root.querySelector("#g-reaction-grade");
      var lastEl = root.querySelector("#g-reaction-last");
      var bestEl = root.querySelector("#g-reaction-best");

      var phase = "idle";          // idle | waiting | go
      var timer = null;            // 紅→綠的延遲 timer
      var greenAt = 0;             // 轉綠的時間戳

      function setPad(cls, bigTxt, subTxt) {
        pad.className = "g-reaction-pad " + cls;
        big.textContent = bigTxt;
        sub.textContent = subTxt;
      }

      function arm() {
        phase = "waiting";
        grade.textContent = "";
        setPad("g-reaction-wait",
          t({ zh: "等待綠燈…", en: "Wait for green…" }),
          t({ zh: "綠燈一亮立刻點", en: "Tap the moment it turns green" }));
        var delay = 1000 + Math.random() * 3000;   // 1–4 秒隨機
        timer = setTimeout(function () {
          phase = "go";
          greenAt = (window.performance && performance.now) ? performance.now() : Date.now();
          setPad("g-reaction-go",
            t({ zh: "點!", en: "TAP!" }),
            t({ zh: "就是現在", en: "Now!" }));
        }, delay);
      }

      function finish(ms) {
        phase = "result";
        lastEl.textContent = ms;
        if (!best || ms < best) {
          best = ms; ctx.save("best", best); bestEl.textContent = best;
        }
        grade.textContent = gradeReaction(ms, t);
        setPad("g-reaction-result",
          ms + " ms",
          t({ zh: "再點一次重來", en: "Tap to try again" }));
        phase = "idle";
      }

      function onPad() {
        if (phase === "idle") { arm(); return; }
        if (phase === "waiting") {                 // 搶快 = 犯規
          if (timer) { clearTimeout(timer); timer = null; }
          phase = "idle";
          grade.textContent = "";
          setPad("g-reaction-early",
            t({ zh: "太早了!", en: "Too soon!" }),
            t({ zh: "紅燈不能點,點此重來", en: "Don't tap on red — tap to retry" }));
          return;
        }
        if (phase === "go") {
          var now = (window.performance && performance.now) ? performance.now() : Date.now();
          finish(Math.round(now - greenAt));
        }
      }

      pad.addEventListener("click", onPad);

      /* cleanup:關閉或語言切換時,清掉待觸發的 timer 與 listener */
      return function cleanup() {
        if (timer) clearTimeout(timer);
        pad.removeEventListener("click", onPad);
      };
    }
  });
})();
