/**
 * ============================================================================
 * CENTRALIZED COMPANY & BILLING CONFIGURATION
 * ============================================================================
 * Plug in your real registered company details here (or via environment variables).
 * Every generated invoice, receipt, and ledger snapshot reads from this single config.
 */

export interface CompanyBillingProfile {
  /** Official registered legal name of the company */
  legalName: string;
  /** Brand / trade name shown on headers */
  tradeName: string;
  /** 9-digit Nepal PAN / VAT Registration Number */
  panNumber: string;
  /** Company Registrar (OCR) or Department Registration Number */
  registrationNumber: string;
  /** Registered office address line 1 */
  addressLine1: string;
  /** Registered office address line 2 / Province / Country */
  addressLine2: string;
  /** Official billing/accounts phone number */
  phone: string;
  /** Official billing/accounts email */
  email: string;
  /** Official website domain */
  website: string;
  /** Prefix for sequential/deterministic Invoice Numbers (e.g. SAM-INV) */
  invoicePrefix: string;
  /** Prefix for Official Money Receipt Numbers (e.g. SAM-RCPT) */
  receiptPrefix: string;
  /** Default currency code */
  defaultCurrency: 'NPR';
  /** Applicable VAT / Education Service Tax percentage (0 if exempt) */
  taxRatePercent: number;
  /** Name of the Authorized Signatory for invoices/receipts */
  authorizedSignatoryName: string;
  /** Designation / Department of the Authorized Signatory */
  authorizedSignatoryTitle: string;
  /** Official rubber stamp text lines */
  stampHeader: string;
  stampFooter: string;
  /** Statutory terms & conditions printed at the bottom of every invoice */
  termsAndConditions: string[];
}

export const COMPANY_BILLING_CONFIG: CompanyBillingProfile = {
  legalName:
    process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME ||
    'YOUR COMPANY LEGAL NAME PVT. LTD.',
  tradeName:
    process.env.NEXT_PUBLIC_COMPANY_TRADE_NAME ||
    'Samyak Academy',
  panNumber:
    process.env.NEXT_PUBLIC_COMPANY_PAN ||
    '000000000',
  registrationNumber:
    process.env.NEXT_PUBLIC_COMPANY_REG_NO ||
    'REG-000000/082/083',
  addressLine1:
    process.env.NEXT_PUBLIC_COMPANY_ADDRESS_1 ||
    'Registered Office Address, Ward No.',
  addressLine2:
    process.env.NEXT_PUBLIC_COMPANY_ADDRESS_2 ||
    'Kathmandu, Nepal',
  phone:
    process.env.NEXT_PUBLIC_COMPANY_PHONE ||
    '+977-01-0000000',
  email:
    process.env.NEXT_PUBLIC_COMPANY_EMAIL ||
    'accounts@yourdomain.com',
  website:
    process.env.NEXT_PUBLIC_COMPANY_WEBSITE ||
    'www.yourdomain.com',
  invoicePrefix:
    process.env.NEXT_PUBLIC_BILLING_INVOICE_PREFIX ||
    'SAM-INV',
  receiptPrefix:
    process.env.NEXT_PUBLIC_BILLING_RECEIPT_PREFIX ||
    'SAM-RCPT',
  defaultCurrency: 'NPR',
  taxRatePercent: Number(process.env.NEXT_PUBLIC_BILLING_TAX_PERCENT || 0),
  authorizedSignatoryName:
    process.env.NEXT_PUBLIC_BILLING_SIGNATORY_NAME ||
    'Authorized Signatory',
  authorizedSignatoryTitle:
    process.env.NEXT_PUBLIC_BILLING_SIGNATORY_TITLE ||
    'Finance & Accounts Division',
  stampHeader:
    process.env.NEXT_PUBLIC_BILLING_STAMP_HEADER ||
    'ACCOUNTS DEPARTMENT',
  stampFooter:
    process.env.NEXT_PUBLIC_BILLING_STAMP_FOOTER ||
    'OFFICIAL VERIFIED RECORD',
  termsAndConditions: [
    'All payment records are cryptographically signed (HMAC-SHA256) and stored in the immutable billing ledger.',
    'Keep the Invoice Number and Verification Control Code for official audit and institutional verification.',
  ],
};

/**
 * Returns the 9 individual characters of the configured PAN/VAT number
 * for boxed grid display on invoices.
 */
export function getPanDigitsBoxed(panOverride?: string): string[] {
  const raw = (panOverride || COMPANY_BILLING_CONFIG.panNumber || '000000000')
    .replace(/\s+/g, '')
    .slice(0, 9)
    .padEnd(9, '0');
  return raw.split('');
}
