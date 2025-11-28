import React from 'react';
import { ReconciliationResult, MatchStatus } from '../types';
import { CheckCircle2, AlertCircle, HelpCircle, XCircle, Lightbulb } from 'lucide-react';

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
      case MatchStatus.POTENTIAL_DATE_