import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styles: []
})
export class DashboardComponent {
  private authService = inject(AuthService);

  name = computed(() => this.authService.getUserName());
}
