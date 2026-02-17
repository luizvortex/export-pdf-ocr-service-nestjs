import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly storageDir = path.join(process.cwd(), 'temp', 'downloads');

  constructor() {
    this.ensureStorageDir();
  }

  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      this.logger.log(`Diretório de armazenamento: ${this.storageDir}`);
    } catch (error) {
      this.logger.error(`Erro ao criar diretório: ${error.message}`);
    }
  }

  async saveFile(fileId: string, buffer: Buffer, originalName: string): Promise<string> {
    const fileName = `${fileId}_${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}.xlsx`;
    const filePath = path.join(this.storageDir, fileName);

    await fs.writeFile(filePath, buffer);
    
    this.logger.log(`Arquivo salvo: ${fileName} (${(buffer.length / 1024).toFixed(2)} KB)`);
    
    // Agendar exclusão após 1 hora
    this.scheduleFileDeletion(filePath, 60 * 60 * 1000); // 1 hora
    
    return fileId;
  }

  async getFile(fileId: string): Promise<{ buffer: Buffer; fileName: string }> {
    const files = await fs.readdir(this.storageDir);
    const targetFile = files.find((file) => file.startsWith(fileId));

    if (!targetFile) {
      throw new NotFoundException(`Arquivo com ID ${fileId} não encontrado ou expirado`);
    }

    const filePath = path.join(this.storageDir, targetFile);
    const buffer = await fs.readFile(filePath);

    return {
      buffer,
      fileName: targetFile.replace(`${fileId}_`, ''),
    };
  }

  async deleteFile(fileId: string): Promise<void> {
    const files = await fs.readdir(this.storageDir);
    const targetFile = files.find((file) => file.startsWith(fileId));

    if (targetFile) {
      const filePath = path.join(this.storageDir, targetFile);
      await fs.unlink(filePath);
      this.logger.log(`Arquivo deletado: ${targetFile}`);
    }
  }

  private scheduleFileDeletion(filePath: string, delayMs: number): void {
    setTimeout(async () => {
      try {
        await fs.unlink(filePath);
        this.logger.log(`Arquivo temporário removido: ${path.basename(filePath)}`);
      } catch (error) {
        this.logger.warn(`Erro ao remover arquivo temporário: ${error.message}`);
      }
    }, delayMs);
  }

  async cleanupOldFiles(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = await fs.readdir(this.storageDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.storageDir, file);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAgeMs) {
          await fs.unlink(filePath);
          this.logger.log(`Arquivo antigo removido: ${file}`);
        }
      }
    } catch (error) {
      this.logger.error(`Erro ao limpar arquivos antigos: ${error.message}`);
    }
  }
}