import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, PieChart, Info, Filter, ArrowUpRight, TrendingUp } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { PieChart as RePie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LabelList } from 'recharts';

export default function Reports() {
  const { state } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredMaterials = state.materials;
  const filteredDeliveries = state.deliveries;
  const filteredWorks = state.works;
  const filteredPayments = state.payments;

  const totalMaterialsPrice = filteredMaterials.reduce((acc, m) => acc + (m.quantity * m.pricePerUnit), 0);
  const totalMaterialsSaving = filteredMaterials.reduce((acc, m) => acc + (m.savingAmount || 0), 0);
  
  const totalDeliveryPrice = filteredDeliveries.reduce((acc, d) => acc + d.amount, 0);
  
  const totalWorksPrice = filteredWorks.reduce((acc, w) => acc + w.amount, 0);
  
  const totalGeneralPayments = filteredPayments.reduce((acc, p) => acc + p.amount, 0);
  
  const totalSavingsGlobal = state.savings.filter(s => {
    if (s.materialId) return filteredMaterials.some(m => m.id === s.materialId);
    if (s.deliveryId) return filteredDeliveries.some(d => d.id === s.deliveryId);
    if (s.workId) return filteredWorks.some(w => w.id === s.workId);
    return true;
  }).reduce((acc, s) => acc + s.amount, 0);

  const totalMaterialsNetGlobal = totalMaterialsPrice;
  const totalDeliveryNetGlobal = totalDeliveryPrice;
  const totalWorksNetGlobal = totalWorksPrice;

  const chartData = [
    { name: 'Materijali', value: totalMaterialsNetGlobal },
    { name: 'Dostava', value: totalDeliveryNetGlobal },
    { name: 'Radovi', value: totalWorksNetGlobal },
    { name: 'Uplate', value: totalGeneralPayments },
  ];

  const COLORS = ['#4f46e5', '#2563eb', '#475569', '#9333ea', '#d97706'];

  const categorySummary = state.categories.map(cat => {
    const materials = filteredMaterials.filter(m => m.categoryId === cat.id);
    const materialIds = materials.map(m => m.id);
    
    // Costs for this category
    const matBrutoAtCat = materials.reduce((acc, m) => acc + (m.quantity * m.pricePerUnit), 0);
    const matSavingAtCat = state.savings.filter(s => s.materialId && materialIds.includes(s.materialId)).reduce((acc, s) => acc + s.amount, 0);

    const delBrutoAtCat = filteredDeliveries.filter(d => 
      d.materialIds.some(mid => materialIds.includes(mid))
    ).reduce((acc, d) => acc + d.amount, 0);
    const delSavingAtCat = state.savings.filter(s => s.deliveryId && filteredDeliveries.find(d => d.id === s.deliveryId)?.materialIds.some(mid => materialIds.includes(mid))).reduce((acc, s) => acc + s.amount, 0);

    const wrkBrutoAtCat = filteredWorks.filter(w => 
      w.materialIds.some(mid => materialIds.includes(mid))
    ).reduce((acc, w) => acc + w.amount, 0);
    const wrkSavingAtCat = state.savings.filter(s => s.workId && filteredWorks.find(w => w.id === s.workId)?.materialIds.some(mid => materialIds.includes(mid))).reduce((acc, s) => acc + s.amount, 0);

    const totalBrutoAtCat = matBrutoAtCat + delBrutoAtCat + wrkBrutoAtCat;
    const totalSavingAtCat = matSavingAtCat + delSavingAtCat + wrkSavingAtCat;
    const totalNetoAtCat = totalBrutoAtCat; // Show gross as total

    const pay = filteredPayments.filter(p => p.categoryId === cat.id).reduce((acc, p) => acc + p.amount, 0);

    return {
      id: cat.id,
      name: cat.name,
      total: totalNetoAtCat + pay,
      materials: matBrutoAtCat,
      delivery: delBrutoAtCat,
      works: wrkBrutoAtCat,
      savings: totalSavingAtCat,
      payments: pay
    };
  }).filter(c => selectedCategory === 'all' || c.id === selectedCategory);

  // Category Colors Map for Charts
  const CATEGORY_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', 
    '#10b981', '#06b6d4', '#3b82f6', '#64748b', '#78350f'
  ];

  const categoryChartData = categorySummary.map(c => ({
    name: c.name,
    total: c.total
  })).sort((a, b) => b.total - a.total);

  const categoryColorMap = new Map<string, string>();
  state.categories.forEach((cat, index) => {
    categoryColorMap.set(cat.id, CATEGORY_COLORS[index % CATEGORY_COLORS.length]);
  });

  const allTransactions: { id: string, date: string, type: string, name: string, amount: number, categoryId: string }[] = [];
  
  filteredMaterials.forEach(m => {
    if (selectedCategory !== 'all' && m.categoryId !== selectedCategory) return;
    const grossAmount = m.quantity * m.pricePerUnit;
    allTransactions.push({
      id: m.id,
      date: m.date,
      type: 'Materijal',
      name: m.name,
      amount: grossAmount,
      categoryId: m.categoryId
    });
  });

  filteredDeliveries.forEach(d => {
    const catId = state.materials.find(m => d.materialIds.includes(m.id))?.categoryId || 'other';
    if (selectedCategory !== 'all' && catId !== selectedCategory) return;
    const grossAmount = d.amount;
    allTransactions.push({
      id: d.id,
      date: d.date,
      type: 'Dostava',
      name: d.company || 'Nepoznata dostava',
      amount: grossAmount,
      categoryId: catId
    });
  });

  filteredWorks.forEach(w => {
    const catId = state.materials.find(m => w.materialIds.includes(m.id))?.categoryId || 'other';
    if (selectedCategory !== 'all' && catId !== selectedCategory) return;
    const grossAmount = w.amount;
    allTransactions.push({
      id: w.id,
      date: w.date,
      type: 'Radovi',
      name: w.description || 'Nepoznat rad',
      amount: grossAmount,
      categoryId: catId
    });
  });

  filteredPayments.forEach(p => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return;
    allTransactions.push({
      id: p.id,
      date: p.date,
      type: 'Ostala uplata',
      name: p.note || 'Uplata',
      amount: p.amount,
      categoryId: p.categoryId
    });
  });

  const transactionsByCategory = state.categories.map(cat => ({
    category: cat,
    transactions: allTransactions.filter(t => t.categoryId === cat.id).sort((a, b) => b.date.localeCompare(a.date))
  })).filter(group => group.transactions.length > 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Izvješća</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Analiza troškova i financijski pregled renovacije</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
             <Filter className="w-4 h-4 text-slate-400" />
             <select 
               value={selectedCategory} 
               onChange={e => setSelectedCategory(e.target.value)}
               className="bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none"
             >
                <option value="all">Sve kategorije</option>
                {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
          </div>
        </div>
      </header>

      {/* Spending by Category Chart */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Troškovi po Kategorijama (€)
        </h2>
        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={categoryChartData} 
              layout="vertical" 
              margin={{ left: 20, right: 60, top: 20, bottom: 20 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fontWeight: 700, fill: '#1e293b' }} 
                width={120}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                formatter={(val: number) => [formatCurrency(val), 'Ukupno']}
              />
              <Bar 
                dataKey="total" 
                fill="#6366f1" 
                radius={[0, 10, 10, 0]} 
                barSize={32}
              >
                <LabelList 
                  dataKey="total" 
                  position="right" 
                  formatter={(val: number) => formatCurrency(val)}
                  style={{ fontSize: 11, fontWeight: 800, fill: '#6366f1' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-6">
         <h2 className="text-xl font-bold text-slate-900 dark:text-white px-2 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Detalji po kategorijama
         </h2>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categorySummary.map((sum) => (
               <div key={sum.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white">{sum.name}</h3>
                     <span className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(sum.total)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Materijali</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(sum.materials)}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Uplate</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(sum.payments)}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dostava</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(sum.delivery)}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Radovi</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(sum.works)}</p>
                     </div>
                  </div>
                  
                  {/* Savings display removed as per user request to see only gross costs */}
               </div>
            ))}
         </div>
      </div>

      <div className="space-y-6 pt-8">
         <h2 className="text-xl font-bold text-slate-900 dark:text-white px-2 flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-600" />
            Popis svih troškova grupisan po kategorijama
         </h2>
         
         <div className="space-y-8">
           {transactionsByCategory.map((group) => (
             <div key={group.category.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColorMap.get(group.category.id) || '#ccc' }}></div>
                      {group.category.name}
                   </h3>
                   <span className="text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800/50">
                     {group.transactions.length} stavki
                   </span>
                </div>
                
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr>
                            <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Naziv asortimana / Vrsta</th>
                            <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-right whitespace-nowrap">Iznos</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                         {group.transactions.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                               <td className="py-3 px-4">
                                  <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{t.name}</p>
                                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5 border border-slate-200 dark:border-slate-700/50 rounded inline-block px-1.5">{t.type}</p>
                               </td>
                               <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <span className="text-sm font-black text-slate-900 dark:text-white">
                                     {formatCurrency(t.amount)}
                                  </span>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                      <tfoot>
                        <tr>
                           <td className="py-4 px-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 dark:border-slate-800">Ukupno za kategoriju:</td>
                           <td className="py-4 px-4 text-right border-t border-slate-100 dark:border-slate-800 text-lg font-black text-indigo-600 dark:text-indigo-400">
                              {formatCurrency(group.transactions.reduce((acc, t) => acc + t.amount, 0))}
                           </td>
                        </tr>
                      </tfoot>
                   </table>
                </div>
             </div>
           ))}
           
           {transactionsByCategory.length === 0 && (
             <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800/50">
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Nema troškova u odabranim kategorijama.</p>
             </div>
           )}
         </div>
      </div>
    </div>
  );
}
