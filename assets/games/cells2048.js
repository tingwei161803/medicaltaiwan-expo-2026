/* =========================================================================
   cells2048.js — 細胞合成 2048 / Cell Merge 2048   ★ 益智

   玩法:4×4 棋盤,用方向鍵 / WASD / 滑動(觸控)把方塊往某方向推。
   相同數字的相鄰方塊會合併成兩倍,每移動一次合併一次;之後在空格隨機
   生成一個 2(90%)或 4(10%)。湊出 2048 過關(可續玩);無可走步即結束。
   分數累加每次合併的值,最高分用 ctx.load/save 持久化(越高越好)。

   照 reaction.js 結構寫:IIFE 封裝、window.GAMES.push、mount(root, ctx)、
   一次注入的 scoped CSS(前綴 g-cells2048-)、ctx.t 雙語、
   回傳 cleanup 清掉所有 listener(鍵盤 + 指標/觸控)。
   ========================================================================= */
(function () {
  "use strict";

  var SIZE = 4;
  var WIN = 2048;

  /* 每個數值的方塊底色(這是方塊自己的顏色,允許寫死)。淺色底用深字。 */
  var TILE_BG = {
    2: "#F2E9D8", 4: "#EBDFC2", 8: "#F2B179", 16: "#F59563",
    32: "#F67C5F", 64: "#F65E3B", 128: "#EDCF72", 256: "#EDCC61",
    512: "#EDC850", 1024: "#EDC53F", 2048: "#EDC22E"
  };
  /* 值 >= 8 用白字,2/4 用深字(底色淺) */
  function tileColors(v) {
    var bg = TILE_BG[v] || "#8E4585";  // 超過 2048 用 accent 色
    var fg = (v <= 4) ? "#3A2E1F" : "#FFFFFF";
    return { bg: bg, fg: fg };
  }

  /* ---- scoped CSS:整支遊戲只注入一次,所有 class 前綴 g-cells2048- ---- */
  function injectCSS() {
    if (document.getElementById("g-cells2048-css")) return;
    var s = document.createElement("style");
    s.id = "g-cells2048-css";
    s.textContent = [
      ".g-cells2048-wrap{width:100%;max-width:480px;margin:0 auto;}",
      ".g-cells2048-board{position:relative;width:100%;aspect-ratio:1/1;",
        "background:var(--surface-container-high);border:1px solid var(--outline-variant);",
        "border-radius:var(--radius);padding:2.5%;box-sizing:border-box;",
        "display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);",
        "gap:2.5%;touch-action:none;user-select:none;-webkit-user-select:none;}",
      ".g-cells2048-cell{background:var(--surface-variant);border-radius:var(--radius-sm);}",
      ".g-cells2048-tile{display:flex;align-items:center;justify-content:center;",
        "border-radius:var(--radius-sm);font-weight:800;line-height:1;text-align:center;",
        "font-family:var(--font-body);box-sizing:border-box;padding:2px;}",
      ".g-cells2048-tv2,.g-cells2048-tv4,.g-cells2048-tv8,.g-cells2048-tv16,",
        ".g-cells2048-tv32,.g-cells2048-tv64{font-size:clamp(1.1rem,7vw,2rem);}",
      ".g-cells2048-tv128,.g-cells2048-tv256,.g-cells2048-tv512{font-size:clamp(.95rem,5.5vw,1.6rem);}",
      ".g-cells2048-tv1024,.g-cells2048-tv2048,.g-cells2048-tvbig{font-size:clamp(.75rem,4.2vw,1.25rem);}",
      ".g-cells2048-hint{margin:10px 0 0;}",
      ".g-cells2048-overlay{position:absolute;inset:0;display:flex;flex-direction:column;",
        "align-items:center;justify-content:center;gap:14px;text-align:center;padding:18px;",
        "box-sizing:border-box;border-radius:var(--radius);background:color-mix(in srgb,var(--surface) 80%,transparent);",
        "backdrop-filter:blur(2px);}",
      ".g-cells2048-ovtitle{font-size:1.5rem;font-weight:800;color:var(--on-surface);margin:0;}",
      ".g-cells2048-ovsub{font-size:1rem;color:var(--on-surface-variant);margin:0;}",
      ".g-cells2048-hidden{display:none;}",
      ".g-cells2048-pad{display:grid;grid-template-columns:repeat(3,48px);grid-template-rows:repeat(3,48px);",
        "gap:6px;justify-content:center;margin:12px auto 0;}",
      ".g-cells2048-pad button{font-size:1.3rem;}",
      ".g-cells2048-padspacer{visibility:hidden;}"
    ].join("");
    document.head.appendChild(s);
  }

  (window.GAMES = window.GAMES || []).push({
    id: "cells2048",
    icon: "grid_view",
    accent: "#8E4585",
    category: { zh: "益智", en: "Puzzle" },
    title:   { zh: "細胞合成 2048", en: "Cell Merge 2048" },
    tagline: { zh: "滑動合併相同數字,挑戰湊出 2048。",
               en: "Slide to merge equal tiles — reach 2048." },

    mount: function (root, ctx) {
      injectCSS();
      var t = ctx.t;
      var best = Number(ctx.load("best", 0)) || 0;

      var grid = [];               // SIZE×SIZE,0 = 空
      var score = 0;
      var won = false;             // 是否已達 2048(允許續玩)
      var over = false;            // 是否結束(本局不能再動)

      /* ---------- 棋盤資料 ---------- */
      function emptyGrid() {
        var g = [];
        for (var r = 0; r < SIZE; r++) {
          g.push([0, 0, 0, 0]);
        }
        return g;
      }
      function emptyCells() {
        var cells = [];
        for (var r = 0; r < SIZE; r++) {
          for (var c = 0; c < SIZE; c++) {
            if (grid[r][c] === 0) cells.push([r, c]);
          }
        }
        return cells;
      }
      function spawn() {
        var cells = emptyCells();
        if (!cells.length) return;
        var pick = cells[Math.floor(Math.random() * cells.length)];
        grid[pick[0]][pick[1]] = (Math.random() < 0.9) ? 2 : 4;
      }

      /* 把一列(由「移動方向起點→終點」順序)往起點壓並合併。
         回傳 { row: 新列, gained: 本列得分, moved: 是否有變化 }。 */
      function slideRow(row) {
        var nums = row.filter(function (v) { return v !== 0; });
        var out = [];
        var gained = 0;
        for (var i = 0; i < nums.length; i++) {
          if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
            var merged = nums[i] * 2;
            out.push(merged);
            gained += merged;
            if (merged === WIN) won = true;
            i++; // 跳過已合併的下一格
          } else {
            out.push(nums[i]);
          }
        }
        while (out.length < SIZE) out.push(0);
        var moved = false;
        for (var k = 0; k < SIZE; k++) {
          if (out[k] !== row[k]) { moved = true; break; }
        }
        return { row: out, gained: gained, moved: moved };
      }

      /* 取出某方向的「行/列」並在處理後寫回。dir: left/right/up/down */
      function move(dir) {
        if (over) return false;
        var movedAny = false;
        var gainedTotal = 0;
        var r, c, line, res;

        if (dir === "left" || dir === "right") {
          for (r = 0; r < SIZE; r++) {
            line = grid[r].slice();
            if (dir === "right") line.reverse();
            res = slideRow(line);
            if (dir === "right") res.row.reverse();
            grid[r] = res.row;
            gainedTotal += res.gained;
            if (res.moved) movedAny = true;
          }
        } else {
          for (c = 0; c < SIZE; c++) {
            line = [];
            for (r = 0; r < SIZE; r++) line.push(grid[r][c]);
            if (dir === "down") line.reverse();
            res = slideRow(line);
            if (dir === "down") res.row.reverse();
            for (r = 0; r < SIZE; r++) grid[r][c] = res.row[r];
            gainedTotal += res.gained;
            if (res.moved) movedAny = true;
          }
        }

        if (movedAny) {
          score += gainedTotal;
          spawn();
          if (score > best) { best = score; ctx.save("best", best); }
          render();
          if (!hasMoves()) { over = true; showOverlay(false); }
          else if (won && !overlayShownForWin) { showOverlay(true); }
        }
        return movedAny;
      }

      var overlayShownForWin = false;

      function hasMoves() {
        if (emptyCells().length) return true;
        for (var r = 0; r < SIZE; r++) {
          for (var c = 0; c < SIZE; c++) {
            var v = grid[r][c];
            if (c + 1 < SIZE && grid[r][c + 1] === v) return true;
            if (r + 1 < SIZE && grid[r + 1][c] === v) return true;
          }
        }
        return false;
      }

      /* ---------- 畫面 ---------- */
      root.innerHTML =
        '<div class="gu-center">' +
          '<div class="gu-statbar">' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-cells2048-score">0</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "分數", en: "Score" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-cells2048-best">' +
              (best ? best : "0") + '</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "最佳", en: "Best" })) + '</span></div>' +
          '</div>' +
          '<div class="g-cells2048-wrap">' +
            '<div class="g-cells2048-board" id="g-cells2048-board">' +
              '<div class="g-cells2048-overlay g-cells2048-hidden" id="g-cells2048-overlay">' +
                '<p class="g-cells2048-ovtitle" id="g-cells2048-ovtitle"></p>' +
                '<p class="g-cells2048-ovsub" id="g-cells2048-ovsub"></p>' +
                '<button class="gu-btn gu-btn--primary" id="g-cells2048-ovbtn" type="button"></button>' +
              '</div>' +
            '</div>' +
            '<div class="g-cells2048-pad" id="g-cells2048-pad" aria-hidden="true">' +
              '<span class="g-cells2048-padspacer"></span>' +
              '<button class="gu-btn gu-btn--tonal" data-dir="up" type="button" aria-label="' +
                ctx.esc(t({ zh: "上", en: "Up" })) + '">↑</button>' +
              '<span class="g-cells2048-padspacer"></span>' +
              '<button class="gu-btn gu-btn--tonal" data-dir="left" type="button" aria-label="' +
                ctx.esc(t({ zh: "左", en: "Left" })) + '">←</button>' +
              '<button class="gu-btn gu-btn--tonal" data-dir="down" type="button" aria-label="' +
                ctx.esc(t({ zh: "下", en: "Down" })) + '">↓</button>' +
              '<button class="gu-btn gu-btn--tonal" data-dir="right" type="button" aria-label="' +
                ctx.esc(t({ zh: "右", en: "Right" })) + '">→</button>' +
            '</div>' +
            '<p class="gu-hint g-cells2048-hint">' +
              ctx.esc(t({ zh: "方向鍵 / WASD / 滑動棋盤來移動,相同數字合併。",
                         en: "Arrow keys / WASD / swipe the board to move; equal tiles merge." })) + '</p>' +
          '</div>' +
          '<button class="gu-btn gu-btn--primary" id="g-cells2048-new" type="button">' +
            ctx.esc(t({ zh: "新遊戲", en: "New game" })) + '</button>' +
        '</div>';

      var boardEl = root.querySelector("#g-cells2048-board");
      var scoreEl = root.querySelector("#g-cells2048-score");
      var bestEl  = root.querySelector("#g-cells2048-best");
      var overlay = root.querySelector("#g-cells2048-overlay");
      var ovTitle = root.querySelector("#g-cells2048-ovtitle");
      var ovSub   = root.querySelector("#g-cells2048-ovsub");
      var ovBtn   = root.querySelector("#g-cells2048-ovbtn");
      var newBtn  = root.querySelector("#g-cells2048-new");
      var padEl   = root.querySelector("#g-cells2048-pad");

      var tileEls = [];  // 已建立的 tile 節點(每次 render 重建)

      function render() {
        // 移除舊 tile(保留 overlay)
        for (var i = 0; i < tileEls.length; i++) {
          if (tileEls[i].parentNode) tileEls[i].parentNode.removeChild(tileEls[i]);
        }
        tileEls = [];
        for (var r = 0; r < SIZE; r++) {
          for (var c = 0; c < SIZE; c++) {
            var v = grid[r][c];
            var el = document.createElement("div");
            if (v === 0) {
              el.className = "g-cells2048-cell";
            } else {
              var col = tileColors(v);
              var sizeCls = TILE_BG[v] ? ("g-cells2048-tv" + v) : "g-cells2048-tvbig";
              el.className = "g-cells2048-tile " + sizeCls;
              el.style.background = col.bg;
              el.style.color = col.fg;
              el.textContent = String(v);
            }
            // 讓 cell/tile 落在 overlay 之前(overlay 為第一個子節點時要放它後面)
            boardEl.appendChild(el);
            tileEls.push(el);
          }
        }
        scoreEl.textContent = String(score);
        bestEl.textContent = String(best);
      }

      function showOverlay(isWin) {
        if (isWin) {
          overlayShownForWin = true;
          ovTitle.textContent = t({ zh: "🎉 達成 2048!", en: "🎉 You reached 2048!" });
          ovSub.textContent = t({ zh: "分數 " + score + " ・ 可繼續挑戰更高",
                                  en: "Score " + score + " · keep going for more" });
          ovBtn.textContent = t({ zh: "繼續玩", en: "Keep playing" });
        } else {
          ovTitle.textContent = t({ zh: "遊戲結束", en: "Game over" });
          ovSub.textContent = t({ zh: "最終分數 " + score, en: "Final score " + score });
          ovBtn.textContent = t({ zh: "重新開始", en: "Restart" });
        }
        overlay.classList.remove("g-cells2048-hidden");
      }
      function hideOverlay() {
        overlay.classList.add("g-cells2048-hidden");
      }

      function onOverlayBtn() {
        if (over) {
          reset();
        } else {
          // 續玩:只關閉勝利提示
          hideOverlay();
        }
      }

      function reset() {
        grid = emptyGrid();
        score = 0;
        won = false;
        over = false;
        overlayShownForWin = false;
        hideOverlay();
        spawn();
        spawn();
        render();
      }

      /* ---------- 輸入:鍵盤 ---------- */
      var KEYMAP = {
        ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
        a: "left", d: "right", w: "up", s: "down",
        A: "left", D: "right", W: "up", S: "down"
      };
      function onKey(e) {
        var dir = KEYMAP[e.key];
        if (!dir) return;
        e.preventDefault();   // 避免方向鍵捲動頁面
        move(dir);
      }

      /* ---------- 輸入:觸控 / 指標滑動 ---------- */
      var swipeStart = null;       // { x, y } 或 null
      var SWIPE_MIN = 24;          // px,最小有效滑動距離

      function onPointerDown(e) {
        var p = pointFromEvent(e);
        swipeStart = { x: p.x, y: p.y };
      }
      function onPointerUp(e) {
        if (!swipeStart) return;
        var p = pointFromEvent(e);
        var dx = p.x - swipeStart.x;
        var dy = p.y - swipeStart.y;
        swipeStart = null;
        var adx = Math.abs(dx), ady = Math.abs(dy);
        if (adx < SWIPE_MIN && ady < SWIPE_MIN) return;
        if (adx > ady) move(dx > 0 ? "right" : "left");
        else move(dy > 0 ? "down" : "up");
      }
      function onPointerCancel() { swipeStart = null; }

      function pointFromEvent(e) {
        if (e.changedTouches && e.changedTouches.length) {
          return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        if (e.touches && e.touches.length) {
          return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
      }

      /* ---------- 輸入:螢幕方向鍵 ---------- */
      function onPadClick(e) {
        var btn = e.target.closest ? e.target.closest("button[data-dir]") : null;
        if (!btn) return;
        var dir = btn.getAttribute("data-dir");
        if (dir) move(dir);
      }

      /* ---------- 綁定 listeners ---------- */
      document.addEventListener("keydown", onKey);
      newBtn.addEventListener("click", reset);
      ovBtn.addEventListener("click", onOverlayBtn);
      padEl.addEventListener("click", onPadClick);

      var usePointer = (typeof window.PointerEvent !== "undefined");
      if (usePointer) {
        boardEl.addEventListener("pointerdown", onPointerDown);
        boardEl.addEventListener("pointerup", onPointerUp);
        boardEl.addEventListener("pointercancel", onPointerCancel);
      } else {
        boardEl.addEventListener("touchstart", onPointerDown, { passive: true });
        boardEl.addEventListener("touchend", onPointerUp);
        boardEl.addEventListener("touchcancel", onPointerCancel);
      }

      reset();

      /* cleanup:清掉所有鍵盤 / 指標 / 觸控 listener */
      return function cleanup() {
        document.removeEventListener("keydown", onKey);
        newBtn.removeEventListener("click", reset);
        ovBtn.removeEventListener("click", onOverlayBtn);
        padEl.removeEventListener("click", onPadClick);
        if (usePointer) {
          boardEl.removeEventListener("pointerdown", onPointerDown);
          boardEl.removeEventListener("pointerup", onPointerUp);
          boardEl.removeEventListener("pointercancel", onPointerCancel);
        } else {
          boardEl.removeEventListener("touchstart", onPointerDown);
          boardEl.removeEventListener("touchend", onPointerUp);
          boardEl.removeEventListener("touchcancel", onPointerCancel);
        }
      };
    }
  });
})();
