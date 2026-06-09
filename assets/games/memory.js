/* =========================================================================
   memory.js — 醫療記憶配對 / Medical Memory   ★ 照 reaction.js 結構撰寫

   玩法:4×4 共 8 對醫療符號卡牌,全部蓋著。點牌翻面,兩張相同就鎖定保持翻開,
   不同則約 0.7 秒後翻回去。每翻一對牌算 1 步,並計時(mm:ss)。
   全部 8 對配對完成即通關,記錄最少步數(BEST,越少越好)。

   依契約:IIFE 封裝、window.GAMES.push、mount(root, ctx)、
   一次注入的 scoped CSS(前綴 g-memory-)、ctx.t 雙語、
   ctx.load/save 持久化、回傳 cleanup 清掉所有 timer/listener。
   ========================================================================= */
(function () {
  "use strict";

  /* ---- 8 種互異的醫療符號(emoji),每種一對 ---- */
  var FACES = ["🫀", "💊", "🩺", "🩹", "🧬", "🦠", "🩻", "💉"];

  /* ---- scoped CSS:整支遊戲只注入一次,所有 class 前綴 g-memory- ---- */
  function injectCSS() {
    if (document.getElementById("g-memory-css")) return;
    var s = document.createElement("style");
    s.id = "g-memory-css";
    s.textContent = [
      ".g-memory-wrap{width:100%;max-width:560px;margin:0 auto;}",
      ".g-memory-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;",
        "width:100%;margin:12px auto 0;}",
      /* 正方形卡牌:用 aspect-ratio,並保留 padding-top 後備 */
      ".g-memory-card{position:relative;aspect-ratio:1/1;border:none;padding:0;",
        "border-radius:var(--radius-sm);background:var(--primary);color:var(--on-primary);",
        "font:inherit;cursor:pointer;overflow:hidden;",
        "display:flex;align-items:center;justify-content:center;",
        "transition:background .15s,transform .12s,box-shadow .15s;",
        "box-shadow:0 1px 2px rgba(0,0,0,.18);}",
      ".g-memory-card__face{font-size:clamp(1.4rem,7vw,2rem);line-height:1;",
        "opacity:0;transition:opacity .12s;user-select:none;}",
      /* 翻開:換成 surface 底色並顯示符號 */
      ".g-memory-card.is-up{background:var(--surface-container-high);}",
      ".g-memory-card.is-up .g-memory-card__face{opacity:1;}",
      /* 配對鎖定:用 tertiary 容器色標示已完成 */
      ".g-memory-card.is-done{background:var(--tertiary-container);color:var(--on-surface);",
        "cursor:default;box-shadow:none;}",
      ".g-memory-card.is-done .g-memory-card__face{opacity:.55;}",
      ".g-memory-card:focus-visible{outline:3px solid var(--primary);outline-offset:2px;}",
      ".g-memory-card:active{transform:scale(.96);}",
      ".g-memory-card[disabled]{cursor:default;}",
      /* 通關訊息面板 */
      ".g-memory-win{margin-top:14px;text-align:center;}",
      ".g-memory-win__msg{margin:0 0 10px;font-size:1.05rem;font-weight:700;color:var(--on-surface);}",
      ".g-memory-win__sub{margin:0 0 12px;}"
    ].join("");
    document.head.appendChild(s);
  }

  /* ---- Fisher–Yates 洗牌(用 Math.random) ---- */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  /* ---- 秒數 → mm:ss ---- */
  function fmtTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
  }

  (window.GAMES = window.GAMES || []).push({
    id: "memory",
    icon: "style",
    accent: "#4B607C",
    category: { zh: "記憶", en: "Memory" },
    title:   { zh: "醫療記憶配對", en: "Medical Memory" },
    tagline: { zh: "翻牌找出成對的醫療符號,用最少步數通關。",
               en: "Flip cards to match medical icon pairs in the fewest moves." },

    mount: function (root, ctx) {
      injectCSS();
      var t = ctx.t;
      var best = Number(ctx.load("best", 0)) || 0;  // 0 = 尚無紀錄(越少越好)

      root.innerHTML =
        '<div class="gu-center">' +
          '<div class="g-memory-wrap">' +
            '<div class="gu-statbar">' +
              '<div class="gu-stat"><span class="gu-stat__v" id="g-memory-moves">0</span>' +
                '<span class="gu-stat__k">' + ctx.esc(t({ zh: "步數", en: "Moves" })) + '</span></div>' +
              '<div class="gu-stat"><span class="gu-stat__v" id="g-memory-time">00:00</span>' +
                '<span class="gu-stat__k">' + ctx.esc(t({ zh: "時間", en: "Time" })) + '</span></div>' +
              '<div class="gu-stat"><span class="gu-stat__v" id="g-memory-best">' +
                (best ? best : "—") + '</span>' +
                '<span class="gu-stat__k">' + ctx.esc(t({ zh: "最佳步數", en: "Best moves" })) + '</span></div>' +
            '</div>' +
            '<p class="gu-hint" style="text-align:center;margin:10px 0 0;">' +
              ctx.esc(t({ zh: "翻開兩張相同的牌即可配對。", en: "Flip two matching cards to pair them." })) + '</p>' +
            '<div class="g-memory-grid" id="g-memory-grid"></div>' +
            '<div class="g-memory-win" id="g-memory-win" hidden>' +
              '<p class="g-memory-win__msg" id="g-memory-win-msg"></p>' +
              '<p class="gu-hint g-memory-win__sub" id="g-memory-win-sub"></p>' +
              '<button class="gu-btn gu-btn--primary" id="g-memory-again" type="button">' +
                ctx.esc(t({ zh: "再玩一次", en: "Play again" })) + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      var grid    = root.querySelector("#g-memory-grid");
      var movesEl = root.querySelector("#g-memory-moves");
      var timeEl  = root.querySelector("#g-memory-time");
      var bestEl  = root.querySelector("#g-memory-best");
      var winBox  = root.querySelector("#g-memory-win");
      var winMsg  = root.querySelector("#g-memory-win-msg");
      var winSub  = root.querySelector("#g-memory-win-sub");
      var againBtn = root.querySelector("#g-memory-again");

      var cards = [];          // 卡牌 DOM 陣列
      var first = null;        // 第一張翻開的卡(等待第二張)
      var locked = false;      // 等待翻回的 ~700ms 期間禁止點擊
      var moves = 0;
      var matched = 0;         // 已配對的「對」數
      var seconds = 0;
      var started = false;     // 第一次翻牌才開始計時
      var tick = null;         // 計時 interval
      var flipBack = null;     // 不配對時翻回的 timer

      function startTimer() {
        if (started) return;
        started = true;
        tick = setInterval(function () {
          seconds++;
          timeEl.textContent = fmtTime(seconds);
        }, 1000);
      }

      function stopTimer() {
        if (tick) { clearInterval(tick); tick = null; }
      }

      function win() {
        stopTimer();
        var isBest = false;
        if (!best || moves < best) {       // 越少越好;沒舊紀錄也存
          best = moves; ctx.save("best", best); bestEl.textContent = best;
          isBest = true;
        }
        winMsg.textContent = t({ zh: "🎉 全部配對完成!", en: "🎉 All pairs matched!" });
        winSub.textContent = isBest
          ? t({ zh: "用了 " + moves + " 步 · 新紀錄!", en: moves + " moves · New best!" })
          : t({ zh: "用了 " + moves + " 步 · 最佳 " + best + " 步",
                en: moves + " moves · best " + best });
        winBox.hidden = false;
      }

      function onCard(ev) {
        var btn = ev.currentTarget;
        if (locked) return;
        if (btn.classList.contains("is-up") || btn.classList.contains("is-done")) return;

        startTimer();
        btn.classList.add("is-up");

        if (!first) { first = btn; return; }

        // 第二張翻開 → 算一步
        moves++;
        movesEl.textContent = moves;
        var second = btn;

        if (first.getAttribute("data-face") === second.getAttribute("data-face")) {
          // 配對成功:鎖定保持翻開
          var a = first, b = second;
          first = null;
          a.classList.add("is-done"); b.classList.add("is-done");
          a.setAttribute("disabled", "true"); b.setAttribute("disabled", "true");
          matched++;
          if (matched === FACES.length) win();
        } else {
          // 不配對:鎖住,~700ms 後翻回
          locked = true;
          var x = first, y = second;
          first = null;
          flipBack = setTimeout(function () {
            x.classList.remove("is-up");
            y.classList.remove("is-up");
            locked = false;
            flipBack = null;
          }, 700);
        }
      }

      function buildBoard() {
        // 重置狀態
        if (flipBack) { clearTimeout(flipBack); flipBack = null; }
        stopTimer();
        first = null; locked = false; moves = 0; matched = 0;
        seconds = 0; started = false;
        movesEl.textContent = "0";
        timeEl.textContent = "00:00";
        winBox.hidden = true;
        cards = [];
        grid.innerHTML = "";

        var deck = shuffle(FACES.concat(FACES));  // 8 對 → 16 張,洗牌
        var faceLabel = t({ zh: "牌", en: "Card" });
        for (var i = 0; i < deck.length; i++) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "g-memory-card";
          btn.setAttribute("data-face", deck[i]);
          btn.setAttribute("aria-label", faceLabel + " " + (i + 1));
          var span = document.createElement("span");
          span.className = "g-memory-card__face";
          span.setAttribute("aria-hidden", "true");
          span.textContent = deck[i];
          btn.appendChild(span);
          btn.addEventListener("click", onCard);
          grid.appendChild(btn);
          cards.push(btn);
        }
      }

      againBtn.addEventListener("click", buildBoard);

      buildBoard();

      /* cleanup:關閉或語言切換時,清掉計時器、翻回 timer 與所有 listener */
      return function cleanup() {
        stopTimer();
        if (flipBack) { clearTimeout(flipBack); flipBack = null; }
        againBtn.removeEventListener("click", buildBoard);
        for (var i = 0; i < cards.length; i++) {
          cards[i].removeEventListener("click", onCard);
        }
      };
    }
  });
})();
