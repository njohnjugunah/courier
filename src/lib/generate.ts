export function generateTrackingCode(): string {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${now}-${rand}`.slice(0, 12);
}

export function formatPhoneNumber(phone: string): string {
  // Basic E.164 formatting for Kenya numbers
  if (phone.startsWith('07') || phone.startsWith('01')) {
    return `+254${phone.substring(1)}`;
  }
  if (phone.startsWith('254')) {
    return `+${phone}`;
  }
  if (phone.startsWith('+254')) {
    return phone;
  }
  return phone;
}

export function validatePhoneNumber(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(formatPhoneNumber(phone));
}