export interface BankTransaction {
  id: string; // generated
  account_no: string;
  settlement_date: string;
  transaction_date: string; // DD/MM/YYYY
  time: string;
  invoice_number: string;
  product: string;
  liter: number;
  price: number;
  amount_before_vat: number;
  vat: number;
  total_amount: number;
  wht: number;
  total_after_wd: number;
  merchant_id: string;
  fuel_brand: string;
}

export interface BookTransaction {
  id: string; // generated
  document_no: string;
  posting_date: string; // DD/MM/YYYY
  description: string; // Often matches invoice_number
  amount: number;
}

export enum MatchStatus {
  MATCHED = 'MATCHED', // Exact match on Invoice & Amount
  MATCHED_AMOUNT_MISMATCH = 'MATCHED_AMOUNT_MISMATCH', // Invoice matches, Amount differs
  POTENTIAL_DATE_MATCH = 'POTENTIAL_DATE_MATCH', // Amount matches, Invoice differs, Date close
  SMART_FIX = 'SMART_FIX', // AI detected anomaly (e.g. transposition, typo)
  UNMATCHED = 'UNMATCHED'
}

export interface ReconciliationResult {
  bankId: string;
  bookId?: string;
  status: MatchStatus;
  score: number; // Confidence score 0-100
  note?: string;
  suggestedFix?: {
    field: string;
    originalValue: string | number;
    suggestedValue: string | number;
    reason: string;
  };
  bankData: BankTransaction;
  bookData?: BookTransaction;
}

export interface DashboardStats {
  totalBank: number;
  totalBook: number;
  matchedCount: number;
  unmatchedCount: number;
  accuracy: number;
  totalMatchedAmount: number;
  totalUnmatchedAmount: number;
}