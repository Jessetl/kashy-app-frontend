import { apiClient } from '@/shared/infrastructure/api/api-client';
import type {
  FinancialRecordSummary,
  FinancialRecordType,
} from '../../domain/entities/financial-record-summary.entity';
import type {
  AppNotification,
  NotificationFilters,
  NotificationSearchInput,
  NotificationSearchResult,
  NotificationStatus,
} from '../../domain/entities/notification.entity';
import type { NotificationsPort } from '../../domain/ports/notifications.port';

const BASE = '/notifications';

interface FinancialRecordSummaryDto {
  id: string;
  title: string;
  type: string;
  amountLocal: number;
  amountUsd: number;
  date: string;
}

interface NotificationDto {
  id: string;
  type: string;
  scheduledAt: string;
  sentAt: string | null;
  status: string;
  isRead: boolean;
  financialRecord: FinancialRecordSummaryDto;
}

interface SearchResponseDto {
  data: NotificationDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UnreadCountDto {
  unreadCount: number;
}

interface MarkAllResponseDto {
  markedCount: number;
}

function parseFinancialRecord(
  dto: FinancialRecordSummaryDto,
): FinancialRecordSummary {
  return {
    id: dto.id,
    title: dto.title,
    type: (dto.type as FinancialRecordType) ?? 'EXPENSE',
    amountLocal: dto.amountLocal,
    amountUsd: dto.amountUsd,
    date: dto.date,
  };
}

function parseNotification(dto: NotificationDto): AppNotification {
  return {
    id: dto.id,
    type: dto.type,
    scheduledAt: dto.scheduledAt,
    sentAt: dto.sentAt,
    status: (dto.status as NotificationStatus) ?? 'PENDING',
    isRead: dto.isRead,
    financialRecord: parseFinancialRecord(dto.financialRecord),
  };
}

function buildSearchBody(input: NotificationSearchInput) {
  const body: Record<string, unknown> = {
    page: input.page,
    limit: input.limit,
  };
  const cleanFilters = stripUndefinedFilters(input.filters);
  if (Object.keys(cleanFilters).length > 0) {
    body.filters = cleanFilters;
  }
  return body;
}

function stripUndefinedFilters(
  filters: NotificationFilters | undefined,
): Partial<NotificationFilters> {
  if (!filters) return {};
  const out: Partial<NotificationFilters> = {};
  for (const key of Object.keys(filters) as (keyof NotificationFilters)[]) {
    const value = filters[key];
    if (value !== undefined) {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

export class NotificationsDatasource implements NotificationsPort {
  async search(input: NotificationSearchInput): Promise<NotificationSearchResult> {
    const response = await apiClient<SearchResponseDto>(`${BASE}/search`, {
      method: 'POST',
      body: buildSearchBody(input),
    });

    return {
      data: response.data.data.map(parseNotification),
      meta: response.data.meta,
    };
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiClient<UnreadCountDto>(`${BASE}/unread-count`);
    return response.data.unreadCount;
  }

  async markAsRead(id: string): Promise<AppNotification> {
    const response = await apiClient<NotificationDto>(
      `${BASE}/${id}/read`,
      { method: 'PATCH' },
    );
    return parseNotification(response.data);
  }

  async markAllAsRead(): Promise<number> {
    const response = await apiClient<MarkAllResponseDto>(`${BASE}/read-all`, {
      method: 'POST',
    });
    return response.data.markedCount;
  }

  async delete(id: string): Promise<void> {
    await apiClient(`${BASE}/${id}`, { method: 'DELETE' });
  }
}
