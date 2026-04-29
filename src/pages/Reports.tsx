import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, PieChart, Info, Filter, ArrowUpRight, TrendingUp } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { PieChart as RePie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function Reports() {
  const { state } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const totalMaterials = state.materials.reduce((acc, m) => acc + (m.quantity * m.pricePerUnit), 0);
  const totalDelivery = state.deliveries.reduce((acc, d) => acc + d.amount, 0);
  const totalWorks = state.works.reduce((acc, w) => acc + w.amount, 0);
  const totalSavings = state.savings.reduce((acc, s) => acc + s.amount, 0);
  const totalGeneralPayments = state.payments.filter(p => p.type === 'general').reduce((acc, p) => acc + p.amount, 0);
  const totalLoanPayments = state.payments.filter(p => p.type === 'loan').reduce((acc, p) => acc + p.amount, 0);

  const chartData = [
    { name: 'Materijali', value: totalMaterials },
    { name: 'Dostava', value: totalDelivery },
    { name: 'Radovi', value: totalWorks },
    { name: 'Uplate', value: totalGeneralPayments },
    { name: 'Kredit', value: totalLoanPayments },
  ];

  const COLORS = ['#4f46e5', '#2563eb', '#475569', '#9333ea', '#d97706'];

  const categorySummary = state.categories.map(cat => {
    const materials = state.materials.filter(m => m.categoryId === cat.id);
    const cost = materials.reduce((acc, m) => acc + (m.quantity * m.pricePerUnit), 0);
    const del = materials.reduce((acc, m) => acc + m.deliveryCost, 0);
    const wrk = materials.reduce((acc, m) => acc + m.workCost, 0);
    const sav = materials.reduce((acc, m) => acc + (m.plannedCost - m.actualPaid), 0);
    const pay = state.payments.filter(p => p.categoryId === cat.id).reduce((acc, p) => acc + p.amount, 0);

    return {
      id: cat.id,
      name: cat.name,
      total: cost + del + wrk + pay,
      materials: cost,
      delivery: del,
      works: wrk,
      savings: sav,
      payments: pay
    };
  }).filter(c => selectedCategory === 'all' || c.id === selectedCategory);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Izvješća</h1>
          <p className="text-slate-500 mt-1 font-medium">Analiza troškova i financijski pregled renovacije</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
           <Filter className="w-4 h-4 text-slate-400" />
           <select 
             value={selectedCategory} 
             onChange={e => setSelectedCategory(e.target.value)}
             className="bg-transparent text-sm font-bold text-slate-900 outline-none"
           >
              <option value="all">Sve kategorije</option>
              {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
           </select>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-blue-600" />
               Raspodjela troškova (€)
            </h2>
            <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                     <Tooltip 
                       contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                       formatter={(val: number) => [formatCurrency(val), 'Iznos']}
                     />
                     <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl shadow-slate-200 flex flex-col">
            <h2 className="text-xl font-bold mb-6">Udio u ukupnom</h2>
            <div className="flex-1 min-h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                  <RePie>
                     <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip />
                  </RePie>
               </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
               {chartData.map((d, i) => (
                  <div key={d.name} className="flex justify-between items-center text-xs">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                        <span className="text-slate-400 font-medium">{d.name}</span>
                     </div>
                     <span className="font-bold">{formatCurrency(d.value)}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>

      <div className="space-y-6">
         <h2 className="text-xl font-bold text-slate-900 px-2 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Detalji po kategorijama
         </h2>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categorySummary.map((sum) => (
               <div key={sum.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                     <h3 className="text-lg font-bold text-slate-900">{sum.name}</h3>
                     <span className="text-2xl font-black text-slate-900">{formatCurrency(sum.total)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Materijali</p>
                        <p className="text-sm font-bold text-slate-700">{formatCurrency(sum.materials)}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Uplate</p>
                        <p className="text-sm font-bold text-slate-700">{formatCurrency(sum.payments)}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dostava</p>
                        <p className="text-sm font-bold text-slate-700">{formatCurrency(sum.delivery)}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Radovi</p>
                        <p className="text-sm font-bold text-slate-700">{formatCurrency(sum.works)}</p>
                     </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-baseline">
                     <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                        Ušteda kategorije
                        <ArrowUpRight className="w-3 h-3" />
                     </span>
                     <span className="text-lg font-black text-emerald-600">{formatCurrency(sum.savings)}</span>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
