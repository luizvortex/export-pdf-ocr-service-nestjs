import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { createWorker } from 'tesseract.js';
import { UsageMonitorService } from './usage-monitor.service';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(private readonly usageMonitor: UsageMonitorService) {
    this.logger.log('OCR Service inicializado (Tesseract.js - 100% local)');
  }

  async processImages(imageBuffers: Buffer[]): Promise<string> {
    this.logger.log(`Iniciando OCR em ${imageBuffers.length} imagem(ns)`);

    const pageCount = imageBuffers.length;

    if (!this.usageMonitor.canProcessPages(pageCount)) {
      const stats = this.usageMonitor.getUsageStats();
      this.logger.warn(
        `Limite interno de ${stats.limit} páginas/mês atingido. ` +
        `Processadas: ${stats.used} páginas em ${stats.month}.`
      );
    }

    try {
      const worker = await createWorker('por', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            this.logger.log(`OCR progresso: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const allText: string[] = [];

      for (let i = 0; i < imageBuffers.length; i++) {
        this.logger.log(`Processando página ${i + 1}/${imageBuffers.length}`);
        
        const { data } = await worker.recognize(imageBuffers[i]);
        
        if (data.text && data.text.trim().length > 0) {
          allText.push(data.text);
          this.logger.log(
            `Página ${i + 1}: ${data.text.length} caracteres extraídos ` +
            `(confiança: ${Math.round(data.confidence)}%)`
          );
        } else {
          this.logger.warn(`Página ${i + 1}: Nenhum texto extraído`);
        }
      }

      await worker.terminate();

      if (allText.length === 0) {
        throw new BadRequestException('Nenhum texto foi extraído do PDF');
      }

      const fullText = allText.join('\n\n--- PÁGINA ---\n\n');

      // Registrar páginas processadas
      this.usageMonitor.recordPages(pageCount);

      this.logger.log(
        `✅ OCR concluído: ${fullText.length} caracteres extraídos de ${pageCount} página(s)`
      );

      return fullText;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro no OCR: ${errorMessage}`);
      throw new BadRequestException(`Falha no OCR: ${errorMessage}`);
    }
  }
}