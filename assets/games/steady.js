/* =========================================================================
   steady.js — 妙手手術 / Steady Hand   (技巧 / Skill)

   玩法:按住左側「起點」把探針 arm 起來,沿著彎曲的安全通道,
   用滑鼠/手指把探針拖到右側「終點」。碰到牆壁(離開通道)= 失誤,
   探針彈回起點、失誤次數 +1。中途放開也回起點。到終點 = 完成,
   顯示用時;記錄最快通關時間(越低越好)。

   照 reaction.js 的黃金範本結構:IIFE 封裝、window.GAMES.push、
   mount(root, ctx)、一次注入的 scoped CSS(前綴 g-steady-)、
   ctx.t 雙語、ctx.load/save 持久化、回傳 cleanup 清掉所有 timer/listener。

   命中判定採契約建議的最穩做法:pointer 事件 + document.elementFromPoint,
   只要指標下方是通道/起點/終點元素就算 SAFE,其餘皆視為牆。
   ========================================================================= */
(function () {
  "use strict";

  /* ---- scoped CSS:整支遊戲只注入一次,所有 class 前綴 g-steady- ---- */
  function injectCSS() {
    if (document.getElementById("g-steady-css")) return;
    var s = document.createElement("style");
    s.id = "g-steady-css";
    s.textContent = [
      ".g-steady-board{position:relative;width:100%;max-width:560px;margin:0 auto;height:300px;",
        "border-radius:var(--radius-lg);background:var(--surface-container);",
        "border:2px solid var(--outline-variant);overflow:hidden;touch-action:none;",
        "user-select:none;-webkit-user-select:none;}",
      /* 通道由一串寬的 segment div 拼成;它們是「安全區」 */
      ".g-steady-path{position:absolute;background:var(--surface-container-high);",
        "border-radius:999px;box-sizing:border-box;}",
      /* 起點 / 終點 zone */
      ".g-steady-zone{position:absolute;display:flex;align-items:center;justify-content:center;",
        "border-radius:999px;box-sizing:border-box;color:var(--on-surface);font-weight:700;",
        "font-size:.8rem;text-align:center;line-height:1.1;}",
      ".g-steady-start{background:color-mix(in srgb, var(--success) 26%, transparent);",
        "border:2px solid var(--success);}",
      ".g-steady-goal{background:color-mix(in srgb, var(--primary) 26%, transparent);",
        "border:2px solid var(--primary);}",
      /* 探針 dot */
      ".g-steady-probe{position:absolute;width:24px;height:24px;border-radius:50%;",
        "background:#B5651D;border:3px solid var(--surface);",
        "box-shadow:0 1px 5px rgba(0,0,0,.35);transform:translate(-50%,-50%);",
        "pointer-events:none;z-index:3;transition:left .04s linear, top .04s linear;}",
      ".g-steady-probe.g-steady-armed{box-shadow:0 0 0 4px color-mix(in srgb,#B5651D 40%,transparent),0 1px 5px rgba(0,0,0,.35);}",
      ".g-steady-probe.g-steady-hit{background:var(--error);}",
      /* 中央狀態字 */
      ".g-steady-flash{position:absolute;left:50%;top:8px;transform:translateX(-50%);",
        "padding:4px 12px;border-radius:999px;font-size:.85rem;font-weight:700;z-index:4;",
        "color:var(--on-surface);background:color-mix(in srgb,var(--surface) 80%,transparent);",
        "pointer-events:none;max-width:90%;text-align:center;}",
      ".g-steady-flash.g-steady-flash--err{color:var(--error);}",
      ".g-steady-flash.g-steady-flash--win{color:var(--success);}",
      ".g-steady-hint{margin:8px 0 0;text-align:center;}"
    ].join("");
    document.head.appendChild(s);
  }

  /* ---- 完成時間 → 評語(可調)。lower ms = better ---- */
  function gradeTime(ms, t) {
    if (ms < 3500) return t({ zh: "🩺 神之手,穩如磐石", en: "🩺 Surgeon's hands, rock steady" });
    if (ms < 6000) return t({ zh: "👍 手很穩,漂亮", en: "👍 Steady and clean" });
    if (ms < 10000) return t({ zh: "🙂 順利完成", en: "🙂 Made it through" });
    return t({ zh: "🐢 慢工出細活", en: "🐢 Slow but sure" });
  }

  (window.GAMES = window.GAMES || []).push({
    id: "steady",
    icon: "back_hand",
    accent: "#B5651D",
    category: { zh: "技巧", en: "Skill" },
    title:   { zh: "妙手手術", en: "Steady Hand" },
    tagline: { zh: "沿著通道把探針從起點移到終點,別碰到邊。",
               en: "Guide the probe from start to finish without touching the walls." },

    mount: function (root, ctx) {
      injectCSS();
      var t = ctx.t;
      var best = Number(ctx.load("best", 0)) || 0;  // 0 = 尚無紀錄(毫秒,越低越好)

      root.innerHTML =
        '<div class="gu-center">' +
          '<div class="gu-statbar">' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-steady-time">0.0</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "用時 (秒)", en: "Time (s)" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-steady-faults">0</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "失誤", en: "Faults" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-steady-best">' +
              (best ? (best / 1000).toFixed(1) : "—") + '</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "最佳 (秒)", en: "Best (s)" })) + '</span></div>' +
          '</div>' +
          '<div class="g-steady-board" id="g-steady-board">' +
            '<div class="g-steady-flash" id="g-steady-flash">' +
              ctx.esc(t({ zh: "按住「起點」開始", en: "Press START to begin" })) + '</div>' +
            '<div class="g-steady-zone g-steady-start g-steady-path" id="g-steady-start">' +
              ctx.esc(t({ zh: "起點", en: "START" })) + '</div>' +
            '<div class="g-steady-zone g-steady-goal g-steady-path" id="g-steady-goal">' +
              ctx.esc(t({ zh: "終點", en: "GOAL" })) + '</div>' +
            '<div class="g-steady-probe" id="g-steady-probe"></div>' +
          '</div>' +
          '<div class="gu-row" style="margin-top:8px;">' +
            '<button class="gu-btn gu-btn--primary" id="g-steady-reset" type="button">' +
              ctx.esc(t({ zh: "開始 / 重設", en: "Start / Reset" })) + '</button>' +
          '</div>' +
          '<p class="gu-hint g-steady-hint" id="g-steady-grade">' +
            ctx.esc(t({ zh: "提示:按住綠色起點不放,慢慢沿著通道滑到藍色終點。",
                       en: "Tip: hold the green START, then slide along the lane to the blue GOAL." })) + '</p>' +
        '</div>';

      var board   = root.querySelector("#g-steady-board");
      var flash   = root.querySelector("#g-steady-flash");
      var probe   = root.querySelector("#g-steady-probe");
      var startZ  = root.querySelector("#g-steady-start");
      var goalZ   = root.querySelector("#g-steady-goal");
      var timeEl  = root.querySelector("#g-steady-time");
      var faultEl = root.querySelector("#g-steady-faults");
      var bestEl  = root.querySelector("#g-steady-best");
      var grade   = root.querySelector("#g-steady-grade");
      var resetBtn = root.querySelector("#g-steady-reset");

      /* 通道幾何用百分比定義(相對 board),resize 也安全。
         每段是 {x1,y1,x2,y2} 百分比中心點;搭配統一線寬畫成圓角 segment。 */
      var LANE = [
        { x1: 8,  y1: 50, x2: 26, y2: 22 },
        { x1: 26, y1: 22, x2: 46, y2: 78 },
        { x1: 46, y1: 78, x2: 66, y2: 30 },
        { x1: 66, y1: 30, x2: 80, y2: 60 },
        { x1: 80, y1: 60, x2: 92, y2: 50 }
      ];
      var LANE_W = 56;       // 通道線寬(px),夠寬在手機上才公平
      var ZONE = 46;         // 起點/終點圓直徑(px)
      var WIN_MS = 0;

      var armed = false;     // 是否已從起點 arm
      var startTime = 0;
      var faults = 0;
      var won = false;
      var rafId = null;
      var segEls = [];

      function rad(deg) { return deg * Math.PI / 180; }

      /* 依目前 board 尺寸把通道 segment 與起終點畫上去(百分比 → px) */
      function layout() {
        // 移除舊 segment
        for (var i = 0; i < segEls.length; i++) {
          if (segEls[i].parentNode) segEls[i].parentNode.removeChild(segEls[i]);
        }
        segEls = [];
        var bw = board.clientWidth || 320;
        var bh = board.clientHeight || 300;

        for (var j = 0; j < LANE.length; j++) {
          var seg = LANE[j];
          var ax = seg.x1 / 100 * bw, ay = seg.y1 / 100 * bh;
          var bx = seg.x2 / 100 * bw, by = seg.y2 / 100 * bh;
          var dx = bx - ax, dy = by - ay;
          var len = Math.sqrt(dx * dx + dy * dy) + LANE_W; // +線寬讓接縫圓潤
          var ang = Math.atan2(dy, dx);
          var cx = (ax + bx) / 2, cy = (ay + by) / 2;
          var el = document.createElement("div");
          el.className = "g-steady-path";
          el.style.width = len + "px";
          el.style.height = LANE_W + "px";
          el.style.left = (cx - len / 2) + "px";
          el.style.top = (cy - LANE_W / 2) + "px";
          el.style.transform = "rotate(" + (ang) + "rad)";
          board.appendChild(el);
          segEls.push(el);
        }

        // 起點(第一段起點)/ 終點(最後一段終點)
        var s0 = LANE[0], sL = LANE[LANE.length - 1];
        var sx = s0.x1 / 100 * bw, sy = s0.y1 / 100 * bh;
        var gx = sL.x2 / 100 * bw, gy = sL.y2 / 100 * bh;
        startZ.style.width = ZONE + "px"; startZ.style.height = ZONE + "px";
        startZ.style.left = (sx - ZONE / 2) + "px"; startZ.style.top = (sy - ZONE / 2) + "px";
        goalZ.style.width = ZONE + "px"; goalZ.style.height = ZONE + "px";
        goalZ.style.left = (gx - ZONE / 2) + "px"; goalZ.style.top = (gy - ZONE / 2) + "px";

        // 探針停在起點
        if (!armed) placeProbe(sx, sy);
      }

      function placeProbe(x, y) {
        probe.style.left = x + "px";
        probe.style.top = y + "px";
      }

      function setFlash(txt, kind) {
        flash.textContent = txt;
        flash.className = "g-steady-flash" + (kind ? " g-steady-flash--" + kind : "");
      }

      function resetProbeToStart() {
        var bw = board.clientWidth || 320, bh = board.clientHeight || 300;
        var s0 = LANE[0];
        placeProbe(s0.x1 / 100 * bw, s0.y1 / 100 * bh);
      }

      /* 判定某個畫面座標是否在安全通道內:用 elementFromPoint。
         指標下若是 g-steady-path / start / goal(它們都帶 g-steady-path)即安全。 */
      function isSafeAt(clientX, clientY) {
        var prevPe = probe.style.pointerEvents;
        probe.style.pointerEvents = "none"; // 探針本來就 none,保險再設一次
        var el = document.elementFromPoint(clientX, clientY);
        probe.style.pointerEvents = prevPe;
        if (!el) return false;
        // 必須仍在本 board 範圍內
        if (!board.contains(el)) return false;
        return el.classList && el.classList.contains("g-steady-path");
      }

      function isOnElem(clientX, clientY, elem) {
        var el = document.elementFromPoint(clientX, clientY);
        return !!el && (el === elem || elem.contains(el));
      }

      function tick() {
        if (armed && !won) {
          var now = (window.performance && performance.now) ? performance.now() : Date.now();
          timeEl.textContent = ((now - startTime) / 1000).toFixed(1);
          rafId = requestAnimationFrame(tick);
        }
      }

      function fault() {
        faults++;
        faultEl.textContent = faults;
        disarm();
        probe.classList.add("g-steady-hit");
        setFlash(t({ zh: "失誤!回到起點", en: "Touched! Back to start" }), "err");
        resetProbeToStart();
        setTimeout(function () { probe.classList.remove("g-steady-hit"); }, 220);
      }

      function disarm() {
        armed = false;
        probe.classList.remove("g-steady-armed");
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }

      function win(clientX, clientY) {
        var now = (window.performance && performance.now) ? performance.now() : Date.now();
        var ms = Math.round(now - startTime);
        WIN_MS = ms;
        won = true;
        disarm();
        timeEl.textContent = (ms / 1000).toFixed(1);
        if (!best || ms < best) {
          best = ms; ctx.save("best", best); bestEl.textContent = (best / 1000).toFixed(1);
        }
        setFlash(t({ zh: "完成!", en: "Done!" }), "win");
        grade.textContent = gradeTime(ms, t) + "  ·  " +
          t({ zh: "再玩一次:按重設", en: "Play again: press Reset" });
      }

      function onPointerDown(e) {
        if (won) return;
        // 只在「起點」上按下才 arm
        if (!isOnElem(e.clientX, e.clientY, startZ)) return;
        if (board.setPointerCapture) {
          try { board.setPointerCapture(e.pointerId); } catch (err) {}
        }
        armed = true;
        won = false;
        probe.classList.add("g-steady-armed");
        startTime = (window.performance && performance.now) ? performance.now() : Date.now();
        placeProbe(e.clientX - board.getBoundingClientRect().left,
                   e.clientY - board.getBoundingClientRect().top);
        setFlash(t({ zh: "穩住…滑向終點", en: "Steady… slide to goal" }), null);
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(tick);
        e.preventDefault();
      }

      function onPointerMove(e) {
        if (!armed || won) return;
        e.preventDefault();
        var rect = board.getBoundingClientRect();
        placeProbe(e.clientX - rect.left, e.clientY - rect.top);
        // 先看是否進入終點 → 勝利
        if (isOnElem(e.clientX, e.clientY, goalZ)) { win(e.clientX, e.clientY); return; }
        // 否則檢查是否還在安全通道
        if (!isSafeAt(e.clientX, e.clientY)) fault();
      }

      function onPointerUp(e) {
        if (won || !armed) return;
        // 提早放開(未到終點)= 回起點(不算失誤,但需重新 arm)
        disarm();
        setFlash(t({ zh: "放開了,按住起點重來", en: "Released — hold START to retry" }), null);
        resetProbeToStart();
      }

      // touchmove 在 board 上阻止頁面捲動(pointer 通常已涵蓋,保險再加)
      function onTouchMove(e) {
        if (armed) e.preventDefault();
      }

      function fullReset() {
        disarm();
        won = false;
        faults = 0;
        faultEl.textContent = "0";
        timeEl.textContent = "0.0";
        setFlash(t({ zh: "按住「起點」開始", en: "Press START to begin" }), null);
        grade.textContent = t({ zh: "提示:按住綠色起點不放,慢慢沿著通道滑到藍色終點。",
                                en: "Tip: hold the green START, then slide along the lane to the blue GOAL." });
        layout();
      }

      board.addEventListener("pointerdown", onPointerDown);
      board.addEventListener("pointermove", onPointerMove);
      board.addEventListener("pointerup", onPointerUp);
      board.addEventListener("pointercancel", onPointerUp);
      board.addEventListener("touchmove", onTouchMove, { passive: false });
      resetBtn.addEventListener("click", fullReset);

      // 視窗尺寸改變時重畫通道
      var onResize = function () { if (!armed) layout(); };
      window.addEventListener("resize", onResize);

      // 初次布局(等一拍確保 board 已有尺寸)
      layout();
      var layoutTimer = setTimeout(layout, 60);

      /* cleanup:關閉或語言切換時,清掉 raf / timer 與所有 listener */
      return function cleanup() {
        if (rafId) cancelAnimationFrame(rafId);
        if (layoutTimer) clearTimeout(layoutTimer);
        board.removeEventListener("pointerdown", onPointerDown);
        board.removeEventListener("pointermove", onPointerMove);
        board.removeEventListener("pointerup", onPointerUp);
        board.removeEventListener("pointercancel", onPointerUp);
        board.removeEventListener("touchmove", onTouchMove);
        resetBtn.removeEventListener("click", fullReset);
        window.removeEventListener("resize", onResize);
      };
    }
  });
})();
