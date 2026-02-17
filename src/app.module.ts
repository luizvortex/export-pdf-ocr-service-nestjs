import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AssetExtractorModule } from './modules/assets-extractor/asset-extractor.module';

@Module({
  imports: [
    AssetExtractorModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}