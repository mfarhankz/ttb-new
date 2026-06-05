import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-gray-900">{{ title }}</h1>
      <p class="mt-2 text-gray-600">This page is coming soon.</p>
    </div>
  `
})
export class PlaceholderComponent {
  private route = inject(ActivatedRoute);
  title = this.route.snapshot.title ?? 'Page';
}
