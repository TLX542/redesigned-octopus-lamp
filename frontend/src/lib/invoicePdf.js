function money(value) {
  return `${Number(value ?? 0).toFixed(2)} USD`;
}

function cleanText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value) {
  return cleanText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function textLine(x, y, size, value, options = {}) {
  const font = options.bold ? "F2" : "F1";
  return `BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET`;
}

function rect(x, y, width, height, options = {}) {
  const fill = options.fill ? "f" : "S";
  return `${x} ${y} ${width} ${height} re ${fill}`;
}

function buildPdfObjects(pageContent) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${pageContent.length} >>\nstream\n${pageContent}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

function pdfToDataUrl(pdf) {
  const bytes = new TextEncoder().encode(pdf);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `data:application/pdf;base64,${btoa(binary)}`;
}

export function formatInvoiceDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function enrichInvoiceItems(invoice, productsByApiId) {
  return (invoice?.items ?? []).map((item) => {
    const product = productsByApiId?.get?.(item.product_id);
    return {
      ...item,
      product_name: item.product_name ?? product?.name ?? `Product #${item.product_id}`,
    };
  });
}

export function buildInvoicePdfDataUrl(invoice, productsByApiId) {
  const items = enrichInvoiceItems(invoice, productsByApiId);
  const lines = [
    "0.96 0.98 0.97 rg",
    rect(0, 0, 595, 842, { fill: true }),
    "0.09 0.11 0.14 rg",
    textLine(48, 780, 26, "Fragrance Shop", { bold: true }),
    textLine(48, 756, 11, "Professional Invoice"),
    textLine(410, 782, 18, "INVOICE", { bold: true }),
    textLine(410, 760, 10, invoice.order_id),
    "0.85 0.87 0.88 RG",
    rect(48, 725, 499, 1),
    "0.09 0.11 0.14 rg",
    textLine(48, 690, 11, "Billed To", { bold: true }),
    textLine(48, 672, 10, invoice.customer_name ?? "Customer"),
    textLine(48, 656, 10, invoice.customer_email ?? ""),
    textLine(340, 690, 11, "Order Details", { bold: true }),
    textLine(340, 672, 10, `Date: ${formatInvoiceDate(invoice.created_at)}`),
    textLine(340, 656, 10, `Status: ${invoice.status}`),
    textLine(340, 640, 10, `Items: ${invoice.item_count}`),
    "0.09 0.11 0.14 rg",
    rect(48, 594, 499, 28, { fill: true }),
    "1 1 1 rg",
    textLine(62, 604, 9, "Product", { bold: true }),
    textLine(306, 604, 9, "Qty", { bold: true }),
    textLine(366, 604, 9, "Unit", { bold: true }),
    textLine(466, 604, 9, "Total", { bold: true }),
  ];

  let y = 572;
  items.slice(0, 10).forEach((item) => {
    lines.push(
      "0.09 0.11 0.14 rg",
      textLine(62, y, 9, item.product_name),
      textLine(306, y, 9, item.quantity),
      textLine(366, y, 9, money(item.unit_price)),
      textLine(466, y, 9, money(item.line_total)),
      "0.85 0.87 0.88 RG",
      rect(48, y - 12, 499, 1),
    );
    y -= 30;
  });

  lines.push(
    "0.09 0.11 0.14 rg",
    textLine(360, 210, 11, "Subtotal", { bold: true }),
    textLine(466, 210, 11, money(invoice.total_amount), { bold: true }),
    "0.88 0.90 0.89 RG",
    rect(340, 188, 207, 1),
    textLine(360, 164, 16, "Total", { bold: true }),
    textLine(466, 164, 16, money(invoice.total_amount), { bold: true }),
    textLine(48, 116, 12, "Thank you for shopping with us.", { bold: true }),
    textLine(48, 96, 9, "A PDF copy of this invoice has been sent to your registered email address."),
  );

  return pdfToDataUrl(buildPdfObjects(lines.join("\n")));
}
