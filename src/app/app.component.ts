import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestService } from './core/services';
import { tap } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
