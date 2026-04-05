// js/teacher-gate.js
// Código docente = FECHA DEL DÍA (DDMMYY)
(() => {
  function todayCode() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}${mm}${yy}`;
  }

  function key(phaseId) {
    return `teacher_unlock_${phaseId}_${todayCode()}`;
  }

  function isUnlocked(phaseId) {
    return localStorage.getItem(key(phaseId)) === "1";
  }

  function setUnlocked(phaseId) {
    localStorage.setItem(key(phaseId), "1");
    window.dispatchEvent(new Event("teacherGateUpdated"));
  }

  async function verify(phaseId, enteredCode) {
    return String(enteredCode || "").trim() === todayCode();
  }

  window.TeacherGate = { todayCode, isUnlocked, setUnlocked, verify };
})();
