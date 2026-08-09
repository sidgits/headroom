// Builds a PDF from a report the AI coach generated on its own.
export interface CoachReportSection { heading: string; body: string }
export interface CoachReport {
  title: string;
  summary: string;
  sections: CoachReportSection[];
}

export async function generateCoachPDF(report: CoachReport, name?: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const golden: [number, number, number] = [196, 150, 28];
  const dark: [number, number, number] = [46, 38, 28];
  const muted: [number, number, number] = [120, 105, 90];

  const newPageIfNeeded = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeBlock = (text: string, size: number, style: "normal" | "bold", color: [number, number, number], gap = 4) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    const lineHeight = size * 0.45;
    for (const line of lines) {
      newPageIfNeeded(lineHeight + 2);
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += gap;
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...golden);
  doc.text("HEADROOM · AI PRODUCTIVITY COACH", margin, y);
  y += 10;

  writeBlock(report.title, 20, "bold", dark, 3);
  writeBlock(
    `${name ? name + " · " : ""}${new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}`,
    10,
    "normal",
    muted,
    6,
  );

  doc.setDrawColor(...golden);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  if (report.summary) writeBlock(report.summary, 11, "normal", dark, 8);

  for (const s of report.sections ?? []) {
    newPageIfNeeded(20);
    writeBlock(s.heading, 13, "bold", golden, 2);
    writeBlock(s.body, 11, "normal", dark, 6);
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text(`Headroom · Cognitive Load Theory coaching report · Page ${i} of ${pages}`, margin, pageHeight - 10);
  }

  const slug = report.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "coach-report";
  doc.save(`headroom-${slug}.pdf`);
}
