/* =========================================================================
   quiz.js — 醫療知識問答 / Health Quiz   ★ 依 _CONTRACT.md 與 reaction.js 結構

   玩法:10 題選擇題,混合醫療常識與 Medical Taiwan 2026 展會冷知識。
   每題 4 個選項,點選後鎖定、標出正解(綠)與選錯(紅),顯示解說與「下一題」。
   答完 10 題顯示總分 X/10 與評語,可再玩一次。最佳成績(答對最多題)會記錄。

   照契約結構:IIFE 封裝、window.GAMES.push、mount(root, ctx)、
   一次注入的 scoped CSS(前綴 g-quiz-)、ctx.t 雙語、ctx.load/save 持久化、
   回傳 cleanup 清掉所有 listener。
   ========================================================================= */
(function () {
  "use strict";

  /* ---- scoped CSS:整支遊戲只注入一次,所有 class 前綴 g-quiz- ---- */
  function injectCSS() {
    if (document.getElementById("g-quiz-css")) return;
    var s = document.createElement("style");
    s.id = "g-quiz-css";
    s.textContent = [
      ".g-quiz-wrap{width:100%;max-width:560px;margin:0 auto;}",
      ".g-quiz-progress{font-size:.85rem;font-weight:600;color:var(--on-surface-variant);",
        "text-align:center;margin:0 0 10px;}",
      ".g-quiz-bar{width:100%;height:6px;border-radius:999px;background:var(--surface-variant);",
        "overflow:hidden;margin:0 0 16px;}",
      ".g-quiz-bar__fill{height:100%;background:var(--primary);border-radius:999px;",
        "transition:width .25s ease;}",
      ".g-quiz-q{font-size:1.1rem;font-weight:700;line-height:1.45;color:var(--on-surface);",
        "margin:0 0 16px;}",
      ".g-quiz-opts{display:flex;flex-direction:column;gap:10px;}",
      ".g-quiz-opt{display:flex;align-items:center;gap:10px;width:100%;text-align:left;",
        "padding:13px 14px;border-radius:var(--radius);border:1.5px solid var(--outline-variant);",
        "background:var(--surface-container);color:var(--on-surface);font:inherit;font-size:1rem;",
        "line-height:1.4;cursor:pointer;transition:border-color .12s,background .12s;}",
      ".g-quiz-opt:hover:not(:disabled){border-color:var(--primary);}",
      ".g-quiz-opt:disabled{cursor:default;}",
      ".g-quiz-opt__key{flex:0 0 auto;width:26px;height:26px;border-radius:50%;",
        "display:inline-flex;align-items:center;justify-content:center;font-size:.85rem;",
        "font-weight:700;background:var(--surface-variant);color:var(--on-surface-variant);}",
      ".g-quiz-opt__txt{flex:1 1 auto;}",
      ".g-quiz-opt--right{border-color:var(--success);background:color-mix(in srgb,var(--success) 14%,transparent);}",
      ".g-quiz-opt--right .g-quiz-opt__key{background:var(--success);color:#fff;}",
      ".g-quiz-opt--wrong{border-color:var(--error);background:color-mix(in srgb,var(--error) 14%,transparent);}",
      ".g-quiz-opt--wrong .g-quiz-opt__key{background:var(--error);color:#fff;}",
      ".g-quiz-explain{margin:14px 0 0;padding:12px 14px;border-radius:var(--radius);",
        "background:var(--surface-variant);color:var(--on-surface-variant);font-size:.92rem;",
        "line-height:1.5;}",
      ".g-quiz-explain__tag{font-weight:700;margin-right:6px;}",
      ".g-quiz-explain--right .g-quiz-explain__tag{color:var(--success);}",
      ".g-quiz-explain--wrong .g-quiz-explain__tag{color:var(--error);}",
      ".g-quiz-next{margin-top:16px;width:100%;}",
      ".g-quiz-end{text-align:center;}",
      ".g-quiz-end__score{font-size:2.4rem;font-weight:800;color:var(--primary);margin:4px 0;}",
      ".g-quiz-end__grade{font-size:1.05rem;font-weight:600;color:var(--on-surface);margin:0 0 4px;}"
    ].join("");
    document.head.appendChild(s);
  }

  /* ---- 題庫:10 題。混醫療常識 + Medical Taiwan 2026 安全可推得的事實 ---- */
  /* 每題 = { q:{zh,en}, options:[{zh,en}×4], answer:正解 index, explain:{zh,en} } */
  function buildBank() {
    return [
      {
        q: { zh: "成人安靜時的正常心跳大約是每分鐘幾下?",
             en: "What is a normal resting heart rate for an adult?" },
        options: [
          { zh: "20–40 下/分", en: "20–40 bpm" },
          { zh: "60–100 下/分", en: "60–100 bpm" },
          { zh: "120–160 下/分", en: "120–160 bpm" },
          { zh: "180–220 下/分", en: "180–220 bpm" }
        ],
        answer: 1,
        explain: { zh: "一般成人安靜時心跳約落在每分鐘 60–100 下;運動員可能更低。",
                   en: "A typical adult resting heart rate is about 60–100 bpm; athletes can be lower." }
      },
      {
        q: { zh: "醫學縮寫「BP」代表什麼?",
             en: "What does the medical abbreviation \"BP\" stand for?" },
        options: [
          { zh: "血壓 (Blood Pressure)", en: "Blood Pressure" },
          { zh: "體溫 (Body Temperature)", en: "Body Temperature" },
          { zh: "脈搏速率 (Beat Pace)", en: "Beat Pace" },
          { zh: "呼吸頻率 (Breathing Pace)", en: "Breathing Pace" }
        ],
        answer: 0,
        explain: { zh: "BP 是 Blood Pressure(血壓),常以收縮壓/舒張壓表示,例如 120/80 mmHg。",
                   en: "BP means Blood Pressure, usually written as systolic/diastolic, e.g. 120/80 mmHg." }
      },
      {
        q: { zh: "聽診器主要用來「聽」身體的什麼?",
             en: "A stethoscope is mainly used to listen to what?" },
        options: [
          { zh: "骨頭密度", en: "Bone density" },
          { zh: "血糖值", en: "Blood sugar level" },
          { zh: "心音、肺音與腸音等體內聲音", en: "Internal sounds like the heart, lungs and bowel" },
          { zh: "視力清晰度", en: "Visual acuity" }
        ],
        answer: 2,
        explain: { zh: "聽診器用來聆聽心音、呼吸音、腸音等體內聲音,協助初步診斷。",
                   en: "A stethoscope lets clinicians hear heart, breath and bowel sounds to aid diagnosis." }
      },
      {
        q: { zh: "MRI(核磁共振造影)主要利用下列哪一種原理成像?",
             en: "MRI scanners create images primarily using what?" },
        options: [
          { zh: "X 光輻射", en: "X-ray radiation" },
          { zh: "強力磁場與無線電波", en: "Strong magnetic fields and radio waves" },
          { zh: "高頻超音波", en: "High-frequency ultrasound" },
          { zh: "γ 射線同位素", en: "Gamma-ray isotopes" }
        ],
        answer: 1,
        explain: { zh: "MRI 用強磁場與無線電波成像,不使用游離輻射(X 光);這也是它的優點之一。",
                   en: "MRI uses strong magnets and radio waves — not ionising X-ray radiation, which is one of its advantages." }
      },
      {
        q: { zh: "一般成人每天建議的總水分攝取量大約是?",
             en: "Roughly how much total water intake is recommended for an adult per day?" },
        options: [
          { zh: "約 0.5 公升", en: "About 0.5 litres" },
          { zh: "約 2 公升", en: "About 2 litres" },
          { zh: "約 8 公升", en: "About 8 litres" },
          { zh: "約 15 公升", en: "About 15 litres" }
        ],
        answer: 1,
        explain: { zh: "常見建議約每天 2 公升上下(含食物中的水分),實際需求因體型、氣候與活動量而異。",
                   en: "A common guideline is around 2 litres a day (including water from food); needs vary with size, climate and activity." }
      },
      {
        q: { zh: "正常人體核心體溫大約是攝氏幾度?",
             en: "What is normal human core body temperature in Celsius?" },
        options: [
          { zh: "約 32°C", en: "About 32°C" },
          { zh: "約 37°C", en: "About 37°C" },
          { zh: "約 42°C", en: "About 42°C" },
          { zh: "約 47°C", en: "About 47°C" }
        ],
        answer: 1,
        explain: { zh: "人體正常核心體溫約 37°C(約 98.6°F),會隨時間與測量部位略有變化。",
                   en: "Normal core body temperature is around 37°C (about 98.6°F), varying slightly by time and site." }
      },
      {
        q: { zh: "成人心肺復甦術(CPR)胸外按壓的建議速率約為?",
             en: "What is the recommended chest-compression rate for adult CPR?" },
        options: [
          { zh: "每分鐘 30–50 次", en: "30–50 per minute" },
          { zh: "每分鐘 100–120 次", en: "100–120 per minute" },
          { zh: "每分鐘 200–250 次", en: "200–250 per minute" },
          { zh: "每分鐘 5–10 次", en: "5–10 per minute" }
        ],
        answer: 1,
        explain: { zh: "成人 CPR 建議以每分鐘 100–120 次的速率按壓,深度約 5 公分。",
                   en: "Adult CPR is recommended at 100–120 compressions per minute, about 5 cm deep." }
      },
      {
        q: { zh: "Medical Taiwan 2026 三大主題館不包含下列哪一項?",
             en: "Which is NOT one of Medical Taiwan 2026's three pillars?" },
        options: [
          { zh: "創新照護 Innovative Care", en: "Innovative Care" },
          { zh: "智慧醫療 Smart Healthcare", en: "Smart Healthcare" },
          { zh: "醫材供應鏈 Medical Supplies Hub", en: "Medical Supplies Hub" },
          { zh: "太空醫學 Space Medicine", en: "Space Medicine" }
        ],
        answer: 3,
        explain: { zh: "Medical Taiwan 2026 三大主題為:創新照護、智慧醫療、醫材供應鏈;並無「太空醫學」館。",
                   en: "The three pillars are Innovative Care, Smart Healthcare and the Medical Supplies Hub — there is no Space Medicine pavilion." }
      },
      {
        q: { zh: "Medical Taiwan 2026 的主要展出地點是?",
             en: "Where is Medical Taiwan 2026 mainly held?" },
        options: [
          { zh: "台北世貿中心一館 (TWTC Hall 1)", en: "Taipei World Trade Center Hall 1" },
          { zh: "高雄展覽館", en: "Kaohsiung Exhibition Center" },
          { zh: "台中國際會展中心", en: "Taichung International Expo Center" },
          { zh: "桃園國際機場", en: "Taoyuan International Airport" }
        ],
        answer: 0,
        explain: { zh: "展會主要於台北世貿中心一館(TWTC Hall 1)舉行。",
                   en: "The expo is held mainly at the Taipei World Trade Center Hall 1 (TWTC Hall 1)." }
      },
      {
        q: { zh: "Medical Taiwan 2026 是第幾屆台灣國際醫療暨健康照護展?",
             en: "Which edition of the show is Medical Taiwan 2026?" },
        options: [
          { zh: "第 5 屆", en: "The 5th edition" },
          { zh: "第 12 屆", en: "The 12th edition" },
          { zh: "第 20 屆", en: "The 20th edition" },
          { zh: "第 50 屆", en: "The 50th edition" }
        ],
        answer: 2,
        explain: { zh: "Medical Taiwan 2026 為第 20 屆,展期為 2026 年 6 月 25–27 日。",
                   en: "Medical Taiwan 2026 is the 20th edition, running June 25–27, 2026." }
      }
    ];
  }

  /* ---- Fisher–Yates 洗牌(回傳新陣列,不改原陣列) ---- */
  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  /* ---- 總分 → 評語(滿分 10,higher is better) ---- */
  function gradeScore(score, t) {
    if (score >= 10) return t({ zh: "🏆 滿分!醫療達人就是你", en: "🏆 Perfect score — a true medical whiz!" });
    if (score >= 8)  return t({ zh: "🩺 很強,專業水準", en: "🩺 Excellent — clinical level!" });
    if (score >= 6)  return t({ zh: "👍 不錯,及格有餘", en: "👍 Nice — comfortably passed" });
    if (score >= 4)  return t({ zh: "🙂 還行,再加把勁", en: "🙂 Not bad — keep going" });
    return t({ zh: "📚 多逛逛展場補補知識吧", en: "📚 Time to explore the expo and learn more!" });
  }

  (window.GAMES = window.GAMES || []).push({
    id: "quiz",
    icon: "quiz",
    accent: "#00696E",
    category: { zh: "知識", en: "Knowledge" },
    title:   { zh: "醫療知識問答", en: "Health Quiz" },
    tagline: { zh: "10 題醫療常識與展會冷知識,看你能答對幾題。",
               en: "10 medical-trivia questions — how many can you ace?" },

    mount: function (root, ctx) {
      injectCSS();
      var t = ctx.t;
      var esc = ctx.esc;
      var KEYS = ["A", "B", "C", "D"];

      var best = Number(ctx.load("best", 0)) || 0;   // 0 = 尚無紀錄;higher is better

      /* 每局:洗題序,並為每題洗選項順序(保留正解位置) */
      var questions = [];
      function newRound() {
        questions = shuffled(buildBank()).map(function (item) {
          var idx = item.options.map(function (_, i) { return i; });
          var order = shuffled(idx);
          var opts = order.map(function (i) { return item.options[i]; });
          var ans = order.indexOf(item.answer);
          return { q: item.q, options: opts, answer: ans, explain: item.explain };
        });
      }

      var cur = 0;        // 目前題號(0-based)
      var score = 0;      // 答對數
      var answered = false;
      var listeners = []; // 收集事件 listener 供 cleanup 清除

      function on(el, ev, fn) {
        el.addEventListener(ev, fn);
        listeners.push([el, ev, fn]);
      }
      function clearListeners() {
        for (var i = 0; i < listeners.length; i++) {
          listeners[i][0].removeEventListener(listeners[i][1], listeners[i][2]);
        }
        listeners = [];
      }

      var total; // 題數

      /* ---- 渲染單題 ---- */
      function renderQuestion() {
        answered = false;
        var item = questions[cur];
        var pct = Math.round((cur / total) * 100);

        var optsHtml = "";
        for (var i = 0; i < item.options.length; i++) {
          optsHtml +=
            '<button class="g-quiz-opt" type="button" data-i="' + i + '">' +
              '<span class="g-quiz-opt__key" aria-hidden="true">' + esc(KEYS[i]) + '</span>' +
              '<span class="g-quiz-opt__txt">' + esc(t(item.options[i])) + '</span>' +
            '</button>';
        }

        root.innerHTML =
          '<div class="g-quiz-wrap gu-panel">' +
            '<p class="g-quiz-progress">' +
              esc(t({ zh: "第 " + (cur + 1) + " / " + total + " 題",
                      en: "Question " + (cur + 1) + " / " + total })) +
              '　·　' +
              esc(t({ zh: "答對 " + score, en: "Score " + score })) +
            '</p>' +
            '<div class="g-quiz-bar"><div class="g-quiz-bar__fill" style="width:' + pct + '%"></div></div>' +
            '<p class="g-quiz-q">' + esc(t(item.q)) + '</p>' +
            '<div class="g-quiz-opts" id="g-quiz-opts">' + optsHtml + '</div>' +
            '<div id="g-quiz-after"></div>' +
          '</div>';

        var optButtons = root.querySelectorAll(".g-quiz-opt");
        for (var k = 0; k < optButtons.length; k++) {
          on(optButtons[k], "click", onPick);
        }
      }

      /* ---- 點選某選項 ---- */
      function onPick(e) {
        if (answered) return;
        answered = true;

        var btn = e.currentTarget;
        var chosen = Number(btn.getAttribute("data-i"));
        var item = questions[cur];
        var correct = item.answer;
        var isRight = chosen === correct;
        if (isRight) score++;

        var optButtons = root.querySelectorAll(".g-quiz-opt");
        for (var i = 0; i < optButtons.length; i++) {
          var bi = Number(optButtons[i].getAttribute("data-i"));
          optButtons[i].disabled = true;
          if (bi === correct) optButtons[i].classList.add("g-quiz-opt--right");
          else if (bi === chosen) optButtons[i].classList.add("g-quiz-opt--wrong");
        }

        var tag = isRight
          ? t({ zh: "答對!", en: "Correct!" })
          : t({ zh: "答錯", en: "Not quite" });

        var isLast = cur >= total - 1;
        var nextLabel = isLast
          ? t({ zh: "看結果", en: "See results" })
          : t({ zh: "下一題", en: "Next" });

        var after = root.querySelector("#g-quiz-after");
        after.innerHTML =
          '<div class="g-quiz-explain ' + (isRight ? "g-quiz-explain--right" : "g-quiz-explain--wrong") + '">' +
            '<span class="g-quiz-explain__tag">' + esc(tag) + '</span>' +
            esc(t(item.explain)) +
          '</div>' +
          '<button class="gu-btn gu-btn--primary g-quiz-next" id="g-quiz-next" type="button">' +
            esc(nextLabel) +
          '</button>';

        on(root.querySelector("#g-quiz-next"), "click", onNext);
      }

      /* ---- 下一題 / 結算 ---- */
      function onNext() {
        if (cur >= total - 1) {
          renderEnd();
          return;
        }
        cur++;
        renderQuestion();
      }

      /* ---- 結算畫面 ---- */
      function renderEnd() {
        var isBest = false;
        if (score > best) { best = score; ctx.save("best", best); isBest = true; }

        root.innerHTML =
          '<div class="g-quiz-wrap gu-panel g-quiz-end">' +
            '<p class="gu-hint">' + esc(t({ zh: "你的成績", en: "Your score" })) + '</p>' +
            '<p class="g-quiz-end__score">' + score + ' / ' + total + '</p>' +
            '<p class="g-quiz-end__grade">' + esc(gradeScore(score, t)) + '</p>' +
            '<div class="gu-statbar" style="margin-top:14px;">' +
              '<div class="gu-stat"><span class="gu-stat__v">' + score + '</span>' +
                '<span class="gu-stat__k">' + esc(t({ zh: "本次答對", en: "This run" })) + '</span></div>' +
              '<div class="gu-stat"><span class="gu-stat__v">' + best + '</span>' +
                '<span class="gu-stat__k">' + esc(t({ zh: "最佳", en: "Best" })) + '</span></div>' +
            '</div>' +
            (isBest
              ? '<p class="gu-hint" style="margin-top:10px;">' +
                  esc(t({ zh: "🎉 刷新最佳紀錄!", en: "🎉 New best score!" })) + '</p>'
              : '') +
            '<button class="gu-btn gu-btn--primary g-quiz-next" id="g-quiz-again" type="button">' +
              esc(t({ zh: "再玩一次", en: "Play again" })) +
            '</button>' +
          '</div>';

        on(root.querySelector("#g-quiz-again"), "click", startGame);
      }

      /* ---- 開新局 ---- */
      function startGame() {
        clearListeners();
        newRound();
        total = questions.length;
        cur = 0;
        score = 0;
        renderQuestion();
      }

      startGame();

      /* cleanup:關閉或語言切換時,清掉所有 listener */
      return function cleanup() {
        clearListeners();
      };
    }
  });
})();
