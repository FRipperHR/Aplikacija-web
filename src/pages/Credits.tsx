import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CreditCard, CheckCircle, Trash2, Plus, X, Edit2, Clock, ChevronRight, Info } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Credit, CreditRepayment } from '../types';

export default function Credits() {
  const { state, addCredit, updateCredit, deleteCredit, addRepayment, approveRepayment, deleteRepayment, hasWriteAccess, currentUser } = useApp();
  
  const canEdit = hasWriteAccess('kredit');
  const canApprove = currentUser?.permissions?.approveCredit || currentUser?.role === 'ADMIN';

  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [selectedCreditId, setSelectedCreditId] = useState<string | null>(null);
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<{ type: 'CREDIT' | 'REPAYMENT', id: string, extra?: string } | null>(null);
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null);
  
  const [creditFormData, setCreditFormData] = useState({ name: '', totalAmount: 0 });
  const [repaymentFormData, setRepaymentFormData] = useState({ amount: 0, note: '' });

  const handleOpenAddCredit = () => {
    setEditingCredit(null);
    setCreditFormData({ name: '', totalAmount: 0 });
    setIsCreditModalOpen(true);
  };

  const handleOpenEditCredit = (c: Credit) => {
    setEditingCredit(c);
    setCreditFormData({ name: c.name, totalAmount: c.totalAmount });
    setIsCreditModalOpen(true);
  };

  const handleOpenAddRepayment = (creditId: string) => {
    setSelectedCreditId(creditId);
    setRepaymentFormData({ amount: 0, note: '' });
    setIsRepaymentModalOpen(true);
  };

  const handleCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCredit) {
      updateCredit(editingCredit.id, creditFormData);
    } else {
      addCredit({
        ...creditFormData,
        date: new Date().toISOString()
      });
    }
    setIsCreditModalOpen(false);
  };

  const handleRepaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCreditId) {
      addRepayment(selectedCreditId, repaymentFormData.amount, repaymentFormData.note);
    }
    setIsRepaymentModalOpen(false);
  };

  const credits = state.credits || [];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Krediti</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Upravljanje kompletni iznosima i uplatama</p>
        </div>
        <button 
          onClick={handleOpenAddCredit}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-purple-100 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novi kredit
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {credits.length === 0 ? (
          <div className="xl:col-span-2 py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
             <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-slate-300" />
             </div>
             <p className="text-slate-400 font-medium">Još nema kreiranih kredita.</p>
          </div>
        ) : (
          credits.map(credit => {
            const confirmedPaid = credit.repayments
              .filter(r => r.status === 'CONFIRMED')
              .reduce((sum, r) => sum + r.amount, 0);
            
            const remaining = Math.max(0, credit.totalAmount - confirmedPaid);
            const progress = Math.min(100, (confirmedPaid / credit.totalAmount) * 100);
            
            return (
              <motion.div 
                layout
                key={credit.id} 
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">{credit.name}</h3>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">Ukupni iznos: {formatCurrency(credit.totalAmount)}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleOpenEditCredit(credit)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDeleteId({ type: 'CREDIT', id: credit.id })} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="mb-8 space-y-4">
                    <div className="flex justify-between items-baseline mb-1">
                      <p className="text-sm font-bold text-slate-500">Plaćeno</p>
                      <div className="text-right">
                        <span className="text-2xl font-black text-purple-600">{formatCurrency(confirmedPaid)}</span>
                        <span className="text-xs font-bold text-slate-400 ml-2">({progress.toFixed(1)}%)</span>
                      </div>
                    </div>
                    
                    <div className="h-4 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                      />
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <p className="text-sm font-bold text-slate-500">Preostalo za otplatu</p>
                       <p className="text-xl font-black text-slate-700 dark:text-slate-200">{formatCurrency(remaining)}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleOpenAddRepayment(credit.id)}
                      className="flex-1 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Nova uplata
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-50 dark:border-slate-800">
                  <details className="group">
                    <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors list-none">
                       <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                          Popis svih uplata ({credit.repayments.length})
                       </span>
                       <ChevronRight className="w-4 h-4 text-slate-300 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="p-6 pt-0 space-y-3">
                      {credit.repayments.length === 0 ? (
                        <p className="text-center py-4 text-slate-400 text-sm italic">Nema evidentiranih uplata.</p>
                      ) : (
                        credit.repayments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(repayment => (
                          <div key={repayment.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 group/item">
                             <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center",
                                  repayment.status === 'CONFIRMED' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                )}>
                                  {repayment.status === 'CONFIRMED' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-900 dark:text-white leading-tight">{formatCurrency(repayment.amount)}</p>
                                    {repayment.status === 'PENDING' && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-sm font-black uppercase">Čeka potvrdu</span>}
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    {new Date(repayment.date).toLocaleDateString()}
                                    {repayment.confirmedBy && ` • Odobrio: ${repayment.confirmedBy}`}
                                  </p>
                                  {repayment.note && <p className="text-[10px] text-slate-400 italic mt-0.5">{repayment.note}</p>}
                                </div>
                             </div>
                             <div className="flex gap-1 items-center">
                                {repayment.status === 'PENDING' && canApprove && (
                                   <button 
                                    onClick={() => approveRepayment(credit.id, repayment.id, currentUser?.username || 'Admin')}
                                    className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-bold text-[10px] px-3 py-2 uppercase"
                                   >
                                     Odobri
                                   </button>
                                )}
                                <button 
                                  onClick={() => setConfirmDeleteId({ type: 'REPAYMENT', id: repayment.id, extra: credit.id })}
                                  className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          </div>
                        ))
                      )}
                    </div>
                  </details>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Credit Modal */}
      <AnimatePresence>
        {isCreditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreditModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                   <CreditCard className="w-6 h-6 text-purple-600" />
                   {editingCredit ? 'Uredi kredit' : 'Novi kredit'}
                </h3>
                <button onClick={() => setIsCreditModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <form onSubmit={handleCreditSubmit} className="p-6 space-y-4">
                <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Naziv kredita</label>
                   <input type="text" required value={creditFormData.name} onChange={e => setCreditFormData({...creditFormData, name: e.target.value})} placeholder="npr. Kredit renovacija" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" />
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Ukupni iznos (€)</label>
                   <input type="number" step="0.01" required value={creditFormData.totalAmount || ''} onChange={e => setCreditFormData({...creditFormData, totalAmount: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" />
                </div>
                <div className="pt-4 flex gap-3">
                   <button type="button" onClick={() => setIsCreditModalOpen(false)} className="flex-1 py-4 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">Odustani</button>
                   <button type="submit" className="flex-1 py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200">Spremi</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Repayment Modal */}
      <AnimatePresence>
        {isRepaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRepaymentModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Plus className="w-6 h-6 text-emerald-600" />
                    Nova uplata kredita
                  </h3>
                  <button onClick={() => setIsRepaymentModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
               </div>
               <form onSubmit={handleRepaymentSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Iznos uplate (€)</label>
                    <input type="number" step="0.01" required value={repaymentFormData.amount || ''} onChange={e => setRepaymentFormData({...repaymentFormData, amount: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Napomena (opcionalno)</label>
                    <input type="text" value={repaymentFormData.note} onChange={e => setRepaymentFormData({...repaymentFormData, note: e.target.value})} placeholder="npr. Rata za travanj" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsRepaymentModalOpen(false)} className="flex-1 py-4 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">Odustani</button>
                    <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">Evidentiraj uplatu</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (!confirmDeleteId) return;
          if (confirmDeleteId.type === 'CREDIT') deleteCredit(confirmDeleteId.id);
          else if (confirmDeleteId.extra) deleteRepayment(confirmDeleteId.extra, confirmDeleteId.id);
          setConfirmDeleteId(null);
        }}
        title={confirmDeleteId?.type === 'CREDIT' ? "Izbriši cijeli kredit?" : "Izbriši uplatu?"}
        message={confirmDeleteId?.type === 'CREDIT' ? "Sve uplate povezane s ovim kreditom bit će obrisane." : "Jeste li sigurni da želite obrisati ovu uplatu?"}
      />
    </div>
  );
}
