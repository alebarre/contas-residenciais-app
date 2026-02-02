import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportTable {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: (string | number | null | undefined)[][];
  fileBaseName: string; // sem extensão
}

@Injectable({ providedIn: 'root' })
export class ExportService {

  exportTxt(data: ExportTable): void {
    const lines: string[] = [];
    lines.push(data.title);
    if (data.subtitle) lines.push(data.subtitle);
    lines.push('');
    lines.push(data.columns.join(' | '));
    lines.push('-'.repeat(Math.min(120, data.columns.join(' | ').length)));

    for (const row of data.rows) {
      lines.push(row.map(v => (v ?? '')).join(' | '));
    }

    const content = lines.join('\n');
    this.downloadBlob(content, `${data.fileBaseName}.txt`, 'text/plain;charset=utf-8');
  }

  exportPdf(data: ExportTable): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    const marginLeft = 40;
    let y = 36;

    doc.setFontSize(14);
    doc.text(data.title, marginLeft, y);
    y += 18;

    if (data.subtitle) {
        doc.setFontSize(10);
        doc.text(data.subtitle, marginLeft, y);
        y += 14;
    }

    const generatedAt = new Date();
    const stamp = generatedAt.toLocaleString();

    autoTable(doc, {
        head: [data.columns],
        body: data.rows.map(r => r.map(v => (v ?? '').toString())),
        startY: y + 8,
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fontSize: 9 },
        margin: { left: marginLeft, right: 40 },
        didDrawPage: (hookData) => {
        const pageNumber = doc.getNumberOfPages();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setFontSize(9);
        doc.text(`Gerado em: ${stamp}`, marginLeft, pageHeight - 18);
        doc.text(`Página ${pageNumber}`, pageWidth - 90, pageHeight - 18);
        }
    });

    doc.save(`${data.fileBaseName}.pdf`);
}


  exportXls(data: ExportTable): void {
    const sheetData = [
        data.columns,
        ...data.rows.map(r => r.map(v => (v ?? '')))
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    const colWidths = data.columns.map((c, idx) => {
        const maxLen = Math.max(
        c.length,
        ...data.rows.map(r => String(r[idx] ?? '').length)
        );
        return { wch: Math.min(40, Math.max(12, maxLen + 2)) };
    });
    (ws as any)['!cols'] = colWidths;

    // 2 casas em colunas que parecem valores
    const valorCols = data.columns
        .map((c, i) => ({ c: c.toLowerCase(), i }))
        .filter(x => x.c.includes('r$') || x.c.includes('valor'))
        .map(x => x.i);

    // Tipo numérico e formato nas células (exceto header)
    for (let r = 2; r <= data.rows.length + 1; r++) { // 1-based in sheet (row 1 header)
        for (const ci of valorCols) {
        const cellAddress = XLSX.utils.encode_cell({ r: r - 1, c: ci });
        const cell = ws[cellAddress];
        if (!cell) continue;

        const n = Number(String(cell.v).replace(',', '.'));
        if (Number.isFinite(n)) {
            cell.t = 'n';
            cell.v = n;
            // formato numérico com 2 casas (ex: 1,234.56)
            cell.z = '#,##0.00';
        }
        }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatorio');

    XLSX.writeFile(wb, `${data.fileBaseName}.xlsx`);
    }


  private downloadBlob(content: string, filename: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    window.URL.revokeObjectURL(url);
  }
}
