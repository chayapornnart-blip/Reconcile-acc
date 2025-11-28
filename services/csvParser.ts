import Papa from 'papaparse';
import { BankTransaction, BookTransaction } from '../types';

// Helper to clean currency strings "2,080.00" -> 2080.00
const parseCurrency = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  return parseFloat(value.replace(/,/g, ''));
};

export const parseBankCSV = (file: File): Promise<BankTransaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data.map((row: any, index: number) => ({
            id: `bank-${index}`,
            account_no: row['account_no'],
            settlement_date: row['settlement_date'],
            transaction_date: row['transaction_date'],
            time: row['time'],
            invoice_number: row['invoice_number'],
            product: row['product'],
            liter: parseFloat(row['liter']),
            price: parseFloat(row['price']),
            amount_before_vat: parseCurrency(row['amount_before_vat']),
            vat: parseCurrency(row['vat']),
            total_amount: parseCurrency(row['total_amount']),
            wht: parseCurrency(row['wht_1_percent']),
            total_after_wd: parseCurrency(row['total_amount_after_wd']),
            merchant_id: row['merchant_id'],
            fuel_brand: row['fuel_brand']
          }));
          resolve(data as BankTransaction[]);
        } catch (e) {
          reject(e);
        }
      },
      error: (error) => reject(error)
    });
  });
};

export const parseBookCSV = (file: File): Promise<BookTransaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data.map((row: any, index: number) => ({
            id: `book-${index}`,
            document_no: row['document_no'],
            posting_date: row['posting_date'],
            description: row['description'],
            amount: parseCurrency(row['amount'])
          }));
          resolve(data as BookTransaction[]);
        } catch (e) {
          reject(e);
        }
      },
      error: (error) => reject(error)
    });
  });
};