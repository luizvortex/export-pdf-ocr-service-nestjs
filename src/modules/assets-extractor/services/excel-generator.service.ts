import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { Asset } from '../interfaces/asset.interface';

@Injectable()
export class ExcelGeneratorService {
  private readonly logger = new Logger(ExcelGeneratorService.name);

  async generate(assets: Asset[]): Promise<Buffer> {
    this.logger.log(`Gerando planilha Excel com ${assets.length} ativos`);

    // Criar dados para a planilha
    const worksheetData = [
      // Cabeçalho
      ['Código SAP', 'Nome', 'Tipo de Equipamento', 'Descrição'],
      // Dados
      ...assets.map(asset => [
        asset.codigoSAP,
        asset.nome,
        asset.tipoEquipamento,
        asset.descricao,
      ]),
    ];

    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Ajustar largura das colunas
    const columnWidths = [
      { wch: 15 }, // Código SAP
      { wch: 50 }, // Nome
      { wch: 25 }, // Tipo de Equipamento
      { wch: 60 }, // Descrição
    ];
    worksheet['!cols'] = columnWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ativos');

    // Gerar buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    this.logger.log('Planilha Excel gerada com sucesso');

    return excelBuffer;
  }
}