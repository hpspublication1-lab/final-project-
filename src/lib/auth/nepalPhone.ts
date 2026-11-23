/**
 * Nepali mobile number helpers, shared by the login page and the SMS hook.
 *
 * A Nepali mobile number is 10 digits and starts with 96, 97 or 98
 * (Nepal Telecom, Ncell, Smart Telecom). Supabase wants E.164 (+977…);
 * Aakash SMS wants the bare 10 digits.
 */

const NEPAL_MOBILE = /^9[678]\d{8}$/;

/** Returns the 10-digit local number, or null if it isn't a Nepali mobile. */
export function toNepalLocal(input: string | null | undefined): string | null {
  let digits = String(input ?? '').replace(/\D/g, '');
  if (digits.startsWith('00977')) digits = digits.slice(5);
  else if (digits.startsWith('977') && digits.length === 13) digits = digits.slice(3);
  else if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  return NEPAL_MOBILE.test(digits) ? digits : null;
}

/** Returns +977XXXXXXXXXX, or null if it isn't a Nepali mobile. */
export function toE164Nepal(input: string | null | undefined): string | null {
  const local = toNepalLocal(input);
  return local ? `+977${local}` : null;
}

/** 98•••••678 — safe to show on screen and to write to logs. */
export function maskNepalPhone(input: string | null | undefined): string {
  const local = toNepalLocal(input);
  if (!local) return '•••';
  return `${local.slice(0, 2)}•••••${local.slice(-3)}`;
}
