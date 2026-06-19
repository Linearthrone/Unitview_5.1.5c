/** Shared print styles for assignment + charge reports (no Tailwind CDN dependency). */
export const PRINT_REPORT_CSS = `
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #000; background: #fff; }
  #printable-assignments-report,
  #printable-charge-report {
    display: block !important;
    position: static !important;
    left: auto !important;
    top: auto !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    overflow: visible !important;
    opacity: 1 !important;
  }
  .uv-print-root {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color: #000;
    padding: 16px;
    box-sizing: border-box;
  }
  .uv-print-header { position: relative; margin-bottom: 16px; }
  .uv-print-header .uv-print-unit-name {
    font-size: 20pt; font-weight: bold; text-align: center; width: 100%;
    position: absolute; top: 0; left: 0;
  }
  .uv-print-header-meta {
    display: flex; justify-content: space-between; width: 100%; padding-top: 28px;
    font-size: 9pt;
  }
  .uv-print-header-meta p { margin: 2px 0; }
  .uv-print-header-meta .uv-print-right { text-align: right; }
  .uv-print-layout-two {
    display: grid; grid-template-columns: 1fr 18rem; gap: 12px; align-items: start;
  }
  .uv-print-layout-single { display: flex; flex-direction: column; gap: 12px; }
  .uv-print-main, .uv-print-sidebar { display: flex; flex-direction: column; gap: 12px; }
  .uv-print-nurse-row { display: grid; gap: 8px; }
  .uv-print-nurse-card, .uv-print-tech-panel, .uv-print-sidebar-panel {
    border: 1px solid #000; padding: 8px;
  }
  .uv-print-nurse-card h3, .uv-print-tech-panel h3, .uv-print-sidebar-panel h3 {
    font-weight: bold; text-align: center; border-bottom: 1px solid #000;
    padding-bottom: 4px; margin: 0 0 8px 0; font-size: 11px;
  }
  .uv-print-spectra { text-align: center; font-size: 10px; margin-bottom: 8px; }
  .uv-print-patient-row {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;
  }
  .uv-print-patient-room { font-weight: 600; }
  .uv-print-patient-icons { display: flex; align-items: center; gap: 4px; }
  .uv-print-empty-slot { height: 20px; border-bottom: 1px dotted rgba(0,0,0,0.2); }
  .uv-print-isolation-badge {
    display: inline-flex; align-items: center; gap: 2px;
    border: 1px solid #000; border-radius: 3px; padding: 0 4px; font-size: 9px;
  }
  .uv-print-pct-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .uv-print-pct-card { font-size: 12px; border: 1px solid rgba(0,0,0,0.3); border-radius: 3px; padding: 4px; }
  .uv-print-pct-card p { margin: 2px 0; }
  .uv-print-pct-name { font-weight: bold; }
  .uv-print-stats-block { margin-bottom: 12px; }
  .uv-print-stats-block p { margin: 2px 0; }
  .uv-print-stats-title { font-weight: 600; margin-bottom: 4px; }
  .uv-print-stats-list { list-style: disc; padding-left: 16px; margin: 4px 0; }
  .uv-print-legend { border-top: 1px solid #000; padding-top: 8px; font-size: 10px; }
  .uv-print-legend-items { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
  .uv-print-legend-item { display: inline-flex; align-items: center; gap: 4px; }
  @media print {
    body { font-size: 10pt; }
    .print-hide { display: none !important; }
    .page-break-inside-avoid { page-break-inside: avoid; }
  }
`;

export type PrintReportTarget = 'printable-charge-report' | 'printable-assignments-report';

export interface OpenPrintWindowResult {
  ok: boolean;
  error?: string;
}

export function openPrintWindow(
  targetId: PrintReportTarget,
  title = 'Print Report',
): OpenPrintWindowResult {
  const content = document.getElementById(targetId);
  if (!content) {
    return { ok: false, error: 'Print content is not ready. Try again after the unit finishes loading.' };
  }

  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) {
    return {
      ok: false,
      error: 'Unable to open print window. Check popup blockers and try again.',
    };
  }

  const bodyHtml = content.innerHTML.replace(/<\/script/gi, '<\\/script');

  try {
    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${PRINT_REPORT_CSS}</style>
</head>
<body>
  ${bodyHtml}
  <script>
    (function () {
      function triggerPrint() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.error('Print failed', e);
        }
        setTimeout(function () { window.close(); }, 300);
      }
      if (document.readyState === 'complete') {
        setTimeout(triggerPrint, 150);
      } else {
        window.addEventListener('load', function () { setTimeout(triggerPrint, 150); });
      }
    })();
  </script>
</body>
</html>`);
    printWindow.document.close();
    return { ok: true };
  } catch (err) {
    printWindow.close();
    return { ok: false, error: err instanceof Error ? err.message : 'Print window failed to render.' };
  }
}

export async function openPrintWindowWithElectronFallback(
  targetId: PrintReportTarget,
  title = 'Print Report',
): Promise<OpenPrintWindowResult> {
  const content = document.getElementById(targetId);
  if (!content) {
    return { ok: false, error: 'Print content is not ready. Try again after the unit finishes loading.' };
  }

  if (window.electronAPI?.printToPDF) {
    try {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${PRINT_REPORT_CSS}</style></head><body>${content.innerHTML}</body></html>`;
      const result = await window.electronAPI.printToPDF(html);
      if (result.success) {
        return { ok: true };
      }
    } catch {
      /* fall through to browser print */
    }
  }

  return openPrintWindow(targetId, title);
}
