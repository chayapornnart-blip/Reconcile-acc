import React, { useState, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { KpiCard } from './components/KpiCard';
import { ResultTable } from './components/ResultTable';
import { parseBankCSV, parseBookCSV } from './services/csvParser';
import { reconcileData } from './services/reconciliationEngine';
import { BankTransaction, BookTransaction, MatchStatus } from './types';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  Activity, CheckCircle, 
  ArrowRightLeft, Database, RefreshCw, Lightbulb,
  TrendingUp, AlertTriangle, FileSearch
} from 'lucide-react';

function App() {
  const [bankData, setBankData] = useState<BankTransaction[]>([]);
  const [bookData, setBookData] = useState<BookTransaction[]>([]);
  const [bankFile, setBankFile] = useState<string>('');
  const [bookFile, setBookFile] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reconciliation Results
  const results = useMemo(() => {
    if (bankData.length === 0 || bookData.length === 0) return [];
    return reconcileData(bankData, bookData);
  }, [bankData, bookData]);

  // Statistics & Analytics
  const analytics = useMemo(() => {
    const total = results.length;
    if (total === 0) return null;

    const matched = results.filter(r => r.status === MatchStatus.MATCHED).length;
    const unmatched = results.filter(r => r.status === MatchStatus.UNMATCHED).length;
    const smartFixes = results.filter(r => r.status === MatchStatus.SMART_FIX).length;
    
    // Detailed Breakdown
    const amountMismatch = results.filter(r => r.status === MatchStatus.MATCHED_AMOUNT_MISMATCH).length;
    const dateMismatch = results.filter(r => r.status === MatchStatus.POTENTIAL_DATE_MATCH).length;
    const issues = amountMismatch + dateMismatch;

    const matchRate = Math.round((matched / total) * 100);

    // AI Insights Generation
    const insights: string[] = [];
    if (matchRate > 95) {
      insights.push("Excellent Reconciliation Health: Process is highly efficient. Consider automating the posting for exact matches.");
    }
    if (smartFixes > 0) {
      const percentage = Math.round((smartFixes / total) * 100);
      insights.push(`Detected ${smartFixes} Human Errors (${percentage}%): High frequency of typos/transpositions detected. Recommendation: Implement strict input masks or double-entry verification in the GL system.`);
    }
    if (unmatched > (total * 0.1)) {
      insights.push(`Significant Missing Documentation: ${unmatched} items unmatched. Suggest auditing the receipt collection workflow or checking for delays in merchant bank feed ingestion.`);
    }
    if (dateMismatch > (total * 0.05)) {
      insights.push(`Timing Differences Observed: Recurring date lags detected. Review the policy for recording transaction dates vs. settlement dates.`);
    }
    if (amountMismatch > 0) {
      insights.push(`Value Discrepancies: ${amountMismatch} items matched by Invoice # but have different amounts. Possible tax (VAT/WHT) calculation errors.`);
    }

    return { total, matched, unmatched, issues, smartFixes, matchRate, insights, amountMismatch, dateMismatch };
  }, [results]);

  // Chart Data: Status Distribution
  const pieChartData = useMemo(() => {
    if (!analytics) return [];
    return [
      { name: 'Matched', value: analytics.matched, color: '#10b981' }, // Emerald
      { name: 'Smart Fix', value: analytics.smartFixes, color: '#6366f1' }, // Indigo
      { name: 'Review Needed', value: analytics.issues, color: '#f59e0b' }, // Amber
      { name: 'Unmatched', value: analytics.unmatched, color: '#ef4444' }, // Red
    ];
  }, [analytics]);

  // Chart Data: Root Cause Analysis
  const barChartData = useMemo(() => {
    if (!analytics) return [];
    return [
      { name: 'Missing in Book', count: analytics.unmatched, fill: '#94a3b8' },
      { name: 'Human Error', count: analytics.smartFixes, fill: '#6366f1' },
      { name: 'Variance', count: analytics.amountMismatch, fill: '#f43f5e' },
      { name: 'Timing Diff', count: analytics.dateMismatch, fill: '#f59e0b' },
    ];
  }, [analytics]);

  const handleBankUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      setBankFile(file.name);
      const data = await parseBankCSV(file);
      setBankData(data);
    } catch (error) {
      alert("Error parsing Bank CSV");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBookUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      setBookFile(file.name);
      const data = await parseBookCSV(file);
      setBookData(data);
    } catch (error) {
      alert("Error parsing Book CSV");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setBankData([]);
    setBookData([]);
    setBankFile('');
    setBookFile('');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-600/20">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                SmartReconcile AI
              </h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide">FINANCIAL ANALYTICS SUITE</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {analytics && (
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Reset Data
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Upload Section */}
        <section className={`transition-all duration-500 ${analytics ? 'mb-8' : 'mb-0'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUpload 
              label="Upload Bank Statement (CSV)" 
              onChange={handleBankUpload} 
              fileName={bankFile}
              colorClass="blue"
            />
            <FileUpload 
              label="Upload GL/Book Record (CSV)" 
              onChange={handleBookUpload} 
              fileName={bookFile}
              colorClass="emerald"
            />
          </div>
        </section>

        {/* Dashboard Section */}
        {analytics && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* 1. Overview KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard 
                title="Reconciliation Score" 
                value={`${analytics.matchRate}%`} 
                subValue="Overall Health"
                icon={Activity} 
                color={analytics.matchRate > 90 ? "green" : "amber"} 
              />
              <KpiCard 
                title="Clean Matches" 
                value={analytics.matched} 
                subValue="No issues found"
                icon={CheckCircle} 
                color="green" 
              />
              <KpiCard 
                title="AI Corrections" 
                value={analytics.smartFixes} 
                subValue="Human errors identified"
                icon={Lightbulb} 
                color="blue" 
              />
              <KpiCard 
                title="Action Required" 
                value={analytics.unmatched + analytics.issues} 
                subValue="Exceptions to review"
                icon={AlertTriangle} 
                color="red" 
              />
            </div>

            {/* 2. Deep Dive Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left: AI Executive Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 lg:col-span-1 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileSearch className="w-5 h-5 text-indigo-500" />
                    AI Executive Summary
                  </h3>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                  <div className="space-y-4">
                    {analytics.insights.map((insight, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className="min-w-[4px] h-[4px] rounded-full bg-indigo-500 mt-2"></div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {insight.split("Recommendation:").map((part, i) => (
                            i === 0 ? part : <span key={i} className="block mt-1 font-medium text-indigo-700 bg-indigo-50 p-2 rounded-lg border border-indigo-100">💡 Recommendation: {part}</span>
                          ))}
                        </p>
                      </div>
                    ))}
                    {analytics.insights.length === 0 && (
                      <p className="text-slate-400 italic">Analysis in progress...</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle: Root Cause Analysis (Bar Chart) */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-1">
                <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-rose-500" />
                  Root Cause Analysis
                </h3>
                <p className="text-xs text-slate-400 mb-6">Breakdown of discrepancies by category</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#64748b'}} />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

               {/* Right: Status Distribution (Pie Chart) */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-1">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Reconciliation Status</h3>
                <p className="text-xs text-slate-400 mb-6">Proportion of matched vs unmatched items</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* 3. Detailed Transaction Table */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Transaction Detail Report</h2>
                  <p className="text-sm text-slate-500">Comprehensive list of all bank transactions and their reconciliation status</p>
                </div>
                <div className="text-sm font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                  Total Records: {analytics.total}
                </div>
              </div>
              <ResultTable results={results} />
            </div>
          </div>
        )}

        {/* Empty State / Welcome */}
        {!analytics && (
          <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
            <div className="inline-flex items-center justify-center p-6 bg-blue-50 rounded-full mb-6">
              <Database className="w-16 h-16 text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Financial Reconciliation Intelligence</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
              Upload your <strong>Bank Statement</strong> and <strong>General Ledger</strong> to generate an instant AI-powered analysis report with smart anomaly detection.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;