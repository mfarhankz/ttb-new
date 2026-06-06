import { Component, effect, inject, viewChild } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { LoginComponent } from '../../../pages/public/login/login.component';
import { SessionExpiredService } from '../../../core/services/session-expired.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [ModalComponent, LoginComponent],
  templateUrl: './login-modal.component.html'
})
export class LoginModalComponent {
  readonly sessionExpiredService = inject(SessionExpiredService);
  private readonly modal = viewChild.required<ModalComponent>('modal');

  constructor() {
    effect(() => {
      const modal = this.modal();
      if (!modal) {
        return;
      }

      if (this.sessionExpiredService.loginModalOpen()) {
        modal.open();
      } else if (modal.isOpen()) {
        modal.close();
      }
    });
  }

  onLoginSuccess(): void {
    this.sessionExpiredService.notifySessionRenewed();
    this.sessionExpiredService.closeLoginModal();
  }
}
