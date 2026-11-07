const UNSAFE_CHARACTERS = /[\\\u0000-\u001f\u007f]/;

export function safeReturnUrl(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/login') ||
    UNSAFE_CHARACTERS.test(value)
  ) {
    return '/';
  }
  return value;
}
