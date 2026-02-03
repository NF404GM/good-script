import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { Script } from '../types';
import * as mammoth from 'mammoth';
import { Document, Packer, Paragraph as DocxParagraph, TextRun } from 'docx';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Set PDF Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
// Note: Downgraded/Pinned to stable 4.x for compatibility if 5.x has module issues in non-module worker context.
// Actually, let's try matching version 5.4.624 but be careful with .mjs
// Using a known working CDN pattern.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const ExportManager = {
    // --- EXPORTS ---

    exportToPDF: async (script: Script) => {
        const doc = new jsPDF();
        doc.setFont("courier", "normal");
        doc.setFontSize(12);

        // Title
        doc.setFontSize(24);
        doc.text(script.title.toUpperCase(), 105, 100, { align: "center" });
        doc.setFontSize(12);
        doc.text("Written by User", 105, 115, { align: "center" });

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = script.content;
        // Simple text extraction for V3.0
        const lines = tempDiv.innerText.split('\n');

        doc.addPage();
        let y = 20;
        lines.forEach(line => {
            if (y > 280) { doc.addPage(); y = 20; }
            const split = doc.splitTextToSize(line, 170);
            doc.text(split, 20, y);
            y += (split.length * 5) + 2;
        });

        doc.save(`${script.title}.pdf`);
    },

    exportToMarkdown: (script: Script) => {
        let text = script.content
            .replace(/<h1>/g, '# ')
            .replace(/<\/h1>/g, '\n\n')
            .replace(/<p>/g, '')
            .replace(/<\/p>/g, '\n\n')
            .replace(/<br>/g, '\n');
        const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
        saveAs(blob, `${script.title}.md`);
    },

    exportToJSON: (script: Script) => {
        const blob = new Blob([JSON.stringify(script, null, 2)], { type: "application/json;charset=utf-8" });
        saveAs(blob, `${script.title}.json`);
    },

    exportToWord: async (script: Script) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = script.content;
        const paragraphs = Array.from(tempDiv.querySelectorAll('p')).map(p =>
            new DocxParagraph({
                children: [new TextRun({
                    text: p.innerText,
                    font: "Courier Prime",
                    size: 24 // 12pt = 24 half-points
                })]
            })
        );

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new DocxParagraph({ children: [new TextRun({ text: script.title.toUpperCase(), bold: true, size: 48 })] }),
                    ...paragraphs
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${script.title}.docx`);
    },

    exportToFDX: (script: Script) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = script.content;
        const paragraphs = Array.from(tempDiv.querySelectorAll('p'));

        let xml = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<FinalDraft DocumentType="Script" Template="Screenplay_Standard" Version="1">
  <Content>
    <Paragraph Type="General">
      <Text>${script.title.toUpperCase()}</Text>
    </Paragraph>
`;
        paragraphs.forEach(p => {
            // Minimal Heuristic if class missing
            let type = "Action";
            const text = p.innerText.trim();
            if (text === text.toUpperCase() && text.length > 0 && text.length < 50) type = "Scene Heading"; // Weak guess

            // Use existing class if available
            if (p.className && ["Scene Heading", "Action", "Character", "Dialogue", "Parenthetical"].includes(p.className)) {
                type = p.className;
            }

            xml += `    <Paragraph Type="${type}">\n      <Text>${text}</Text>\n    </Paragraph>\n`;
        });

        xml += `  </Content>\n</FinalDraft>`;

        const blob = new Blob([xml], { type: "text/xml;charset=utf-8" });
        saveAs(blob, `${script.title}.fdx`);
    },

    // --- IMPORTS ---

    parseImportFile: async (file: File): Promise<Partial<Script>> => {
        return new Promise(async (resolve, reject) => {
            const name = file.name.toLowerCase();

            try {
                if (name.endsWith('.json')) {
                    const text = await file.text();
                    resolve(JSON.parse(text));
                }
                else if (name.endsWith('.docx')) {
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    resolve({
                        title: file.name.replace('.docx', ''),
                        content: result.value,
                        lastModified: Date.now()
                    });
                }
                else if (name.endsWith('.pdf')) {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    let fullText = "";

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map((item: any) => item.str).join(' ');
                        fullText += `<p>${pageText}</p>`;
                    }

                    resolve({
                        title: file.name.replace('.pdf', ''),
                        content: fullText,
                        lastModified: Date.now()
                    });
                }
                else if (name.endsWith('.pages')) {
                    // Try to unzip and find PDF Preview
                    const zip = new JSZip();
                    const content = await zip.loadAsync(file);

                    // Look for preview pdf
                    const previewFile = content.file('QuickLook/Preview.pdf') || content.file('Preview.pdf');

                    if (previewFile) {
                        const pdfData = await previewFile.async('arraybuffer');
                        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                        let fullText = "";
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            const pageText = textContent.items.map((item: any) => item.str).join(' ');
                            fullText += `<p>${pageText}</p>`;
                        }
                        resolve({
                            title: file.name.replace('.pages', ''),
                            content: fullText,
                            lastModified: Date.now()
                        });
                    } else {
                        // Fallback: Can't read proprietary iwa
                        reject(new Error("Could not find preview in .pages file. Please export to Word or PDF."));
                    }
                }
                else if (name.endsWith('.fdx')) {
                    const text = await file.text();
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(text, "text/xml");
                    const paragraphs = xmlDoc.getElementsByTagName("Paragraph");
                    let html = "";
                    for (let i = 0; i < paragraphs.length; i++) {
                        const p = paragraphs[i];
                        const type = p.getAttribute("Type") || "Action";
                        const txt = p.textContent?.trim() || "";
                        if (txt) html += `<p class="${type}">${txt}</p>`;
                    }
                    resolve({
                        title: file.name.replace('.fdx', ''),
                        content: html,
                        lastModified: Date.now()
                    });
                }
                else { // TXT, MD, Fountain
                    const text = await file.text();
                    const html = text.split('\n').map(l => l.trim() ? `<p>${l}</p>` : '').join('');
                    resolve({
                        title: file.name.replace(/\.(txt|md|fountain)$/, ''),
                        content: html,
                        lastModified: Date.now()
                    });
                }
            } catch (err) {
                console.error("Import Error", err);
                reject(err);
            }
        });
    }
};
