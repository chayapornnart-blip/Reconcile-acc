import { BankTransaction, BookTransaction, MatchStatus, ReconciliationResult } from '../types';
import { parse, differenceInDays } from 'date-fns';

// Helper: Check if two numbers are transpositions of each other (e.g., 5400 vs 4500)
const isTranspositionError = (num1: number, num2: number): boolean => {
  const s1 = num1.toFixed(2).replace('.', '').split('').sort().join('');
  const s2 = num2.toFixed(2).replace('.', '').split('').sort().join('');
  return s1 === s2 && num1 !== num2;
};

// Helper: Levenshtein distance for strings (Invoice numbers)
const getLevenshteinDistance = (a: string, b: string): number => {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

export const reconcileData = (
  bankData: BankTransaction[],
  bookData: BookTransaction[]
): ReconciliationResult[] => {
  const results: ReconciliationResult[] = [];
  
  // Clone book data to track usage (avoid double matching)
  const availableBookRecords = [...bookData];

  // Pass 1: Exact Match (Invoice Number + Amount)
  bankData.forEach(bankRow => {
    const matchIndex = availableBookRecords.findIndex(bookRow => 
      bookRow.description === bankRow.invoice_number && 
      Math.abs(bookRow.amount - bankRow.total_amount) < 0.01
    );

    if (matchIndex !== -1) {
      const bookRow = availableBookRecords[matchIndex];
      results.push({
        bankId: bankRow.id,
        bookId: bookRow.id,
        status: MatchStatus.MATCHED,
        score: 100,
        note: 'Perfect match on Invoice # and Amount',
        bankData: bankRow,
        bookData: bookRow
      });
      availableBookRecords.splice(matchIndex, 1);
    } else {
      results.push({
        bankId: bankRow.id,
        status: MatchStatus.UNMATCHED,
        score: 0,
        bankData: bankRow
      });
    }
  });

  // Pass 2: Amount Mismatch (Invoice Number matches, Amount differs)
  results.forEach(res => {
    if (res.status === MatchStatus.UNMATCHED) {
      const matchIndex = availableBookRecords.findIndex(bookRow => 
        bookRow.description === res.bankData.invoice_number
      );

      if (matchIndex !== -1) {
        const bookRow = availableBookRecords[matchIndex];
        res.status = MatchStatus.MATCHED_AMOUNT_MISMATCH;
        res.bookId = bookRow.id;
        res.bookData = bookRow;
        res.score = 90;
        res.note = `Invoice matched, but amount differs. Bank: ${res.bankData.total_amount} vs Book: ${bookRow.amount}`;
        availableBookRecords.splice(matchIndex, 1);
      }
    }
  });

  // Pass 3: Fuzzy Date Match (Amount matches exactly, Date is within range)
  const DATE_TOLERANCE_DAYS = 3;
  
  results.forEach(res => {
    if (res.status === MatchStatus.UNMATCHED) {
      const bankDate = parse(res.bankData.transaction_date, 'd/M/yyyy', new Date());

      const matchIndex = availableBookRecords.findIndex(bookRow => {
        const bookDate = parse(bookRow.posting_date, 'd/M/yyyy', new Date());
        const daysDiff = Math.abs(differenceInDays(bankDate, bookDate));
        
        return (
          Math.abs(bookRow.amount - res.bankData.total_amount) < 0.01 &&
          daysDiff <= DATE_TOLERANCE_DAYS
        );
      });

      if (matchIndex !== -1) {
        const bookRow = availableBookRecords[matchIndex];
        res.status = MatchStatus.POTENTIAL_DATE_MATCH;
        res.bookId = bookRow.id;
        res.bookData = bookRow;
        res.score = 70;
        res.note = `Amount matched. Date diff: ${differenceInDays(parse(res.bankData.transaction_date, 'd/M/yyyy', new Date()), parse(bookRow.posting_date, 'd/M/yyyy', new Date()))} days.`;
        availableBookRecords.splice(matchIndex, 1);
      }
    }
  });

  // Pass 4: Smart Anomaly Detection (Human Errors)
  // Check for Transposition Errors or simple typos in Invoice Numbers
  results.forEach(res => {
    if (res.status === MatchStatus.UNMATCHED) {
      const bankDate = parse(res.bankData.transaction_date, 'd/M/yyyy', new Date());
      const bankAmount = res.bankData.total_amount;

      // Find best candidate in remaining book records
      let bestCandidateIndex = -1;
      let anomalyType = '';
      
      const candidateIndex = availableBookRecords.findIndex(bookRow => {
        const bookDate = parse(bookRow.posting_date, 'd/M/yyyy', new Date());
        const daysDiff = Math.abs(differenceInDays(bankDate, bookDate));
        
        if (daysDiff > DATE_TOLERANCE_DAYS) return false;

        // Check 1: Transposition Error (e.g., 5400 vs 4500)
        if (isTranspositionError(bankAmount, bookRow.amount)) {
          anomalyType = 'transposition';
          return true;
        }

        // Check 2: Invoice Typo (Amount matches exactly, Invoice is 1 char off)
        if (Math.abs(bankAmount - bookRow.amount) < 0.01) {
           const dist = getLevenshteinDistance(res.bankData.invoice_number, bookRow.description);
           if (dist === 1) { // Only 1 char difference
             anomalyType = 'typo';
             return true;
           }
        }

        return false;
      });

      if (candidateIndex !== -1) {
        const bookRow = availableBookRecords[candidateIndex];
        res.status = MatchStatus.SMART_FIX;
        res.bookId = bookRow.id;
        res.bookData = bookRow;
        res.score = 85;

        if (anomalyType === 'transposition') {
          res.note = `AI Detected: Potential number transposition error.`;
          res.suggestedFix = {
            field: 'amount',
            originalValue: bookRow.amount,
            suggestedValue: bankAmount,
            reason: 'Digits match but are swapped (Human Error)'
          };
        } else if (anomalyType === 'typo') {
           res.note = `AI Detected: Invoice number typo.`;
           res.suggestedFix = {
             field: 'description',
             originalValue: bookRow.description,
             suggestedValue: res.bankData.invoice_number,
             reason: 'Invoice number is very similar (1 char diff)'
           };
        }

        availableBookRecords.splice(candidateIndex, 1);
      }
    }
  });

  // Sort: Unmatched & Smart Fix first
  return results.sort((a, b) => {
    const scoreA = getSortScore(a.status);
    const scoreB = getSortScore(b.status);
    return scoreA - scoreB;
  });
};

const getSortScore = (status: MatchStatus) => {
  switch (status) {
    case MatchStatus.SMART_FIX: return 0;
    case MatchStatus.MATCHED_AMOUNT_MISMATCH: return 1;
    case MatchStatus.UNMATCHED: return 2;
    case MatchStatus.POTENTIAL_DATE_MATCH: return 3;
    case MatchStatus.MATCHED: return 4;
    default: return 5;
  }
};