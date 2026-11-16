import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import PDFDocument from 'pdfkit';
import { SUBSCRIPTION_PRICING_INR } from '@reprojects/constants';

const app = express();
const PORT = Number(process.env.PORT || 3003);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/', (_req, res) => {
  res.json({
    service: '@reprojects/pdf-renderer',
    version: '2.0.0',
    status: 'running',
    endpoints: [
      'GET /health',
      'POST /api/v2/pdf/invoice',
      'POST /api/v2/pdf/property-brochure'
    ]
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'pdf-renderer',
    timestamp: new Date().toISOString()
  });
});

// 1. Render GST Tax Invoice PDF for Agent Pro Subscriptions
app.post('/api/v2/pdf/invoice', (req, res) => {
  const {
    invoiceNumber = `INV-${Date.now()}`,
    agentName = 'Registered Commercial Agent',
    agentMobile = '+91 98450 00000',
    gstin = 'Unregistered',
    cities = ['Bengaluru'],
    bundles = ['Office'],
    subtotalInr = 1000
  } = req.body;

  const gstInr = Math.round(Number(subtotalInr) * SUBSCRIPTION_PRICING_INR.GST_RATE);
  const totalInr = Number(subtotalInr) + gstInr;

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fillColor('#0f294a').fontSize(20).text('REALESTATE PROJECTS', { align: 'left' });
  doc.fillColor('#526075').fontSize(10).text('Commercial Real Estate Intelligence Platform · Tax Invoice');
  doc.moveDown(1.5);

  // Invoice Meta
  doc.fillColor('#111827').fontSize(11);
  doc.text(`Invoice Number: ${invoiceNumber}`);
  doc.text(`Issue Date: ${new Date().toLocaleDateString('en-IN')}`);
  doc.text(`Billing Cycle: 30 Days (Agent Pro Membership)`);
  doc.moveDown(1);

  // Billed To
  doc.fontSize(12).fillColor('#0f294a').text('Billed To:');
  doc.fontSize(10).fillColor('#111827');
  doc.text(`Name: ${agentName}`);
  doc.text(`Mobile: ${agentMobile}`);
  doc.text(`GSTIN: ${gstin}`);
  doc.moveDown(1.5);

  // Line Items
  doc.fontSize(12).fillColor('#0f294a').text('Subscription Coverage:');
  doc.fontSize(10).fillColor('#111827');
  doc.text(`Asset Class Bundles: ${Array.isArray(bundles) ? bundles.join(', ') : bundles}`);
  doc.text(`Active Cities: ${Array.isArray(cities) ? cities.join(', ') : cities}`);
  doc.moveDown(1.5);

  // Totals
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#dce3ec');
  doc.moveDown(0.75);
  doc.fontSize(11).text(`Subtotal: INR ${Number(subtotalInr).toLocaleString('en-IN')}`);
  doc.text(`GST (18%): INR ${gstInr.toLocaleString('en-IN')}`);
  doc.fontSize(13).fillColor('#0f294a').text(`Total Paid: INR ${totalInr.toLocaleString('en-IN')}`);

  doc.moveDown(2);
  doc.fontSize(9).fillColor('#526075').text('This is a computer-generated GST invoice and does not require a physical signature.');
  doc.end();
});

// 2. Render Commercial Property Fact Sheet Brochure PDF
app.post('/api/v2/pdf/property-brochure', (req, res) => {
  const {
    propertyId = 'PR-000000',
    displayTitle = 'Grade-A Commercial Space for Lease',
    assetClass = 'office',
    city = 'Bengaluru',
    primaryLocation = 'Outer Ring Road',
    carpetAreaSqFt = 10000,
    builtUpAreaSqFt = 12500,
    quotedRentInr = 950000,
    ratePerSqFtInr = 95,
    floor = '5th Floor',
    possession = 'Immediate',
    ocStatus = 'Ready',
    hideImages = false
  } = req.body;

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${propertyId}-brochure.pdf"`);
  doc.pipe(res);

  doc.fillColor('#0f294a').fontSize(18).text(displayTitle);
  doc.fillColor('#e85d04').fontSize(10).text(`${propertyId} · ${String(assetClass).toUpperCase()} FOR LEASE`);
  doc.moveDown(0.5);
  doc.fillColor('#526075').fontSize(11).text(`${primaryLocation}, ${city}`);
  doc.moveDown(1.5);

  doc.fillColor('#0f294a').fontSize(12).text('Technical & Commercial Specifications');
  doc.moveDown(0.5);
  doc.fillColor('#111827').fontSize(10.5);
  doc.text(`• Carpet Area: ${Number(carpetAreaSqFt).toLocaleString('en-IN')} sq. ft.`);
  doc.text(`• Built-up Area: ${Number(builtUpAreaSqFt).toLocaleString('en-IN')} sq. ft.`);
  doc.text(`• Quoted Monthly Rent: INR ${Number(quotedRentInr).toLocaleString('en-IN')} / month`);
  doc.text(`• Effective Rate: INR ${ratePerSqFtInr} / sq. ft. (on Carpet Area)`);
  doc.text(`• Floor: ${floor}`);
  doc.text(`• Possession Timeline: ${possession}`);
  doc.text(`• Occupancy Certificate (OC): ${ocStatus}`);

  if (hideImages) {
    doc.moveDown(1.5);
    doc.fillColor('#b45309').fontSize(10).text(
      'Privacy Notice: Property photographs are restricted by the lister and require approved image access.'
    );
  }

  doc.moveDown(2);
  doc.fillColor('#526075').fontSize(9).text('Generated by RealEstate Projects · Commercial Mandate & Leasing Desk');
  doc.end();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[pdf-renderer] PDF microservice listening on http://localhost:${PORT}`);
});
