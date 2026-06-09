/* =========================================================================
   whack.js — 病菌大作戰 / Germ Buster   (Reflex / 反應力)

   玩法:點「開始」→ 30 秒倒數開始。3×3 的洞口會隨機冒出病菌 🦠,
   點到 +1 分;偶爾冒出好細胞 ❤️/💊,誤點 -1 分並中斷連擊。
   時間越長冒得越快(輕微難度遞增)。時間到凍結棋盤,顯示最終分數。
   記錄最高分(越高越好)。

   依《_CONTRACT.md》結構撰寫:IIFE 封裝、window.GAMES.push、
   mount(root, ctx)、一次注入的 scoped CSS(前綴 g-whack-)、ctx.t 雙語、
   ctx.load/save 持久化、回傳 cleanup 清掉所有 timer/interval/listener。
   ========================================================================= */
(function () {
  "use strict";

  /* ---- scoped CSS:整支遊戲只注入一次,所有 class 前綴 g-whack- ---- */
  function injectCSS() {
    if (document.getElementById("g-whack-css")) return;
    var s = document.createElement("style");
    s.id = "g-whack-css";
    s.textContent = [
      ".g-whack-wrap{width:100%;max-width:560px;margin:0 auto;}",
      ".g-whack-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;",
        "width:100%;margin:8px auto 0;}",
      ".g-whack-hole{aspect-ratio:1/1;width:100%;border:1px solid var(--outline-variant);",
        "border-radius:var(--radius);background:var(--surface-container-high);",
        "display:flex;align-items:center;justify-content:center;cursor:pointer;",
        "font-size:2rem;line-height:1;user-select:none;padding:0;font:inherit;",
        "color:var(--on-surface);transition:transform .08s,background .12s;}",
      ".g-whack-hole:active{transform:scale(.94);}",
      ".g-whack-hole:disabled{cursor:default;opacity:.85;}",
      ".g-whack-hole--germ{background:var(--primary-container);}",
      ".g-whack-hole--good{background:var(--tertiary-container);}",
      ".g-whack-hole--hit{background:var(--success,#2E7D32);color:#fff;}",
      ".g-whack-hole--bad{background:var(--error,#B3261E);color:#fff;}",
      ".g-whack-mole{display:inline-block;animation:g-whack-pop .14s ease-out;}",
      "@keyframes g-whack-pop{from{transform:scale(.3);opacity:.2;}to{transform:scale(1);opacity:1;}}",
      ".g-whack-combo{min-height:1.4em;}"
    ].join("");
    document.head.appendChild(s);
  }

  /* ---- 最終分數 → 評語(可調)。higher = better ---- */
  function gradeScore(n, t) {
    if (n >= 30) return t({ zh: "🏆 防疫指揮官!", en: "🏆 Outbreak commander!" });
    if (n >= 20) return t({ zh: "🥼 滅菌高手", en: "🥼 Sterilization pro" });
    if (n >= 12) return t({ zh: "👍 手速不錯", en: "👍 Quick hands" });
    if (n >= 5)  return t({ zh: "🙂 還行,再練練", en: "🙂 Not bad, keep at it" });
    return t({ zh: "🦠 病菌大獲全勝…", en: "🦠 The germs won this round…" });
  }

  (window.GAMES = window.GAMES || []).push({
    id: "whack",
    icon: "pest_control",
    accent: "#2E7D32",
    category: { zh: "反應力", en: "Reflex" },
    title:   { zh: "病菌大作戰", en: "Germ Buster" },
    tagline: { zh: "30 秒內消滅冒出來的病菌,小心別誤傷好細胞。",
               en: "Smash the germs in 30s — don't hit the good cells." },

    mount: function (root, ctx) {
      injectCSS();
      var t = ctx.t;
      var best = Number(ctx.load("best", 0)) || 0;     // 0 = 尚無紀錄

      var ROUND_MS = 30000;                            // 一局 30 秒
      var GERM = "🦠";
      var GOODS = ["❤️", "💊"];                         // 好細胞 / 好藥(誤點扣分)

      root.innerHTML =
        '<div class="gu-center g-whack-wrap">' +
          '<div class="gu-statbar">' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-whack-score">0</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "分數", en: "Score" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-whack-time">30</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "剩餘 (秒)", en: "Time (s)" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-whack-best">' +
              (best ? best : "—") + '</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "最佳", en: "Best" })) + '</span></div>' +
          '</div>' +
          '<p class="gu-hint g-whack-combo" id="g-whack-msg">' +
            ctx.esc(t({ zh: "點「開始」,打地鼠式消滅病菌!", en: "Hit Start and whack those germs!" })) + '</p>' +
          '<div class="g-whack-grid" id="g-whack-grid"></div>' +
          '<div class="gu-row" style="margin-top:12px;">' +
            '<button class="gu-btn gu-btn--primary" id="g-whack-start" type="button">' +
              ctx.esc(t({ zh: "開始", en: "Start" })) + '</button>' +
          '</div>' +
        '</div>';

      var grid    = root.querySelector("#g-whack-grid");
      var scoreEl = root.querySelector("#g-whack-score");
      var timeEl  = root.querySelector("#g-whack-time");
      var bestEl  = root.querySelector("#g-whack-best");
      var msgEl   = root.querySelector("#g-whack-msg");
      var startBtn = root.querySelector("#g-whack-start");

      /* 建立 9 個洞口(button,方便鍵盤/觸控) */
      var holes = [];
      for (var i = 0; i < 9; i++) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "g-whack-hole";
        b.disabled = true;
        b.setAttribute("aria-label", t({ zh: "洞口", en: "hole" }) + " " + (i + 1));
        b.dataset.idx = String(i);
        grid.appendChild(b);
        holes.push(b);
      }

      /* ---- 局內狀態 ---- */
      var playing = false;
      var score = 0;
      var combo = 0;
      var timeLeft = 30;                  // 秒
      var spawnTimer = null;              // 下一次冒出的 timeout
      var hideTimers = [];               // 各洞口的隱藏 timeout
      var roundTimer = null;              // 每秒倒數 interval
      var active = {};                    // idx -> { kind } 目前佔用的洞口

      function clearHideTimers() {
        for (var k = 0; k < hideTimers.length; k++) clearTimeout(hideTimers[k]);
        hideTimers = [];
      }

      function resetHole(b) {
        b.className = "g-whack-hole";
        b.innerHTML = "";
        b.disabled = !playing;
      }

      function elapsedFrac() {
        // 0 → 1 隨時間遞增,用來輕微加快冒出速度
        return Math.min(1, (30 - timeLeft) / 30);
      }

      function scheduleSpawn() {
        if (!playing) return;
        var f = elapsedFrac();
        // 起始 ~600–900ms,終盤稍快(下限 ~360ms),輕微遞增
        var base = 900 - 300 * f;            // 900 → 600
        var delay = base + Math.random() * 180 - 90;
        if (delay < 360) delay = 360;
        spawnTimer = setTimeout(function () {
          spawn();
          scheduleSpawn();
        }, delay);
      }

      function spawn() {
        if (!playing) return;
        // 找一個目前空著的洞口
        var free = [];
        for (var i = 0; i < holes.length; i++) {
          if (!active[i]) free.push(i);
        }
        if (!free.length) return;
        var idx = free[Math.floor(Math.random() * free.length)];
        var isGood = Math.random() < 0.2;    // ~20% 是好細胞
        var kind = isGood ? "good" : "germ";
        var glyph = isGood ? GOODS[Math.floor(Math.random() * GOODS.length)] : GERM;

        var b = holes[idx];
        active[idx] = { kind: kind };
        b.className = "g-whack-hole g-whack-hole--" + kind;
        b.innerHTML = '<span class="g-whack-mole" aria-hidden="true">' + glyph + "</span>";

        // 顯示窗 ~700–900ms
        var life = 700 + Math.random() * 200;
        var ht = setTimeout(function () {
          if (active[idx]) {                 // 沒被點到就自然消失
            delete active[idx];
            resetHole(b);
          }
        }, life);
        hideTimers.push(ht);
      }

      function setMsg(txt) { msgEl.textContent = txt; }

      function onHole(ev) {
        if (!playing) return;
        var b = ev.currentTarget;
        var idx = Number(b.dataset.idx);
        var cur = active[idx];
        if (!cur) return;                    // 點到空洞,無作用

        delete active[idx];
        if (cur.kind === "germ") {
          score += 1;
          combo += 1;
          scoreEl.textContent = String(score);
          b.className = "g-whack-hole g-whack-hole--hit";
          b.innerHTML = '<span class="g-whack-mole" aria-hidden="true">💥</span>';
          if (combo >= 3) {
            setMsg(t({ zh: "連擊 ", en: "Combo " }) + "x" + combo + " 🔥");
          } else {
            setMsg(t({ zh: "命中!+1", en: "Hit! +1" }));
          }
        } else {
          score = Math.max(0, score - 1);    // 不低於 0
          combo = 0;
          scoreEl.textContent = String(score);
          b.className = "g-whack-hole g-whack-hole--bad";
          b.innerHTML = '<span class="g-whack-mole" aria-hidden="true">⚠️</span>';
          setMsg(t({ zh: "那是好細胞!−1", en: "That's a good cell! −1" }));
        }
        // 短暫顯示命中/誤擊回饋後復原
        var ht = setTimeout(function () { resetHole(b); }, 200);
        hideTimers.push(ht);
      }

      function tick() {
        timeLeft -= 1;
        if (timeLeft < 0) timeLeft = 0;
        timeEl.textContent = String(timeLeft);
        if (timeLeft <= 0) endRound();
      }

      function startRound() {
        playing = true;
        score = 0;
        combo = 0;
        timeLeft = 30;
        active = {};
        scoreEl.textContent = "0";
        timeEl.textContent = "30";
        setMsg(t({ zh: "開打!打病菌、避開好細胞", en: "Go! Smash germs, spare the good cells" }));
        for (var i = 0; i < holes.length; i++) resetHole(holes[i]);
        startBtn.disabled = true;
        startBtn.textContent = t({ zh: "進行中…", en: "Playing…" });
        roundTimer = setInterval(tick, 1000);
        scheduleSpawn();
      }

      function endRound() {
        playing = false;
        if (spawnTimer) { clearTimeout(spawnTimer); spawnTimer = null; }
        if (roundTimer) { clearInterval(roundTimer); roundTimer = null; }
        clearHideTimers();
        active = {};
        // 凍結棋盤
        for (var i = 0; i < holes.length; i++) {
          holes[i].disabled = true;
          if (!holes[i].className.match(/--germ|--good|--hit|--bad/)) {
            holes[i].className = "g-whack-hole";
            holes[i].innerHTML = "";
          }
        }
        var isBest = score > best;
        if (isBest) { best = score; ctx.save("best", best); }
        bestEl.textContent = best ? String(best) : "—";
        setMsg(
          gradeScore(score, t) + "  " +
          t({ zh: "最終分數 ", en: "Final score " }) + score +
          (isBest ? t({ zh: " (新紀錄!)", en: " (new best!)" }) : "")
        );
        startBtn.disabled = false;
        startBtn.textContent = t({ zh: "再玩一次", en: "Play again" });
      }

      function onStart() {
        if (playing) return;
        startRound();
      }

      startBtn.addEventListener("click", onStart);
      for (var h = 0; h < holes.length; h++) {
        holes[h].addEventListener("click", onHole);
      }

      /* cleanup:關閉或語言切換時,清掉所有 timer/interval 與 listener */
      return function cleanup() {
        playing = false;
        if (spawnTimer) clearTimeout(spawnTimer);
        if (roundTimer) clearInterval(roundTimer);
        clearHideTimers();
        startBtn.removeEventListener("click", onStart);
        for (var h = 0; h < holes.length; h++) {
          holes[h].removeEventListener("click", onHole);
        }
      };
    }
  });
})();
