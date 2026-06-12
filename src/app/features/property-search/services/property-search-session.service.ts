import { Injectable } from '@angular/core';
import {
  AddressSearchPayload,
  OwnerSearchPayload,
  ParcelSearchPayload,
  PropertySearchSession,
  PropertySearchTab
} from '@app/core/interfaces/property-search.interface';
import { PropertyRecordRaw } from '@app/core/interfaces/property-record.interface';

export interface CreatePropertySearchSessionInput {
  title: string;
  searchType: PropertySearchTab;
  rows: Record<string, unknown>[];
  rawRecords: PropertyRecordRaw[];
  lastPayload?: AddressSearchPayload | OwnerSearchPayload | ParcelSearchPayload;
}

@Injectable({ providedIn: 'root' })
export class PropertySearchSessionService {
  private readonly sessions = new Map<string, PropertySearchSession>();

  createSession(input: CreatePropertySearchSessionInput): string {
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, {
      sessionId,
      title: input.title,
      searchType: input.searchType,
      rows: input.rows,
      rawRecords: input.rawRecords,
      createdAt: Date.now(),
      lastPayload: input.lastPayload
    });

    return sessionId;
  }

  getSession(sessionId: string): PropertySearchSession | undefined {
    return this.sessions.get(sessionId);
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
