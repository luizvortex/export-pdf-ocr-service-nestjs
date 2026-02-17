import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: 'API de Extração de Ativos está rodando',
      version: '1.0.1',
      endpoints: {
        upload: 'POST /asset-extractor/upload',
        usage: 'GET /asset-extractor/usage',
        test: 'GET /asset-extractor/test-ocr',
      },
      documentation: 'Envie um PDF via POST /asset-extractor/upload com campo "file"',
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}