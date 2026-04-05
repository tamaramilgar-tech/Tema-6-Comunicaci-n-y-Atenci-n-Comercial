// js/app.js
(() => {
  "use strict";
  console.log("CARGANDO js/app.js (Tema 4) OK");

  // ========= Configuración =========
  const MAX_ATTEMPTS = 3;
  const QUESTIONS_PER_PHASE = 15;

  // ========= Vistas =========
  const views = {
    home: document.getElementById("view-home"),
    phase1: document.getElementById("view-phase1"),
    phase2: document.getElementById("view-phase2"),
    phase3: document.getElementById("view-phase3"),
    phase4: document.getElementById("view-phase4"),
    phase5: document.getElementById("view-phase5"),
    certificate: document.getElementById("view-certificate"),
  };

  function showView(viewId) {
    Object.values(views).forEach(v => v && v.classList.add("hidden"));
    if (views[viewId]) views[viewId].classList.remove("hidden");

    // estilo activo
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("is-active", b.dataset.view === viewId));
  }

  // ========= Estado / Progreso =========
  const KEY = "t4_escr_progress_v1";
  const ATTEMPTS_KEY = "t4_escr_attempts_v1";
  // En este tema: barajado real (preguntas + opciones) en cada intento,
  // como en el Tema 3. No persistimos selección/orden ni barajados.
  const ACT_KEY = "t4_escr_phase5_activities_v1";

  const defaultState = {
    unlocked: { phase1: true, phase2: false, phase3: false, phase4: false, phase5: false, certificate: false },
    verified: { phase2: false, phase3: false, phase4: false, phase5: false },
    passed: { phase1: false, phase2: false, phase3: false, phase4: false, phase5: false },
    scores: { phase1: 0, phase2: 0, phase3: 0, phase4: 0, phase5: 0 },
  };

  const state = (() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!raw) return structuredClone(defaultState);
      return {
        ...structuredClone(defaultState),
        ...raw,
        unlocked: { ...defaultState.unlocked, ...(raw.unlocked || {}) },
        verified: { ...defaultState.verified, ...(raw.verified || {}) },
        passed: { ...defaultState.passed, ...(raw.passed || {}) },
        scores: { ...defaultState.scores, ...(raw.scores || {}) },
      };
    } catch {
      return structuredClone(defaultState);
    }
  })();

  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

  // ========= Intentos =========
  const attempts = (() => { try { return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || "{}"); } catch { return {}; } })();
  function saveAttempts() { localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts)); }
  function getAttempts(phaseKey) { return Number(attempts[phaseKey] || 0); }
  function incAttempts(phaseKey) { attempts[phaseKey] = getAttempts(phaseKey) + 1; saveAttempts(); }
  function attemptsLeft(phaseKey) { return Math.max(0, MAX_ATTEMPTS - getAttempts(phaseKey)); }
  function canAttempt(phaseKey) { if (state.passed[phaseKey]) return true; return getAttempts(phaseKey) < MAX_ATTEMPTS; }

  // ========= Bancos =========
  const bankMap = {
    phase1: window.phase1Bank,
    phase2: window.phase2Bank,
    phase3: window.phase3Bank,
    phase4: window.phase4Bank,
    phase5: window.phase5Bank,
  };

  // ========= Utils =========
  function shuffleArray(arr, rng = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ========= Quiz por intento (Tema 3-style) =========
  // - En cada intento: 15 preguntas aleatorias (sin persistencia)
  // - Orden de preguntas aleatorio
  // - Opciones A/B/C/D barajadas y se recalcula la correcta
  const quizSession = Object.create(null);

  function buildAttemptQuiz(phaseKey) {
    const bank = bankMap[phaseKey];
    if (!Array.isArray(bank) || bank.length === 0) return [];

    const n = Math.min(QUESTIONS_PER_PHASE, bank.length);
    const picked = shuffleArray(bank).slice(0, n);

    const normalized = picked.map((item) => {
      const idxs = shuffleArray([0, 1, 2, 3]);
      const options = idxs.map(i => item.options[i]);
      const answerIndex = idxs.indexOf(item.answerIndex);
      return { q: item.q, options, answerIndex };
    });

    return shuffleArray(normalized);
  }

  function ensureAttemptQuiz(phaseKey) {
    if (!quizSession[phaseKey] || !Array.isArray(quizSession[phaseKey].questions)) {
      quizSession[phaseKey] = { questions: buildAttemptQuiz(phaseKey) };
    }
  }

  function resetAttemptQuiz(phaseKey) {
    quizSession[phaseKey] = { questions: buildAttemptQuiz(phaseKey) };
  }

  function getAttemptQuestions(phaseKey) {
    ensureAttemptQuiz(phaseKey);
    return quizSession[phaseKey].questions || [];
  }

  // ========= Actividades Fase 5 =========
  const actState = (() => { try { return JSON.parse(localStorage.getItem(ACT_KEY) || "{}"); } catch { return {}; } })();
  function saveActs() { localStorage.setItem(ACT_KEY, JSON.stringify(actState)); }
  function activitiesDone() { return actState.a1 === true && actState.a2 === true && actState.a3 === true; }

  // ========= UI =========
  function setBadge(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  function setResult(resultId, text) {
    const el = document.getElementById(resultId);
    if (el) el.textContent = text;
  }

  function refreshUI() {
    // Tabs
    document.querySelectorAll(".tab").forEach(btn => {
      const v = btn.dataset.view;
      if (!v) return;
      if (v === "home") btn.disabled = false;
      else if (v === "phase1") btn.disabled = !state.unlocked.phase1;
      else if (v === "phase2") btn.disabled = !state.unlocked.phase2;
      else if (v === "phase3") btn.disabled = !state.unlocked.phase3;
      else if (v === "phase4") btn.disabled = !state.unlocked.phase4;
      else if (v === "phase5") btn.disabled = !state.unlocked.phase5;
      else if (v === "certificate") btn.disabled = !state.unlocked.certificate;
    });

    // Badges
    setBadge("phase1Badge", state.passed.phase1 ? "🟩 FASE 1: completada" : "🟦 FASE 1: pendiente");
    setBadge("phase2Badge", state.passed.phase2 ? "🟩 FASE 2: completada" : "🔒 FASE 2: bloqueada");
    setBadge("phase3Badge", state.passed.phase3 ? "🟩 FASE 3: completada" : "🔒 FASE 3: bloqueada");
    setBadge("phase4Badge", state.passed.phase4 ? "🟩 FASE 4: completada" : "🔒 FASE 4: bloqueada");
    setBadge("phase5Badge", state.passed.phase5 ? "🟩 FASE 5: completada" : "🔒 FASE 5: bloqueada");

    // Intentos (si no quedan, deshabilita)
    ["phase1","phase2","phase3","phase4","phase5"].forEach((pk, i) => {
      const n = i + 1;
      const btn = document.getElementById(`p${n}SubmitQuiz`);
      if (!btn) return;
      if (!canAttempt(pk)) btn.disabled = true;
    });

    // Docente: fases 2-4
    const p2Submit = document.getElementById("p2SubmitQuiz");
    if (p2Submit) p2Submit.disabled = p2Submit.disabled || !state.verified.phase2;

    const p3Submit = document.getElementById("p3SubmitQuiz");
    if (p3Submit) p3Submit.disabled = p3Submit.disabled || !state.verified.phase3;

    const p4Submit = document.getElementById("p4SubmitQuiz");
    if (p4Submit) p4Submit.disabled = p4Submit.disabled || !state.verified.phase4;

    // Fase 5: docente + actividades
    const p5Submit = document.getElementById("p5SubmitQuiz");
    if (p5Submit) p5Submit.disabled = p5Submit.disabled || !state.verified.phase5 || !activitiesDone();

    // Mensaje fase 5
    const p5LockMsg = document.getElementById("p5TestLockMsg");
    if (p5LockMsg) {
      if (!state.verified.phase5) p5LockMsg.textContent = "🔒 Test bloqueado. Introduce el código del docente para habilitar la corrección.";
      else if (!activitiesDone()) p5LockMsg.textContent = "🧩 Completa primero las 3 actividades interactivas para habilitar la corrección del test final.";
      else if (!canAttempt("phase5")) p5LockMsg.textContent = `❌ Sin intentos disponibles (máximo ${MAX_ATTEMPTS}).`;
      else p5LockMsg.textContent = "";
    }

    // Certificado
    const certTab = document.getElementById("certTab");
    if (certTab) certTab.disabled = !state.unlocked.certificate;

    const downloadBtn = document.getElementById("downloadCertBtn");
    if (downloadBtn) downloadBtn.disabled = !state.unlocked.certificate;
  }

  // ========= Navegación =========
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => { if (!btn.disabled) showView(btn.dataset.view); });
  });

  const startBtn = document.getElementById("startPhase1Btn");
  if (startBtn) startBtn.addEventListener("click", () => showView("phase1"));

  // ========= Reiniciar =========
  const resetBtn = document.getElementById("resetProgressBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const ok = confirm("¿Reiniciar progreso de este tema en ESTE navegador? (No afecta a otros dispositivos)");
      if (!ok) return;

      Object.keys(localStorage)
        .filter(k =>
          k.includes("t4_escr_") ||
          k.startsWith("teacher_unlock_") ||
          k.toLowerCase().includes("teachergate")
        )
        .forEach(k => localStorage.removeItem(k));

      location.reload();
    });
  }

  // ========= Render Quiz =========
  function renderQuiz(phaseKey, mountId) {
    const mount = document.getElementById(mountId);
    if (!mount) return;

    const questions = getAttemptQuestions(phaseKey);
    if (!questions.length) {
      mount.innerHTML = `<p class="hint">⚠️ No hay preguntas cargadas para ${phaseKey}. Revisa js/data.js.</p>`;
      return;
    }
    mount.innerHTML = questions.map((item, qi) => {
      const name = `${phaseKey}_q${qi}`;
      const opts = item.options.map((opt, oi) => {
        const id = `${name}_o${oi}`;
        return `
          <label for="${id}" style="display:block; margin:.35rem 0;">
            <input type="radio" id="${id}" name="${name}" value="${oi}">
            ${opt}
          </label>
        `;
      }).join("");

      return `
        <div style="margin:12px 0; padding:12px; border:1px solid rgba(255,255,255,.10); border-radius:16px; background: rgba(0,0,0,.16);">
          <p style="margin:0 0 8px 0;"><strong>${qi + 1}.</strong> ${item.q}</p>
          ${opts}
        </div>
      `;
    }).join("");
  }

  function gradeQuiz(phaseKey) {
    const questions = getAttemptQuestions(phaseKey);
    if (!questions.length) return { ok: 0, total: 0, pct: 0 };

    let ok = 0;
    questions.forEach((item, qi) => {
      const sel = document.querySelector(`input[name="${phaseKey}_q${qi}"]:checked`);
      if (sel && Number(sel.value) === item.answerIndex) ok++;
    });

    const total = questions.length;
    const pct = Math.round((ok / total) * 100);
    return { ok, total, pct };
  }

  function unlockNextAfterPass(phaseKey) {
    if (phaseKey === "phase1") state.unlocked.phase2 = true;
    if (phaseKey === "phase2") state.unlocked.phase3 = true;
    if (phaseKey === "phase3") state.unlocked.phase4 = true;
    if (phaseKey === "phase4") state.unlocked.phase5 = true;
    if (phaseKey === "phase5") state.unlocked.certificate = true;
  }

  function nextViewOf(phaseKey) {
    if (phaseKey === "phase1") return "phase2";
    if (phaseKey === "phase2") return "phase3";
    if (phaseKey === "phase3") return "phase4";
    if (phaseKey === "phase4") return "phase5";
    if (phaseKey === "phase5") return "certificate";
    return "home";
  }

  function handleSubmit(phaseKey, mountId, resultId) {
    if (!canAttempt(phaseKey)) {
      setResult(resultId, `❌ Sin intentos disponibles. (Máximo ${MAX_ATTEMPTS})`);
      refreshUI();
      return;
    }

    incAttempts(phaseKey);

    const { ok, total, pct } = gradeQuiz(phaseKey);
    state.scores[phaseKey] = pct;

    setResult(resultId, `Resultado: ${ok}/${total} (${pct}%) — Intentos restantes: ${attemptsLeft(phaseKey)}`);

    if (pct >= 80) {
      state.passed[phaseKey] = true;
      unlockNextAfterPass(phaseKey);
      save();
      refreshUI();
      showView(nextViewOf(phaseKey));
    } else {
      state.passed[phaseKey] = false;
      save();
      refreshUI();

      // Si aún quedan intentos, prepara un nuevo intento con preguntas barajadas.
      if (canAttempt(phaseKey)) {
        resetAttemptQuiz(phaseKey);
        renderQuiz(phaseKey, mountId);
      }
    }
  }

  // Render quizzes
  renderQuiz("phase1", "p1Quiz");
  renderQuiz("phase2", "p2Quiz");
  renderQuiz("phase3", "p3Quiz");
  renderQuiz("phase4", "p4Quiz");
  renderQuiz("phase5", "p5Quiz");

  // Submit buttons
  const p1Submit = document.getElementById("p1SubmitQuiz");
  if (p1Submit) p1Submit.addEventListener("click", () => handleSubmit("phase1", "p1Quiz", "p1QuizResult"));

  const p2Submit = document.getElementById("p2SubmitQuiz");
  if (p2Submit) p2Submit.addEventListener("click", () => handleSubmit("phase2", "p2Quiz", "p2QuizResult"));

  const p3Submit = document.getElementById("p3SubmitQuiz");
  if (p3Submit) p3Submit.addEventListener("click", () => handleSubmit("phase3", "p3Quiz", "p3QuizResult"));

  const p4Submit = document.getElementById("p4SubmitQuiz");
  if (p4Submit) p4Submit.addEventListener("click", () => handleSubmit("phase4", "p4Quiz", "p4QuizResult"));

  const p5Submit = document.getElementById("p5SubmitQuiz");
  if (p5Submit) p5Submit.addEventListener("click", () => handleSubmit("phase5", "p5Quiz", "p5QuizResult"));

  // ========= Verificación docente =========
  function setMsg(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function applyGateState(phaseNum) {
    const phaseKey = `phase${phaseNum}`;
    const submit = document.getElementById(`p${phaseNum}SubmitQuiz`);
    const lockMsg = document.getElementById(`p${phaseNum}TestLockMsg`);

    const unlockedToday = window.TeacherGate?.isUnlocked?.(phaseKey) === true;
    state.verified[phaseKey] = unlockedToday;

    if (submit) {
      if (phaseNum === 5) submit.disabled = !unlockedToday || !activitiesDone() || !canAttempt("phase5");
      else submit.disabled = !unlockedToday || !canAttempt(phaseKey);
    }

    if (lockMsg && phaseNum !== 5) {
      if (!unlockedToday) lockMsg.textContent = "🔒 Test bloqueado. Introduce el código del docente para habilitar la corrección.";
      else if (!canAttempt(phaseKey)) lockMsg.textContent = `❌ Sin intentos disponibles (máximo ${MAX_ATTEMPTS}).`;
      else lockMsg.textContent = "";
    }
  }

  function wireGate(phaseNum) {
    const phaseKey = `phase${phaseNum}`;
    const input = document.getElementById(`p${phaseNum}CodeInput`);
    const btn = document.getElementById(`p${phaseNum}VerifyBtn`);
    const msgId = `p${phaseNum}GateMsg`;

    if (!btn || !input) return;

    btn.addEventListener("click", async () => {
      if (!window.TeacherGate?.verify) {
        setMsg(msgId, "Error: TeacherGate no está disponible.");
        return;
      }

      const code = (input.value || "").trim();
      const ok = await window.TeacherGate.verify(phaseKey, code);

      if (!ok) {
        setMsg(msgId, "Código incorrecto.");
        applyGateState(phaseNum);
        save();
        refreshUI();
        return;
      }

      window.TeacherGate.setUnlocked(phaseKey);
      setMsg(msgId, "✅ Verificación correcta. Ya puedes realizar el test.");

      applyGateState(phaseNum);
      save();
      refreshUI();
    });

    applyGateState(phaseNum);
  }

  wireGate(2); wireGate(3); wireGate(4); wireGate(5);

  window.addEventListener("teacherGateUpdated", () => {
    applyGateState(2); applyGateState(3); applyGateState(4); applyGateState(5);
    save(); refreshUI();
  });

  // ========= Certificado =========
  function canGenerateCertificate() {
    const passedAll = state.passed.phase1 && state.passed.phase2 && state.passed.phase3 && state.passed.phase4 && state.passed.phase5;
    const verifiedAll = state.verified.phase2 && state.verified.phase3 && state.verified.phase4 && state.verified.phase5;
    return passedAll && verifiedAll && state.unlocked.certificate;
  }

  const downloadCertBtnEl = document.getElementById("downloadCertBtn");
  if (downloadCertBtnEl) {
    downloadCertBtnEl.addEventListener("click", () => {
      if (!canGenerateCertificate()) {
        alert("Certificado bloqueado: debes completar todas las fases (mínimo 80%) y verificación docente.");
        refreshUI();
        return;
      }

      const studentName = (document.getElementById("studentName")?.value || "").trim() || "Alumno/a";
      const unitName = window.UNIT_NAME || "Tema";

      generateCertificatePDF({
        studentName,
        unitName,
        resultP1: state.scores.phase1,
        resultP2: state.scores.phase2,
        resultP3: state.scores.phase3,
        resultP4: state.scores.phase4,
        resultP5: state.scores.phase5,
      });
    });
  }

  // ========= Fase 5: Actividades interactivas =========
  function mountAct1() {
    const mount = document.getElementById("p5Act1");
    if (!mount) return;

    const correctOrder = [
      "Asunto claro",
      "Saludo + contexto",
      "Acción solicitada + plazo",
      "Cierre + firma"
    ];

    if (!actState.act1Items) {
      actState.act1Items = shuffleArray(correctOrder);
      saveActs();
    }

    function render() {
      mount.innerHTML = actState.act1Items.map((t, i) => `
        <div style="display:flex; gap:8px; align-items:center; margin:8px 0; padding:10px; border:1px solid rgba(255,255,255,.10); border-radius:14px; background: rgba(0,0,0,.14);">
          <div style="flex:1;">${i + 1}. ${t}</div>
          <button class="btn btn--ghost" data-move="up" data-i="${i}">↑</button>
          <button class="btn btn--ghost" data-move="down" data-i="${i}">↓</button>
        </div>
      `).join("");

      mount.querySelectorAll("button[data-move]").forEach(btn => {
        btn.addEventListener("click", () => {
          const i = Number(btn.dataset.i);
          const dir = btn.dataset.move;
          const arr = actState.act1Items;
          const j = dir === "up" ? i - 1 : i + 1;
          if (j < 0 || j >= arr.length) return;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          saveActs();
          render();
          refreshUI();
        });
      });
    }

    render();

    const checkBtn = document.getElementById("p5Act1Check");
    const msg = document.getElementById("p5Act1Msg");
    if (checkBtn) {
      checkBtn.addEventListener("click", () => {
        const ok = actState.act1Items.join("|") === correctOrder.join("|");
        actState.a1 = ok;
        saveActs();
        if (msg) msg.textContent = ok ? "✅ Actividad 1 correcta." : "❌ Aún no. Revisa el orden.";
        refreshUI();
      });
    }
  }

  function mountAct2() {
    const mount = document.getElementById("p5Act2");
    if (!mount) return;

    const pairs = [
      ["Asunto", "Resume el objetivo del mensaje de forma específica"],
      ["CC", "Incluye a personas que deben estar informadas"],
      ["CCO", "Oculta destinatarios cuando es necesario"]
    ];

    if (!actState.act2) {
      actState.act2 = {};
      saveActs();
    }

    const definitions = shuffleArray(pairs.map(p => p[1]));

    mount.innerHTML = pairs.map(([term]) => `
      <div style="margin:10px 0; padding:12px; border:1px solid rgba(255,255,255,.10); border-radius:14px; background: rgba(0,0,0,.14);">
        <strong>${term}</strong><br/>
        <select data-term="${term}" style="margin-top:10px; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background: rgba(0,0,0,.22); color: #eef2ff; width: 100%;">
          <option value="">-- Elige definición --</option>
          ${definitions.map(d => `<option value="${d}">${d}</option>`).join("")}
        </select>
      </div>
    `).join("");

    mount.querySelectorAll("select").forEach(sel => {
      const term = sel.dataset.term;
      sel.value = actState.act2[term] || "";
      sel.addEventListener("change", () => {
        actState.act2[term] = sel.value;
        saveActs();
        refreshUI();
      });
    });

    const checkBtn = document.getElementById("p5Act2Check");
    const msg = document.getElementById("p5Act2Msg");
    if (checkBtn) {
      checkBtn.addEventListener("click", () => {
        const ok = pairs.every(([term, def]) => (actState.act2?.[term] || "") === def);
        actState.a2 = ok;
        saveActs();
        if (msg) msg.textContent = ok ? "✅ Actividad 2 correcta." : "❌ Hay emparejamientos incorrectos.";
        refreshUI();
      });
    }
  }

  function mountAct3() {
    const mount = document.getElementById("p5Act3");
    if (!mount) return;

    const q = {
      text: "Vas a pedir documentación por correo. ¿Cuál es la mejor redacción?",
      options: [
        "Mándame lo que falta ya.",
        "Por favor, ¿podría enviarnos la documentación pendiente antes del viernes para completar el expediente? Gracias.",
        "Necesito papeles. Urgente!!!",
        "Si no lo envía, no se tramita."
      ],
      correct: 1
    };

    if (actState.act3Sel === undefined) actState.act3Sel = null;

    mount.innerHTML = `
      <div style="margin:8px 0; padding:12px; border:1px solid rgba(255,255,255,.10); border-radius:14px; background: rgba(0,0,0,.14);">
        <p style="margin:0 0 10px 0;"><strong>${q.text}</strong></p>
        ${q.options.map((opt, i) => `
          <label style="display:block; margin:.45rem 0;">
            <input type="radio" name="p5act3" value="${i}" ${String(actState.act3Sel) === String(i) ? "checked" : ""}>
            ${opt}
          </label>
        `).join("")}
      </div>
    `;

    mount.querySelectorAll('input[name="p5act3"]').forEach(r => {
      r.addEventListener("change", () => {
        actState.act3Sel = Number(r.value);
        saveActs();
        refreshUI();
      });
    });

    const checkBtn = document.getElementById("p5Act3Check");
    const msg = document.getElementById("p5Act3Msg");
    if (checkBtn) {
      checkBtn.addEventListener("click", () => {
        const ok = Number(actState.act3Sel) === q.correct;
        actState.a3 = ok;
        saveActs();
        if (msg) msg.textContent = ok ? "✅ Actividad 3 correcta." : "❌ No es la opción más profesional.";
        refreshUI();
      });
    }
  }

  mountAct1();
  mountAct2();
  mountAct3();

  // ========= Arranque =========
  refreshUI();
  showView("home");
})();
