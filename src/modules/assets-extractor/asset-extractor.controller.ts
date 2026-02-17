import { 
  Controller, 
  Post, 
  Get,
  Param,
  UseInterceptors, 
  UploadedFile, 
  StreamableFile, 
  BadRequestException,
  Logger,
  Res 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { Multer } from 'multer';
import { PdfConverterService } from './services/pdf-converter.service';
import { PdfToImageService } from './services/pdf-to-image.service';
import { OcrService } from './services/ocr.service';
import { AssetParserService } from './services/asset-parser.service';
import { ExcelGeneratorService } from './services/excel-generator.service';
import { UsageMonitorService } from './services/usage-monitor.service';
import { FileStorageService } from './services/file-storage.service';
import { randomUUID } from 'crypto';

@Controller('asset-extractor')
export class AssetExtractorController {
  private readonly logger = new Logger(AssetExtractorController.name);

  constructor(
    private readonly pdfConverterService: PdfConverterService,
    private readonly pdfToImageService: PdfToImageService,
    private readonly ocrService: OcrService,
    private readonly assetParserService: AssetParserService,
    private readonly excelGeneratorService: ExcelGeneratorService,
    private readonly usageMonitor: UsageMonitorService,
    private readonly fileStorage: FileStorageService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      if (!file) {
        throw new BadRequestException('Arquivo não fornecido');
      }

      if (file.mimetype !== 'application/pdf') {
        throw new BadRequestException('Apenas arquivos PDF são aceitos');
      }

      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      this.logger.log(`📄 Arquivo recebido: ${file.originalname} (${fileSizeMB} MB)`);

      this.logger.log('🔄 Etapa 1/5: Preparando PDF...');
      const pdfBuffer = await this.pdfConverterService.convert(file);

      this.logger.log('🔄 Etapa 2/5: Convertendo PDF para imagens...');
      const imageBuffers = await this.pdfToImageService.convertPdfToImages(pdfBuffer);

      this.logger.log('🔄 Etapa 3/5: Executando OCR (Tesseract.js local)...');
      const ocrResult = await this.ocrService.processImages(imageBuffers);

      this.logger.log('🔄 Etapa 4/5: Parseando ativos...');
      const parsedAssets = await this.assetParserService.parse(ocrResult);
      
      if (parsedAssets.length === 0) {
        throw new BadRequestException('Nenhum ativo foi encontrado no PDF');
      }

      this.logger.log(`✅ ${parsedAssets.length} ativos encontrados`);

      this.logger.log('🔄 Etapa 5/5: Gerando Excel...');
      const excelBuffer = await this.excelGeneratorService.generate(parsedAssets);

      // Gerar ID único para o arquivo
      const fileId = randomUUID();
      await this.fileStorage.saveFile(fileId, excelBuffer, 'ativos_extraidos');

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(`✅ Processamento completo em ${totalTime}s`);

      return {
        success: true,
        message: 'PDF processado com sucesso',
        fileId: fileId,
        downloadUrl: `/asset-extractor/download/${fileId}`,
        assetsFound: parsedAssets.length,
        processingTime: `${totalTime}s`,
        expiresIn: '1 hora',
      };
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`❌ Erro após ${totalTime}s: ${errorMessage}`);
      throw new BadRequestException(`Erro ao processar o arquivo: ${errorMessage}`);
    }
  }

  @Get('download/:fileId')
  async downloadFile(
    @Param('fileId') fileId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    try {
      this.logger.log(`📥 Solicitação de download: ${fileId}`);

      const { buffer, fileName } = await this.fileStorage.getFile(fileId);

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length,
      });

      this.logger.log(`✅ Download iniciado: ${fileName} (${(buffer.length / 1024).toFixed(2)} KB)`);

      return new StreamableFile(buffer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new BadRequestException(`Erro ao baixar arquivo: ${errorMessage}`);
    }
  }

  @Get('usage')
  getUsageStats() {
    const stats = this.usageMonitor.getUsageStats();
    return {
      message: 'Estatísticas de uso mensal (controle interno)',
      month: stats.month,
      pagesProcessed: stats.used,
      note: 'Processamento 100% local e gratuito com Tesseract.js',
    };
  }

  @Get('test-ocr')
  async testOcr() {
    return { 
      message: 'Use POST /asset-extractor/upload com um arquivo PDF',
      status: 'Tesseract.js OCR local configurado (100% gratuito)',
      engine: 'Tesseract.js + PDF.js (Mozilla)',
    };
  }

  @Post('debug-ocr')
  @UseInterceptors(FileInterceptor('file'))
  async debugOcr(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    try {
      if (!file || file.mimetype !== 'application/pdf') {
        throw new BadRequestException('Envie um arquivo PDF');
      }

      this.logger.log('🔍 Modo DEBUG: Extraindo texto sem parsing...');

      const pdfBuffer = await this.pdfConverterService.convert(file);
      const imageBuffers = await this.pdfToImageService.convertPdfToImages(pdfBuffer);
      
      const firstPages = imageBuffers.slice(0, 3);
      const ocrResult = await this.ocrService.processImages(firstPages);

      return {
        message: 'Texto extraído das primeiras 3 páginas (DEBUG)',
        totalCharacters: ocrResult.length,
        text: ocrResult,
        firstLines: ocrResult.split('\n').slice(0, 50),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`❌ Erro no modo DEBUG: ${errorMessage}`);
      throw new BadRequestException(`Erro no modo DEBUG: ${errorMessage}`);
    }
  }
}