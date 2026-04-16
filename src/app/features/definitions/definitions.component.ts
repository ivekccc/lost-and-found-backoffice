import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-definitions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './definitions.component.html',
  styleUrl: './definitions.component.scss',
})
export default class DefinitionsComponent {}
