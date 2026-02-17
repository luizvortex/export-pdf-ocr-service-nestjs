import { Injectable, Logger } from '@nestjs/common';

interface Asset {
  codigoSAP: string;
  nome: string;
  tipoEquipamento: string;
  descricao: string;
}

@Injectable()
export class AssetParserService {
  private readonly logger = new Logger(AssetParserService.name);

  async parse(ocrText: string): Promise<Asset[]> {
    this.logger.log('Iniciando parsing do texto OCR');

    const assets: Asset[] = [];
    const lines = ocrText.split('\n');

    // Regex para identificar linha de ativo
    // Aceita variações: "Nº ATIVO", "N° ATIVO", "No ATIVO", etc.
    const assetRegex = /N[ºo°]\s*ATIVO\s+(\d+)\s*-\s*(.+)/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Pular linhas vazias ou muito curtas
      if (!line || line.length < 10) continue;

      const match = line.match(assetRegex);

      if (match) {
        const codigoSAP = match[1].trim();
        const restoDaLinha = match[2].trim();

        try {
          const asset = this.parseAssetDetails(codigoSAP, restoDaLinha);
          assets.push(asset);

          this.logger.log(
            `Ativo encontrado: ${codigoSAP} - ${asset.tipoEquipamento}`
          );
        } catch (error) {
          this.logger.warn(
            `Erro ao parsear ativo ${codigoSAP}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }

    this.logger.log(`Total de ativos extraídos: ${assets.length}`);
    return assets;
  }

  private parseAssetDetails(codigoSAP: string, restoDaLinha: string): Asset {
    // Dividir por " - " para separar os campos
    const parts = restoDaLinha.split(/\s+-\s+/);

    // Primeira parte é sempre a descrição base do equipamento
    const descricaoBase = parts[0] || '';

    // Extrair informações estruturadas
    let marca = '';
    let modelo = '';
    let dimensao = '';
    let capacidade = '';
    let outrasInfos: string[] = [];

    // Processar cada parte
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      const partUpper = part.toUpperCase();

      if (partUpper.startsWith('MARCA ')) {
        marca = part.replace(/^MARCA\s+/i, '').trim();
      } else if (partUpper.startsWith('MODELO ')) {
        modelo = part.replace(/^MODELO\s+/i, '').trim();
      } else if (partUpper.startsWith('DIMENSÃO ') || partUpper.startsWith('DIMENSAO ')) {
        dimensao = part.replace(/^DIMENS[ÃA]O\s+/i, '').trim();
      } else if (partUpper.startsWith('CAPACIDADE ')) {
        capacidade = part.replace(/^CAPACIDADE\s+/i, '').trim();
      } else {
        // Outras informações não estruturadas
        outrasInfos.push(part);
      }
    }

    // Montar o campo "nome" (descrição base + marca + capacidade)
    const nomePartes = [descricaoBase];
    if (marca) nomePartes.push(marca);
    if (capacidade) nomePartes.push(capacidade);
    const nome = nomePartes.join(' ');

    // Extrair tipo de equipamento (primeira palavra da descrição)
    const tipoEquipamento = descricaoBase.split(/\s+/)[0] || 'EQUIPAMENTO';

    // Montar o campo "descricao" (modelo + dimensão + outras infos)
    const descricaoPartes: string[] = [];
    
    // Só adiciona "MODELO" se realmente existir modelo
    if (modelo) {
      descricaoPartes.push(`MODELO ${modelo}`);
    }
    
    // Só adiciona "DIMENSÃO" se realmente existir dimensão
    if (dimensao) {
      descricaoPartes.push(`DIMENSÃO ${dimensao}`);
    }
    
    // Adiciona outras informações
    if (outrasInfos.length > 0) {
      descricaoPartes.push(...outrasInfos);
    }
    
    // Junta tudo com " | " ou retorna "-" se vazio
    const descricao = descricaoPartes.length > 0 
      ? descricaoPartes.join(' | ') 
      : '-';

    return {
      codigoSAP,
      nome,
      tipoEquipamento,
      descricao,
    };
  }
}