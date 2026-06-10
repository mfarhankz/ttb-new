import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { LayoutService } from '@app/core/services/layout.service';
import { TargetOfficeService } from '@app/core/services/target-office.service';
import { LoginModalComponent } from '@app/shared/components/login-modal/login-modal.component';
import { PropertySearchModalComponent } from '@app/shared/components/property-search-modal/property-search-modal.component';
import { ThemeModalComponent } from '@app/shared/components/theme-modal/theme-modal.component';
import { PayNowHostComponent } from '@app/shared/components/pay-now-modal/pay-now-host.component';

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    LoginModalComponent,
    PropertySearchModalComponent,
    ThemeModalComponent,
    PayNowHostComponent
  ],
  templateUrl: './authenticated-layout.component.html',
  styles: []
})
export class AuthenticatedLayoutComponent implements OnInit {
  private layoutService = inject(LayoutService);
  private targetOfficeService = inject(TargetOfficeService);

  collapsed = signal(false);

  ngOnInit(): void {
    this.targetOfficeService.ensureDefault();
  }

  onSidebarCollapsed(collapsed: boolean): void {
    this.collapsed.set(collapsed);
    this.layoutService.setSidebarCollapsed(collapsed);
  }
}
