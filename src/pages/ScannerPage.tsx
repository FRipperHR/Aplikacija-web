import React from 'react';
import { ReceiptScanner } from '../components/ReceiptScanner';
import { FileText } from 'lucide-react';

export default function ScannerPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">AI SKENIRANJE</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Inteligentno prepoznavanje računa pomoću Gemini AI modela</p>
      </header>

      <ReceiptScanner />
    </div>
  );
}
