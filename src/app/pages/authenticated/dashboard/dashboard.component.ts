import { Component, computed, inject } from '@angular/core';
import { CardComponent } from '../../../shared/components';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardComponent],
  templateUrl: './dashboard.component.html',
  styles: []
})
export class DashboardComponent {
  // Inject AuthService using inject() function
  private authService = inject(AuthService);

  // Access response data reactively
  responseData = this.authService.responseData;

  // Get user name from TbUser.name in response data
  // Uses the helper method from AuthService
  name = computed(() => {
    return this.authService.getUserName();
  });
}

