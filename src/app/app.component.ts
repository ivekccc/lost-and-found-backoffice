import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestService } from './core/services';
import { tap } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {}
