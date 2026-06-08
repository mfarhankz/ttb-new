import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { API_CONFIG } from '../config/api.config';
import { UNAUTHORIZED_MESSAGE } from '../constants/auth.constants';
import { ApiError } from '../interfaces/api.interface';
import { extractTtbErrorMessage } from '../utils/ttb-response.util';
import { SessionExpiredService } from './session-expired.service';
import { VerticalService } from './vertical.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly verticalService = inject(VerticalService);
  private readonly sessionExpiredService = inject(SessionExpiredService);

  private get baseUrl(): string {
    return this.verticalService.initialized()
      ? this.verticalService.apiBaseUrl()
      : API_CONFIG.baseUrl;
  }

  /**
   * Get default headers for API requests
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Generic GET request
   */
  get<T>(endpoint: string): Observable<T> {
    return this.http
      .get<T>(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders()
      })
      .pipe(
        tap((data) => this.inspectTtbResponseForAuth(data)),
        catchError(this.handleError)
      );
  }

  /**
   * GET as plain text then JSON.parse — for legacy pipeline endpoints that may not
   * return standard application/json (avoids HttpClient "200 OK" parse errors).
   */
  getParsedJson<T>(endpoint: string, options?: { treatEmptyAs?: T }): Observable<T> {
    return this.http
      .get(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders(),
        responseType: 'text'
      })
      .pipe(
        map((body) => this.parseJsonBody<T>(body, options?.treatEmptyAs)),
        tap((data) => this.inspectTtbResponseForAuth(data)),
        catchError(this.handleError)
      );
  }

  private parseJsonBody<T>(body: string, treatEmptyAs?: T): T {
    const trimmed = body.trim();

    if (!trimmed) {
      if (treatEmptyAs !== undefined) {
        return treatEmptyAs;
      }

      throw new Error('Empty response from server.');
    }

    if (trimmed.startsWith('<')) {
      throw new Error('Session may have expired. Please refresh or log in again.');
    }

    if (treatEmptyAs !== undefined && /^no records/i.test(trimmed)) {
      return treatEmptyAs;
    }

    try {
      const parsed = JSON.parse(trimmed) as T;

      if (treatEmptyAs !== undefined && this.isLegacyNoRecordsPayload(parsed)) {
        return treatEmptyAs;
      }

      return parsed;
    } catch {
      if (treatEmptyAs !== undefined) {
        return treatEmptyAs;
      }

      throw new Error('Invalid response from server.');
    }
  }

  private isLegacyNoRecordsPayload(value: unknown): boolean {
    if (value == null) {
      return true;
    }

    if (typeof value === 'string') {
      return /no records/i.test(value);
    }

    if (typeof value !== 'object') {
      return false;
    }

    const payload = value as Record<string, unknown>;
    const envelope =
      payload['response'] && typeof payload['response'] === 'object'
        ? (payload['response'] as Record<string, unknown>)
        : undefined;
    const body = envelope?.['status'] === 'OK' ? envelope : envelope ?? payload;
    const count = Number(body['count'] ?? 0);

    if (count > 0) {
      return false;
    }

    const data = body['data'];
    return (
      data == null ||
      (Array.isArray(data) && data.length === 0) ||
      (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0)
    );
  }

  /**
   * Generic POST request
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param params - Optional query parameters
   */
  /**
   * POST as plain text then JSON.parse — for legacy pipeline endpoints that may not
   * return standard application/json.
   */
  postParsedJson<T>(endpoint: string, body: unknown, options?: { treatEmptyAs?: T }): Observable<T> {
    return this.http
      .post(`${this.baseUrl}${endpoint}`, body, {
        headers: this.getHeaders(),
        responseType: 'text'
      })
      .pipe(
        map((response) => this.parseJsonBody<T>(response, options?.treatEmptyAs)),
        tap((data) => this.inspectTtbResponseForAuth(data)),
        catchError(this.handleError)
      );
  }

  post<T>(endpoint: string, body: unknown, params?: { [key: string]: string }): Observable<T> {
    // For JSON endpoints, ensure proper content type
    const headers = this.getHeaders();
    
    // Build URL with query parameters if provided
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) {
          queryParams.append(key, params[key]);
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return this.http
      .post<T>(url, body, {
        headers: headers
      })
      .pipe(
        tap((data) => this.inspectTtbResponseForAuth(data)),
        catchError(this.handleError)
      );
  }

  /**
   * Multipart form upload (Content-Type set automatically by the browser).
   */
  postFormData<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, formData).pipe(catchError(this.handleError));
  }

  /**
   * Generic PUT request
   */
  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http
      .put<T>(`${this.baseUrl}${endpoint}`, body, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<T>(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Handle HTTP errors and non-HTTP failures (e.g. JSON parse errors from getParsedJson).
   */
  private inspectTtbResponseForAuth(data: unknown): void {
    const message = extractTtbErrorMessage(data);
    if (message) {
      this.sessionExpiredService.handleUnauthorized(message);
    }
  }

  private handleError = (error: unknown): Observable<never> => {
    const { message: errorMessage, status, errors, url } = this.resolveErrorDetails(error);

    this.sessionExpiredService.handleUnauthorized(errorMessage, status, url);

    const apiError: ApiError = {
      message: errorMessage,
      status,
      errors
    };

    return throwError(() => apiError);
  };

  private resolveErrorDetails(error: unknown): {
    message: string;
    status?: number;
    errors?: Record<string, string[]>;
    url?: string;
  } {
    if (error instanceof HttpErrorResponse) {
      const message = this.resolveHttpErrorMessage(error);
      this.inspectTtbResponseForAuth(error.error);

      return {
        message,
        status: error.status,
        errors: error.error?.errors,
        url: error.url ?? undefined
      };
    }

    if (error instanceof Error) {
      return { message: error.message || 'An unknown error occurred.' };
    }

    if (typeof error === 'string') {
      return { message: error };
    }

    if (error && typeof error === 'object') {
      const apiError = error as ApiError;
      if (typeof apiError.message === 'string' && apiError.message) {
        return {
          message: apiError.message,
          status: apiError.status,
          errors: apiError.errors
        };
      }
    }

    return { message: 'An unknown error occurred.' };
  }

  private resolveHttpErrorMessage(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      return error.error.message || 'A network error occurred.';
    }

    if (error.error && typeof error.error === 'object' && 'message' in error.error) {
      const message = (error.error as { message?: string }).message;
      if (message) {
        return message;
      }
    }

    if (error.status === 0) {
      return 'Error occurred in contacting Server. Please try again later.';
    }

    if (error.status === 401) {
      return UNAUTHORIZED_MESSAGE;
    }

    if (error.status === 403) {
      return 'Access forbidden.';
    }

    if (error.status === 404) {
      return 'Resource not found.';
    }

    if (error.status === 500) {
      return 'Server error. Please try again later.';
    }

    if (error.status >= 200 && error.status < 300) {
      return typeof error.message === 'string' && error.message.includes('parsing')
        ? 'Received an invalid response from the server.'
        : 'Unexpected server response. Please try again.';
    }

    if (error.status) {
      const statusText = error.statusText || 'Request failed';
      return `Request failed (${error.status} ${statusText}).`;
    }

    return 'An unknown error occurred.';
  }
}

