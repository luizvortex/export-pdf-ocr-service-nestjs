# 🤖 Extrator de Ativos PDF → Excel

> **Transforme PDFs de inventário em planilhas Excel automaticamente usando OCR local 100% gratuito**

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tesseract.js](https://img.shields.io/badge/Tesseract.js-OCR-success)](https://tesseract.projectnaptha.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 O que este projeto faz?

Sabe aqueles **PDFs gigantes de inventário** que você recebe do setor de manutenção? Com centenas de ativos listados assim:

```
Nº ATIVO 1000XXXX - BOMBA CENTRÍFUGA - MARCA SULZER - MODELO ZHD V252 - CAPACIDADE 1.150 RPM
Nº ATIVO 1000XXXX - MOTOR TRIFÁSICO - MARCA WEG - MODELO W22 - POTÊNCIA 150CV
```

Este projeto **lê o PDF automaticamente** usando OCR e transforma em uma planilha Excel organizada:

| Código SAP | Nome | Tipo de Equipamento | Descrição |
|------------|------|---------------------|-----------|
| 1000XXXX | BOMBA CENTRÍFUGA SULZER 1.150 RPM | BOMBA | MODELO ZHD V252 |
| 1000XXXX | MOTOR TRIFÁSICO WEG 150CV | MOTOR | MODELO W22 \| POTÊNCIA 150CV |

**Sem custos com APIs externas.** Tudo roda localmente no seu servidor! 🚀

---

## ✨ Por que usar?

### ✅ **100% Gratuito e Local**
- Nenhuma API paga (Google Cloud Vision, AWS Textract, etc.)
- Sem envio de dados para servidores externos
- Processamento totalmente offline
- Ideal para dados sensíveis/confidenciais

### ⚡ **Rápido e Eficiente**
- Processa PDFs de até 100MB
- OCR em português otimizado
- Conversão PDF → Imagem → Texto → Excel automatizada
- Timeout de 5 minutos para documentos grandes

### 🎯 **Feito para Inventários Industriais**
- Reconhece padrões de ativos (Nº ATIVO, código SAP, etc.)
- Extrai automaticamente: marca, modelo, capacidade, dimensão
- Organiza dados em campos estruturados
- Exporta Excel pronto para uso

### 🛡️ **Seguro e Privado**
- Arquivos processados localmente
- Downloads temporários (expiram em 1 hora)
- Limpeza automática de arquivos antigos
- Sem rastreamento ou logs externos

---

## 🚀 Como Usar

### 1️⃣ Acesse a API
```
http://localhost:3000
```

### 2️⃣ Envie seu PDF
**Via cURL:**
```bash
curl -X POST http://localhost:3000/asset-extractor/upload \
  -F "file=@inventario.pdf"
```

**Via Postman/Insomnia:**
- Método: `POST`
- URL: `http://localhost:3000/asset-extractor/upload`
- Body: `form-data`
- Key: `file` (tipo: File)
- Value: Selecione seu PDF

### 3️⃣ Baixe o Excel
A resposta retorna um link de download:

```json
{
  "success": true,
  "message": "PDF processado com sucesso",
  "fileId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "downloadUrl": "/asset-extractor/download/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "assetsFound": 150,
  "processingTime": "45.23s",
  "expiresIn": "1 hora"
}
```

Acesse o link:
```
http://localhost:3000/asset-extractor/download/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

✅ **Pronto!** Seu Excel está pronto para uso.

---

## 🛠️ Instalação (Para Desenvolvedores)

### Pré-requisitos
- **Node.js** 18+ ([baixar aqui](https://nodejs.org/))
- **npm** ou **yarn**

### Passo 1: Clone o Repositório
```bash
git clone https://github.com/seu-usuario/asset-extractor.git
cd asset-extractor
```

### Passo 2: Instale as Dependências
```bash
npm install
```

**Principais bibliotecas instaladas:**
- `@nestjs/core` - Framework backend moderno
- `tesseract.js` - OCR 100% JavaScript (gratuito)
- `pdfjs-dist` - Parser de PDF da Mozilla
- `canvas` - Renderização de imagens
- `xlsx` - Gerador de planilhas Excel

### Passo 3: Execute o Servidor
```bash
npm run start:dev
```

**Servidor rodando em:**
```
http://localhost:3000
```

---

## 📋 Endpoints Disponíveis

### `POST /asset-extractor/upload`
**Envia PDF para processamento**

**Entrada:**
- `file` (multipart/form-data) - Arquivo PDF (max 100MB)

**Saída:**
```json
{
  "success": true,
  "fileId": "uuid",
  "downloadUrl": "/asset-extractor/download/uuid",
  "assetsFound": 150,
  "processingTime": "45.23s"
}
```

---

### `GET /asset-extractor/download/:fileId`
**Baixa o Excel gerado**

**Entrada:**
- `fileId` (path param) - ID retornado no upload

**Saída:**
- Arquivo Excel (.xlsx) pronto para download

---

### `GET /asset-extractor/usage`
**Verifica uso mensal (controle interno)**

**Saída:**
```json
{
  "month": "2026-02",
  "pagesProcessed": 245,
  "note": "Processamento 100% local e gratuito com Tesseract.js"
}
```

---

### `POST /asset-extractor/debug-ocr`
**Modo debug: extrai texto bruto sem parsing**

Útil para testar se o OCR está funcionando corretamente.

---

## 🏗️ Como Funciona (Arquitetura)

```mermaid
graph LR
    A[PDF Upload] --> B[PDF → Imagens]
    B --> C[OCR Tesseract.js]
    C --> D[Parser Inteligente]
    D --> E[Gerador Excel]
    E --> F[Download]
    
    style A fill:#e1f5ff
    style C fill:#fff3cd
    style E fill:#d4edda
```

### Fluxo de Processamento

1. **📄 Upload do PDF**
   - Valida formato (apenas PDF)
   - Limita tamanho (max 100MB)

2. **🖼️ Conversão PDF → Imagens**
   - Usa `pdfjs-dist` (biblioteca da Mozilla)
   - Converte cada página em PNG de alta resolução
   - Scale 2.5x para melhor qualidade OCR

3. **👁️ OCR (Reconhecimento Ótico de Caracteres)**
   - Usa `tesseract.js` treinado em português
   - Processa imagem por imagem
   - Extrai todo o texto com confiança média de 85%+

4. **🧠 Parser Inteligente**
   - Identifica padrões: `Nº ATIVO 12345 - DESCRIÇÃO`
   - Extrai automaticamente:
     - Código SAP
     - Nome do equipamento
     - Marca, modelo, capacidade, dimensão
   - Organiza em campos estruturados

5. **📊 Geração do Excel**
   - Cria planilha com 4 colunas
   - Ajusta largura das colunas automaticamente
   - Salva temporariamente (1 hora)

6. **⬇️ Download**
   - Gera link único
   - Arquivo expira após 1 hora
   - Limpeza automática de arquivos antigos

---

## 🎨 Exemplo de Resultado

### Entrada (PDF):
```
Nº ATIVO 1000XXXX - BOMBA CENTRÍFUGA - MARCA SULZER - MODELO ZHD V252 - DIMENSÃO 4X6 - CAPACIDADE 1.150 RPM
Nº ATIVO 1000XXXX - MOTOR TRIFÁSICO - MARCA WEG - MODELO W22 - POTÊNCIA 150CV - ROTAÇÃO 1.780 RPM
Nº ATIVO 1000XXXX - COMPRESSOR PARAFUSO - MARCA ATLAS COPCO - MODELO GA75 - CAPACIDADE 13.5 m³/min
```

### Saída (Excel):

| Código SAP | Nome | Tipo | Descrição |
|------------|------|------|-----------|
| 1000XXXX | BOMBA CENTRÍFUGA SULZER 1.150 RPM | BOMBA | MODELO ZHD V252 \| DIMENSÃO 4X6 |
| 1000XXXX | MOTOR TRIFÁSICO WEG 150CV | MOTOR | MODELO W22 \| POTÊNCIA 150CV \| ROTAÇÃO 1.780 RPM |
| 1000XXXX | COMPRESSOR PARAFUSO ATLAS COPCO 13.5 m³/min | COMPRESSOR | MODELO GA75 |

---

## ⚙️ Configurações Avançadas

### Ajustar Qualidade do OCR
Edite `pdf-to-image.service.ts`:

```typescript
private readonly DEFAULT_SCALE = 2.5; // Aumentar para mais qualidade (mais lento)
```

**Valores recomendados:**
- `1.5` - Rápido, qualidade média (PDFs com texto grande)
- `2.5` - Balanceado (recomendado)
- `3.5` - Alta qualidade (PDFs com texto pequeno)

### Ajustar Timeout
Edite `main.ts`:

```typescript
server.setTimeout(300000); // 5 minutos (em milissegundos)
```

### Ajustar Limite de Arquivo
Edite `asset-extractor.module.ts`:

```typescript
fileSize: 100 * 1024 * 1024, // 100MB (em bytes)
```

### Limitar Uso Mensal
Edite `usage-monitor.service.ts`:

```typescript
private readonly MAX_FREE_PAGES = 1000; // Páginas/mês
```

---

## 🐛 Troubleshooting

### ❌ "Nenhum ativo foi encontrado no PDF"

**Causa:** OCR não conseguiu identificar o padrão de ativos.

**Solução:**
1. Use o endpoint `/debug-ocr` para ver o texto extraído
2. Verifique se o formato é: `Nº ATIVO 12345 - DESCRIÇÃO`
3. Ajuste o regex no `asset-parser.service.ts`

---

### ❌ "Timeout ao processar PDF"

**Causa:** Arquivo muito grande ou muitas páginas.

**Solução:**
1. Divida o PDF em partes menores
2. Aumente o timeout no `main.ts`
3. Reduza o `scale` no `pdf-to-image.service.ts`

---

### ❌ "Arquivo não encontrado ou expirado"

**Causa:** Download expirou (1 hora).

**Solução:**
1. Faça o upload novamente
2. Baixe imediatamente após processar
3. Ajuste tempo de expiração no `file-storage.service.ts`

---

## 📊 Limitações Conhecidas

| Limitação | Descrição | Workaround |
|-----------|-----------|------------|
| **Tamanho do arquivo** | Max 100MB por PDF | Divida em múltiplos PDFs |
| **Qualidade do OCR** | ~85-95% de precisão | Use PDFs com texto nítido |
| **Timeout** | 5 minutos de processamento | Configure servidor para maior timeout |
| **Formatos de ativo** | Reconhece apenas padrão "Nº ATIVO" | Customize regex no parser |

---

## 🤝 Como Contribuir

Adoramos contribuições! Aqui está como você pode ajudar:

### 1. Reporte Bugs
Abra uma **Issue** descrevendo:
- O que aconteceu
- O que você esperava
- Como reproduzir

### 2. Sugira Melhorias
- Novos formatos de ativos suportados
- Otimizações de performance
- Novos recursos (ex: exportar JSON, CSV)

### 3. Envie Pull Requests
1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

## 📜 Licença

Este projeto é open source sob a licença **MIT**.

**Você pode:**
- ✅ Usar comercialmente
- ✅ Modificar o código
- ✅ Distribuir
- ✅ Uso privado

**Você deve:**
- 📋 Incluir a licença e copyright

---

## 🙏 Agradecimentos

Este projeto é possível graças a:

- **[Tesseract.js](https://tesseract.projectnaptha.com/)** - OCR gratuito e open source
- **[PDF.js](https://mozilla.github.io/pdf.js/)** - Parser de PDF da Mozilla
- **[NestJS](https://nestjs.com/)** - Framework backend moderno
- **[SheetJS](https://sheetjs.com/)** - Gerador de Excel

---

## 📧 Contato

**Desenvolvido por:** Luiz Felipe Morisco  
**E-mail:** luizfelipemorisco@gmail.com  
**GitHub:** [@luizmorisco](https://github.com/luizmorisco)

---

**Versão:** 1.0.0 
**Última Atualização:** Fevereiro de 2026
