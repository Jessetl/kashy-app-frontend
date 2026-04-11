import { apiClient } from '@/shared/infrastructure/api/api-client';
import type {
  CreateDebtInput,
  Debt,
  DebtFilters,
  UpdateDebtInput,
} from '../../domain/entities/debt.entity';
import type { DebtPort } from '../../domain/ports/debt.port';

function buildQueryString(filters?: DebtFilters): string {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (filters.priority) {
    params.set('priority', filters.priority);
  }
  if (filters.isCollection !== undefined) {
    params.set('is_collection', String(filters.isCollection));
  }
  if (filters.isPaid !== undefined) {
    params.set('is_paid', String(filters.isPaid));
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export class DebtDatasource implements DebtPort {
  async createDebt(input: CreateDebtInput): Promise<Debt> {
    const response = await apiClient<Debt>('/debts', {
      method: 'POST',
      body: {
        title: input.title,
        description: input.description,
        amountUsd: input.amountUsd,
        priority: input.priority,
        interestRatePct: input.interestRatePct ?? 0,
        dueDate: input.dueDate,
        isCollection: input.isCollection,
      },
    });
    return response.data;
  }

  async getDebts(filters?: DebtFilters): Promise<Debt[]> {
    const qs = buildQueryString(filters);
    const response = await apiClient<Debt[]>(`/debts${qs}`);
    return response.data;
  }

  async getDebtById(id: string): Promise<Debt> {
    const response = await apiClient<Debt>(`/debts/${id}`);
    return response.data;
  }

  async updateDebt(id: string, data: UpdateDebtInput): Promise<Debt> {
    const response = await apiClient<Debt>(`/debts/${id}`, {
      method: 'PUT',
      body: data,
    });
    return response.data;
  }

  async deleteDebt(id: string): Promise<void> {
    await apiClient(`/debts/${id}`, { method: 'DELETE' });
  }

  async markAsPaid(id: string): Promise<Debt> {
    const response = await apiClient<Debt>(`/debts/${id}/pay`, {
      method: 'PUT',
    });
    return response.data;
  }
}
