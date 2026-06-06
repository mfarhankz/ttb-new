import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VERTICAL_CONFIG } from '../config/vertical.config';
import { getVerticalColorPreset } from '../config/vertical-theme.presets';
import { tokensToCssVars } from '../config/theme.config';
import {
  AgencyApiOffice,
  AgencyConfig,
  CompanyInfo,
  TtbApiResponse,
  VerticalContentData,
  VerticalMetaData
} from '../interfaces/vertical.interface';
import { ThemeService } from './theme.service';

@Injectable({ providedIn: 'root' })
export class VerticalService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly themeService = inject(ThemeService);

  private readonly _meta = signal<VerticalMetaData | null>(null);
  private readonly _content = signal<VerticalContentData | null>(null);
  private readonly _companyInfo = signal<CompanyInfo>({});
  private readonly _agencyConfig = signal<AgencyConfig | null>(null);
  private readonly _initialized = signal(false);
  private readonly _initError = signal<string | null>(null);

  readonly meta = this._meta.asReadonly();
  readonly content = this._content.asReadonly();
  readonly companyInfo = this._companyInfo.asReadonly();
  readonly agencyConfig = this._agencyConfig.asReadonly();
  readonly initialized = this._initialized.asReadonly();
  readonly initError = this._initError.asReadonly();

  readonly verticalName = computed(() => this._meta()?.vertical_name ?? VERTICAL_CONFIG.defaultVerticalName);
  readonly partnerKey = computed(() => this._meta()?.partner_key ?? '');
  readonly apiBaseUrl = computed(() => `${this.buildApiOrigin(this._meta())}/webservices`);
  readonly storageBaseUrl = computed(() => this.buildApiOrigin(this._meta()));

  readonly companyName = computed(() => this._companyInfo().company_name ?? 'Title Toolbox');
  readonly publicPageLogoUrl = computed(
    () =>
      this.resolveAssetUrl(
        this._companyInfo().public_page_logo_url || this._companyInfo().logo_url
      ) ?? VERTICAL_CONFIG.defaultLogoPath
  );
  readonly dashboardLogoUrl = computed(
    () =>
      this.resolveAssetUrl(
        this._companyInfo().dashboard_logo_url || this._companyInfo().logo_url
      ) ?? VERTICAL_CONFIG.defaultLogoPath
  );
  readonly dashboardShortLogoUrl = computed(
    () =>
      this.resolveAssetUrl(this._companyInfo().profile_logo) ??
      VERTICAL_CONFIG.defaultShortLogoPath
  );
  readonly bannerUrl = computed(() => this.resolveAssetUrl(this._companyInfo().banner_url));
  readonly publicLogoStyle = computed(
    () => this._content()?.custom_content?.public_header?.logo_style ?? {}
  );

  /** user_pic path segment: ttb-storage/{vertical}/user_pic */
  readonly userPicLocation = computed(() => `ttb-storage/${this.verticalName()}/user_pic`);

  /** Legacy app_config.grayout_primary_fields — disables email/password on profile pages. */
  readonly grayoutPrimaryFields = computed(() => {
    const value = this._content()?.app_config?.['grayout_primary_fields'];
    if (value !== undefined && value !== null) {
      return !!value && value !== '0' && value !== 'false' && value !== 0;
    }

    return this.verticalName() === VERTICAL_CONFIG.defaultVerticalName;
  });

  async init(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      this._initialized.set(true);
      return;
    }

    try {
      const domain = this.resolveVerticalDomain();
      const meta = await this.fetchVerticalMeta(domain);
      this._meta.set(meta);

      const content = await this.fetchVerticalConf(meta);
      let companyInfo = { ...content.company_info };

      const agencyRoute = this.detectAgencyRoute();
      if (agencyRoute) {
        const agency = await this.fetchAgencyConf(agencyRoute, meta);
        if (agency) {
          this._agencyConfig.set(agency);
          companyInfo = this.mergeAgencyBranding(companyInfo, agency, content);
        }
      }

      this._content.set(content);
      this._companyInfo.set(companyInfo);

      this.applyVerticalBranding(meta.vertical_name);
      this.applyPageMeta(companyInfo);

      document.documentElement.setAttribute('data-vertical', meta.vertical_name);
      document.body.classList.add(`x-vertical--${meta.vertical_name}`);

      this._initialized.set(true);
    } catch (err) {
      console.error('VerticalService.init failed:', err);
      this._initError.set(err instanceof Error ? err.message : 'Failed to load vertical configuration');
      this.applyVerticalBranding(VERTICAL_CONFIG.defaultVerticalName);
      this._initialized.set(true);
    }
  }

  isVerticalApiRequest(url: string): boolean {
    const meta = this._meta();
    if (!meta) return false;
    const host = meta.vertical_api_url.replace(/^https?:\/\//, '');
    return url.includes(host) || url.includes('titletoolbox.com');
  }

  resolveAssetUrl(path: string | undefined | null): string | null {
    if (!path) return null;
    if (/^https?:\/\//i.test(path) || path.startsWith('//')) {
      return path.startsWith('//') ? `https:${path}` : path;
    }

    const appUrl = this._content()?.app_config?.url;
    if (appUrl) {
      const base = appUrl.replace(/\/$/, '');
      return `${base}/${path.replace(/^\//, '')}`;
    }

    const apiHost = this._meta()?.vertical_api_url?.replace(/^https?:\/\//, '');
    if (apiHost) {
      const publicHost = apiHost.replace('.api.', '.');
      return `https://${publicHost}/${path.replace(/^\//, '')}`;
    }

    return path.startsWith('/') ? path : `/${path}`;
  }

  private resolveVerticalDomain(): string {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get(VERTICAL_CONFIG.verticalDomainQueryParam);
    if (fromQuery) {
      return fromQuery.replace('#!/', '').replace(/\/$/, '');
    }
    return window.location.hostname;
  }

  private async fetchVerticalMeta(domain: string): Promise<VerticalMetaData> {
    if ((VERTICAL_CONFIG.localhostDomains as readonly string[]).includes(domain)) {
      return { ...VERTICAL_CONFIG.localhostMeta };
    }

    const url = `${VERTICAL_CONFIG.metaApiOrigin}${VERTICAL_CONFIG.metaEndpoint}`;
    const res = await firstValueFrom(
      this.http.post<TtbApiResponse<VerticalMetaData>>(url, { vertical_domain: domain })
    );

    if (res.response?.status !== 'OK' || !res.response.data) {
      throw new Error(res.response?.message ?? 'vertical_meta.json failed');
    }

    return res.response.data;
  }

  private async fetchVerticalConf(meta: VerticalMetaData): Promise<VerticalContentData> {
    const url = `${this.buildApiOrigin(meta)}/${VERTICAL_CONFIG.confEndpoint}`;

    const res = await firstValueFrom(
      this.http.get<VerticalContentData | TtbApiResponse<VerticalContentData>>(url, {
        headers: { 'Partner-Key': meta.partner_key }
      })
    );

    // Legacy vertical_conf.json is returned directly (not wrapped in the TTB envelope).
    if ('app_config' in res && res.app_config) {
      return res;
    }

    const wrapped = res as TtbApiResponse<VerticalContentData>;
    if (wrapped.response?.status === 'OK' && wrapped.response.data) {
      return wrapped.response.data;
    }

    throw new Error(wrapped.response?.message ?? 'vertical_conf.json failed');
  }

  private async fetchAgencyConf(
    agencyRoute: string,
    meta: VerticalMetaData
  ): Promise<AgencyConfig | null> {
    const url = `${this.buildApiOrigin(meta)}/${VERTICAL_CONFIG.agencyEndpoint}/${agencyRoute}.json`;

    try {
      const res = await firstValueFrom(
        this.http.get<TtbApiResponse<AgencyApiOffice>>(url, {
          headers: { 'Partner-Key': meta.partner_key }
        })
      );

      if (res.response?.status !== 'OK' || !res.response.data) {
        return null;
      }

      return this.parseAgencyOffice(res.response.data);
    } catch {
      return null;
    }
  }

  private parseAgencyOffice(office: AgencyApiOffice): AgencyConfig {
    const model: AgencyConfig = {
      office_id: office.TbOffice.office_id,
      agency_identifier: office.TbOffice.agency_identifier,
      corporate_name: office.TbOffice.corporate_name
    };

    if (office.TbOffice.agency_conf) {
      try {
        Object.assign(model, JSON.parse(office.TbOffice.agency_conf));
      } catch {
        console.warn('Invalid agency_conf JSON');
      }
    }

    const phone = office.TbPhone?.[0]?.phone;
    if (phone) model.agency_phone = phone;

    const addr = office.TbAddress?.[0];
    if (addr?.address) {
      model.agency_address = [addr.address, addr.city, addr.state, addr.zip].filter(Boolean).join(', ');
    }

    return model;
  }

  private mergeAgencyBranding(
    companyInfo: CompanyInfo,
    agency: AgencyConfig,
    content: VerticalContentData
  ): CompanyInfo {
    const merged: CompanyInfo = { ...companyInfo };

    if (agency.banner_url) merged.banner_url = agency.banner_url;
    if (agency.public_page_logo_url || agency.logo_url) {
      merged.public_page_logo_url = agency.public_page_logo_url || agency.logo_url;
    }
    if (agency.dashboard_logo_url) merged.dashboard_logo_url = agency.dashboard_logo_url;

    if (agency.public_page_logo_style) {
      content.custom_content = content.custom_content || {};
      content.custom_content.public_header = content.custom_content.public_header || {};
      content.custom_content.public_header.logo_style = agency.public_page_logo_style;
    }

    const agencyId = agency.agency_identifier?.toLowerCase();
    if (agencyId && content.agencies_app_config?.[agencyId]) {
      content.app_config = {
        ...content.app_config,
        ...content.agencies_app_config[agencyId]
      };
    }

    return merged;
  }

  private detectAgencyRoute(): string | null {
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return null;

    const first = segments[0].toLowerCase();
    if (VERTICAL_CONFIG.reservedPathSegments.has(first)) return null;

    return first;
  }

  /** API host origin only — legacy generateBaseURL() (no /webservices suffix). */
  private buildApiOrigin(meta: VerticalMetaData | null): string {
    const protocol = meta?.api_http_only ? 'http' : 'https';
    const host = (meta?.vertical_api_url ?? 'demo.api.titletoolbox.com').replace(/^https?:\/\//, '');
    return `${protocol}://${host}`;
  }

  private applyVerticalBranding(verticalName: string): void {
    const preset = getVerticalColorPreset(verticalName);
    if (preset) {
      this.themeService.applyCssVars(tokensToCssVars(preset));
    }
  }

  private applyPageMeta(companyInfo: CompanyInfo): void {
    if (companyInfo.company_name) {
      document.title = companyInfo.company_name;
    }
  }
}
