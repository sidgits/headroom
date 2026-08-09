import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateCoachPDF, type CoachReport } from "@/lib/generateCoachPDF";

export function parseToolCalls(parts: { tool_calls?: { function: { arguments: string; name: string } }[] } | null) {
  const calls = parts?.tool_calls ?? [];
  const suggestions: { event_id: string; action: string; title: string; rationale: string }[] = [];
  const reports: CoachReport[] = [];
  for (const tc of calls) {
    try {
      const args = JSON.parse(tc.function.arguments);
      if (tc.function.name === "generate_pdf_report") reports.push(args as CoachReport);
      else suggestions.push(args);
    } catch { /* ignore malformed tool args */ }
  }
  return { suggestions, reports };
}

export function ReportCard({ report, name }: { report: CoachReport; name?: string }) {
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try {
      await generateCoachPDF(report, name);
      toast.success("Report downloaded.");
    } catch {
      toast.error("Couldn't build the PDF. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-3 space-y-2">
      <div className="flex items-start gap-2">
        <FileDown className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Coach report</p>
          <p className="text-sm font-semibold text-foreground">{report.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">{report.summary}</p>
          {report.sections?.length ? (
            <p className="text-[11px] text-muted-foreground mt-1">{report.sections.length} sections</p>
          ) : null}
        </div>
      </div>
      <button onClick={download} disabled={busy}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />} Download PDF
      </button>
    </div>
  );
}
