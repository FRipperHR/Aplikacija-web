import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CreditCard, Plus, Search, Trash2, Calendar, Tags, Edit2, Lock } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Payment } from '../types';

export default function Payments() {
  const { state, addPayment, updatePayment, deletePayment, hasWriteAccess } = useApp();
  const canEdit = hasWriteAccess('uplate');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Payment, 'id'>>({
    name: '',
    amount: 0,
    categoryId: state.categories[0]?.id || '',
    type: 'general' as const,
    date: new Date().toISOString().split('T')[0],
  });

  const allPayments = useMemo(() => {
    let list: Array<Payment & { source: string, isAuto?: boolean }> = [];
    
    // Manual general payments
    state.payments.forEach(p => {
      if (p.type === 'general') {
        list.push({ ...p, source: 'manual' });
      }
    });

    // Material actual paid
    state.materials.forEach(m => {
      if (m.actualPaid > 0) {
        list.push({
          id: `mat-${m.id}`,
          name: `Materijal: ${m.name}`,
          amount: m.actualPaid,
          categoryId: m.categoryId,
          date: '-',
          type: 'general',
          source: 'material',
          isAuto: true
        });
      }
    });

    // Delivery actual paid
    state.deliveries.forEach(d => {
      if (d.actualPaid && d.actualPaid > 0) {
        list.push({
          id: `del-${d.id}`,
          name: `Dostava: ${d.name}`,
          amount: d.actualPaid,
          categoryId: d.materialIds.length > 0 ? state.materials.find(m => m.id === d.materialIds[0])?.categoryId || '' : '',
          date: '-',
          type: 'general',
          source: 'delivery',
          isAuto: true
        });
      }
    });

    // Work actual paid
    state.works.forEach(w => {
      if (w.actualPaid && w.actualPaid > 0) {
        list.push({
          id: `work-${w.id}`,
          name: `Radovi: ${w.name}`,
          amount: w.actualPaid,
          categoryId: w.materialIds.length > 0 ? state.materials.find(m => m.id === w.materialIds[0])?.categoryId || '' : '',
          date: '-',
          type: 'general',
          source: 'work',
          isAuto: true
        });
      }
    });

    return list.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [state, searchTerm]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      amount: 0,
      categoryId: state.categories[0]?.id || '',
      type: 'general' as const,
      date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Payment) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      amount: p.amount,
      categoryId: p.categoryId,
      type: p.type,
      date: p.date,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updatePayment(editingId, formData);
    } else {
      addPayment(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Uplate</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Pratite sve uplate i troškove osim kredita</p>
        </div>
        {canEdit && ( <button 
          onClick={handleOpenAdd}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova uplata
        </button> )}
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Pretraži uplate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Opis</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Kategorija</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Datum</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Iznos</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {allPayments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                  Nema evidentiranih uplata.
                </td>
              </tr>
            ) : (
              allPayments.map((p) => {
                const category = state.categories.find(c => c.id === p.categoryId);
                return (
                  <motion.tr layout key={p.id} className="hover:bg-slate-50 dark:bg-slate-800 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold relative">
                          <CreditCard className="w-5 h-5" />
                          {p.isAuto && <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-slate-400" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {p.name}
                            {p.isAuto && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-black">Auto</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-full text-xs font-bold">
                          <Tags className="w-3 h-3" />
                          {category?.name || 'Ostalo'}
                       </span>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                          <Calendar className="w-4 h-4" />
                          {p.date}
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(p.amount)}</p>
                    </td>
                    <td className="px-6 py-5">
                       {canEdit && !p.isAuto && (
                         <div className="flex items-center gap-2 transition-opacity">
                            <button onClick={() => handleOpenEdit(p)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                               <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setConfirmDeleteId(p.id)} className="p-2 text-slate-300 hover:text-red-500 dark:text-red-400 transition-colors">
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                       )}
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{editingId ? 'Uredi uplatu' : 'Nova uplata'}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Opis uplate</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Iznos (€)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00"
                      required 
                      value={formData.amount || ''} 
                      onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-black" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Kategorija</label>
                    <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                       {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Datum</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-50 dark:bg-slate-800 transition-all">Odustani</button>
                   <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">Spremi</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && deletePayment(confirmDeleteId)}
        title="Izbriši uplatu?"
        message="Jeste li sigurni da želite izbrisati ovu uplatu? Ova radnja će smanjiti ukupni iznos plaćenih troškova."
      />
    </div>
  );
}
