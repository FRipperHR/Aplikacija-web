import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Hammer, Info, Package, Trash2, Plus, X, Edit2, PiggyBank } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { MultiSelect } from '../components/ui/MultiSelect';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Work as WorkType } from '../types';

export default function Works() {
  const { state, addWork, updateWork, deleteWork, hasWriteAccess } = useApp();
  const canEdit = hasWriteAccess('radovi');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<WorkType, 'id'>>({
    name: '',
    amount: 0,
    savingAmount: 0,
    hasSaving: false,
    savingNote: '',
    materialIds: [],
    date: new Date().toISOString().split('T')[0]
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      amount: 0, 
      savingAmount: 0, 
      hasSaving: false, 
      savingNote: '', 
      materialIds: [],
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w: WorkType) => {
    setEditingId(w.id);
    setFormData({
      name: w.name,
      amount: w.amount,
      savingAmount: w.savingAmount || 0,
      hasSaving: w.hasSaving || false,
      savingNote: w.savingNote || '',
      materialIds: [...w.materialIds],
      date: w.date || new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateWork(editingId, formData);
    } else {
      addWork(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Radovi</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Pregled i upravljanje troškovima rada</p>
        </div>
        {canEdit && ( <button 
          onClick={handleOpenAdd}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-slate-200 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novi radovi
        </button> )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.works.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
             <Hammer className="w-12 h-12 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-400 italic">Nema evidentiranih radova.</p>
          </div>
        ) : (
          state.works.map((w) => {
            const specificSavings = state.savings.filter(s => s.workId === w.id);
            const totalSaving = specificSavings.reduce((acc, s) => acc + s.amount, 0);
            const neto = w.amount - totalSaving;
            const linkedMaterials = state.materials.filter(m => w.materialIds.includes(m.id));
            
            return (
              <motion.div 
                layout
                key={w.id}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all group relative"
              >
                <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-2xl">
                      <Hammer className="w-6 h-6" />
                   </div>
                   <div className="absolute top-4 right-4">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                      totalSaving > 0 ? "bg-emerald-100 text-emerald-700" : totalSaving < 0 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-400"
                    )}>
                      {totalSaving !== 0 ? `Ušteda: ${formatCurrency(totalSaving)}` : 'Nema uštede'}
                    </span>
                  </div>
                   {canEdit && (
                     <div className="flex items-center gap-2 transition-opacity">
                        <button 
                          onClick={() => handleOpenEdit(w)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setConfirmDeleteId(w.id)}
                          className="p-2 text-slate-400 hover:text-red-500 dark:text-red-400 hover:bg-red-50 dark:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                   )}
                </div>
                
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">{w.name}</h3>
                {w.note && <p className="text-[10px] text-slate-400 mb-2 truncate">{w.note}</p>}
                
                <div className="flex items-baseline gap-2 mb-4">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatCurrency(neto)}
                  </div>
                  {totalSaving !== 0 && (
                    <div className="text-xs text-slate-400 line-through">
                      {formatCurrency(w.amount)}
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-slate-50 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <Package className="w-3 h-3" />
                      Povezano s materijalima:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {linkedMaterials.length > 0 ? linkedMaterials.map(m => (
                        <span key={m.id} className="inline-flex px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[10px] font-bold border border-slate-100 dark:border-slate-800/50">
                          {m.name}
                        </span>
                      )) : (
                        <span className="text-[10px] text-slate-400 italic">Nema povezanih materijala</span>
                      )}
                    </div>
                  </div>

                  {state.savings.filter(s => s.workId === w.id).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <PiggyBank className="w-3 h-3" />
                        Povezane uštede:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {state.savings.filter(s => s.workId === w.id).map(s => (
                          <span key={s.id} className={cn(
                            "inline-flex px-2 py-1 rounded-md text-[10px] font-bold border",
                            s.amount >= 0 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100" : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100"
                          )}>
                            {s.name}: {formatCurrency(s.amount)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="bg-amber-50 p-6 rounded-3xl flex gap-4 items-start border border-amber-100">
         <div className="p-2 bg-amber-100 rounded-xl text-amber-600 dark:text-amber-400">
            <Info className="w-5 h-5" />
         </div>
         <div>
            <p className="text-sm font-bold text-amber-900 mb-1">Radovi i materijali</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
              Radove možete dodati samostalno ili ih povezati s ugradnjom određenih materijala. 
              Trošak radova se pribraja ukupnoj investiciji.
            </p>
         </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Hammer className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  {editingId ? 'Uredi radove' : 'Novi radovi'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Naziv radova</label>
                    <input 
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="npr. Postavljanje parketa"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Datum</label>
                    <input 
                      type="date"
                      required
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Cijena (€)</label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      required
                      value={formData.amount || ''}
                      onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Neto Investicija</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      {formatCurrency(formData.amount - (state.savings.find(s => s.workId === editingId && s.isAuto)?.amount || formData.savingAmount))}
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl space-y-4">
                   <div className="flex items-center gap-2">
                     <input 
                       type="checkbox"
                       id="workHasSaving"
                       checked={formData.hasSaving}
                       onChange={e => setFormData({...formData, hasSaving: e.target.checked})}
                       className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                     />
                     <label htmlFor="workHasSaving" className="text-sm font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                       <PiggyBank className="w-4 h-4" />
                       Ovaj rad ima uštedu
                     </label>
                   </div>

                   {formData.hasSaving && (
                     <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mb-1 uppercase tracking-tighter">Iznos uštede (€)</label>
                          <input 
                            type="number" step="0.01"
                            value={formData.savingAmount || ''}
                            onChange={e => setFormData({...formData, savingAmount: parseFloat(e.target.value) || 0})}
                            className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 text-sm font-bold text-emerald-900 dark:text-emerald-100"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mb-1 uppercase tracking-tighter">Napomena o uštedi</label>
                          <input 
                            type="text"
                            value={formData.savingNote || ''}
                            onChange={e => setFormData({...formData, savingNote: e.target.value})}
                            placeholder="Kako ste uštedjeli?"
                            className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 text-sm text-emerald-900 dark:text-emerald-100"
                          />
                        </div>
                     </motion.div>
                   )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Poveznica s materijalima (opcionalno)</label>
                  <MultiSelect 
                    options={state.materials}
                    selectedIds={formData.materialIds}
                    onChange={ids => setFormData({...formData, materialIds: ids})}
                    placeholder="Odaberi materijale..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Napomena (opcionalno)</label>
                  <input 
                    type="text"
                    value={formData.note || ''}
                    onChange={e => setFormData({...formData, note: e.target.value})}
                    placeholder="siva mala slova će biti vidljiva..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-xs"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-50 dark:bg-slate-800 transition-all"
                  >
                    Odustani
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
                  >
                    Spremi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && deleteWork(confirmDeleteId)}
        title="Izbriši radove?"
        message="Jeste li sigurni da želite izbrisati ovu stavku radova? Ova radnja je nepovratna."
      />
    </div>
  );
}
