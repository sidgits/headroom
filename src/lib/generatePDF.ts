import type { ScoringResult } from "./scoring";

async function loadImageAsDataURL(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generateResultsPDF(result: ScoringResult, role: string): Promise<void> {
  const { archetype, burnoutRisk, dimensionScores, recommendations } = result;

  // Dynamic import jspdf
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Colors
  const golden: [number, number, number] = [196, 150, 28];
  const dark: [number, number, number] = [46, 38, 28];
  const muted: [number, number, number] = [120, 105, 90];
  const burnoutColorMap: Record<string, [number, number, number]> = {
    low: [196, 150, 28],
    moderate: [196, 150, 28],
    high: [210, 105, 30],
    critical: [200, 60, 50],
  };

  // Subtle watermark — large faded text in center
  doc.saveGraphicsState();
  const gState = new (doc as any).GState({ opacity: 0.04 });
  doc.setGState(gState);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(72);
  doc.setTextColor(...golden);
  const wmText = "HEADROOM";
  const wmWidth = doc.getTextWidth(wmText);
  doc.text(wmText, (pageWidth - wmWidth) / 2, pageHeight / 2 + 10);
  doc.restoreGraphicsState();

  // Logo
  try {
    const logoDataUrl = await loadImageAsDataURL("/headroom-logo.png");
    const logoWidth = 50;
    const logoHeight = 14;
    doc.addImage(logoDataUrl, "PNG", margin, y, logoWidth, logoHeight);
    y += logoHeight + 6;
  } catch {
    // Fallback text if logo fails
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...golden);
    doc.text("headroom", margin, y + 5);
    y += 12;
  }

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("ASSESSMENT RESULTS", margin, y);
  y += 4;
  doc.setDrawColor(220, 210, 195);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  // Archetype emoji + name
  doc.setFontSize(28);
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.text(archetype.name, margin, y);
  y += 10;

  // Headline
  doc.setFontSize(13);
  doc.setTextColor(...golden);
  doc.setFont("helvetica", "normal");
  doc.text(archetype.headline, margin, y);
  y += 10;

  // Role
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(`Role: ${role}`, margin, y);
  y += 12;

  // Description
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "normal");
  const descLines = doc.splitTextToSize(archetype.description, contentWidth);
  doc.text(descLines, margin, y);
  y += descLines.length * 5 + 10;

  // Burnout Risk section
  doc.setDrawColor(220, 210, 195);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("BURNOUT RISK", margin, y);
  y += 8;

  const riskColor = burnoutColorMap[burnoutRisk.level] || golden;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...riskColor);
  doc.text(burnoutRisk.label, margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  const riskLines = doc.splitTextToSize(burnoutRisk.description, contentWidth);
  doc.text(riskLines, margin, y);
  y += riskLines.length * 5 + 10;

  // Dimensions
  doc.setDrawColor(220, 210, 195);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("YOUR DIMENSIONS", margin, y);
  y += 10;

  dimensionScores.forEach((dim) => {
    const pct = (dim.score / dim.maxScore) * 100;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.text(dim.name, margin, y);
    doc.setTextColor(...muted);
    doc.text(`${dim.score}/${dim.maxScore}`, pageWidth - margin, y, { align: "right" });
    y += 5;

    // Progress bar background
    const barHeight = 4;
    const barWidth = contentWidth;
    doc.setFillColor(235, 228, 218);
    doc.roundedRect(margin, y, barWidth, barHeight, 2, 2, "F");

    // Progress bar fill
    doc.setFillColor(...golden);
    const fillWidth = (pct / 100) * barWidth;
    if (fillWidth > 0) {
      doc.roundedRect(margin, y, fillWidth, barHeight, 2, 2, "F");
    }
    y += 12;
  });

  // Recommendations
  y += 2;
  doc.setDrawColor(220, 210, 195);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("WHAT TO DO NEXT", margin, y);
  y += 10;

  recommendations.forEach((rec, i) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...golden);
    doc.text(`${i + 1}.`, margin, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...dark);
    const recLines = doc.splitTextToSize(rec, contentWidth - 10);
    doc.text(recLines, margin + 10, y);
    y += recLines.length * 5 + 6;
  });

  // Footer
  y = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(220, 210, 195);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text("headroom — cognitive load assessment", margin, y);
  doc.text(new Date().toLocaleDateString(), pageWidth - margin, y, { align: "right" });

  doc.save("headroom-results.pdf");
}
