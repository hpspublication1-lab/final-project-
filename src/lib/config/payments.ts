/**
 * Payment methods across the site.
 *
 * Fonepay Dynamic QR is the ONLY payment method. Every purchase — plans and
 * the crash-course prebooking — is completed by scanning a Fonepay dynamic QR,
 * and the plan unlocks automatically the moment Fonepay confirms the payment.
 *
 * The other keys are kept (all permanently false) only so existing UI that
 * references them keeps compiling; nothing renders them. Do not re-enable a
 * method here without also wiring its gateway + verification on the server.
 */
export const PAYMENT_METHODS = {
  fonepay: true,
  esewa: false,
  khalti: false,
  bank: false,
  whatsappCode: false,
} as const;

export type PaymentMethodKey = keyof typeof PAYMENT_METHODS;

/** True when any "send money manually then claim" method is on. Always false —
 *  Fonepay QR is verified server-to-server, so there is no manual method. */
export const hasManualMethod = (): boolean =>
  PAYMENT_METHODS.esewa || PAYMENT_METHODS.khalti || PAYMENT_METHODS.bank;

/** Human list of enabled methods. Always "Fonepay". */
export const enabledMethodsLabel = (): string => 'Fonepay';
