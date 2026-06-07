import { Component, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { VerticalService } from '@app/core/services/vertical.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgStyle],
  templateUrl: './public-layout.component.html',
  styles: []
})
export class PublicLayoutComponent {
  readonly vertical = inject(VerticalService);
  currentYear = new Date().getFullYear();
}
