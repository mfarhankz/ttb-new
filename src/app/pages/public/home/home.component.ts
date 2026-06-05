import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VerticalService } from '../../../core/services/vertical.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styles: []
})
export class HomeComponent {
  readonly vertical = inject(VerticalService);
}
