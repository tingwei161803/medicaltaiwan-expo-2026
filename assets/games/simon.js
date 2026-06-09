/* =========================================================================
   simon.js — 心律記憶 / Heartbeat Memory   ★ 記憶類小遊戲(照 reaction.js 結構)

   玩法:點「開始」→ 4 片色塊會依序閃動(像心電圖的節律),你要照同樣
   順序點回去。每過一關序列就 +1 格,愈來愈長;點錯一格即結束,顯示
   你撐到第幾關。記錄最佳關卡(愈高愈好)。

   遵循契約:IIFE 封裝、window.GAMES.push、mount(root, ctx)、
   一次注入的 scoped CSS(前綴 g-simon-)、ctx.t 雙語、
   ctx.load/save 持久化、回傳 cleanup 清掉所有 timer + 關閉 AudioContext。
   音效為可選(WebAudio),使用者手勢觸發、try/catch 包住、靜音不報錯。
   ========================================================================= */
(function () {
  "use strict";

  /* ---- 4 片色塊的設定(顏色用可讀的固定 hex,深淺色都看得清楚;音高各異) ---- */
  var PADS = [
    { bg: "#00696E", on: "#5DDBDF", freq: 329.63 }, /* 取自 --primary 系,青 */
    { bg: "#B3261E", on: "#FF8A80", freq: 392.00 }, /* --error 系,紅 */
    { bg: "#7D5260", on: "#EFB8C8", freq: 261.63 }, /* --tertiary 系,粉 */
    { bg: "#2E7D32", on: "#9CD89F", freq: 440.00 }  /* --success 系,綠 */
  ];

  /* ---- scoped CSS:整支遊戲只注入一次,所有 class 前綴 g-simon- ---- */
  function injectCSS() {
    if (document.getElementById("g-simon-css")) return;
    var s = document.createElement("style");
    s.id = "g-simon-css";
    s.textContent = [
      ".g-simon-wrap{width:100%;max-width:560px;margin:0 auto;}",
      ".g-simon-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;",
        "margin:4px auto 12px;}",
      ".g-simon-pad{aspect-ratio:1/1;width:100%;border:3px solid var(--outline-variant);",
        "border-radius:var(--radius);cursor:pointer;font:inherit;color:#fff;",
        "opacity:.72;transition:opacity .12s,transform .08s,box-shadow .12s,filter .12s;",
        "-webkit-tap-highlight-color:transparent;display:flex;align-items:center;",
        "justify-content:center;}",
      ".g-simon-pad:disabled{cursor:default;}",
      ".g-simon-pad.g-simon-lit{opacity:1;filter:brightness(1.45);",
        "box-shadow:0 0 0 3px var(--on-surface),0 0 22px 4px rgba(255,255,255,.55);",
        "transform:scale(.97);}",
      ".g-simon-pad .material-symbols-rounded{font-size:2rem;opacity:.9;}",
      ".g-simon-msg{text-align:center;min-height:1.4em;margin:2px 0 12px;",
        "color:var(--on-surface);font-weight:600;}",
      ".g-simon-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}",
      "@media (max-width:380px){.g-simon-grid{gap:9px;}.g-simon-pad .material-symbols-rounded{font-size:1.6rem;}}"
    ].join("");
    document.head.appendChild(s);
  }

  /* ---- 關卡 → 評語(可調)。higher round = better ---- */
  function gradeRound(round, t) {
    if (round >= 16) return t({ zh: "🧠 心律大師,過目不忘!", en: "🧠 Cardiac maestro — flawless memory!" });
    if (round >= 11) return t({ zh: "🏥 主治醫師級記憶", en: "🏥 Attending-level recall" });
    if (round >= 8)  return t({ zh: "👍 記性很好", en: "👍 Sharp memory" });
    if (round >= 5)  return t({ zh: "🙂 還不錯,再衝高一點", en: "🙂 Not bad — push further" });
    return t({ zh: "🐢 多練幾次就上手了", en: "🐢 A few more tries and you'll nail it" });
  }

  (window.GAMES = window.GAMES || []).push({
    id: "simon",
    icon: "favorite",
    accent: "#B3261E",
    category: { zh: "記憶", en: "Memory" },
    title:   { zh: "心律記憶", en: "Heartbeat Memory" },
    tagline: { zh: "記住閃動的節律順序並重現,序列會愈來愈長。",
               en: "Repeat the lighting sequence — it grows each round." },

    mount: function (root, ctx) {
      injectCSS();
      var t = ctx.t;
      var best = Number(ctx.load("best", 0)) || 0;   // 0 = 尚無紀錄;愈高愈好

      var startTxt = t({ zh: "開始", en: "Start" });
      var againTxt = t({ zh: "再玩一次", en: "Play again" });

      root.innerHTML =
        '<div class="gu-center">' +
          '<div class="gu-statbar">' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-simon-round">—</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "關卡 / 長度", en: "Round / Len" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-simon-best">' +
              (best ? best : "—") + '</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "最佳關卡", en: "Best round" })) + '</span></div>' +
          '</div>' +
          '<div class="g-simon-wrap">' +
            '<div class="g-simon-grid" id="g-simon-grid">' +
              padBtn(0, ctx) + padBtn(1, ctx) + padBtn(2, ctx) + padBtn(3, ctx) +
            '</div>' +
            '<p class="g-simon-msg gu-hint" id="g-simon-msg">' +
              ctx.esc(t({ zh: "按「開始」,看色塊閃動的順序再點回去", en: "Press Start, watch the flash order, then repeat it" })) +
            '</p>' +
            '<div class="g-simon-row">' +
              '<button class="gu-btn gu-btn--primary" id="g-simon-start" type="button">' +
                ctx.esc(startTxt) + '</button>' +
              '<button class="gu-btn" id="g-simon-mute" type="button" aria-pressed="false">' +
                ctx.esc(t({ zh: "🔊 音效", en: "🔊 Sound" })) + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      function padBtn(i, c) {
        return '<button class="g-simon-pad" type="button" data-i="' + i +
          '" style="background:' + PADS[i].bg + ';" aria-label="' +
          c.esc(c.t({ zh: "色塊 ", en: "Pad " })) + (i + 1) + '">' +
          '<span class="material-symbols-rounded" aria-hidden="true">graphic_eq</span></button>';
      }

      var grid    = root.querySelector("#g-simon-grid");
      var pads    = Array.prototype.slice.call(root.querySelectorAll(".g-simon-pad"));
      var roundEl = root.querySelector("#g-simon-round");
      var bestEl  = root.querySelector("#g-simon-best");
      var msgEl   = root.querySelector("#g-simon-msg");
      var startBtn = root.querySelector("#g-simon-start");
      var muteBtn  = root.querySelector("#g-simon-mute");

      var seq = [];               // 目前序列(0–3 的索引陣列)
      var inputIdx = 0;           // 玩家已正確輸入到第幾格
      var playing = false;        // 是否正在「示範閃動」(此時禁止玩家輸入)
      var active = false;         // 一局是否進行中
      var timers = [];            // 所有待清的 timeout
      var muted = false;          // 音效開關(預設開)
      var audio = null;           // AudioContext(使用者手勢時才建立)

      function clearTimers() {
        for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
        timers = [];
      }
      function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }

      /* ---- 音效:使用者手勢觸發、try/catch 包住、失敗就安靜略過 ---- */
      function ensureAudio() {
        if (muted) return;
        if (audio) return;
        try {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (AC) audio = new AC();
        } catch (e) { audio = null; }
      }
      function beep(freq) {
        if (muted || !audio) return;
        try {
          if (audio.state === "suspended" && audio.resume) audio.resume();
          var osc = audio.createOscillator();
          var gain = audio.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          var now = audio.currentTime;
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
          osc.connect(gain);
          gain.connect(audio.destination);
          osc.start(now);
          osc.stop(now + 0.34);
        } catch (e) { /* 靜音容錯 */ }
      }

      function flash(i, ms) {
        var p = pads[i];
        if (!p) return;
        p.classList.add("g-simon-lit");
        beep(PADS[i].freq);
        later(function () { p.classList.remove("g-simon-lit"); }, ms);
      }

      function setMsg(txt) { msgEl.textContent = txt; }

      function setPadsDisabled(dis) {
        for (var i = 0; i < pads.length; i++) pads[i].disabled = dis;
      }

      /* ---- 示範整段序列 ---- */
      function playSequence() {
        playing = true;
        setPadsDisabled(true);
        setMsg(t({ zh: "看好順序…", en: "Watch the sequence…" }));
        var onMs = 450, gapMs = 250, step = onMs + gapMs;
        for (var k = 0; k < seq.length; k++) {
          (function (k) {
            later(function () { flash(seq[k], onMs); }, 500 + k * step);
          })(k);
        }
        later(function () {
          playing = false;
          inputIdx = 0;
          setPadsDisabled(false);
          setMsg(t({ zh: "換你!照順序點回去", en: "Your turn — repeat it" }));
        }, 500 + seq.length * step);
      }

      function nextRound() {
        seq.push(Math.floor(Math.random() * 4));
        roundEl.textContent = seq.length;
        playSequence();
      }

      function startGame() {
        clearTimers();
        active = true;
        seq = [];
        inputIdx = 0;
        startBtn.textContent = againTxt;
        setMsg(t({ zh: "準備…", en: "Get ready…" }));
        nextRound();
      }

      function gameOver() {
        active = false;
        playing = false;
        clearTimers();
        setPadsDisabled(false);
        var reached = seq.length;
        if (reached > best) { best = reached; ctx.save("best", best); bestEl.textContent = best; }
        setMsg(t({ zh: "撐到第 ", en: "Reached round " }) + reached +
          t({ zh: " 關 — ", en: " — " }) + gradeRound(reached, t));
        startBtn.textContent = againTxt;
      }

      function onPad(e) {
        var btn = e.currentTarget;
        var i = Number(btn.getAttribute("data-i"));
        // 點亮回饋(玩家輸入也高亮)
        if (!active || playing) {
          // 局外/示範中只給視覺與音效回饋,不影響進度
          ensureAudio();
          btn.classList.add("g-simon-lit");
          beep(PADS[i].freq);
          later(function () { btn.classList.remove("g-simon-lit"); }, 200);
          return;
        }
        ensureAudio();
        btn.classList.add("g-simon-lit");
        beep(PADS[i].freq);
        later(function () { btn.classList.remove("g-simon-lit"); }, 200);

        if (i === seq[inputIdx]) {
          inputIdx++;
          if (inputIdx === seq.length) {
            // 本關完成 → 下一關(序列延長)
            setPadsDisabled(true);
            setMsg(t({ zh: "正確!下一關…", en: "Correct! Next round…" }));
            roundEl.textContent = seq.length;
            later(nextRound, 700);
          }
        } else {
          gameOver();
        }
      }

      function onStart() {
        ensureAudio();           // 在使用者手勢中建立/喚醒音訊
        startGame();
      }

      function onMute() {
        muted = !muted;
        muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
        muteBtn.textContent = muted
          ? t({ zh: "🔇 靜音", en: "🔇 Muted" })
          : t({ zh: "🔊 音效", en: "🔊 Sound" });
        if (muted && audio) {
          try { if (audio.suspend) audio.suspend(); } catch (e) { /* 容錯 */ }
        } else if (!muted) {
          ensureAudio();
          if (audio) { try { if (audio.resume) audio.resume(); } catch (e) { /* 容錯 */ } }
        }
      }

      for (var p = 0; p < pads.length; p++) pads[p].addEventListener("click", onPad);
      startBtn.addEventListener("click", onStart);
      muteBtn.addEventListener("click", onMute);

      /* cleanup:關閉或語言切換時,清掉所有 timer / listener,並關閉 AudioContext */
      return function cleanup() {
        clearTimers();
        for (var q = 0; q < pads.length; q++) pads[q].removeEventListener("click", onPad);
        startBtn.removeEventListener("click", onStart);
        muteBtn.removeEventListener("click", onMute);
        if (audio) { try { audio.close(); } catch (e) { /* 容錯 */ } audio = null; }
      };
    }
  });
})();
