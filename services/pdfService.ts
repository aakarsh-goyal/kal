import { jsPDF } from "jspdf";
import { AstrologyReport } from "../types";
import { fetchLogoForPDF } from "./supabaseService";

// Helper to process image: Remove background and get aspect ratio
const processLogoImage = (base64Str: string): Promise<{ processedBase64: string; ratio: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "Anonymous"; // prevent taint issues if applicable

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve({ processedBase64: base64Str, ratio: img.width / img.height });
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 1. Sampling the Top-Left pixel to determine background color
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];
        const bgA = data[3];

        if (bgA > 200) {
          const tolerance = 40; 
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (
              Math.abs(r - bgR) < tolerance &&
              Math.abs(g - bgG) < tolerance &&
              Math.abs(b - bgB) < tolerance
            ) {
              data[i + 3] = 0; // Turn alpha to 0 (Transparent)
            }
          }
          ctx.putImageData(imageData, 0, 0);
          resolve({ 
            processedBase64: canvas.toDataURL('image/png'), 
            ratio: img.width / img.height 
          });
        } else {
          resolve({ processedBase64: base64Str, ratio: img.width / img.height });
        }
      } catch (e) {
        console.warn("Canvas manipulation failed (likely CORS), using original image", e);
        resolve({ processedBase64: base64Str, ratio: img.width / img.height });
      }
    };

    img.onerror = () => {
      resolve({ processedBase64: base64Str, ratio: 1 });
    };
  });
};

