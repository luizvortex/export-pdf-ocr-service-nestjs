import { Injectable, Logger } from '@nestjs/common';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { createCanvas } from 'canvas';

@Injectable()
export class PdfToImageService {
  private readonly logger = new Logger(PdfToImageService.name);
  
  // Configurações centralizadas
  private readonly DEFAULT_SCALE = 2.5; // Balance entre qualidade e performance
  private readonly IMAGE_FORMAT = 'image/png'; // PNG para melhor qualidade OCR
  
  /**
   * Converte todas as páginas de um PDF em buffers de imagens PNG
   * @param pdfBuffer - Buffer do arquivo PDF
   * @param scale - Fator de escala (opcional, default: 2.5)
   * @returns Array de buffers de imagens PNG
   */
  async convertPdfToImages(
    pdfBuffer: Buffer, 
    scale: number = this.DEFAULT_SCALE
  ): Promise<Buffer[]> {
    this.logger.log('Iniciando conversão de PDF para imagens');

    try {
      // Carregar PDF usando pdf.js
      const pdf = await this.loadPdf(pdfBuffer);
      const numPages = pdf.numPages;

      this.logger.log(`PDF carregado: ${numPages} página(s) | Scale: ${scale}x`);

      const imageBuffers: Buffer[] = [];

      // Processar cada página sequencialmente
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const imageBuffer = await this.convertPageToImage(pdf, pageNum, scale);
        imageBuffers.push(imageBuffer);
      }

      this.logger.log(`✅ ${imageBuffers.length} páginas convertidas com sucesso`);
      return imageBuffers;
    } catch (error) {
      this.logger.error(`❌ Erro ao converter PDF: ${error.message}`);
      throw new Error(`Falha na conversão do PDF: ${error.message}`);
    }
  }

  /**
   * Carrega o documento PDF
   */
  private async loadPdf(pdfBuffer: Buffer): Promise<any> {
    const uint8Array = new Uint8Array(pdfBuffer);
    
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useSystemFonts: true, // Usar fontes do sistema quando possível
    });

    return await loadingTask.promise;
  }

  /**
   * Converte uma única página do PDF em imagem PNG
   */
  private async convertPageToImage(
    pdf: any, 
    pageNum: number, 
    scale: number
  ): Promise<Buffer> {
    this.logger.log(`🔄 Processando página ${pageNum}/${pdf.numPages}`);

    // Obter página específica
    const page = await pdf.getPage(pageNum);
    
    // Calcular viewport com escala
    const viewport = page.getViewport({ scale });

    // Criar canvas para renderizar
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    // Renderizar página no canvas
    const renderContext = {
      canvasContext: context as any,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    // Converter canvas para buffer PNG
    const imageBuffer = canvas.toBuffer(this.IMAGE_FORMAT);

    const sizeKB = (imageBuffer.length / 1024).toFixed(2);
    const dimensions = `${viewport.width}x${viewport.height}`;
    
    this.logger.log(
      `✅ Página ${pageNum} convertida: ${sizeKB} KB | ${dimensions}px`
    );

    return imageBuffer;
  }

  /**
   * Converte apenas um intervalo de páginas (útil para debug)
   * @param pdfBuffer - Buffer do arquivo PDF
   * @param startPage - Página inicial (1-indexed)
   * @param endPage - Página final (inclusive)
   * @param scale - Fator de escala (opcional)
   */
  async convertPageRange(
    pdfBuffer: Buffer,
    startPage: number,
    endPage: number,
    scale: number = this.DEFAULT_SCALE
  ): Promise<Buffer[]> {
    this.logger.log(`Convertendo páginas ${startPage}-${endPage}`);

    const pdf = await this.loadPdf(pdfBuffer);
    const numPages = pdf.numPages;

    // Validar intervalo
    if (startPage < 1 || endPage > numPages || startPage > endPage) {
      throw new Error(
        `Intervalo inválido: ${startPage}-${endPage} (total: ${numPages} páginas)`
      );
    }

    const imageBuffers: Buffer[] = [];

    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const imageBuffer = await this.convertPageToImage(pdf, pageNum, scale);
      imageBuffers.push(imageBuffer);
    }

    return imageBuffers;
  }

  /**
   * Obtém informações do PDF sem converter
   */
  async getPdfInfo(pdfBuffer: Buffer): Promise<{
    numPages: number;
    estimatedSizeMB: number;
  }> {
    const pdf = await this.loadPdf(pdfBuffer);
    
    return {
      numPages: pdf.numPages,
      estimatedSizeMB: parseFloat((pdfBuffer.length / 1024 / 1024).toFixed(2)),
    };
  }
}




// import { Injectable, Logger } from '@nestjs/common';
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
// import { createCanvas } from 'canvas';

// @Injectable()
// export class PdfToImageService {
//   private readonly logger = new Logger(PdfToImageService.name);

//   async convertPdfToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
//     this.logger.log('Iniciando conversão de PDF para imagens');

//     try {
//       const uint8Array = new Uint8Array(pdfBuffer);
//       const loadingTask = pdfjsLib.getDocument({
//         data: uint8Array,
//         useSystemFonts: true,
//       });

//       const pdf = await loadingTask.promise;
//       const numPages = pdf.numPages;

//       this.logger.log(`PDF possui ${numPages} página(s)`);

//       const imageBuffers: Buffer[] = [];

//       for (let pageNum = 1; pageNum <= numPages; pageNum++) {
//         this.logger.log(`Processando página ${pageNum}/${numPages}`);

//         const page = await pdf.getPage(pageNum);
//         const viewport = page.getViewport({ scale: 3.0 });

//         const canvas = createCanvas(viewport.width, viewport.height);
//         const context = canvas.getContext('2d');

//         const renderContext = {
//           canvasContext: context as any,
//           viewport: viewport,
//         };

//         await page.render(renderContext).promise;

//         // Converter canvas para buffer PNG
//         const imageBuffer = canvas.toBuffer('image/png');
//         imageBuffers.push(imageBuffer);

//         this.logger.log(`Página ${pageNum} convertida (${(imageBuffer.length / 1024).toFixed(2)} KB)`);
//       }

//       this.logger.log(`${imageBuffers.length} páginas convertidas com sucesso`);
//       return imageBuffers;
//     } catch (error) {
//       this.logger.error(`Erro ao converter PDF: ${error.message}`);
//       throw new Error(`Falha na conversão do PDF: ${error.message}`);
//     }
//   }
// }