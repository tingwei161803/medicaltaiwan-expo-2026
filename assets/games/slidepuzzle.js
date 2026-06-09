/* =========================================================================
   slidepuzzle.js — 滑塊拼圖 / Sliding Puzzle   (益智 / Puzzle)

   玩法:把打亂的數字方塊滑回 1..N 的順序,最後一格留空。點(觸)空格旁邊的
   方塊即可把它滑進空格。計步數與時間,用最少步數解出就是好成績。
   支援 3×3 / 4×4 切換(預設 3×3)。打亂方式 = 從已解狀態做大量隨機合法移動,
   保證一定可解(不會出現無解排列)。

   照官方範本 reaction.js 的結構寫:IIFE 封裝、window.GAMES.push、
   mount(root, ctx)、一次注入的 scoped CSS(前綴 g-slidepuzzle-)、
   ctx.t 雙語、ctx.load/save 持久化(最佳 = 最少步數,越低越好)、
   回傳 cleanup 清掉所有 timer/listener。
   ========================================================================= */
(function () {
  "use strict";

  /* ---- scoped CSS:整支遊戲只注入一次,所有 class 前綴 g-slidepuzzle- ---- */
  function injectCSS() {
    if (document.getElementById("g-slidepuzzle-css")) return;
    var s = document.createElement("style");
    s.id = "g-slidepuzzle-css";
    s.textContent = [
      ".g-slidepuzzle-wrap{width:100%;max-width:420px;margin:0 auto;}",
      ".g-slidepuzzle-grid{display:grid;gap:8px;width:100%;",
        "aspect-ratio:1/1;background:var(--surface-container);",
        "border:1px solid var(--outline-variant);border-radius:var(--radius);",
        "padding:8px;box-sizing:border-box;}",
      ".g-slidepuzzle-tile{border:none;font:inherit;cursor:pointer;",
        "border-radius:var(--radius-sm);background:var(--primary-container);",
        "color:var(--on-primary-container);font-weight:800;line-height:1;",
        "display:flex;align-items:center;justify-content:center;",
        "user-select:none;-webkit-tap-highlight-color:transparent;",
        "transition:transform .07s ease, background .12s ease;min-width:0;}",
      ".g-slidepuzzle-tile:active{transform:scale(.95);}",
      ".g-slidepuzzle-tile.is-movable{background:var(--primary);color:var(--on-primary);}",
      ".g-slidepuzzle-blank{background:transparent;border:2px dashed var(--outline-variant);",
        "border-radius:var(--radius-sm);}",
      ".g-slidepuzzle-msg{margin:12px 0 0;text-align:center;font-weight:600;",
        "color:var(--on-surface);min-height:1.4em;}",
      ".g-slidepuzzle-win{color:var(--success,var(--primary));}",
      ".g-slidepuzzle-seg{display:inline-flex;border:1px solid var(--outline-variant);",
        "border-radius:999px;overflow:hidden;}",
      ".g-slidepuzzle-seg button{border:none;background:transparent;font:inherit;",
        "color:var(--on-surface-variant);padding:6px 16px;cursor:pointer;font-weight:600;}",
      ".g-slidepuzzle-seg button.is-on{background:var(--primary);color:var(--on-primary);}"
    ].join("");
    document.head.appendChild(s);
  }

  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function fmtTime(ms) {
    var s = Math.floor(ms / 1000);
    return pad2(Math.floor(s / 60)) + ":" + pad2(s % 60);
  }

  (window.GAMES = window.GAMES || []).push({
    id: "slidepuzzle",
    icon: "extension",
    accent: "#1565C0",
    category: { zh: "益智", en: "Puzzle" },
    title:   { zh: "滑塊拼圖", en: "Sliding Puzzle" },
    tagline: { zh: "滑動數字方塊復原順序,挑戰最少步數。",
               en: "Slide the tiles back into order in as few moves as you can." },

    mount: function (root, ctx) {
      injectCSS();
      var t = ctx.t;

      var size = 3;                              // 3 或 4(預設 3×3)
      var n = size * size;
      var board = [];                            // 長度 n,值 1..n-1 與 0(空格)
      var blank = 0;                             // 空格的索引
      var moves = 0;
      var started = false;                       // 第一步後才開始計時
      var startAt = 0;
      var solvedFlag = false;
      var tickTimer = null;
      var best = Number(ctx.load("best", 0)) || 0;  // 最少步數;0 = 尚無紀錄

      root.innerHTML =
        '<div class="gu-center">' +
          '<div class="gu-row" style="margin-bottom:4px;">' +
            '<div class="g-slidepuzzle-seg" role="group" ' +
                 'aria-label="' + ctx.esc(t({ zh: "盤面大小", en: "Board size" })) + '">' +
              '<button type="button" id="g-slidepuzzle-s3">3 × 3</button>' +
              '<button type="button" id="g-slidepuzzle-s4">4 × 4</button>' +
            '</div>' +
          '</div>' +
          '<div class="gu-statbar">' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-slidepuzzle-moves">0</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "步數", en: "Moves" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-slidepuzzle-time">00:00</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "時間", en: "Time" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-slidepuzzle-best">' +
              (best ? best : "—") + '</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "最佳步數", en: "Best moves" })) + '</span></div>' +
          '</div>' +
          '<div class="g-slidepuzzle-wrap">' +
            '<div class="g-slidepuzzle-grid" id="g-slidepuzzle-grid"></div>' +
            '<p class="g-slidepuzzle-msg" id="g-slidepuzzle-msg"></p>' +
          '</div>' +
          '<div class="gu-row" style="margin-top:12px;">' +
            '<button class="gu-btn gu-btn--primary" type="button" id="g-slidepuzzle-shuffle">' +
              ctx.esc(t({ zh: "打亂", en: "Shuffle" })) + '</button>' +
          '</div>' +
        '</div>';

      var grid    = root.querySelector("#g-slidepuzzle-grid");
      var movesEl = root.querySelector("#g-slidepuzzle-moves");
      var timeEl  = root.querySelector("#g-slidepuzzle-time");
      var bestEl  = root.querySelector("#g-slidepuzzle-best");
      var msgEl   = root.querySelector("#g-slidepuzzle-msg");
      var shuffleBtn = root.querySelector("#g-slidepuzzle-shuffle");
      var s3Btn   = root.querySelector("#g-slidepuzzle-s3");
      var s4Btn   = root.querySelector("#g-slidepuzzle-s4");

      function neighbours(idx) {
        var r = Math.floor(idx / size), c = idx % size, out = [];
        if (r > 0)        out.push(idx - size);
        if (r < size - 1) out.push(idx + size);
        if (c > 0)        out.push(idx - 1);
        if (c < size - 1) out.push(idx + 1);
        return out;
      }

      function makeSolved() {
        board = [];
        for (var i = 1; i < n; i++) board.push(i);
        board.push(0);                 // 最後一格 = 空格
        blank = n - 1;
      }

      function isSolved() {
        for (var i = 0; i < n - 1; i++) if (board[i] !== i + 1) return false;
        return board[n - 1] === 0;
      }

      /* 從已解狀態做大量隨機合法移動 → 保證可解的打亂 */
      function scramble() {
        makeSolved();
        var prev = -1, count = size === 3 ? 120 : 300;
        for (var k = 0; k < count; k++) {
          var nb = neighbours(blank);
          var pick;
          do { pick = nb[Math.floor(Math.random() * nb.length)]; }
          while (nb.length > 1 && pick === prev);
          prev = blank;
          board[blank] = board[pick];
          board[pick] = 0;
          blank = pick;
        }
        if (isSolved()) { scramble(); return; }   // 極罕見:剛好打回原樣就重打
      }

      function stopTick() {
        if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
      }
      function startTick() {
        stopTick();
        tickTimer = setInterval(function () {
          timeEl.textContent = fmtTime(Date.now() - startAt);
        }, 250);
      }

      function setSizeButtons() {
        s3Btn.className = size === 3 ? "is-on" : "";
        s4Btn.className = size === 4 ? "is-on" : "";
      }

      function render() {
        grid.style.gridTemplateColumns = "repeat(" + size + ",1fr)";
        grid.style.gridTemplateRows = "repeat(" + size + ",1fr)";
        // 字級隨盤面縮放,4×4 也不會在 375px 溢出
        var fontPx = size === 3 ? 1.8 : 1.3;
        var movable = solvedFlag ? [] : neighbours(blank);
        var html = "";
        for (var i = 0; i < n; i++) {
          if (board[i] === 0) {
            html += '<div class="g-slidepuzzle-blank" aria-hidden="true"></div>';
          } else {
            var canMove = movable.indexOf(i) !== -1;
            html += '<button type="button" class="g-slidepuzzle-tile' +
                      (canMove ? ' is-movable' : '') + '" data-i="' + i + '"' +
                      ' style="font-size:' + fontPx + 'rem;"' +
                      ' aria-label="' + board[i] + '">' + board[i] + '</button>';
          }
        }
        grid.innerHTML = html;
      }

      function refreshStats() {
        movesEl.textContent = moves;
      }

      function win() {
        solvedFlag = true;
        stopTick();
        var elapsed = started ? Date.now() - startAt : 0;
        var isBest = false;
        if (!best || moves < best) { best = moves; ctx.save("best", best); isBest = true; }
        bestEl.textContent = best ? best : "—";
        render();
        msgEl.className = "g-slidepuzzle-msg g-slidepuzzle-win";
        msgEl.textContent = t({
          zh: "🎉 完成!" + moves + " 步 / " + fmtTime(elapsed) +
              (isBest ? " ・新紀錄!" : "") + " — 按「打亂」再玩一次",
          en: "🎉 Solved! " + moves + " moves / " + fmtTime(elapsed) +
              (isBest ? " · New best!" : "") + " — press Shuffle to play again"
        });
      }

      function tryMove(idx) {
        if (solvedFlag) return;
        if (neighbours(blank).indexOf(idx) === -1) return;   // 非空格鄰居,忽略
        board[blank] = board[idx];
        board[idx] = 0;
        blank = idx;
        moves++;
        if (!started) { started = true; startAt = Date.now(); startTick(); }
        refreshStats();
        if (isSolved()) { win(); return; }
        render();
      }

      function onGrid(e) {
        var btn = e.target.closest ? e.target.closest(".g-slidepuzzle-tile") : null;
        if (!btn || !grid.contains(btn)) return;
        tryMove(Number(btn.getAttribute("data-i")));
      }

      function newGame() {
        scramble();
        moves = 0;
        started = false;
        startAt = 0;
        solvedFlag = false;
        stopTick();
        timeEl.textContent = "00:00";
        refreshStats();
        msgEl.className = "g-slidepuzzle-msg";
        msgEl.textContent = t({
          zh: "點空格旁的方塊把它滑進去",
          en: "Tap a tile next to the gap to slide it"
        });
        setSizeButtons();
        render();
      }

      function setSize(newSize) {
        if (size === newSize) { newGame(); return; }
        size = newSize;
        n = size * size;
        newGame();
      }

      grid.addEventListener("click", onGrid);
      shuffleBtn.addEventListener("click", newGame);
      s3Btn.addEventListener("click", function () { setSize(3); });
      s4Btn.addEventListener("click", function () { setSize(4); });

      newGame();

      /* cleanup:關閉或語言切換時,清掉計時器與所有 listener */
      return function cleanup() {
        stopTick();
        grid.removeEventListener("click", onGrid);
        shuffleBtn.removeEventListener("click", newGame);
      };
    }
  });
})();
