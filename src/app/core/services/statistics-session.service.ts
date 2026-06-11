import { Injectable } from '@angular/core';
import { MapDrawnGeometry } from './ol-map.service';
import { TractRecord, TractStatsFormData, TractStatsInfo } from '../interfaces/statistics.interface';

export interface StatisticsSession {
  sessionId: string;
  title: string;
  payload: TractStatsFormData;
  info: TractStatsInfo;
  rows: TractRecord[];
  geometry?: MapDrawnGeometry;
  returnUrl?: string;
}

export interface CreateStatisticsSessionInput {
  title?: string;
  payload: TractStatsFormData;
  info: TractStatsInfo;
  rows: TractRecord[];
  geometry?: MapDrawnGeometry;
  returnUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class StatisticsSessionService {
  private readonly sessions = new Map<string, StatisticsSession>();

  createSession(input: CreateStatisticsSessionInput): string {
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, {
      sessionId,
      title: input.title ?? 'Statistics Results',
      payload: input.payload,
      info: input.info,
      rows: input.rows,
      geometry: input.geometry,
      returnUrl: input.returnUrl
    });

    return sessionId;
  }

  getSession(sessionId: string): StatisticsSession | undefined {
    return this.sessions.get(sessionId);
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  updateSession(sessionId: string, updates: Partial<Pick<StatisticsSession, 'rows'>>): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    this.sessions.set(sessionId, { ...session, ...updates });
  }
}
