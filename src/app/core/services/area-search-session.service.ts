import { Injectable } from '@angular/core';
import { AreaSearchPayload } from '../interfaces/area-search-field.interface';
import { GlobalSearchCountData, GlobalSearchPagingInfo } from '../interfaces/global-search-response.interface';
import { PropertyRecordRaw } from '../interfaces/property-record.interface';
import { AreaSearchCriteriaChip } from '../utils/area-search-criteria.util';

export interface AreaSearchSession {
  sessionId: string;
  title: string;
  criteria: AreaSearchPayload;
  criteriaChips?: AreaSearchCriteriaChip[];
  rows: Record<string, unknown>[];
  rawRecords: PropertyRecordRaw[];
  countResult?: GlobalSearchCountData;
  pagingInfo?: GlobalSearchPagingInfo;
  queryId?: string | number;
  createdAt: number;
}

export interface CreateAreaSearchSessionInput {
  title: string;
  criteria: AreaSearchPayload;
  criteriaChips?: AreaSearchCriteriaChip[];
  rows: Record<string, unknown>[];
  rawRecords: PropertyRecordRaw[];
  countResult?: GlobalSearchCountData;
  pagingInfo?: GlobalSearchPagingInfo;
  queryId?: string | number;
}

@Injectable({ providedIn: 'root' })
export class AreaSearchSessionService {
  private readonly sessions = new Map<string, AreaSearchSession>();

  createSession(input: CreateAreaSearchSessionInput): string {
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, {
      sessionId,
      title: input.title,
      criteria: input.criteria,
      criteriaChips: input.criteriaChips,
      rows: input.rows,
      rawRecords: input.rawRecords,
      countResult: input.countResult,
      pagingInfo: input.pagingInfo,
      queryId: input.queryId,
      createdAt: Date.now()
    });

    return sessionId;
  }

  getSession(sessionId: string): AreaSearchSession | undefined {
    return this.sessions.get(sessionId);
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  updateSession(
    sessionId: string,
    patch: Partial<Pick<AreaSearchSession, 'rows' | 'rawRecords' | 'pagingInfo' | 'criteria' | 'criteriaChips'>>
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    this.sessions.set(sessionId, {
      ...session,
      ...patch
    });
  }
}
