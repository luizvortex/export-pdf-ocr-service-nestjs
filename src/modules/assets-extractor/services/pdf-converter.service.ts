import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PdfConverterService {
  private readonly logger = new Logger(PdfConverterService.name);

  async convert(file: Express.Multer.File): Promise<Buffer> {
    this.logger.log('Preparando PDF para processamento');
    
    // Apenas retorna o buffer do PDF
    return file.buffer;
  }

  async cleanupImages(imagePaths: string[]): Promise<void> {
    this.logger.log('Cleanup não necessário (processamento em memória)');
  }
}