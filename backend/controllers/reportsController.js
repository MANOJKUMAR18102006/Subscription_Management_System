const { getReports, getDetails, buildFilters, applySubscriptionScope } = require('../services/reportsService');
const Payment = require('../models/Payment');

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

exports.getReports = async (req, res, next) => {
  try {
    const [report, details] = await Promise.all([getReports(req.query), getDetails(req.query)]);
    res.json({ success: true, ...report, details });
  } catch (error) {
    next(error);
  }
};

exports.exportReports = async (req, res, next) => {
  try {
    const format = req.query.format === 'pdf' ? 'pdf' : 'csv';
    const filters = buildFilters(req.query);
    await applySubscriptionScope(filters);
    const [payments, invoices, subscriptions] = await Promise.all([
      Payment.find(filters.payment).populate('customerId', 'name').sort({ paymentDate: -1 }).lean(),
      Invoice.find(filters.invoice).populate('customerId', 'name').sort({ dueDate: 1 }).lean(),
      Subscription.find(filters.subscription).populate('customerId', 'name').sort({ createdAt: -1 }).lean()
    ]);

    if (format === 'csv') {
      const rows = [
        ['Report', 'Reference', 'Customer', 'Status/Method', 'Amount', 'Date'],
        ...payments.map((item) => ['Payment', item.paymentReference, item.customerId?.name, item.status || item.paymentMethod, item.amount, item.paymentDate]),
        ...invoices.map((item) => ['Invoice', item.invoiceNumber, item.customerId?.name, item.status, item.amount, item.dueDate]),
        ...subscriptions.map((item) => ['Subscription', item.planName, item.customerId?.name, item.status, item.amount, item.createdAt])
      ];
      const body = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
      res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="subscription-report.csv"' });
      return res.send(body);
    }

    const lines = [
      'BRIGHTLOOP FINANCIAL REPORT',
      `Period: ${filters.from.toLocaleDateString()} - ${filters.to.toLocaleDateString()}`,
      `Payments received: ${payments.filter((item) => item.status === 'completed').reduce((total, item) => total + item.amount, 0)}`,
      `Invoices: ${invoices.length}`,
      `Subscriptions: ${subscriptions.length}`,
      '',
      ...payments.slice(0, 40).map((item) => `Payment ${item.paymentReference} | ${item.customerId?.name || '-'} | ${item.amount} | ${item.paymentDate.toLocaleDateString()}`)
    ];
    const escapePdf = (value) => String(value).replace(/([\\()])/g, '\\$1');
    const content = `BT /F1 11 Tf 40 760 Td ${lines.map((line) => `(${escapePdf(line)}) Tj 0 -16 Td`).join(' ')} ET`;
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets[index + 1] = Buffer.byteLength(pdf, 'utf8');
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="subscription-report.pdf"' });
    res.send(Buffer.from(pdf, 'utf8'));
  } catch (error) {
    next(error);
  }
};
