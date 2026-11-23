function siteHost(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://samyakcee.com').host;
  } catch {
    return 'samyakcee.com';
  }
}

/**
 * Plain ASCII keeps it to one SMS credit. The last line is the WebOTP format
 * (`@host #code`), which lets Chrome on Android offer to fill the code in.
 */
export function buildOtpMessage(otp: string, host = siteHost()): string {
  return `Your Samyak Guru code is ${otp}. It expires in 5 minutes. Never share it with anyone.\n\n@${host} #${otp}`;
}