export const createPDF = async (report: AstrologyReport) => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });
  
  // Load and Process Logo
  const rawLogoBase64 = await fetchLogoForPDF();
  let logoData: { processedBase64: string; ratio: number } | null = null;
  
  if (rawLogoBase64) {
    logoData = await processLogoImage(rawLogoBase64);
  }

  // --- CONFIGURATION ---
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20; 
  const contentWidth = pageWidth - (margin * 2);
  
  // Professional "Kalpvriksha" Palette
  const cTeal = [0, 77, 64];       // Deep Teal (#004d40)
  const cOrange = [251, 140, 0];   // Vibrant Orange (#fb8c00)
  const cDark = [33, 33, 33];      // Soft Black
  const cGray = [97, 97, 97];      // Dark Gray
  
  let yPos = 0;

  // --- DRAWING HELPERS ---

  const drawWatermark = () => {
    const x = pageWidth / 2;
    const y = pageHeight / 2;

    // 1. Draw Logo Watermark (if available)
    if (logoData) {
      try {
        doc.saveGraphicsState();
        // @ts-ignore
        doc.setGState(new doc.GState({ opacity: 0.05 })); 

        const wmMax = 120;
        let w = wmMax;
        let h = wmMax;
        
        if (logoData.ratio > 1) {
            h = wmMax / logoData.ratio;
        } else {
            w = wmMax * logoData.ratio;
        }

        doc.addImage(logoData.processedBase64, "PNG", x - (w/2), y - (h/2), w, h);
        doc.restoreGraphicsState();
      } catch (e) {
        console.warn("Could not render logo watermark", e);
      }
    }

    // 2. Draw Text Watermark
    doc.setTextColor(245, 245, 245); 
    doc.setFont("times", "bold");
    doc.setFontSize(60);
    doc.text("KALPVRIKSHA", x, y, { align: "center", angle: 45 });
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  };

  const drawHeader = () => {
    // Orange top accent
    doc.setDrawColor(cOrange[0], cOrange[1], cOrange[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, 15, pageWidth - margin, 15);
    
    // Header Text
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.setTextColor(cTeal[0], cTeal[1], cTeal[2]);
    
    let textOffsetX = margin;

    if (logoData) {
        try {
            const h = 8;
            const w = h * logoData.ratio;
            doc.addImage(logoData.processedBase64, "PNG", margin, 6, w, h);
            textOffsetX = margin + w + 3;
        } catch (e) {
             // Fallback
        }
    }
    
    doc.text("KALPVRIKSHA", textOffsetX, 12);
    doc.setFont("times", "normal");
    doc.setTextColor(cGray[0], cGray[1], cGray[2]);
    doc.text("Rooted in Ancient Wisdom", pageWidth - margin, 12, { align: "right" });
  };

  const addFooter = (pageNo: number) => {
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.setTextColor(cGray[0], cGray[1], cGray[2]);
    doc.text(`${pageNo}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  };

  const checkPageBreak = (heightNeeded: number) => {
    if (yPos + heightNeeded > pageHeight - margin) {
      const pageCount = doc.getNumberOfPages();
      addFooter(pageCount);
      doc.addPage();
      drawWatermark();
      drawHeader();
      yPos = 30;
    }
  };

  // Improved Visual Drawer: Minimalist, No Borders, Flexible Size
  const drawGeneratedVisual = (base64Img: string, height: number = 50, isFullWidth: boolean = true) => {
     checkPageBreak(height + 10);
     
     try {
       if (isFullWidth) {
           // Full width centered
           const imgW = height * (16/9); // Assuming 16:9 ratio generally
           const finalW = Math.min(imgW, contentWidth);
           const finalH = finalW * (9/16);
           const x = (pageWidth - finalW) / 2;
           
           doc.addImage(base64Img, "PNG", x, yPos, finalW, finalH, undefined, 'FAST');
           yPos += finalH + 8;
       } else {
           // Smaller sprinkle (centered for now to keep layout safe)
           const imgH = height;
           const imgW = imgH * (16/9);
           const x = (pageWidth - imgW) / 2;
           doc.addImage(base64Img, "PNG", x, yPos, imgW, imgH, undefined, 'FAST');
           yPos += imgH + 8;
       }
     } catch(e) { console.error(e); }
  };

  const drawSectionTitle = (title: string) => {
    checkPageBreak(20);
    yPos += 5;
    
    // Orange Accent Line
    doc.setDrawColor(cOrange[0], cOrange[1], cOrange[2]);
    doc.setLineWidth(1.5);
    doc.line(margin, yPos, margin, yPos + 6);

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
    yPos += (lines.length * 5) + 4; 
  };

  const drawHighlightsSection = () => {
    if (!report.summaryHighlights || report.summaryHighlights.length === 0) return;
    checkPageBreak(55);
    yPos += 5;
    drawSectionTitle("Executive Summary");
    const cardWidth = (contentWidth - 10) / 3; 
    const cardHeight = 22;
    const gap = 5;
    const highlights = report.summaryHighlights.slice(0, 6);
    highlights.forEach((item, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        const x = margin + (col * (cardWidth + gap));
        const y = yPos + (row * (cardHeight + gap));
        
        doc.setDrawColor(cOrange[0], cOrange[1], cOrange[2]);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, y, cardWidth, cardHeight, 1, 1, 'S');
        
        doc.setFont("times", "bold");
        doc.setFontSize(7);
        doc.setTextColor(cGray[0], cGray[1], cGray[2]);
        doc.text(item.label.toUpperCase(), x + (cardWidth / 2), y + 6, { align: "center" });
        
        doc.setFont("times", "bold");
        doc.setFontSize(10);
        doc.setTextColor(cTeal[0], cTeal[1], cTeal[2]);
        const splitVal = doc.splitTextToSize(item.value, cardWidth - 4);
        doc.text(splitVal, x + (cardWidth / 2), y + 14, { align: "center" });
        
        // Orange/Teal Accent
        doc.setFillColor(cOrange[0], cOrange[1], cOrange[2]);
        doc.rect(x + 6, y + cardHeight - 3, cardWidth - 12, 1, 'F');
        doc.setFillColor(cTeal[0], cTeal[1], cTeal[2]);
        const randomWidth = (cardWidth - 12) * (0.4 + (Math.random() * 0.4));
        doc.rect(x + 6, y + cardHeight - 3, randomWidth, 1, 'F');
    });
    yPos += (Math.ceil(highlights.length / 3) * (cardHeight + gap)) + 8;
  };

  const drawVisualMarker = (type: 'diamond' | 'circle' | 'triangle' | 'square', x: number, y: number) => {
    doc.setFillColor(cOrange[0], cOrange[1], cOrange[2]);
    const r = 1.2; 
    const cy = y + 1.5;
    switch (type) {
      case 'diamond': doc.triangle(x, cy - r, x + r, cy, x - r, cy, 'F'); doc.triangle(x, cy + r, x + r, cy, x - r, cy, 'F'); break;
      case 'circle': doc.circle(x, cy, r, 'F'); break;
      case 'triangle': doc.triangle(x, cy - r, x + r, cy + r, x - r, cy + r, 'F'); break;
      case 'square': doc.rect(x - r, cy - r, r * 2, r * 2, 'F'); break;
    }
  };

  const drawCard = (title: string, content: string | string[], markerType?: 'diamond' | 'circle' | 'triangle' | 'square') => {
    const contentStr = Array.isArray(content) ? content.map(c => `• ${c}`).join("\n") : content;
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(contentStr, contentWidth - 8);
    const height = (lines.length * 5) + 12;
    checkPageBreak(height);
    
    // Line in Orange
    doc.setDrawColor(cOrange[0], cOrange[1], cOrange[2]);
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
    drawWatermark(); 

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(cGray[0], cGray[1], cGray[2]);
    doc.text(today, pageWidth - margin, 30, { align: "right" });

    const centerY = pageHeight / 2 - 20;

    // --- LOGO ON COVER ---
    if (logoData) {
      try {
        const maxSize = 45;
        let w = maxSize;
        let h = maxSize;
        if (logoData.ratio > 1) { w = maxSize; h = maxSize / logoData.ratio; } 
        else { h = maxSize; w = maxSize * logoData.ratio; }
        const logoY = centerY - 55;
        const logoX = (pageWidth - w) / 2;
        doc.addImage(logoData.processedBase64, "PNG", logoX, logoY, w, h);
      } catch (e) { }
    }

    doc.setFont("times", "italic");
    doc.setFontSize(12);
    doc.setTextColor(cOrange[0], cOrange[1], cOrange[2]);
    doc.text("Astrological Consultation For", margin, centerY);
    
    doc.setFont("times", "bold");
    doc.setFontSize(32);
    doc.setTextColor(cTeal[0], cTeal[1], cTeal[2]);
    const nameLines = doc.splitTextToSize(report.clientName, contentWidth);
    doc.text(nameLines, margin, centerY + 15);
    
    // Teal line under name
    doc.setDrawColor(cTeal[0], cTeal[1], cTeal[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, centerY + 30, margin + 40, centerY + 30);
    
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text("KALPVRIKSHA", margin, pageHeight - 30);
    
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(cGray[0], cGray[1], cGray[2]);
    doc.text("Professional Astrological Services", margin, pageHeight - 25);

    addFooter(1);
    doc.addPage();
    drawWatermark(); 
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
    
    // VISUAL: Planetary Alignment (Sprinkled small)
    if (report.generatedVisuals?.planetaryVisual) {
         drawGeneratedVisual(report.generatedVisuals.planetaryVisual, 35, false);
    }

    // 3. EXECUTIVE SUMMARY
    drawHighlightsSection();

    // 4. TIMELINE
    if (report.timelineAnalysis) {
      drawSectionTitle("Timeline & Forecast");
      report.timelineAnalysis.forEach(item => {
        drawLabelValue(item.label, item.value);
      });
      // VISUAL: Career (Full widthish)
      if (report.generatedVisuals?.careerVisual) {
         drawGeneratedVisual(report.generatedVisuals.careerVisual, 45, true);
      }
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
      
      // VISUAL: Personality Aura (Sprinkled small)
      if (report.generatedVisuals?.personalityVisual) {
         drawGeneratedVisual(report.generatedVisuals.personalityVisual, 30, false);
      }
    }

    // 6. REMEDIES
    if (report.structuredRemedies) {
      yPos += 5;
      drawSectionTitle("Remedial Measures");
      
      if (report.structuredRemedies.gemstones) {
          drawCard("Gemstones", report.structuredRemedies.gemstones, 'diamond');
          // VISUAL: Gemstone (Sprinkled small immediately after)
          if (report.generatedVisuals?.gemstoneVisual) {
              drawGeneratedVisual(report.generatedVisuals.gemstoneVisual, 30, false);
          }
      }
      
      if (report.structuredRemedies.rudraksha) drawCard("Rudraksha", report.structuredRemedies.rudraksha, 'circle');
      if (report.structuredRemedies.rituals?.length > 0) drawCard("Rituals", report.structuredRemedies.rituals, 'triangle');
      if (report.structuredRemedies.lifestyle?.length > 0) drawCard("Lifestyle Adjustments", report.structuredRemedies.lifestyle, 'square');
    }

    // 7. BOTANICAL & SPIRITUAL
    if ((report.botanicalRemedies && report.botanicalRemedies.length > 0) || (report.spiritualPilgrimage && report.spiritualPilgrimage.length > 0)) {
        yPos += 5;
        drawSectionTitle("Nature & Spirit");
        
        if (report.botanicalRemedies && report.botanicalRemedies.length > 0) {
             drawCard("Botanical Remedies (Trees to Plant)", report.botanicalRemedies.join(", "));
             // VISUAL: Botanical
             if (report.generatedVisuals?.botanicalSketch) {
                drawGeneratedVisual(report.generatedVisuals.botanicalSketch, 50, true);
             }
        }
        
        if (report.spiritualPilgrimage && report.spiritualPilgrimage.length > 0) {
             const templeList = report.spiritualPilgrimage.map((t, i) => `${i+1}. ${t}`);
             drawCard("Recommended Pilgrimage", templeList);
             // VISUAL: Map
             if (report.generatedVisuals?.pilgrimageMap) {
                drawGeneratedVisual(report.generatedVisuals.pilgrimageMap, 60, true);
             }
        }
    }

    // --- FINAL SIGN-OFF LOGO (SEAL) ---
    checkPageBreak(40);
    yPos += 20;
    if (logoData) {
      try {
        const sealSize = 25;
        let w = sealSize;
        let h = sealSize;
        if (logoData.ratio > 1) { h = sealSize / logoData.ratio; } 
        else { w = sealSize * logoData.ratio; }
        const sealX = (pageWidth - w) / 2;
        doc.addImage(logoData.processedBase64, "PNG", sealX, yPos, w, h);
        doc.setFont("times", "italic");
        doc.setFontSize(8);
        doc.setTextColor(cOrange[0], cOrange[1], cOrange[2]);
        doc.text("May the stars guide you.", pageWidth / 2, yPos + h + 5, { align: "center" });
      } catch (e) { }
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