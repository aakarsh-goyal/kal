import { jsPDF } from "jspdf";
import { AstrologyReport } from "../types";
import { LOGO_BASE_64 } from "./logo";

export const createPDF = async (report: AstrologyReport) => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });
  
  // Use the embedded logo constant
  const logoBase64 = LOGO_BASE_64;

  // --- CONFIGURATION ---
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20; 
  const contentWidth = pageWidth - (margin * 2);
  
  // Professional Palette
  const cTeal = [0, 60, 50];       // Deep Professional Teal
  const cGold = [180, 130, 50];    // Muted Gold/Bronze for accents
  const cDark = [40, 40, 40];      // Soft Black for reading
  const cLight = [100, 100, 100];  // Gray for metadata
  
  let yPos = 0;

  // --- DRAWING HELPERS ---

  const drawHeader = () => {
    // Subtle top line on every content page
    doc.setDrawColor(cGold[0], cGold[1], cGold[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, 15, pageWidth - margin, 15);
    
    // Brand Mark with Logo Icon in Header
    doc.setFont("times", "bold");
    doc.setFontSize(8);
    doc.setTextColor(cTeal[0], cTeal[1], cTeal[2]);
    
    if (logoBase64) {
        try {
            // Small logo icon in header (6x6 mm)
            doc.addImage(logoBase64, "PNG", margin, 6, 6, 6);
            doc.text("KALPVRIKSHA", margin + 8, 11); 
        } catch (e) {
             doc.text("KALPVRIKSHA", margin, 12);
        }
    } else {
        doc.text("KALPVRIKSHA", margin, 12);
    }
    
    doc.setFont("times", "normal");
    doc.setTextColor(cLight[0], cLight[1], cLight[2]);
    doc.text("Astrological Analysis", pageWidth - margin, 11, { align: "right" });
  };

  const addFooter = (pageNo: number) => {
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.setTextColor(cLight[0], cLight[1], cLight[2]);
    doc.text(`${pageNo}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  };

  const checkPageBreak = (heightNeeded: number) => {
    if (yPos + heightNeeded > pageHeight - margin) {
      const pageCount = doc.getNumberOfPages();
      addFooter(pageCount);
      doc.addPage();
      drawHeader();
      yPos = 30; // Top margin for content
    }
  };

  const drawSectionTitle = (title: string) => {
    checkPageBreak(20);
    yPos += 5;
    
    // Accent Block (Small vertical line)
    doc.setDrawColor(cGold[0], cGold[1], cGold[2]);
    doc.setLineWidth(1);
    doc.line(margin, yPos, margin, yPos + 6);

    // Title Text
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(cTeal[0], cTeal[1], cTeal[2]);
    doc.text(title.toUpperCase(), margin + 4, yPos + 5);
    
    yPos += 12;
  };

  const drawLabelValue = (label: string, value: string | string[]) => {
    const labelWidth = 45;
    const valueX = margin + labelWidth;
    const valueWidth = contentWidth - labelWidth;

    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.setTextColor(cTeal[0], cTeal[1], cTeal[2]);
    doc.text(label, margin, yPos);

    doc.setFont("times", "normal");
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);

    let textStr = Array.isArray(value) ? value.join(", ") : (value || "-");
    const lines = doc.splitTextToSize(textStr, valueWidth);
    
    checkPageBreak(lines.length * 5);
    doc.text(lines, valueX, yPos);
    
    yPos += (lines.length * 5) + 4; // Formatting space
  };

  // Draws a dashboard-style grid for summary highlights
  const drawHighlightsSection = () => {
    if (!report.summaryHighlights || report.summaryHighlights.length === 0) return;

    checkPageBreak(55);
    yPos += 5;
    drawSectionTitle("Executive Summary");

    const cardWidth = (contentWidth - 10) / 3; // 3 columns with gap
    const cardHeight = 22;
    const gap = 5;

    // We take up to 6 highlights
    const highlights = report.summaryHighlights.slice(0, 6);

    highlights.forEach((item, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        const x = margin + (col * (cardWidth + gap));
        const y = yPos + (row * (cardHeight + gap));

        // Card container border
        doc.setDrawColor(cGold[0], cGold[1], cGold[2]);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, y, cardWidth, cardHeight, 1, 1, 'S');

        // Header Label (Top part)
        doc.setFont("times", "bold");
        doc.setFontSize(7);
        doc.setTextColor(cLight[0], cLight[1], cLight[2]);
        doc.text(item.label.toUpperCase(), x + (cardWidth / 2), y + 6, { align: "center" });

        // Value (Center-Bottom)
        doc.setFont("times", "bold");
        doc.setFontSize(10);
        doc.setTextColor(cTeal[0], cTeal[1], cTeal[2]);
        
        const splitVal = doc.splitTextToSize(item.value, cardWidth - 4);
        doc.text(splitVal, x + (cardWidth / 2), y + 14, { align: "center" });

        // Visual Accent Bar
        doc.setFillColor(cGold[0], cGold[1], cGold[2]);
        doc.rect(x + 6, y + cardHeight - 3, cardWidth - 12, 1, 'F');
        doc.setFillColor(cTeal[0], cTeal[1], cTeal[2]);
        const randomWidth = (cardWidth - 12) * (0.4 + (Math.random() * 0.4));
        doc.rect(x + 6, y + cardHeight - 3, randomWidth, 1, 'F');
    });

    yPos += (Math.ceil(highlights.length / 3) * (cardHeight + gap)) + 8;
  };

  // Geometric Abstract Markers (Not Icons)
  const drawVisualMarker = (type: 'diamond' | 'circle' | 'triangle' | 'square', x: number, y: number) => {
    doc.setFillColor(cGold[0], cGold[1], cGold[2]);
    const r = 1.2; 
    const cy = y + 1.5;

    switch (type) {
      case 'diamond': // Gemstones (Crystalline structure)
        doc.triangle(x, cy - r, x + r, cy, x - r, cy, 'F'); 
        doc.triangle(x, cy + r, x + r, cy, x - r, cy, 'F');
        break;
      case 'circle': // Rudraksha (Bead)
        doc.circle(x, cy, r, 'F');
        break;
      case 'triangle': // Rituals (Upward energy/Fire)
        doc.triangle(x, cy - r, x + r, cy + r, x - r, cy + r, 'F');
        break;
      case 'square': // Lifestyle (Stability/Foundation)
        doc.rect(x - r, cy - r, r * 2, r * 2, 'F');
        break;
    }
  };

  const drawCard = (title: string, content: string | string[], markerType?: 'diamond' | 'circle' | 'triangle' | 'square') => {
    const contentStr = Array.isArray(content) ? content.map(c => `• ${c}`).join("\n") : content;
    
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(contentStr, contentWidth - 8);
    const height = (lines.length * 5) + 12;

    checkPageBreak(height);

    doc.setDrawColor(cGold[0], cGold[1], cGold[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos, margin, yPos + height - 5);

    let textX = margin + 5;
    if (markerType) {
      drawVisualMarker(markerType, margin + 5, yPos + 1.5);
      textX = margin + 12; 
    }

    doc.setFont("times", "bold");
    doc.setTextColor(cTeal[0], cTeal[1], cTeal[2]);
    doc.text(title, textX, yPos + 3);

    doc.setFont("times", "normal");
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text(lines, margin + 5, yPos + 9);

    yPos += height;
  };

  // --- MAIN RENDER ---
  try {
    // 1. COVER PAGE
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(cLight[0], cLight[1], cLight[2]);
    doc.text(today, pageWidth - margin, 30, { align: "right" });

    const centerY = pageHeight / 2 - 20;

    // --- LOGO ON COVER ---
    if (logoBase64) {
      try {
        const logoSize = 45;
        // Position logo above the title block
        const logoY = centerY - 55;
        doc.addImage(logoBase64, "PNG", (pageWidth - logoSize)/2, logoY, logoSize, logoSize);
      } catch (e) {
        console.warn("Could not render logo on cover", e);
      }
    }

    // "Prepared For"
    doc.setFont("times", "italic");
    doc.setFontSize(12);
    doc.setTextColor(cGold[0], cGold[1], cGold[2]);
    doc.text("Astrological Consultation For", margin, centerY);

    // Client Name
    doc.setFont("times", "bold");
    doc.setFontSize(32);
    doc.setTextColor(cTeal[0], cTeal[1], cTeal[2]);
    const nameLines = doc.splitTextToSize(report.clientName, contentWidth);
    doc.text(nameLines, margin, centerY + 15);

    doc.setDrawColor(cTeal[0], cTeal[1], cTeal[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, centerY + 30, margin + 40, centerY + 30);

    // Bottom Branding
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text("KALPVRIKSHA", margin, pageHeight - 30);
    
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(cLight[0], cLight[1], cLight[2]);
    doc.text("Professional Astrological Services", margin, pageHeight - 25);

    addFooter(1);
    doc.addPage();
    drawHeader();
    yPos = 40;

    // 2. CLIENT PROFILE
    drawSectionTitle("Personal Profile");
    drawLabelValue("Ascendant", report.ascendant);
    drawLabelValue("Moon Sign", report.moonSign);
    
    if (report.keyObservations && report.keyObservations.length > 0) {
      yPos += 2;
      drawLabelValue("Key Observations", report.keyObservations.join("\n"));
    }

    // 3. EXECUTIVE SUMMARY
    drawHighlightsSection();

    // 4. TIMELINE
    if (report.timelineAnalysis) {
      drawSectionTitle("Timeline & Forecast");
      report.timelineAnalysis.forEach(item => {
        drawLabelValue(item.label, item.value);
      });
    }

    // 5. PERSONALITY & HEALTH
    if (report.personalityHealth) {
      yPos += 5;
      drawSectionTitle("Personality & Health");
      const gridItems = [
        { l: "Temperament", v: report.personalityHealth.temperament },
        { l: "Caution", v: report.personalityHealth.caution },
        { l: "Physical", v: report.personalityHealth.physical },
        { l: "Advice", v: report.personalityHealth.advice },
      ];
      gridItems.forEach(item => drawLabelValue(item.l, item.v));
    }

    // 6. REMEDIES
    if (report.structuredRemedies) {
      yPos += 5;
      drawSectionTitle("Remedial Measures");
      
      if (report.structuredRemedies.gemstones) {
        drawCard("Gemstones", report.structuredRemedies.gemstones, 'diamond');
      }
      
      if (report.structuredRemedies.rudraksha) {
        drawCard("Rudraksha", report.structuredRemedies.rudraksha, 'circle');
      }
      
      if (report.structuredRemedies.rituals && report.structuredRemedies.rituals.length > 0) {
        drawCard("Rituals", report.structuredRemedies.rituals, 'triangle');
      }
      
      if (report.structuredRemedies.lifestyle && report.structuredRemedies.lifestyle.length > 0) {
        drawCard("Lifestyle Adjustments", report.structuredRemedies.lifestyle, 'square');
      }
    }

    // 7. BOTANICAL & SPIRITUAL
    if ((report.botanicalRemedies && report.botanicalRemedies.length > 0) || (report.spiritualPilgrimage && report.spiritualPilgrimage.length > 0)) {
        yPos += 5;
        drawSectionTitle("Nature & Spirit");
        
        if (report.botanicalRemedies && report.botanicalRemedies.length > 0) {
             drawCard("Botanical Remedies (Trees to Plant)", report.botanicalRemedies.join(", "));
        }
        
        if (report.spiritualPilgrimage && report.spiritualPilgrimage.length > 0) {
             const templeList = report.spiritualPilgrimage.map((t, i) => `${i+1}. ${t}`);
             drawCard("Recommended Pilgrimage", templeList);
        }
    }

    // --- FINAL SIGN-OFF LOGO (SEAL) ---
    checkPageBreak(40);
    yPos += 20;
    
    if (logoBase64) {
      try {
        const sealSize = 25;
        const sealX = (pageWidth - sealSize) / 2;
        doc.addImage(logoBase64, "PNG", sealX, yPos, sealSize, sealSize);
        
        doc.setFont("times", "italic");
        doc.setFontSize(8);
        doc.setTextColor(cGold[0], cGold[1], cGold[2]);
        doc.text("May the stars guide you.", pageWidth / 2, yPos + sealSize + 5, { align: "center" });
      } catch (e) {
        // ignore
      }
    }

    const totalPages = doc.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i);
    }

    const safeName = report.clientName ? report.clientName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'report';
    doc.save(`${safeName}_consultation.pdf`);

  } catch (error) {
    console.error("PDF Generation Error", error);
    alert("Error generating PDF");
  }
};