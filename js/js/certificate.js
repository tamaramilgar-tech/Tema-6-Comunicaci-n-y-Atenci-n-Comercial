// js/certificate.js
function generateCertificatePDF({
  studentName,
  unitName,
  resultP1,
  resultP2,
  resultP3,
  resultP4,
  resultP5
}) {
  if (!window.jspdf || typeof window.jspdf.jsPDF !== "function") {
    alert("No se pudo generar el PDF: no se cargó la librería jsPDF.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const d = new Date();
  const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  const safe = (v) => (v === null || v === undefined || Number.isNaN(v)) ? "-" : String(v);

  doc.setFontSize(18);
  doc.text("CERTIFICADO DE APROVECHAMIENTO", doc.internal.pageSize.getWidth() / 2, 25, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Nombre del alumno/a: ${studentName}`, 20, 55);
  doc.text(`Unidad: ${unitName}`, 20, 75);

  doc.text(`Resultado FASE 1: ${safe(resultP1)}%`, 20, 95);
  doc.text(`Resultado FASE 2: ${safe(resultP2)}%`, 20, 110);
  doc.text(`Resultado FASE 3: ${safe(resultP3)}%`, 20, 125);
  doc.text(`Resultado FASE 4: ${safe(resultP4)}%`, 20, 140);
  doc.text(`Resultado FASE 5: ${safe(resultP5)}%`, 20, 155);

  doc.text(`Fecha: ${dateStr}`, 20, 175);
  doc.text("(Superado con éxito — mínimo 80%)", 20, 195);

  const fileSafeName = String(studentName || "Alumno")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  doc.save(`Certificado_${fileSafeName}.pdf`);
}
