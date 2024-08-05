import fs from "fs";
import path from "path";
import PdfPrinter from "pdfmake";

const fonts = {
  Roboto: {
    normal: path.resolve("src", "constants", "fonts", "Roboto-Regular.ttf"),
    bold: path.resolve("src", "constants", "fonts", "Roboto-Medium.ttf"),
    italics: path.resolve("src", "constants", "fonts", "Roboto-Italic.ttf"),
    bolditalics: path.resolve("src", "constants", "fonts", "Roboto-MediumItalic.ttf"),
  },
};

const printer = new PdfPrinter(fonts);

export class PdfService {
  static generatePdfLocation(fileName = "output.pdf") {
    return path.resolve("pdf", fileName);
  }

  static generatePdf(docDefinition, fileName) {
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    pdfDoc.pipe(fs.createWriteStream(this.generatePdfLocation(fileName)));

    pdfDoc.end();
  }

  static async sendPdf(docDefinition, fileName, res) {
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    pdfDoc.pipe(res);

    pdfDoc.end();
  }
}
