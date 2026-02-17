import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { AssetExtractorController } from './asset-extractor.controller';
import { PdfConverterService } from './services/pdf-converter.service';
import { PdfToImageService } from './services/pdf-to-image.service';
import { OcrService } from './services/ocr.service';
import { AssetParserService } from './services/asset-parser.service';
import { ExcelGeneratorService } from './services/excel-generator.service';
import { UsageMonitorService } from './services/usage-monitor.service';
import { FileStorageService } from './services/file-storage.service';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Apenas arquivos PDF são permitidos'), false);
        }
      },
    }),
  ],
  controllers: [AssetExtractorController],
  providers: [
    PdfConverterService,
    PdfToImageService,
    OcrService,
    AssetParserService,
    ExcelGeneratorService,
    UsageMonitorService,
    FileStorageService,
  ],
})
export class AssetExtractorModule {}