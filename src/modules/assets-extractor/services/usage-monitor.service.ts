import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface UsageData {
  month: string;
  pagesProcessed: number;
  lastUpdate: string;
}

@Injectable()
export class UsageMonitorService {
  private readonly logger = new Logger(UsageMonitorService.name);
  private readonly usageFilePath = join(process.cwd(), 'usage-data.json');
  private readonly MAX_FREE_PAGES = 1000;

  /**
   * Verifica se ainda há páginas disponíveis no mês
   */
  canProcessPages(pageCount: number): boolean {
    const usage = this.getUsage();
    const currentMonth = this.getCurrentMonth();

    // Se mudou o mês, reseta o contador
    if (usage.month !== currentMonth) {
      this.logger.log(`Novo mês detectado (${currentMonth}). Resetando contador.`);
      this.resetUsage();
      return true;
    }

    const remainingPages = this.MAX_FREE_PAGES - usage.pagesProcessed;

    if (remainingPages <= 0) {
      this.logger.warn('Limite mensal de páginas gratuitas atingido!');
      return false;
    }

    if (usage.pagesProcessed + pageCount > this.MAX_FREE_PAGES) {
      this.logger.warn(
        `Processamento bloqueado: ${pageCount} páginas solicitadas, mas apenas ${remainingPages} disponíveis.`,
      );
      return false;
    }

    return true;
  }

  /**
   * Registra páginas processadas
   */
  recordPages(pageCount: number): void {
    const usage = this.getUsage();
    const currentMonth = this.getCurrentMonth();

    // Se mudou o mês, reseta antes de registrar
    if (usage.month !== currentMonth) {
      this.resetUsage();
    }

    const updatedUsage: UsageData = {
      month: currentMonth,
      pagesProcessed: usage.pagesProcessed + pageCount,
      lastUpdate: new Date().toISOString(),
    };

    this.saveUsage(updatedUsage);

    this.logger.log(
      `Páginas registradas: ${pageCount} | Total no mês: ${updatedUsage.pagesProcessed}/${this.MAX_FREE_PAGES}`,
    );

    const remaining = this.MAX_FREE_PAGES - updatedUsage.pagesProcessed;
    if (remaining <= 100) {
      this.logger.warn(`Atenção: Apenas ${remaining} páginas restantes no limite gratuito!`);
    }
  }

  /**
   * Retorna o uso atual
   */
  getUsageStats(): { month: string; used: number; remaining: number; limit: number } {
    const usage = this.getUsage();
    const currentMonth = this.getCurrentMonth();

    // Se mudou o mês, retorna zerado
    if (usage.month !== currentMonth) {
      return {
        month: currentMonth,
        used: 0,
        remaining: this.MAX_FREE_PAGES,
        limit: this.MAX_FREE_PAGES,
      };
    }

    return {
      month: usage.month,
      used: usage.pagesProcessed,
      remaining: this.MAX_FREE_PAGES - usage.pagesProcessed,
      limit: this.MAX_FREE_PAGES,
    };
  }

  /**
   * Obtém uso atual do arquivo
   */
  private getUsage(): UsageData {
    if (!existsSync(this.usageFilePath)) {
      return this.createInitialUsage();
    }

    try {
      const data = readFileSync(this.usageFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.error(`Erro ao ler arquivo de uso: ${error.message}`);
      return this.createInitialUsage();
    }
  }

  /**
   * Salva uso no arquivo
   */
  private saveUsage(usage: UsageData): void {
    try {
      writeFileSync(this.usageFilePath, JSON.stringify(usage, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error(`Erro ao salvar arquivo de uso: ${error.message}`);
    }
  }

  /**
   * Cria registro inicial
   */
  private createInitialUsage(): UsageData {
    const usage: UsageData = {
      month: this.getCurrentMonth(),
      pagesProcessed: 0,
      lastUpdate: new Date().toISOString(),
    };
    this.saveUsage(usage);
    return usage;
  }

  /**
   * Reseta o contador (usado quando muda o mês)
   */
  private resetUsage(): void {
    const usage: UsageData = {
      month: this.getCurrentMonth(),
      pagesProcessed: 0,
      lastUpdate: new Date().toISOString(),
    };
    this.saveUsage(usage);
    this.logger.log('Contador de uso resetado para o novo mês');
  }

  /**
   * Retorna mês atual no formato "YYYY-MM"
   */
  private getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}