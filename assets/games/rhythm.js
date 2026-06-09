/* =========================================================================
   rhythm.js — 心跳節拍 / Heartbeat Tap   ★ 節奏準度遊戲

   玩法:點「開始」→ 節拍器以固定 BPM(80 起跳,中途會微微加速)脈動,
   畫面有顆心臟/環會跟著心跳跳動。玩家按大 TAP 鈕(或按空白鍵)盡量
   踩在每一拍上。依與最近一拍的時間誤差評分:
     Perfect(<60ms)/ Good(<120ms)/ OK(<200ms)/ Miss(>=200ms 或沒點)。
   固定一局 30 拍,結束顯示總分 + 評級 + 再玩一次。記錄最高分。

   結構照黃金範本 reaction.js:IIFE 封裝、window.GAMES.push、mount(root, ctx)、
   一次注入的 scoped CSS(前綴 g-rhythm-)、ctx.t 雙語、ctx.load/save 持久化、
   回傳 cleanup 清掉所有 timer/interval/listener 並關閉 AudioContext。
   ========================================================================= */
(function () {
  "use strict";

  /* ---- scoped CSS:整支遊戲只注入一次,所有 class 前綴 g-rhythm- ---- */
  function injectCSS() {
    if (document.getElementById("g-rhythm-css")) return;
    var s = document.createElement("style");
    s.id = "g-rhythm-css";
    s.textContent = [
      ".g-rhythm-wrap{width:100%;max-width:560px;margin:0 auto;display:flex;",
        "flex-direction:column;align-items:center;gap:14px;}",
      /* 心臟脈動環 */
      ".g-rhythm-stage{position:relative;width:100%;height:200px;border-radius:var(--radius-lg);",
        "background:var(--surface-container);border:1px solid var(--outline-variant);",
        "display:flex;align-items:center;justify-content:center;overflow:hidden;}",
      ".g-rhythm-ring{width:96px;height:96px;border-radius:50%;display:flex;align-items:center;",
        "justify-content:center;background:rgba(194,24,91,.12);transition:transform .09s ease-out;",
        "will-change:transform;}",
      ".g-rhythm-ring.is-beat{transform:scale(1.35);}",
      ".g-rhythm-heart{font-size:54px;line-height:1;color:#C2185B;",
        "transition:transform .09s ease-out;will-change:transform;}",
      ".g-rhythm-ring.is-beat .g-rhythm-heart{transform:scale(1.12);}",
      /* 浮動回饋字 */
      ".g-rhythm-fb{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);",
        "font-size:1.15rem;font-weight:800;pointer-events:none;opacity:0;text-align:center;",
        "white-space:nowrap;}",
      ".g-rhythm-fb.is-show{animation:g-rhythm-float .55s ease-out;}",
      "@keyframes g-rhythm-float{0%{opacity:0;transform:translate(-50%,-30%) scale(.8);}",
        "25%{opacity:1;}100%{opacity:0;transform:translate(-50%,-130%) scale(1.05);}}",
      ".g-rhythm-perfect{color:var(--success);}",
      ".g-rhythm-good{color:#C2185B;}",
      ".g-rhythm-ok{color:var(--on-surface-variant);}",
      ".g-rhythm-miss{color:var(--error);}",
      /* 進度條 */
      ".g-rhythm-prog{width:100%;max-width:560px;height:6px;border-radius:999px;",
        "background:var(--surface-variant);overflow:hidden;}",
      ".g-rhythm-prog__fill{height:100%;width:0;background:#C2185B;transition:width .12s linear;}",
      /* TAP 大鈕 */
      ".g-rhythm-tap{width:100%;max-width:560px;min-height:120px;border:none;font:inherit;",
        "border-radius:var(--radius-lg);background:#C2185B;color:#fff;font-size:1.6rem;",
        "font-weight:800;cursor:pointer;user-select:none;touch-action:manipulation;",
        "transition:transform .06s,filter .06s;display:flex;align-items:center;justify-content:center;}",
      ".g-rhythm-tap:active{transform:scale(.98);filter:brightness(.92);}",
      ".g-rhythm-tap:disabled{opacity:.5;cursor:default;}",
      ".g-rhythm-tap.is-flash{filter:brightness(1.25);}",
      ".g-rhythm-grade{font-size:.95rem;font-weight:600;margin:0;text-align:center;min-height:1.2em;}",
      ".g-rhythm-mute{background:none;border:none;font:inherit;color:var(--on-surface-variant);",
        "cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:4px 8px;",
        "border-radius:var(--radius-sm);}",
      ".g-rhythm-mute .material-symbols-rounded{font-size:20px;}"
    ].join("");
    document.head.appendChild(s);
  }

  /* ---- 最終分數 → 評級(可調)。higher score = better ---- */
  function gradeScore(score, maxScore, t) {
    var pct = maxScore > 0 ? score / maxScore : 0;
    if (pct >= 0.92) return t({ zh: "💓 竇性節律,完美同步!", en: "💓 Sinus rhythm — perfectly in sync!" });
    if (pct >= 0.78) return t({ zh: "🎵 節奏感絕佳", en: "🎵 Great sense of rhythm" });
    if (pct >= 0.6)  return t({ zh: "👍 抓得不錯", en: "👍 Solid timing" });
    if (pct >= 0.4)  return t({ zh: "🙂 還算穩", en: "🙂 Fairly steady" });
    return t({ zh: "🫀 多練幾拍就上手", en: "🫀 A few more beats and you'll get it" });
  }

  (window.GAMES = window.GAMES || []).push({
    id: "rhythm",
    icon: "ecg_heart",
    accent: "#C2185B",
    category: { zh: "節奏", en: "Rhythm" },
    title:   { zh: "心跳節拍", en: "Heartbeat Tap" },
    tagline: { zh: "跟著心跳節拍器準確點擊,愈準分數愈高。",
               en: "Tap on the beat — the closer to the pulse, the higher you score." },

    mount: function (root, ctx) {
      injectCSS();
      var t = ctx.t;
      var best = Number(ctx.load("best", 0)) || 0;   // 0 = 尚無紀錄

      /* ---- 局面參數 ---- */
      var TOTAL_BEATS = 30;          // 一局拍數
      var START_BPM = 80;            // 起始 BPM(休息心率)
      var STEP_EVERY = 10;           // 每 N 拍加速一次
      var STEP_BPM = 12;             // 每次加速幅度
      var PERFECT = 60, GOOD = 120, OK = 200;  // 誤差門檻 (ms)
      var PTS = { perfect: 100, good: 60, ok: 25, miss: 0 };
      var MAX_SCORE = TOTAL_BEATS * PTS.perfect;

      root.innerHTML =
        '<div class="g-rhythm-wrap">' +
          '<div class="gu-statbar">' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-rhythm-score">0</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "分數", en: "Score" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-rhythm-combo">0</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "連擊", en: "Combo" })) + '</span></div>' +
            '<div class="gu-stat"><span class="gu-stat__v" id="g-rhythm-best">' +
              (best ? best : "—") + '</span>' +
              '<span class="gu-stat__k">' + ctx.esc(t({ zh: "最佳", en: "Best" })) + '</span></div>' +
          '</div>' +

          '<div class="g-rhythm-stage">' +
            '<div class="g-rhythm-ring" id="g-rhythm-ring">' +
              '<span class="material-symbols-rounded g-rhythm-heart" aria-hidden="true">ecg_heart</span>' +
            '</div>' +
            '<div class="g-rhythm-fb" id="g-rhythm-fb" aria-hidden="true"></div>' +
          '</div>' +

          '<div class="g-rhythm-prog"><div class="g-rhythm-prog__fill" id="g-rhythm-prog"></div></div>' +

          '<button class="g-rhythm-tap" id="g-rhythm-tap" type="button">' +
            ctx.esc(t({ zh: "開始 / Start", en: "Start" })) +
          '</button>' +

          '<p class="g-rhythm-grade gu-hint" id="g-rhythm-grade">' +
            ctx.esc(t({ zh: "踩準每一下心跳。也可按空白鍵。",
                        en: "Hit every heartbeat. Space works too." })) +
          '</p>' +

          '<button class="g-rhythm-mute" id="g-rhythm-mute" type="button">' +
            '<span class="material-symbols-rounded" id="g-rhythm-mute-ico" aria-hidden="true">volume_up</span>' +
            '<span id="g-rhythm-mute-txt">' + ctx.esc(t({ zh: "聲音", en: "Sound" })) + '</span>' +
          '</button>' +
        '</div>';

      var ringEl  = root.querySelector("#g-rhythm-ring");
      var fbEl    = root.querySelector("#g-rhythm-fb");
      var progEl  = root.querySelector("#g-rhythm-prog");
      var tapEl   = root.querySelector("#g-rhythm-tap");
      var gradeEl = root.querySelector("#g-rhythm-grade");
      var scoreEl = root.querySelector("#g-rhythm-score");
      var comboEl = root.querySelector("#g-rhythm-combo");
      var bestEl  = root.querySelector("#g-rhythm-best");
      var muteBtn = root.querySelector("#g-rhythm-mute");
      var muteIco = root.querySelector("#g-rhythm-mute-ico");
      var muteTxt = root.querySelector("#g-rhythm-mute-txt");

      /* ---- 狀態 ---- */
      var playing = false;
      var muted = false;
      var score = 0, combo = 0;
      var beatIndex = 0;             // 已排程的拍數
      var startTime = 0;            // 第一拍的 performance.now 基準
      var nextBeatTime = 0;        // 下一拍的預期時間戳
      var beatPeriod = 0;          // 目前拍間隔 (ms)
      var schedTimer = null;        // 排程 setTimeout
      var fbTimer = null;          // 回饋字清除
      var flashTimer = null;       // TAP 鈕閃爍清除
      var endTimer = null;         // 收尾延遲
      var scoredFlags = [];        // 每拍是否已被一次點擊計分(避免雙擊洗分)
      var lastTapAt = 0;           // 上次成功點擊時間戳(防連點)

      /* ---- WebAudio:使用者手勢觸發、try/catch 包住、靜音不報錯 ---- */
      var audioCtx = null;
      function ensureAudio() {
        if (muted) return;
        try {
          if (!audioCtx) {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (AC) audioCtx = new AC();
          }
          if (audioCtx && audioCtx.state === "suspended" && audioCtx.resume) {
            audioCtx.resume();
          }
        } catch (e) { audioCtx = null; }
      }
      function click(freq) {
        if (muted || !audioCtx) return;
        try {
          var now = audioCtx.currentTime;
          var osc = audioCtx.createOscillator();
          var gain = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq || 880, now);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.22, now + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
        } catch (e) { /* 靜音容錯 */ }
      }

      function now() {
        return (window.performance && performance.now) ? performance.now() : Date.now();
      }

      function bpmForBeat(i) {
        var step = Math.floor(i / STEP_EVERY);
        return START_BPM + step * STEP_BPM;
      }

      function pulseRing(beat) {
        ringEl.classList.add("is-beat");
        if (flashTimer) clearTimeout(flashTimer);
        flashTimer = setTimeout(function () {
          ringEl.classList.remove("is-beat");
        }, 110);
        if (beat) click(880);
      }

      function showFeedback(label, cls) {
        fbEl.textContent = label;
        fbEl.className = "g-rhythm-fb " + cls + " is-show";
        if (fbTimer) clearTimeout(fbTimer);
        fbTimer = setTimeout(function () {
          fbEl.className = "g-rhythm-fb " + cls;
        }, 560);
      }

      /* 精準排程器:由 startTime 推算每拍預期時間,避免 setInterval 累積飄移 */
      function scheduleNext() {
        if (!playing) return;
        var delay = Math.max(0, nextBeatTime - now());
        schedTimer = setTimeout(function () {
          if (!playing) return;
          onBeat();
        }, delay);
      }

      function onBeat() {
        // 視覺/聲音脈動 + 推進進度
        pulseRing(true);
        progEl.style.width = ((beatIndex + 1) / TOTAL_BEATS * 100) + "%";
        beatIndex++;

        if (beatIndex >= TOTAL_BEATS) {
          // 最後一拍之後,給一個誤差窗口收尾,讓最後一拍的點擊也能被計分
          endTimer = setTimeout(finish, OK + 60);
          return;
        }
        // 排下一拍:更新 BPM 與預期時間戳
        beatPeriod = 60000 / bpmForBeat(beatIndex);
        nextBeatTime += beatPeriod;
        scheduleNext();
      }

      /* 找出與目前時間最近的「拍時間戳」並回傳誤差 ms 與該拍索引 */
      function nearestBeat(tNow) {
        // 拍 k 的預期時間 = startTime + sum(period_0..k-1)
        // BPM 分段固定,直接以索引重建累積時間。
        var bestErr = Infinity, bestIdx = -1, acc = startTime;
        for (var k = 0; k < TOTAL_BEATS; k++) {
          var err = Math.abs(tNow - acc);
          if (err < bestErr) { bestErr = err; bestIdx = k; }
          acc += 60000 / bpmForBeat(k);
          if (acc - tNow > OK) break;  // 之後只會更遠,提早結束
        }
        return { err: bestErr, idx: bestIdx };
      }

      function judge() {
        if (!playing) return;
        var tNow = now();
        // 防連點:同一個 16ms 內的重複事件忽略
        if (tNow - lastTapAt < 40) return;
        lastTapAt = tNow;

        var nb = nearestBeat(tNow);
        var err = nb.err, idx = nb.idx;

        // 已被計分的拍不重複加分(避免在一拍附近狂點洗分)
        if (idx >= 0 && scoredFlags[idx]) {
          flashTap();
          return;
        }

        var label, cls, pts;
        if (err < PERFECT)      { label = "Perfect"; cls = "g-rhythm-perfect"; pts = PTS.perfect; }
        else if (err < GOOD)    { label = "Good";    cls = "g-rhythm-good";    pts = PTS.good; }
        else if (err < OK)      { label = "OK";      cls = "g-rhythm-ok";      pts = PTS.ok; }
        else                    { label = "Miss";    cls = "g-rhythm-miss";    pts = PTS.miss; }

        if (pts > 0 && idx >= 0) scoredFlags[idx] = true;

        if (pts > 0) {
          combo++;
          score += pts + Math.min(combo, 20);  // 連擊小加成
        } else {
          combo = 0;
        }
        scoreEl.textContent = score;
        comboEl.textContent = combo;
        showFeedback(t({
          zh: { Perfect: "完美", Good: "不錯", OK: "尚可", Miss: "失誤" }[label],
          en: label
        }), cls);
        flashTap();
      }

      function flashTap() {
        tapEl.classList.add("is-flash");
        setTimeout(function () { tapEl.classList.remove("is-flash"); }, 70);
      }

      function start() {
        ensureAudio();
        playing = true;
        score = 0; combo = 0; beatIndex = 0;
        scoredFlags = new Array(TOTAL_BEATS);
        scoreEl.textContent = "0";
        comboEl.textContent = "0";
        progEl.style.width = "0%";
        gradeEl.textContent = t({ zh: "踩準節拍!", en: "Stay on the beat!" });
        tapEl.textContent = t({ zh: "TAP", en: "TAP" });

        // 給一拍的前置時間,讓玩家準備
        beatPeriod = 60000 / bpmForBeat(0);
        startTime = now() + beatPeriod;
        nextBeatTime = startTime;
        scheduleNext();
      }

      function finish() {
        playing = false;
        if (schedTimer) { clearTimeout(schedTimer); schedTimer = null; }
        ringEl.classList.remove("is-beat");
        progEl.style.width = "100%";

        if (score > best) {
          best = score; ctx.save("best", best); bestEl.textContent = best;
        }
        gradeEl.textContent = gradeScore(score, MAX_SCORE, t) +
          "  ·  " + score + (best === score ? "" : "");
        tapEl.textContent = t({ zh: "再玩一次 / Play again", en: "Play again" });
      }

      function onTap() {
        if (!playing) { start(); return; }
        judge();
      }

      /* ---- 事件 ---- */
      function onPointer(e) {
        // 用 pointerdown 取得最即時的時間;避免 click 的合成延遲影響準度
        e.preventDefault();
        onTap();
      }
      function onKey(e) {
        if (e.code === "Space" || e.key === " " || e.keyCode === 32) {
          if (playing) e.preventDefault();   // 進行中阻止頁面捲動
          // 開始也用空白鍵(此時無捲動風險,但仍阻止以免重複觸發)
          if (!e.repeat) onTap();
          if (!playing) e.preventDefault();
        }
      }
      function onMute() {
        muted = !muted;
        muteIco.textContent = muted ? "volume_off" : "volume_up";
        muteTxt.textContent = muted
          ? t({ zh: "靜音", en: "Muted" })
          : t({ zh: "聲音", en: "Sound" });
        if (!muted) ensureAudio();
      }

      tapEl.addEventListener("pointerdown", onPointer);
      muteBtn.addEventListener("click", onMute);
      document.addEventListener("keydown", onKey);

      /* cleanup:清掉所有 timer/listener,並關閉 AudioContext */
      return function cleanup() {
        playing = false;
        if (schedTimer) clearTimeout(schedTimer);
        if (fbTimer) clearTimeout(fbTimer);
        if (flashTimer) clearTimeout(flashTimer);
        if (endTimer) clearTimeout(endTimer);
        tapEl.removeEventListener("pointerdown", onPointer);
        muteBtn.removeEventListener("click", onMute);
        document.removeEventListener("keydown", onKey);
        if (audioCtx && audioCtx.close) {
          try { audioCtx.close(); } catch (e) { /* 忽略 */ }
        }
        audioCtx = null;
      };
    }
  });
})();
