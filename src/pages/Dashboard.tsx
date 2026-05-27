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
  Activity,
  BarChart3
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

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
    whileHover={{ y: -4, scale: 1.01 }}
    onClick={onClick}
    className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-6 rounded-2xl border border-white/40 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all cursor-pointer group flex flex-col justify-center relative overflow-hidden"
  >
    <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40", color.replace('text-', 'bg-').replace('bg-', 'bg-'))}></div>
    
    <div className="flex justify-between items-center mb-4 relative z-10">
      <span className="text-[11px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">{title}</span>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800", color.replace('bg-', 'text-'))}>
        <Icon className={cn("w-5 h-5", color.replace('bg-', 'text-'))} />
      </div>
    </div>
    <div className="flex items-baseline justify-between gap-2 mt-2 relative z-10">
      <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{value}</h3>
    </div>
    {trend && (
      <div className="mt-3 relative z-10">
        <span className={cn(
          "text-[11px] font-bold inline-flex items-center gap-1 px-2 py-1 rounded-md",
          trend.up ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
        )}>
          {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend.val} u odnosu na plan
        </span>
      </div>
    )}
  </motion.div>
);

export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { state } = useApp();

  const totalMaterialsPrice = state.materials.reduce((acc, m) => acc + (m.quantity * m.pricePerUnit), 0);
  const totalDeliveryPrice = state.deliveries.reduce((acc, d) => acc + d.amount, 0);
  const totalWorksPrice = state.works.reduce((acc, w) => acc + w.amount, 0);

  const totalProjectPlanned = totalMaterialsPrice + totalDeliveryPrice + totalWorksPrice;
  const totalSavings = state.savings.reduce((acc, s) => acc + s.amount, 0);
  const totalProjectActual = totalProjectPlanned - totalSavings;
  
  const totalGeneralPayments = state.payments.reduce((acc, p) => acc + p.amount, 0);
  
  const totalMaterialsNet = totalMaterialsPrice - state.savings.filter(s => s.materialId).reduce((acc, s) => acc + s.amount, 0);
  const totalDeliveryNet = totalDeliveryPrice - state.savings.filter(s => s.deliveryId).reduce((acc, s) => acc + s.amount, 0);
  const totalWorksNet = totalWorksPrice - state.savings.filter(s => s.workId).reduce((acc, s) => acc + s.amount, 0);

  const allCredits = state.credits || [];
  const remainingCreditToPay = allCredits.reduce((acc, c) => {
    const paid = c.repayments.filter(r => r.status === 'CONFIRMED').reduce((sum, r) => sum + r.amount, 0);
    return acc + Math.max(0, c.totalAmount - paid);
  }, 0);

  const stats = [
    { id: 'materijali', title: 'Ukupna Investicija', value: formatCurrency(totalProjectActual), icon: Package, color: 'bg-indigo-500' },
    { id: 'ustede', title: 'Ukupne Uštede', value: formatCurrency(totalSavings), icon: PiggyBank, color: 'bg-emerald-500', trend: { val: 'Pozitivno', up: totalSavings >= 0 } },
    { id: 'uplate', title: 'Plaćeno do sada', value: formatCurrency(totalGeneralPayments), icon: CreditCard, color: 'bg-sky-500' },
    { id: 'kredit', title: 'Preostalo kredita', value: formatCurrency(remainingCreditToPay), icon: Wallet, color: 'bg-amber-500' },
  ];

  const pieData = [
    { name: 'Materijali', value: totalMaterialsNet, color: '#6366f1' },
    { name: 'Dostava', value: totalDeliveryNet, color: '#0ea5e9' },
    { name: 'Radovi', value: totalWorksNet, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Pregled Projekta</h1>
          <p className="text-sm text-slate-500 font-medium tracking-wide mt-1">Dobrodošli u sustav Renovacija apartman. Ovdje je vaš centralni pregled.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setActiveTab('materijali')} className="px-6 py-3 bg-slate-900 dark:bg-sky-500 text-white rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-sky-400 shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all">+ Novi Unos</button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard 
            key={stat.id}
            {...stat}
            onClick={() => setActiveTab(stat.id)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lijeva kolona: Torta i uštede */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none p-6">
              <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-6 flex items-center gap-2">
                 <BarChart3 className="w-4 h-4 text-indigo-500" />
                 Raspodjela troškova
              </h2>
              {pieData.length > 0 ? (
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm italic">
                  Nema unesenih troškova
                </div>
              )}
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl shadow-lg shadow-emerald-500/20 p-8 text-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
               <PiggyBank className="w-32 h-32" />
             </div>
             <h2 className="text-emerald-100 text-xs font-black tracking-widest uppercase mb-2">Ukupne Uštede</h2>
             <div className="text-4xl font-black mb-6">{formatCurrency(totalSavings)}</div>
             <div className="space-y-3">
               <div className="flex justify-between items-center text-sm font-medium border-b border-emerald-400/30 pb-2">
                 <span className="text-emerald-100">Planirano</span>
                 <span>{formatCurrency(totalProjectPlanned)}</span>
               </div>
               <div className="flex justify-between items-center text-sm font-medium">
                 <span className="text-emerald-100">Stvarno Plaćeno</span>
                 <span>{formatCurrency(totalProjectActual)}</span>
               </div>
             </div>
          </div>
        </div>

        {/* Desna kolona: Zadnje aktivnosti */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none overflow-hidden flex flex-col h-full min-h-[500px]">
          <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
            <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-500" />
              Tijek financija
            </h2>
            <button 
              onClick={() => setActiveTab('izvjesca')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              Cijelo izvješće
            </button>
          </div>
          
          <div className="flex-1 p-4">
            {state.payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-slate-300 dark:text-slate-600">
                 <Activity className="w-12 h-12 mb-4 opacity-20" />
                 <p className="text-sm font-medium">Još nema financijskih aktivnosti</p>
              </div>
            ) : (
              <div className="space-y-3">
                {state.payments.slice(-8).reverse().map((p, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={p.id} 
                    className="group border border-transparent hover:border-slate-100 dark:hover:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 p-4 rounded-2xl flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                        p.type === 'loan' ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400"
                      )}>
                        {p.type === 'loan' ? <Wallet className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</h4>
                        <p className="text-xs font-bold uppercase tracking-widest mt-1 text-slate-400">
                          {p.type === 'loan' ? 'Kredit' : 'Uplata'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(p.amount)}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
