/* =========================================================================
   breath.js — 深呼吸放鬆 / Breathing Pacer   ★ 紓壓 / Wellness

   玩法:點「開始」→ 跟著大圓圈做「方塊呼吸」四階段循環:
   吸氣 Inhale(4s,圓圈漲大)→ 屏息 Hold(4s,維持大)→
   吐氣 Exhale(4s,縮小)→ 屏息 Hold(4s,維持小)。
   圓圈中央顯示當前階段與倒數秒數。可隨時暫停。
   每完成一輪計一次循環,記錄單次最多循環數(越多越好)。

   結構照官方範本 reaction.js:IIFE 封裝、window.GAMES.push、
   mount(root, ctx)、一次注入的 scoped CSS(前綴 g-breath-)、
   ctx.t 雙語、ctx.load/save 持久化、回傳 cleanup 清掉所有計時器與動畫。
   ========================================================================= */
(function () {
  "use strict";

  /* ---- 方塊呼吸四階段(4-4-4-4 預設;另提供 4-7-8 預設可切換)---- */
  var PRESETS = {
    box:   { id: "box",   secs: [4, 4, 4, 4],
             name: { zh: "方塊呼吸 4-4-4-4", en: "Box 4-4-4-4" } },
    "478": { id: "478",   secs: [4, 7, 8, 0],
             name: { zh: "放鬆呼吸 4-7-8", en: "Relax 4-7-8" } }
  };
  // 階段順序固定:吸氣 → 屏息 → 吐氣 → 屏息
  var PHASES = [
    { key: "inhale", label: { zh: "吸氣", en: "Inhale" }, scale: 1 },
    { key: "hold1",  label: { zh: "屏息", en: "Hold" },   scale: 1 },
    { key: "exhale", label: { zh: "吐氣", en: "Exhale" }, scale: 0 },
    { key: "hold2",  label: { zh: "屏息", en: "Hold" },   scale: 0 }
  ];

  /* ---- scoped CSS:整支遊戲只注入一次,所有 class 前綴 g-breath- ---- */
  function injectCSS() {
    if (document.getElementById("g-breath-css")) return;
    var s = document.createElement("style");
    s.id = "g-breath-css";
    s.textContent = [
      ".g-breath-wrap{width:100%;max-width:560px;margin:0 auto;}",
      /* 圓圈舞台:用 vw/clamp 控大小,375px 也不溢出 */
      ".g-breath-stage{position:relative;width:100%;display:flex;align-items:center;",
        "justify-content:center;height:clamp(220px,68vw,340px);margin:8px auto 4px;}",
      /* 外圈柔光,呼應 primary-container */
      ".g-breath-ring{position:absolute;width:clamp(200px,64vw,320px);",
        "height:clamp(200px,64vw,320px);border-radius:50%;",
        "background:var(--primary-container);opacity:.45;",
        "transform:scale(var(--g-breath-s,.55));",
        "transition:transform var(--g-breath-dur,4s) var(--g-breath-ease,ease-in-out);}",
      /* 主圓:會隨呼吸縮放 */
      ".g-breath-circle{position:relative;width:clamp(150px,48vw,240px);",
        "height:clamp(150px,48vw,240px);border-radius:50%;",
        "background:var(--primary);color:var(--on-primary);",
        "display:flex;flex-direction:column;align-items:center;justify-content:center;",
        "gap:4px;text-align:center;user-select:none;",
        "box-shadow:0 8px 28px -12px var(--primary);",
        "transform:scale(var(--g-breath-s,.55));",
        "transition:transform var(--g-breath-dur,4s) var(--g-breath-ease,ease-in-out),",
        "background .6s ease;}",
      ".g-breath-circle.is-hold{background:var(--secondary-container);",
        "color:var(--on-surface);box-shadow:none;}",
      ".g-breath-phase{font-size:1.5rem;font-weight:700;letter-spacing:.5px;}",
      ".g-breath-count{font-size:2.4rem;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;}",
      ".g-breath-idlehint{font-size:.95rem;font-weight:600;opacity:.95;padding:0 14px;}",
      /* 預設切換 chip 列 */
      ".g-breath-presets{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:2px 0 10px;}",
      ".g-breath-chip{border:1px solid var(--outline-variant);background:transparent;",
        "color:var(--on-surface-variant);border-radius:999px;padding:6px 14px;",
        "font:inherit;font-size:.85rem;font-weight:600;cursor:pointer;}",
      ".g-breath-chip.is-on{background:var(--secondary-container);",
        "color:var(--on-surface);border-color:transparent;}",
      ".g-breath-timer{text-align:center;font-variant-numeric:tabular-nums;}"
    ].join("");
    document.head.appendChild(s);
  }

  function fmtClock(totalSec) {
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    return m + ":" + (s < 10 ? "0" + s : s);
  }

  (window.GAMES = window.GAMES || []).push({
    id: "breath",
    icon: "self_improvement",
    accent: "#4A6364",
    category: { zh: "紓壓", en: "Wellness" },
    title:   { zh: "深呼吸放鬆", en: "Breathing Pacer" },
    tagline: { zh: "跟著圓圈一吸一吐,做幾輪方塊呼吸放鬆一下。",
               en: "Follow the circle through box-breathing to unwind." },

    mount: function (root, ctx) {
      injectCSS();
      var t = ctx.t;
      var best = Number(ctx.load("best", 0)) || 0;  // 0 = 尚無紀錄(單次最多循環數)

      root.innerHTML =
        '<div class="gu-center g-breath-wrap">' +
          '<div class="gu-statbar">' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-breath-cycles">0</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "完成循環", en: "Cycles" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-breath-best">' +
              (best ? best : "—") + '</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "最佳循環", en: "Best" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v g-breath-timer" id="g-breath-clock">0:00</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "時長", en: "Time" })) + '</span></div>' +
          '</div>' +

          '<div class="g-breath-presets" id="g-breath-presets">' +
            '<button class="g-breath-chip is-on" type="button" data-preset="box">' +
              ctx.esc(t(PRESETS.box.name)) + '</button>' +
            '<button class="g-breath-chip" type="button" data-preset="478">' +
              ctx.esc(t(PRESETS["478"].name)) + '</button>' +
          '</div>' +

          '<div class="g-breath-stage">' +
            '<div class="g-breath-ring" aria-hidden="true"></div>' +
            '<div class="g-breath-circle" id="g-breath-circle">' +
              '<span class="g-breath-phase" id="g-breath-phase">' +
                ctx.esc(t({ zh: "準備", en: "Ready" })) + '</span>' +
              '<span class="g-breath-count" id="g-breath-count"></span>' +
              '<span class="g-breath-idlehint" id="g-breath-hint">' +
                ctx.esc(t({ zh: "按開始,跟著圓圈呼吸", en: "Press start and breathe with the circle" })) + '</span>' +
            '</div>' +
          '</div>' +

          '<div class="gu-row">' +
            '<button class="gu-btn gu-btn--primary" id="g-breath-toggle" type="button">' +
              ctx.esc(t({ zh: "開始", en: "Start" })) + '</button>' +
            '<button class="gu-btn gu-btn--tonal" id="g-breath-reset" type="button">' +
              ctx.esc(t({ zh: "重設", en: "Reset" })) + '</button>' +
          '</div>' +
          '<p class="gu-hint">' +
            ctx.esc(t({ zh: "鼻子緩緩吸、輕輕吐,讓肩膀放鬆。",
                        en: "Inhale gently through the nose, soften the shoulders." })) + '</p>' +
        '</div>';

      var ring    = root.querySelector(".g-breath-ring");
      var circle  = root.querySelector("#g-breath-circle");
      var phaseEl = root.querySelector("#g-breath-phase");
      var countEl = root.querySelector("#g-breath-count");
      var hintEl  = root.querySelector("#g-breath-hint");
      var cyclesEl = root.querySelector("#g-breath-cycles");
      var bestEl  = root.querySelector("#g-breath-best");
      var clockEl = root.querySelector("#g-breath-clock");
      var toggle  = root.querySelector("#g-breath-toggle");
      var resetBtn = root.querySelector("#g-breath-reset");
      var presets = root.querySelector("#g-breath-presets");

      var running = false;
      var preset = PRESETS.box;
      var phaseIdx = 0;          // 目前在 PHASES 的哪一階段
      var phaseEndAt = 0;        // 此階段結束的時間戳(ms)
      var phaseDur = 0;          // 此階段總長(秒;0 = 跳過)
      var cycles = 0;
      var elapsed = 0;          // 本次 session 累計秒數
      var sessionStart = 0;     // 開始/恢復計時的時間戳
      var rafId = null;
      var lastClock = -1;       // 避免每幀都動 DOM

      function now() {
        return (window.performance && performance.now) ? performance.now() : Date.now();
      }

      function applyScale(scale, durSec, immediate) {
        // scale: 1 = 漲大(吸氣後),0 = 縮小(吐氣後)
        var s = scale ? 1 : 0.55;
        if (immediate) {
          circle.style.setProperty("--g-breath-dur", "0s");
          ring.style.setProperty("--g-breath-dur", "0s");
        } else {
          circle.style.setProperty("--g-breath-dur", durSec + "s");
          ring.style.setProperty("--g-breath-dur", durSec + "s");
        }
        circle.style.setProperty("--g-breath-s", s);
        ring.style.setProperty("--g-breath-s", s);
      }

      // 找出此 preset 下,從某階段起第一個非零秒數的階段(跳過秒數 0 的階段)
      function nextActiveIdx(fromIdx) {
        for (var i = 0; i < PHASES.length; i++) {
          var idx = (fromIdx + i) % PHASES.length;
          if (preset.secs[idx] > 0) return idx;
        }
        return 0;
      }

      function enterPhase(idx) {
        phaseIdx = idx;
        var ph = PHASES[idx];
        phaseDur = preset.secs[idx];
        phaseEndAt = now() + phaseDur * 1000;

        var holding = (ph.key === "hold1" || ph.key === "hold2");
        circle.classList.toggle("is-hold", holding);
        phaseEl.textContent = t(ph.label);
        hintEl.textContent = "";

        // 吸氣 / 屏息(大)→ scale 1;吐氣 / 屏息(小)→ scale 0
        applyScale(ph.scale, phaseDur, false);
        updateCount();
      }

      function updateCount() {
        var remain = Math.max(0, Math.ceil((phaseEndAt - now()) / 1000));
        if (remain < 1) remain = 1;
        if (remain > phaseDur) remain = phaseDur;
        countEl.textContent = remain;
      }

      function advancePhase() {
        // 從下一階段開始找出下一個有效(秒數>0)階段
        var nextIdx = nextActiveIdx((phaseIdx + 1) % PHASES.length);
        // 完成一輪:當我們從序列尾端繞回 inhale(index 0)
        if (nextIdx === 0) {
          cycles += 1;
          cyclesEl.textContent = cycles;
          if (cycles > best) {
            best = cycles;
            ctx.save("best", best);
            bestEl.textContent = best;
          }
        }
        enterPhase(nextIdx);
      }

      function tick() {
        rafId = null;
        if (!running) return;

        var tnow = now();

        // session 計時
        elapsed += (tnow - sessionStart) / 1000;
        sessionStart = tnow;
        var whole = Math.floor(elapsed);
        if (whole !== lastClock) {
          lastClock = whole;
          clockEl.textContent = fmtClock(whole);
        }

        // 階段倒數 / 推進
        if (tnow >= phaseEndAt) {
          advancePhase();
        } else {
          updateCount();
        }

        rafId = window.requestAnimationFrame(tick);
      }

      function start() {
        if (running) return;
        running = true;
        toggle.textContent = t({ zh: "暫停", en: "Pause" });
        sessionStart = now();
        if (phaseDur === 0) {
          // 第一次啟動:從吸氣開始
          enterPhase(nextActiveIdx(0));
        } else {
          // 從暫停恢復:重新對齊本階段剩餘時間
          var remainMs = Math.max(300, phaseEndAt - now());
          phaseEndAt = now() + remainMs;
        }
        rafId = window.requestAnimationFrame(tick);
      }

      function pause() {
        if (!running) return;
        running = false;
        toggle.textContent = t({ zh: "繼續", en: "Resume" });
        if (rafId) { window.cancelAnimationFrame(rafId); rafId = null; }
        // 凍結縮放在當前視覺狀態
        var cs = getComputedStyle(circle).getPropertyValue("transform");
        if (cs && cs !== "none") {
          // 保留目前 transform,避免暫停時繼續滑動
          applyScale(PHASES[phaseIdx].scale, 0, true);
        }
      }

      function reset() {
        running = false;
        if (rafId) { window.cancelAnimationFrame(rafId); rafId = null; }
        phaseIdx = 0;
        phaseDur = 0;
        phaseEndAt = 0;
        cycles = 0;
        elapsed = 0;
        lastClock = -1;
        cyclesEl.textContent = "0";
        clockEl.textContent = "0:00";
        countEl.textContent = "";
        circle.classList.remove("is-hold");
        phaseEl.textContent = t({ zh: "準備", en: "Ready" });
        hintEl.textContent = t({ zh: "按開始,跟著圓圈呼吸", en: "Press start and breathe with the circle" });
        toggle.textContent = t({ zh: "開始", en: "Start" });
        applyScale(0, 0, true);   // 縮回小圓
      }

      function onToggle() {
        if (running) pause(); else start();
      }

      function onPreset(e) {
        var btn = e.target.closest("[data-preset]");
        if (!btn) return;
        var key = btn.getAttribute("data-preset");
        if (!PRESETS[key] || PRESETS[key] === preset) return;
        preset = PRESETS[key];
        var chips = presets.querySelectorAll(".g-breath-chip");
        for (var i = 0; i < chips.length; i++) {
          chips[i].classList.toggle("is-on", chips[i] === btn);
        }
        reset();   // 換預設等於重設一局
      }

      toggle.addEventListener("click", onToggle);
      resetBtn.addEventListener("click", reset);
      presets.addEventListener("click", onPreset);

      // 初始視覺:小圓、idle
      applyScale(0, 0, true);

      /* cleanup:關閉或語言切換時,停掉呼吸動畫迴圈與 listener(關鍵)*/
      return function cleanup() {
        running = false;
        if (rafId) { window.cancelAnimationFrame(rafId); rafId = null; }
        toggle.removeEventListener("click", onToggle);
        resetBtn.removeEventListener("click", reset);
        presets.removeEventListener("click", onPreset);
      };
    }
  });
})();
