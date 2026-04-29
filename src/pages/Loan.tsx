import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Wallet, Plus, Search, Trash2, Calendar, Tags, Info, Edit2, Target, TrendingDown } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

import { Payment } from '../types';

export default function Loan() {
  const { state, addPayment, updatePayment, deletePayment, setLoanTarget, hasWriteAccess } = useApp();
  const canEdit = hasWriteAccess('kredit');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [targetAmount, setTargetAmount] = useState(state.loanTarget || 0);
  const [formData, setFormData] = useState<Omit<Payment, 'id'>>({
    name: '',
    amount: 0,
    categoryId: state.categories[0]?.id || '',
    type: 'loan' as const,
    date: new Date().toISOString().split('T')[0],
  });

  const loans = state.payments.filter(p => 
    p.type === 'loan' && p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLoaned = loans.reduce((acc, l) => acc + l.amount, 0);
  const remainingLoan = (state.loanTarget || 0) - totalLoaned;

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      amount: 0,
      categoryId: state.categories[0]?.id || '',
      type: 'loan' as const,
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

  const handleTargetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoanTarget(targetAmount);
    setIsTargetModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Kredit</h1>
          <p className="text-slate-500 mt-1 font-medium">Pregled svih uplata i otplata vezanih uz kredit</p>
        </div>
        {canEdit && ( <button 
          onClick={handleOpenAdd}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-amber-100 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nova uplata kredita
        </button> )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="md:col-span-1 bg-slate-900 p-6 rounded-3xl text-white">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Ukupno otplaćeno</p>
            <p className="text-3xl font-black text-amber-400">{formatCurrency(totalLoaned)}</p>
         </div>
         <div className={cn("md:col-span-1 bg-white border border-slate-100 p-6 rounded-3xl flex flex-col justify-between group transition-colors", canEdit ? "cursor-pointer hover:border-amber-200" : "")} onClick={() => canEdit && setIsTargetModalOpen(true)}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Ukupan dug</p>
                {canEdit && <Target className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />}
              </div>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(state.loanTarget || 0)}</p>
            </div>
            {canEdit && (
              <p className="text-[10px] font-bold text-amber-600 mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                Kliknite za promjenu duga
              </p>
            )}
         </div>
         <div className="md:col-span-1 bg-amber-50 p-6 rounded-3xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-amber-700/60 text-xs font-bold uppercase tracking-widest">Preostalo za vratiti</p>
                <TrendingDown className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-900">{formatCurrency(remainingLoan < 0 ? 0 : remainingLoan)}</p>
            </div>
            {state.loanTarget && state.loanTarget > 0 && (
              <div className="mt-2 w-full bg-amber-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-amber-600 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (totalLoaned / state.loanTarget) * 100)}%` }}
                />
              </div>
            )}
         </div>
         <div className="md:col-span-1 relative flex items-center">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Pretraži..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-3xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
            />
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Opis</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Kategorija</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Datum</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Iznos</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loans.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                  Nema evidentiranih kreditnih uplata.
                </td>
              </tr>
            ) : (
              loans.map((p) => {
                const category = state.categories.find(c => c.id === p.categoryId);
                return (
                  <motion.tr layout key={p.id} className="hover:bg-amber-50/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                          <Wallet className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold">
                          <Tags className="w-3 h-3" />
                          {category?.name || 'Kredit'}
                       </span>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                          <Calendar className="w-4 h-4" />
                          {p.date}
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <p className="text-lg font-black text-slate-900">{formatCurrency(p.amount)}</p>
                    </td>
                    <td className="px-6 py-5">
                       {canEdit && (
                         <div className="flex items-center gap-2 transition-opacity">
                            <button onClick={() => handleOpenEdit(p)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                               <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setConfirmDeleteId(p.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
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
        {isTargetModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTargetModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Target className="w-6 h-6 text-amber-500" />
                Postavi iznos kredita
              </h2>
              <form onSubmit={handleTargetSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Ukupan iznos za vratiti (€)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={targetAmount || ''} 
                    onChange={e => setTargetAmount(parseFloat(e.target.value) || 0)} 
                    placeholder="Unesite ukupni iznos kredita..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-black text-xl" 
                  />
                  <p className="mt-2 text-xs text-slate-400">Ovaj iznos služi za praćenje preostalog duga.</p>
                </div>
                <div className="flex gap-3">
                   <button type="button" onClick={() => setIsTargetModalOpen(false)} className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">Zatvori</button>
                   <button type="submit" className="flex-[2] py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all">Spremi iznos</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingId ? 'Uredi kreditnu uplatu' : 'Nova kreditna uplata'}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Opis uplate / Rata br.</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Iznos (€)</label>
                    <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Kategorija</label>
                    <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all">
                       {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Datum uplate</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all" />
                </div>
                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">Odustani</button>
                   <button type="submit" className="flex-[2] py-4 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-200">Spremi uplatu</button>
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
        title="Izbriši kreditnu uplatu?"
        message="Jeste li sigurni da želite izbrisati ovu ratu kredita? Stanje otplaćenog iznosa će se umanjiti."
      />
    </div>
  );
}
