import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface PdfHeader {
  name: string;
  email: string;
  analyticsLine?: string;
}

export interface KpiCard {
  label: string;
  value: string | number;
  subtitle?: string;
  type?: 'default' | 'paid' | 'pending';
}

export interface ExportTable {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: (string | number | null | undefined)[][];
  fileBaseName: string;
  pdfHeader?: PdfHeader;
  kpis?: KpiCard[];
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
    const marginRight = 40;

    let y = 28;

    // ====== HEADER — logo + two-column layout ======
    // Left : logo icon + report title + subtitle
    // Right: user name + email + analytics line
    {
      const pageWidth = doc.internal.pageSize.getWidth();
      const colMid = pageWidth / 2;
      const logoPt = 28; // logo icon size in pt

      // --- LOGO icon (drawn at top-left) ---
      this.drawPdfLogo(doc, marginLeft, y - 10, logoPt);
      const textOffX = marginLeft + logoPt + 8;

      // --- LEFT: title ---
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(16);
      doc.setFont('', 'bold');
      doc.text(String(data.title ?? ''), textOffX, y + 2);

      // --- LEFT: subtitle ---
      if (data.subtitle) {
        doc.setTextColor(107, 114, 128);
        doc.setFontSize(9);
        doc.setFont('', 'normal');
        doc.text(data.subtitle, textOffX, y + 15);
      }

      // --- RIGHT: user info ---
      if (data.pdfHeader) {
        const header = data.pdfHeader;

        doc.setTextColor(17, 24, 39);
        doc.setFontSize(11);
        doc.setFont('', 'bold');
        doc.text(header.name ?? '', colMid, y + 2);

        doc.setTextColor(107, 114, 128);
        doc.setFontSize(9);
        doc.setFont('', 'normal');
        doc.text(header.email ?? '', colMid, y + 14);

        if (header.analyticsLine) {
          doc.setTextColor(17, 24, 39);
          doc.setFontSize(9);
          doc.setFont('', 'bold');
          const maxRight = pageWidth - marginRight - colMid;
          const wrapped = doc.splitTextToSize(header.analyticsLine, maxRight);
          doc.text(wrapped, colMid, y + 26);
        }
      }

      // separator line
      y += 36;
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 10;
    }

    // ====== KPI CARDS  ======
    if (data.kpis && data.kpis.length > 0) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const availableWidth = pageWidth - marginLeft - marginRight;
      const kpiWidth = availableWidth / Math.min(3, data.kpis.length);
      const kpiHeight = 44;

      data.kpis.forEach((kpi, idx) => {
        const kpiX = marginLeft + idx * kpiWidth;
        const kpiY = y;

        // Cores baseadas no tipo
        let bgColor = [255, 255, 255]; // branco padrão
        let borderColor = [229, 231, 235]; // borda cinza
        if (kpi.type === 'paid') {
          bgColor = [240, 253, 244]; // #f0fdf4 (verde claro)
          borderColor = [187, 247, 208]; // #bbf7d0 (verde)
        } else if (kpi.type === 'pending') {
          bgColor = [255, 251, 235]; // #fffbeb (amarelo claro)
          borderColor = [253, 230, 138]; // #fde68a (amarelo)
        }

        //  retângulo (card)
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(kpiX + 3, kpiY, kpiWidth - 6, kpiHeight, 'FD');

        //  label (K)
        doc.setTextColor(107, 114, 128);
        doc.setFontSize(10);
        doc.setFont('', 'bold');
        doc.text(kpi.label, kpiX + 8, kpiY + 13);

        //  valor (V)
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(16);
        doc.setFont('', 'bold');
        doc.text(String(kpi.value), kpiX + 8, kpiY + 28);

        //  subtítulo (optional)
        if (kpi.subtitle) {
          doc.setTextColor(107, 114, 128);
          doc.setFontSize(8);
          doc.setFont('', 'normal');
          doc.text(kpi.subtitle, kpiX + 8, kpiY + 40);
        }
      });

      y += kpiHeight + 14;
    }

    const generatedAt = new Date();
    const stamp = generatedAt.toLocaleString();

    autoTable(doc, {
      head: [data.columns],
      body: data.rows.map(r => r.map(v => (v ?? '').toString())),
      startY: y + 8,
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fontSize: 9 },
      margin: { left: marginLeft, right: marginRight },
      didDrawPage: () => {
        const pageNumber = doc.getNumberOfPages();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setTextColor(107, 114, 128);
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

    for (let r = 2; r <= data.rows.length + 1; r++) {
      for (const ci of valorCols) {
        const cellAddress = XLSX.utils.encode_cell({ r: r - 1, c: ci });
        const cell = ws[cellAddress];
        if (!cell) continue;

        const n = Number(String(cell.v).replace(',', '.'));
        if (Number.isFinite(n)) {
          cell.t = 'n';
          cell.v = n;
          cell.z = '#,##0.00';
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatorio');

    XLSX.writeFile(wb, `${data.fileBaseName}.xlsx`);
  }

  /**
   * Desenha o logotipo (casinha + moeda R$) usando primitivas jsPDF.
   * @param doc   instância jsPDF
   * @param x     posição X (pt) do canto superior-esquerdo do ícone
   * @param y     posição Y (pt) do canto superior-esquerdo do ícone
   * @param size  tamanho do ícone em pt (default 24)
   */
  private drawPdfLogo(doc: jsPDF, x: number, y: number, size = 24): void {
    const s = size / 32; // fator de escala em relação ao viewBox 32x32

    // fundo arredondado escuro
    doc.setFillColor(17, 24, 39);
    doc.setDrawColor(17, 24, 39);
    (doc as any).roundedRect(x, y, size, size, 7 * s, 7 * s, 'F');

    // telhado (triângulo branco)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(255, 255, 255);
    (doc as any).triangle(
      x + 16 * s, y + 5 * s,
      x + 29 * s, y + 17 * s,
      x + 3 * s, y + 17 * s,
      'F'
    );

    // corpo da casa (retângulo branco)
    doc.setFillColor(255, 255, 255);
    doc.rect(x + 6 * s, y + 16 * s, 20 * s, 12 * s, 'F');

    // porta (escura)
    doc.setFillColor(17, 24, 39);
    doc.rect(x + 13 * s, y + 21 * s, 6 * s, 7 * s, 'F');

    // moeda amarela
    doc.setFillColor(245, 158, 11);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.6);
    doc.circle(x + 25 * s, y + 8 * s, 5 * s, 'FD');

    // texto R$ na moeda
    doc.setTextColor(255, 255, 255);
    doc.setFont('', 'bold');
    doc.setFontSize(Math.max(4, 6 * s * (72 / 32)));
    doc.text('R$', x + 25 * s, y + 10 * s, { align: 'center' });

    // reset cor de texto
    doc.setTextColor(17, 24, 39);
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

  private getInitials(name: string): string {
    const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? '';
    const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (a + b).toUpperCase() || 'U';
  }

  private detectImageFormat(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' | null {
    const v = (dataUrl ?? '').trim().toLowerCase();
    if (v.startsWith('data:image/png')) return 'PNG';
    if (v.startsWith('data:image/jpg') || v.startsWith('data:image/jpeg')) return 'JPEG';
    if (v.startsWith('data:image/webp')) return 'WEBP';
    return null; // -> fallback
  }
}
