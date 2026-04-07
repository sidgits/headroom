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
  const { archetype, burnoutRisk, dimensionScores, recommendations, mirror, shadowArchetype } = result;

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const golden: [number, number, number] = [196, 150, 28];
  const dark: [number, number, number] = [46, 38, 28];
  const muted: [number, number, number] = [120, 105, 90];
  const burnoutColorMap: Record<string, [number, number, number]> = {
    low: [196, 150, 28],
    moderate: [196, 150, 28],
    high: [210, 105, 30],
  };

  // Watermark
  doc.saveGraphicsState();
  const gState = new (doc as any).GState({ opacity: 0.04 });
  doc.setGState(gState);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(72);
  doc.setTextColor(...golden);
  doc.text("HEADROOM", pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 });
  doc.restoreGraphicsState();

  // Logo
  try {
    const logoDataUrl = await loadImageAsDataURL("/headroom-logo.png");
    const logoWidth = 48;
    const logoHeight = logoWidth / 2.1;
    doc.addImage(logoDataUrl, "PNG", margin, y, logoWidth, logoHeight);
    y += logoHeight + 6;
  } catch {
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
  doc.text("YOUR HEADROOM PROFILE", margin, y);
  y += 4;
  doc.setDrawColor(220, 210, 195);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  // LAYER 1 — Archetype name + headline
  doc.setFontSize(28);
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.text(archetype.name, margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(...golden);
  doc.setFont("helvetica", "italic");
  const headlineLines = doc.splitTextToSize(archetype.headline, contentWidth);
  doc.text(headlineLines, margin, y);
  y += headlineLines.length * 5 + 8;

  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "normal");
  const cltLine = "Rooted in Sweller\u2019s Cognitive Load Theory \u2014 the gold standard in understanding how the brain processes work.";
  const cltLines = doc.splitTextToSize(cltLine, contentWidth);
  doc.text(cltLines, margin, y);
  y += cltLines.length * 4 + 4;

  doc.setFontSize(9);
  doc.text(`Role: ${role}`, margin, y);
  y += 10;

  // LAYER 2 — Mirror paragraphs
  const mirrorSections = [
    { label: "AT YOUR BEST", text: mirror.atYourBest },
    { label: "WHAT'S WORKING AGAINST YOU", text: mirror.workingAgainstYou },
    { label: "THE PATTERN YOU PROBABLY HAVEN'T NOTICED", text: mirror.patternNotNoticed },
  ];

  for (const section of mirrorSections) {
    // Check if we need a new page
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...golden);
    doc.text(section.label, margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    const lines = doc.splitTextToSize(section.text, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 8;
  }

  // LAYER 3 — Dimensions
  if (y > pageHeight - 70) {
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(220, 210, 195);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("YOUR HEADROOM DIMENSIONS", margin, y);
  y += 10;

  dimensionScores.forEach((dim) => {
    const pct = (dim.score / dim.maxScore) * 100;

    doc.setFont("helvetica", "bold");
    const cogLoadLabel = dim.code === "E" ? "Extraneous Cognitive Load" : dim.code === "I" ? "Intrinsic Cognitive Load" : "Germane Cognitive Load";
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.text(`${dim.name} (${dim.code})`, margin, y);
    const labelWidth = doc.getTextWidth(`${dim.name} (${dim.code}) `);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...muted);
    doc.text(`— ${cogLoadLabel}`, margin + labelWidth, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...muted);
    doc.text(`${dim.score}/${dim.maxScore}`, pageWidth - margin, y, { align: "right" });
    y += 5;

    // Bar
    const barHeight = 4;
    doc.setFillColor(235, 228, 218);
    doc.roundedRect(margin, y, contentWidth, barHeight, 2, 2, "F");
    doc.setFillColor(...golden);
    const fillWidth = (pct / 100) * contentWidth;
    if (fillWidth > 0) doc.roundedRect(margin, y, fillWidth, barHeight, 2, 2, "F");
    y += 6;

    // Interpretation
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    const interpLines = doc.splitTextToSize(dim.interpretation, contentWidth);
    doc.text(interpLines, margin, y);
    y += interpLines.length * 4 + 6;
  });

  // LAYER 4 — Shadow Archetype
  if (y > pageHeight - 40) {
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(220, 210, 195);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("UNDER PRESSURE YOU SHIFT TOWARD", margin, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...dark);
  doc.text(shadowArchetype.name, margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  const shadowLines = doc.splitTextToSize(shadowArchetype.description, contentWidth);
  doc.text(shadowLines, margin, y);
  y += shadowLines.length * 5 + 8;

  // LAYER 5 — One Unlock
  if (y > pageHeight - 40) {
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(220, 210, 195);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("WHAT TO DO NEXT", margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  const unlockLines = doc.splitTextToSize(recommendations[0], contentWidth);
  doc.text(unlockLines, margin, y);
  y += unlockLines.length * 5 + 8;

  // LAYER 6 — Burnout Risk
  if (y > pageHeight - 50) {
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(220, 210, 195);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("BURNOUT RISK SIGNAL", margin, y);
  y += 7;

  const riskColor = burnoutColorMap[burnoutRisk.level] || golden;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...riskColor);
  doc.text(burnoutRisk.label, margin, y);
  y += 6;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  const signalLines = doc.splitTextToSize(`Signal: ${burnoutRisk.signal}`, contentWidth);
  doc.text(signalLines, margin, y);
  y += signalLines.length * 4 + 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  const riskLines = doc.splitTextToSize(burnoutRisk.description, contentWidth);
  doc.text(riskLines, margin, y);
  y += riskLines.length * 5 + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...golden);
  doc.text("EARLY INTERVENTION", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  const interventionLines = doc.splitTextToSize(burnoutRisk.earlyIntervention, contentWidth);
  doc.text(interventionLines, margin, y);
  y += interventionLines.length * 4 + 4;

  // Footer
  y = pageHeight - 15;
  doc.setDrawColor(220, 210, 195);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text("headroom — cognitive load assessment • theheadroom.co", margin, y);
  doc.text(new Date().toLocaleDateString(), pageWidth - margin, y, { align: "right" });

  doc.save("headroom-results.pdf");
}
