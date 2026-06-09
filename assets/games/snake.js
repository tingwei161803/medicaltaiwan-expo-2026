/* =========================================================================
   snake.js — 養分貪食蛇 / Nutrient Snake   ★ 街機小遊戲

   玩法:用方向鍵 / WASD,或螢幕上的方向鈕(▲ ◀ ▼ ▶)控制蛇,
   吃下隨機出現的蔬果養分讓身體變長並加分。撞牆或咬到自己就結束。
   記錄最高分(分數越高越好)。

   遵守 _CONTRACT.md:IIFE 封裝、window.GAMES.push、mount(root, ctx)、
   一次注入的 scoped CSS(前綴 g-snake-)、ctx.t 雙語、ctx.load/save 持久化、
   顏色取 MD3 token、回傳 cleanup 清掉 loop / key listener / resize listener。
   ========================================================================= */
(function () {
  "use strict";

  var ACCENT = "#386A20";   // 自己的點綴色(token 取不到時的 fallback)
  var GRID = 17;            // 棋盤格數(17×17)

  /* ---- scoped CSS:整支遊戲只注入一次,所有 class 前綴 g-snake- ---- */
  function injectCSS() {
    if (document.getElementById("g-snake-css")) return;
    var s = document.createElement("style");
    s.id = "g-snake-css";
    s.textContent = [
      ".g-snake-wrap{width:100%;max-width:480px;margin:0 auto;}",
      ".g-snake-stage{position:relative;width:100%;max-width:480px;margin:0 auto;",
        "aspect-ratio:1/1;border-radius:var(--radius);overflow:hidden;",
        "background:var(--surface-container);border:1px solid var(--outline-variant);}",
      ".g-snake-canvas{display:block;width:100%;height:100%;touch-action:none;}",
      ".g-snake-overlay{position:absolute;inset:0;display:flex;flex-direction:column;",
        "align-items:center;justify-content:center;gap:12px;text-align:center;padding:18px;",
        "background:color-mix(in srgb, var(--scrim, #000) 46%, transparent);",
        "color:var(--on-surface);}",
      ".g-snake-overlay[hidden]{display:none;}",
      ".g-snake-ov-card{background:var(--surface-container-high);color:var(--on-surface);",
        "border-radius:var(--radius);padding:18px 20px;max-width:90%;",
        "display:flex;flex-direction:column;align-items:center;gap:10px;",
        "border:1px solid var(--outline-variant);box-shadow:0 6px 20px rgba(0,0,0,.18);}",
      ".g-snake-ov-big{font-size:1.25rem;font-weight:700;}",
      ".g-snake-ov-sub{font-size:.95rem;font-weight:500;color:var(--on-surface-variant);}",
      ".g-snake-pad{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);",
        "gap:8px;width:180px;max-width:62vw;margin:14px auto 0;}",
      ".g-snake-dbtn{appearance:none;border:1px solid var(--outline-variant);",
        "background:var(--surface-container-high);color:var(--on-surface);",
        "border-radius:var(--radius-sm);font:inherit;font-size:1.25rem;line-height:1;",
        "aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;",
        "cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:manipulation;}",
      ".g-snake-dbtn:active{background:var(--primary);color:var(--on-primary);}",
      ".g-snake-up{grid-column:2;grid-row:1;}",
      ".g-snake-left{grid-column:1;grid-row:2;}",
      ".g-snake-down{grid-column:2;grid-row:3;}",
      ".g-snake-right{grid-column:3;grid-row:2;}"
    ].join("");
    document.head.appendChild(s);
  }

  /* ---- 取 MD3 token 顏色(繪圖當下讀,深淺色自動跟著切)---- */
  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name);
      v = (v || "").trim();
      return v || fallback;
    } catch (e) {
      return fallback;
    }
  }

  (window.GAMES = window.GAMES || []).push({
    id: "snake",
    icon: "nutrition",
    accent: ACCENT,
    category: { zh: "街機", en: "Arcade" },
    title:   { zh: "養分貪食蛇", en: "Nutrient Snake" },
    tagline: { zh: "吃下蔬果養分讓身體變長,別撞牆或咬到自己。",
               en: "Eat healthy nutrients to grow — don't hit a wall or yourself." },

    mount: function (root, ctx) {
      injectCSS();
      var t = ctx.t;
      var best = Number(ctx.load("best", 0)) || 0;   // 0 = 尚無紀錄
      var FOODS = ["🥦", "🥕", "🍎", "🍇", "🍅", "🌽", "🍓", "🥬"];

      root.innerHTML =
        '<div class="gu-center g-snake-wrap">' +
          '<div class="gu-statbar">' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-snake-score">0</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "分數", en: "Score" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-snake-best">' +
              (best ? best : "—") + '</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "最佳", en: "Best" })) + '</span></div>' +
          '</div>' +
          '<div class="g-snake-stage">' +
            '<canvas class="g-snake-canvas" id="g-snake-canvas"></canvas>' +
            '<div class="g-snake-overlay" id="g-snake-overlay">' +
              '<div class="g-snake-ov-card">' +
                '<span class="g-snake-ov-big" id="g-snake-ov-big">' +
                  ctx.esc(t({ zh: "養分貪食蛇", en: "Nutrient Snake" })) + '</span>' +
                '<span class="g-snake-ov-sub" id="g-snake-ov-sub">' +
                  ctx.esc(t({ zh: "方向鍵 / WASD 或下方按鈕操作", en: "Arrow keys / WASD or the buttons below" })) + '</span>' +
                '<button class="gu-btn gu-btn--primary" id="g-snake-start" type="button">' +
                  ctx.esc(t({ zh: "開始", en: "Start" })) + '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="g-snake-pad" id="g-snake-pad">' +
            '<button class="g-snake-dbtn g-snake-up" id="g-snake-up" type="button" ' +
              'aria-label="' + ctx.esc(t({ zh: "上", en: "Up" })) + '">▲</button>' +
            '<button class="g-snake-dbtn g-snake-left" id="g-snake-left" type="button" ' +
              'aria-label="' + ctx.esc(t({ zh: "左", en: "Left" })) + '">◀</button>' +
            '<button class="g-snake-dbtn g-snake-down" id="g-snake-down" type="button" ' +
              'aria-label="' + ctx.esc(t({ zh: "下", en: "Down" })) + '">▼</button>' +
            '<button class="g-snake-dbtn g-snake-right" id="g-snake-right" type="button" ' +
              'aria-label="' + ctx.esc(t({ zh: "右", en: "Right" })) + '">▶</button>' +
          '</div>' +
          '<p class="gu-hint" id="g-snake-hint">' +
            ctx.esc(t({ zh: "吃越多越長,別撞牆也別咬到自己。", en: "Grow by eating — avoid walls and your own tail." })) + '</p>' +
        '</div>';

      var canvas  = root.querySelector("#g-snake-canvas");
      var c2d     = canvas.getContext("2d");
      var overlay = root.querySelector("#g-snake-overlay");
      var ovBig   = root.querySelector("#g-snake-ov-big");
      var ovSub   = root.querySelector("#g-snake-ov-sub");
      var startBtn = root.querySelector("#g-snake-start");
      var scoreEl = root.querySelector("#g-snake-score");
      var bestEl  = root.querySelector("#g-snake-best");

      /* 邏輯狀態(以格為單位)*/
      var snake = [];          // [{x,y}, ...] head 在 [0]
      var dir = { x: 1, y: 0 };
      var nextDir = { x: 1, y: 0 };
      var food = { x: 0, y: 0, emoji: "🥦" };
      var score = 0;
      var running = false;
      var loop = null;
      var tickMs = 140;        // 起始速度;隨成長略加速
      var cell = 20;           // 像素 / 格(resize 時重算)

      function randInt(n) { return Math.floor(Math.random() * n); }

      function placeFood() {
        var free = [];
        for (var y = 0; y < GRID; y++) {
          for (var x = 0; x < GRID; x++) {
            var hit = false;
            for (var i = 0; i < snake.length; i++) {
              if (snake[i].x === x && snake[i].y === y) { hit = true; break; }
            }
            if (!hit) free.push({ x: x, y: y });
          }
        }
        if (!free.length) return;   // 棋盤填滿(理論上贏了)
        var pick = free[randInt(free.length)];
        food.x = pick.x; food.y = pick.y;
        food.emoji = FOODS[randInt(FOODS.length)];
      }

      function resize() {
        // 用容器寬度決定畫布像素;限制不超過 480,且整除 GRID 以對齊格線
        var stage = canvas.parentNode;
        var box = stage.getBoundingClientRect();
        var avail = Math.min(box.width || 320, 480);
        if (!avail || avail < 1) avail = 320;
        cell = Math.max(8, Math.floor(avail / GRID));
        var px = cell * GRID;
        var dpr = window.devicePixelRatio || 1;
        canvas.width = px * dpr;
        canvas.height = px * dpr;
        c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
      }

      function draw() {
        var px = cell * GRID;
        var bg      = cssVar("--surface-container", "#1a1c18");
        var grid    = cssVar("--outline-variant", "rgba(0,0,0,.12)");
        var primary = cssVar("--primary", ACCENT);
        var onPrim  = cssVar("--on-primary", "#ffffff");

        c2d.clearRect(0, 0, px, px);
        c2d.fillStyle = bg;
        c2d.fillRect(0, 0, px, px);

        // 格線
        c2d.strokeStyle = grid;
        c2d.lineWidth = 1;
        c2d.globalAlpha = 0.5;
        for (var i = 1; i < GRID; i++) {
          var p = Math.round(i * cell) + 0.5;
          c2d.beginPath(); c2d.moveTo(p, 0); c2d.lineTo(p, px); c2d.stroke();
          c2d.beginPath(); c2d.moveTo(0, p); c2d.lineTo(px, p); c2d.stroke();
        }
        c2d.globalAlpha = 1;

        // 食物(置中 emoji)
        c2d.font = Math.floor(cell * 0.78) + "px serif";
        c2d.textAlign = "center";
        c2d.textBaseline = "middle";
        c2d.fillText(food.emoji, food.x * cell + cell / 2, food.y * cell + cell / 2 + 1);

        // 蛇身
        var pad = Math.max(1, Math.floor(cell * 0.08));
        var r = Math.max(2, Math.floor(cell * 0.22));
        for (var s = snake.length - 1; s >= 0; s--) {
          var seg = snake[s];
          c2d.fillStyle = primary;
          c2d.globalAlpha = s === 0 ? 1 : 0.82;
          roundRect(seg.x * cell + pad, seg.y * cell + pad, cell - pad * 2, cell - pad * 2, r);
          c2d.fill();
        }
        c2d.globalAlpha = 1;

        // 頭部的眼睛(用 on-primary 點兩點)
        if (snake.length) {
          var h = snake[0];
          var cx = h.x * cell + cell / 2;
          var cy = h.y * cell + cell / 2;
          var er = Math.max(1, cell * 0.08);
          var off = cell * 0.18;
          c2d.fillStyle = onPrim;
          c2d.beginPath();
          c2d.arc(cx - off + dir.x * off * 0.6, cy - off + dir.y * off * 0.6, er, 0, Math.PI * 2);
          c2d.arc(cx + off + dir.x * off * 0.6, cy - off + dir.y * off * 0.6, er, 0, Math.PI * 2);
          c2d.fill();
        }
      }

      function roundRect(x, y, w, h, r) {
        if (w < 0) w = 0; if (h < 0) h = 0;
        r = Math.min(r, w / 2, h / 2);
        c2d.beginPath();
        c2d.moveTo(x + r, y);
        c2d.arcTo(x + w, y, x + w, y + h, r);
        c2d.arcTo(x + w, y + h, x, y + h, r);
        c2d.arcTo(x, y + h, x, y, r);
        c2d.arcTo(x, y, x + w, y, r);
        c2d.closePath();
      }

      function setDir(x, y) {
        // 不可瞬間反向回自己身上
        if (snake.length > 1 && x === -dir.x && y === -dir.y) return;
        nextDir = { x: x, y: y };
      }

      function step() {
        dir = nextDir;
        var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

        // 撞牆
        if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
          return gameOver();
        }
        // 咬到自己(尾巴將移動的最後一節除外)
        var willGrow = (head.x === food.x && head.y === food.y);
        var limit = willGrow ? snake.length : snake.length - 1;
        for (var i = 0; i < limit; i++) {
          if (snake[i].x === head.x && snake[i].y === head.y) return gameOver();
        }

        snake.unshift(head);
        if (willGrow) {
          score += 1;
          scoreEl.textContent = score;
          placeFood();
          // 略為加速(每多吃一個快 4ms,下限 70ms)
          var newTick = Math.max(70, 140 - score * 4);
          if (newTick !== tickMs) {
            tickMs = newTick;
            if (running) {
              clearInterval(loop);
              loop = setInterval(step, tickMs);
            }
          }
        } else {
          snake.pop();
        }
        draw();
      }

      function start() {
        snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
        dir = { x: 1, y: 0 };
        nextDir = { x: 1, y: 0 };
        score = 0;
        tickMs = 140;
        scoreEl.textContent = "0";
        placeFood();
        overlay.setAttribute("hidden", "");
        running = true;
        if (loop) clearInterval(loop);
        loop = setInterval(step, tickMs);
        draw();
      }

      function gameOver() {
        running = false;
        if (loop) { clearInterval(loop); loop = null; }
        if (score > best) {
          best = score; ctx.save("best", best); bestEl.textContent = best;
        }
        ovBig.textContent = t({ zh: "結束!得分 " + score, en: "Game over! Score " + score });
        ovSub.textContent = (score >= best && score > 0)
          ? t({ zh: "新紀錄!太強了 🎉", en: "New best! Nicely done 🎉" })
          : t({ zh: "最佳 " + best + " 分,再挑戰一次", en: "Best " + best + " — try again" });
        startBtn.textContent = t({ zh: "再玩一次", en: "Play again" });
        overlay.removeAttribute("hidden");
      }

      /* ---- 鍵盤:方向鍵 + WASD;遊戲中才 preventDefault 防頁面滾動 ---- */
      function onKey(e) {
        var k = e.key;
        var x = null, y = null;
        if (k === "ArrowUp" || k === "w" || k === "W") { x = 0; y = -1; }
        else if (k === "ArrowDown" || k === "s" || k === "S") { x = 0; y = 1; }
        else if (k === "ArrowLeft" || k === "a" || k === "A") { x = -1; y = 0; }
        else if (k === "ArrowRight" || k === "d" || k === "D") { x = 1; y = 0; }
        else return;
        if (running) {
          // 只有遊戲進行中、且是方向鍵時才擋掉頁面捲動
          if (k.indexOf("Arrow") === 0) e.preventDefault();
          setDir(x, y);
        }
      }

      /* ---- 螢幕方向鈕 ---- */
      function bindDpad(id, x, y) {
        var btn = root.querySelector(id);
        function handler(e) { e.preventDefault(); if (running) setDir(x, y); }
        btn.addEventListener("click", handler);
        dpadCleanups.push(function () { btn.removeEventListener("click", handler); });
      }
      var dpadCleanups = [];
      bindDpad("#g-snake-up", 0, -1);
      bindDpad("#g-snake-down", 0, 1);
      bindDpad("#g-snake-left", -1, 0);
      bindDpad("#g-snake-right", 1, 0);

      startBtn.addEventListener("click", start);
      window.addEventListener("keydown", onKey);
      window.addEventListener("resize", resize);

      resize();   // 設定畫布尺寸並初次繪製(此時顯示 overlay 的「開始」)

      /* cleanup:清掉 loop、所有 key / resize / d-pad listener */
      return function cleanup() {
        running = false;
        if (loop) { clearInterval(loop); loop = null; }
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("resize", resize);
        startBtn.removeEventListener("click", start);
        for (var i = 0; i < dpadCleanups.length; i++) dpadCleanups[i]();
      };
    }
  });
})();
