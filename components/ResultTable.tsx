import React from 'react';
import { ReconciliationResult, MatchStatus } from '../types';
import { CheckCircle2, AlertCircle, HelpCircle, XCircle, Lightbulb, ArrowRight } from 'lucide-react';

interface ResultTableProps {
  results: ReconciliationResult[];
}

export const ResultTable: React.FC<ResultTableProps> = ({ results }) => {
  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case MatchStatus.MATCHED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Matched
          </span>
        );
      case MatchStatus.MATCHED_AMOUNT_MISMATCH:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" /> Amt. Mismatch
          </span>
        );
      case MatchStatus.SMART_FIX:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200 animate-pulse">
            <Lightbulb className="w-3.5 h-3.5" /> AI Suggestion
          </span>
        );
      case MatchStatus.POTENTIAL_DATE_MATCH:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
            <HelpCircle className="w-3.5 h-3.5" /> Fuzzy Match
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3.5 h-3.5" /> Unmatched
          </span>
        );
    }
  };

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('th-TH', { style: 'decimal', minimumFractionDigits: 2 }).format(amount);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Bank Details</th>
              <th className="px-6 py-3">Book Details</th>
              <th className="px-6 py-3">AI Analysis & Smart Fix</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map((item) => (
              <tr key={item.bankId} className={`hover:bg-slate-50 transition-colors ${item.status === MatchStatus.SMART_FIX ? 'bg-indigo-50/30' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap align-top">
                  {getStatusBadge(item.status)}
                </td>
                
                {/* Bank Column */}
                <td className="px-6 py-4 align-top">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-slate-800">{formatMoney(item.bankData.total_amount)}</span>
                    <span className="text-xs text-slate-500">Inv: {item.bankData.invoice_number}</span>
                    <span className="text-xs text-slate-400">{item.bankData.transaction_date}</span>
                  </div>
                </td>
                
                {/* Book Column */}
                <td className="px-6 py-4 align-top">
                  {item.bookData ? (
                    <div className="flex flex-col gap-1">
                      <span className={`font-semibold ${
                        item.status === MatchStatus.MATCHED_AMOUNT_MISMATCH || item.status === MatchStatus.SMART_FIX 
                          ? 'text-rose-600 line-through decoration-rose-400 decoration-2' 
                          : 'text-slate-700'
                      }`}>
                        {formatMoney(item.bookData.amount)}
                      </span>
                      <span className="text-xs text-slate-500">Desc: {item.bookData.description}</span>
                      <span className="text-xs text-slate-400">{item.bookData.posting_date}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No record found</span>
                  )}
                </td>
                
                {/* AI / Note Column */}
                <td className="px-6 py-4 align-top">
                   {item.suggestedFix ? (
                     <div className="bg-white border border-indigo-200 rounded-lg p-3 shadow-sm">
                       <div className="flex items-center gap-2 mb-2 text-indigo-700 font-semibold text-xs uppercase tracking-wide">
                         <Lightbulb className="w-3 h-3" /> Suggested Fix
                       </div>
                       <div className="flex items-center gap-2 text-sm text-slate-700 mb-1">
                         <span>Change {item.suggestedFix.field} to:</span>
                         <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                           {typeof item.suggestedFix.suggestedValue === 'number' 
                             ? formatMoney(item.suggestedFix.suggestedValue as number)
                             : item.suggestedFix.suggestedValue}
                         </span>
                       </div>
                       <p className="text-xs text-slate-500 mt-1 italic">
                         reason: "{item.suggestedFix.reason}"
                       </p>
                     </div>
                   ) : (
                     <span className="text-slate-500 text-xs">{item.note || '-'}</span>
                   )}
                </td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  No transactions to display. Please upload CSV files.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};