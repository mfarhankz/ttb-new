import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AREA_SEARCH_RECENT_QUERIES_KEY } from '@app/authenticated/farming/config/area-search-fields.config';
import { AreaSearchPayload } from '@app/core/interfaces/area-search-field.interface';
import { RecentAreaSearchQuery } from '@app/core/interfaces/area-search-query.interface';

const MAX_RECENT_QUERIES = 20;

@Injectable({ providedIn: 'root' })
export class RecentQueriesService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _queries = signal<RecentAreaSearchQuery[]>(this.readStorage());

  readonly queries = this._queries.asReadonly();

  addOrPromote(name: string, query: AreaSearchPayload, resultCount?: number): void {
    const now = Date.now();
    const existing = this._queries();
    const fingerprint = this.buildFingerprint(query);
    const withoutDuplicate = existing.filter((item) => this.buildFingerprint(item.query) !== fingerprint);

    const entry: RecentAreaSearchQuery = {
      id: crypto.randomUUID(),
      name: name || 'Recent Search',
      query,
      resultCount,
      createdAt: now,
      modifiedAt: now
    };

    const next = [entry, ...withoutDuplicate].slice(0, MAX_RECENT_QUERIES);
    this._queries.set(next);
    this.writeStorage(next);
  }

  remove(id: string): void {
    const next = this._queries().filter((item) => item.id !== id);
    this._queries.set(next);
    this.writeStorage(next);
  }

  updateResultCount(id: string, resultCount: number): void {
    const next = this._queries().map((item) =>
      item.id === id ? { ...item, resultCount, modifiedAt: Date.now() } : item
    );
    this._queries.set(next);
    this.writeStorage(next);
  }

  private readStorage(): RecentAreaSearchQuery[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [];
    }

    const raw = localStorage.getItem(AREA_SEARCH_RECENT_QUERIES_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as RecentAreaSearchQuery[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeStorage(queries: RecentAreaSearchQuery[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(AREA_SEARCH_RECENT_QUERIES_KEY, JSON.stringify(queries));
  }

  private buildFingerprint(query: AreaSearchPayload): string {
    return JSON.stringify(query);
  }
}
