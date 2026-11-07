const INTERACTIVE = 'a, button, input, select, textarea, label, [role="button"], [role="checkbox"]';

export function isInteractiveTarget(event: Event): boolean {
  const target = event.target as HTMLElement | null;
  return !!target?.closest(INTERACTIVE);
}
