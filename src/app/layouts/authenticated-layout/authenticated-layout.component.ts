import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './authenticated-layout.component.html',
  styles: []
})
export class AuthenticatedLayoutComponent {
  // Inject services using inject() function
  private authService = inject(AuthService);
  private router = inject(Router);

  // Access response data reactively
  responseData = this.authService.responseData;

  // Get user data reactively
  tbUser = this.authService.tbUser;

  // Get user name from TbUser.name in response data
  // Uses the helper method from AuthService
  name = computed(() => {
    return this.authService.getUserName() || 'User';
  });

  // Get user picture
  userPicture = computed(() => {
    const userPic = this.tbUser()?.user_pic;
    if (userPic) {
      // Assuming the image is stored at a specific path, adjust as needed
      return `assets/images/users/${userPic}`;
    }
    return null;
  });

  logout(): void {
    this.authService.logout();
  }
}

