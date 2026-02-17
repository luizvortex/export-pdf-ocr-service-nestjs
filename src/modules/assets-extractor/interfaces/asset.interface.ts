export interface Asset {
  codigoSAP: string;
  nome: string;
  tipoEquipamento: string;
  descricao: string;
  marca?: string;
  modelo?: string;
  capacidade?: string;
  dimensao?: string;
  outrasInfos?: string;
}