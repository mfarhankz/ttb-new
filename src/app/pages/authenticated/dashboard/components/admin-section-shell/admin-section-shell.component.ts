import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-section-shell',
  standalone: true,
  templateUrl: './admin-section-shell.component.html'
})
export class AdminSectionShellComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) description!: string;
  @Input({ required: true }) icon!: string;
  @Input() note = 'Full management tools from the legacy app will be connected here.';
}
