import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Package, 
  Truck, 
  Hammer, 
  PiggyBank, 
  CreditCard, 
  Wallet,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Activity
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  onClick, 
  trend 
}: { 
  title: string, 
  value: string, 
  icon: any, 
  color: string, 
  onClick: () => void,
  trend?: { val: string, up: boolean },
  key?: string
}) => (
  <motion.div
    whileHover={{ y: -2 }}
    onClick={onClick}
    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-center"
  >
    <div className="flex justify-between items-center mb-1">
      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">{title}</span>
      <div className={cn("w-6 h-6 rounded-md flex items-center justify-center opacity-80", color)}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
    </div>
    <div className="flex items-baseline justify-between gap-1 mt-1">
      <h3 className="text-xl font-bold text-slate-900 leading-tight">{value}</h3>
      {trend && (
        <span className={cn(
          "text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded-md",
          trend.up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}>
          {trend.val}
        </span>
      )}
    </div>
  </motion.div>
);

import { cn } from '../lib/utils';

export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { state } = useApp();

  const totalMaterials = state.materials.reduce((acc, m) => acc + (m.quantity * m.pricePerUnit), 0);
  const totalDelivery = state.deliveries.reduce((acc, d) => acc + d.amount, 0);
  const totalWorks = state.works.reduce((acc, w) => acc + w.amount, 0);
  const totalProjectPlanned = totalMaterials + totalDelivery + totalWorks;
  const totalProjectPaid = state.materials.reduce((acc, m) => acc + m.actualPaid, 0);
  const totalSavings = totalProjectPlanned - totalProjectPaid;
  
  const totalPayments = state.payments.filter(p => p.type === 'general').reduce((acc, p) => acc + p.amount, 0);
  const totalLoan = state.payments.filter(p => p.type === 'loan').reduce((acc, p) => acc + p.amount, 0);

  const stats = [
    { id: 'materijali', title: 'Ukupna Investicija', value: formatCurrency(totalProjectPlanned), icon: Package, color: 'bg-slate-800' },
    { id: 'ustede', title: 'Ukupne Uštede', value: formatCurrency(totalSavings), icon: PiggyBank, color: 'bg-emerald-600', trend: { val: '+12%', up: true } },
    { id: 'uplate', title: 'Plaćeno do sada', value: formatCurrency(totalProjectPaid), icon: CreditCard, color: 'bg-slate-800' },
    { id: 'kredit', title: 'Kreditni Saldo', value: formatCurrency(totalLoan), icon: Wallet, color: 'bg-sky-600' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">DASHBOARD PREGLED</h1>
          <p className="text-xs text-slate-500 font-medium tracking-wide">Dobrodošli u sustav Renovacija apartman</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">Export Izvješće</button>
           <button onClick={() => setActiveTab('materijali')} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors">+ Novi Unos</button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard 
            key={stat.id}
            {...stat}
            onClick={() => setActiveTab(stat.id)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[420px]">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-500" />
              ZADNJE AKTIVNOSTI
            </h2>
            <button 
              onClick={() => setActiveTab('izvjesca')}
              className="text-[10px] font-black text-sky-600 hover:text-sky-700 tracking-widest uppercase"
            >
              Vidi sve
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {state.payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                 <Activity className="w-8 h-8 mb-2 opacity-20" />
                 <p className="text-xs italic">Nema evidentiranih podataka</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 sticky top-0 z-10">
                   <tr>
                      <th className="px-5 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">Opis</th>
                      <th className="px-5 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">Tip</th>
                      <th className="px-5 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 text-right">Iznos</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.payments.slice(-8).reverse().map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3 text-[13px] font-medium text-slate-700">{p.name}</td>
                      <td className="px-5 py-3">
                         <span className={cn(
                           "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter",
                           p.type === 'loan' ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"
                         )}>
                           {p.type === 'loan' ? 'Kredit' : 'Uplata'}
                         </span>
                      </td>
                      <td className="px-5 py-3 text-[13px] font-bold text-slate-950 text-right">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[420px]">
           <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                 <PiggyBank className="w-4 h-4 text-emerald-500" />
                 UKUPNE UŠTEDE
              </h2>
           </div>
           <div className="p-6 flex flex-col items-center justify-center text-center flex-1">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                 <PiggyBank className="w-8 h-8" />
              </div>
              <div className="text-3xl font-black text-emerald-600 mb-1">{formatCurrency(totalSavings)}</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ukupno ušteđeno na materijalu</p>
              
              <div className="mt-8 w-full space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Planirana investicija</span>
                   <span className="text-xs font-bold text-slate-800">{formatCurrency(totalProjectPlanned)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Plaćeno</span>
                   <span className="text-xs font-bold text-slate-800">{formatCurrency(totalProjectPaid)}</span>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
