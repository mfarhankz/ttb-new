import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { CardComponent } from '../../../shared/components';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CardComponent],
  templateUrl: './profile.component.html',
  styles: []
})
export class ProfileComponent {
  private authService = inject(AuthService);
  
  // Get TbUser reactively
  tbUser = this.authService.tbUser;
  
  getStatusText(): string {
    const status = this.tbUser()?.status;
    if (status === '1') return 'Active';
    if (status === '0') return 'Inactive';
    return status || 'Unknown';
  }
  
  getStatusClass(): string {
    const status = this.tbUser()?.status;
    if (status === '1') return 'bg-green-100 text-green-800';
    if (status === '0') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  }
  
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  }
}

