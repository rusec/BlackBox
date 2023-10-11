import fs from "fs";
import pdfkit from "pdfkit";
import path from "path";
import "../../assets/Roboto-Bold.ttf";
import "../../assets/Roboto-Light.ttf";
import "../../assets/Roboto-LightItalic.ttf";

type email = {
    to: string;
    from: string;
    subject: string;
    body: string;
    attachments: string[];
};
type ir = {};
const numberofemails = fs.existsSync("./emails") ? fs.readdirSync("./emails").length : 0;

export function createEmail(values: email) {
    var doc = new pdfkit({
        font: path.join(__dirname, "fonts/Roboto-Light.ttf"),
    });
    if (!fs.existsSync("./emails")) {
        fs.mkdirSync("./emails");
    }
    let date = new Date();
    let body = values.body;

    doc.pipe(fs.createWriteStream(`./emails/${values.subject}_${date.toISOString()}.pdf`));
    doc.fontSize(10);

    doc.text(`To: ${values.to}`);
    doc.text(`From: ${values.from}`);
    doc.text(`Subject: ${values.subject}`);
    doc.text(`Date: ${date.toUTCString()}`);
    doc.text(` `);
    doc.text(` `);
    addTextToPDF(doc, body);

    if (values.attachments.length > 0) {
        doc.text(` `);
        doc.text(`Please see attached`);
    }
    for (let attachment of values.attachments) {
        doc.addPage().image(attachment, {
            fit: [250, 300],
            align: "center",
        });
    }
    doc.save();
    doc.end();
}

function addTextToPDF(pdfDoc: PDFKit.PDFDocument, body: string) {
    const lines = body.split("\n");
    let bold = false;
    let italic = false;

    lines.forEach((line) => {
        const formattedLine = line.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/__(.*?)__/g, "<i>$1</i>");
        const chunks = formattedLine.split(/(<[^>]*>)/);
        chunks.forEach((chunk, index) => {
            if (chunk.startsWith("<b>")) {
                bold = true;
                chunk = chunk.slice(3);
            } else if (chunk.startsWith("<i>")) {
                italic = true;
                chunk = chunk.slice(3);
            }

            if (chunk.endsWith("</b>")) {
                bold = false;
                chunk = chunk.slice(0, -4);
            } else if (chunk.endsWith("</i>")) {
                italic = false;
                chunk = chunk.slice(0, -4);
            }
            if (chunk.length === 0) {
                return;
            }

            if (bold) {
                pdfDoc.font(path.join(__dirname, "fonts/Roboto-Bold.ttf")).text(chunk, { continued: true });
            } else if (italic) {
                pdfDoc.font(path.join(__dirname, "fonts/Roboto-LightItalic.ttf")).text(chunk, { continued: true });
            } else {
                pdfDoc.font(path.join(__dirname, "fonts/Roboto-Light.ttf")).text(chunk, { continued: true });
            }
        });
        pdfDoc.text(" ");
    });
}

export function createIrReport(values: ir) {}
