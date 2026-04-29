import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PiggyBank, Info, Package, Trash2, ArrowDownRight, Plus, X, Edit2, Hammer } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Saving as SavingType } from '../types';

export default function Savings() {
  const { state, addSaving, updateSaving, deleteSaving, hasWriteAccess } = useApp();
  const canEdit = hasWriteAccess('ustede');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<SavingType, 'id'>>({
    name: '',
    amount: 0,
    materialId: undefined,
    workId: undefined,
    isAuto: false
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', amount: 0, materialId: undefined, workId: undefined, isAuto: false });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: SavingType) => {
    if (s.isAuto) return;
    setEditingId(s.id);
    setFormData({
      name: s.name,
      amount: s.amount,
      materialId: s.materialId,
      workId: s.workId,
      isAuto: s.isAuto
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateSaving(editingId, formData);
    } else {
      addSaving(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Uštede</h1>
          <p className="text-slate-500 mt-1 font-medium">Pregled automatskih i ručno unesenih ušteda na projektu</p>
        </div>
        {canEdit && ( <button 
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-emerald-100 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nova ušteda
        </button> )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.savings.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
             <PiggyBank className="w-12 h-12 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-400 italic">Nema evidentiranih ušteda. Pritisnite gumb iznad za ručni unos ili unesite materijale za auto-izračun.</p>
          </div>
        ) : (
          state.savings.map((s) => {
            const linkedMaterial = s.materialId ? state.materials.find(m => m.id === s.materialId) : null;
            const linkedWork = s.workId ? state.works.find(w => w.id === s.workId) : null;
            
            return (
              <motion.div 
                layout
                key={s.id}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
              >
                <div className="flex justify-between items-start mb-4 relative z-10">
                   <div className={cn(
                     "p-3 rounded-2xl",
                     s.amount >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                   )}>
                      <PiggyBank className="w-6 h-6" />
                   </div>
                   {!s.isAuto && canEdit && (
                     <div className="flex items-center gap-2 transition-opacity">
                        <button 
                          onClick={() => handleOpenEdit(s)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setConfirmDeleteId(s.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                   )}
                </div>
                
                <div className="relative z-10">
                  <h3 className="font-bold text-slate-900 mb-1">{s.name}</h3>
                  <div className={cn(
                    "text-3xl font-black mb-4",
                    s.amount >= 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {s.amount >= 0 ? '+' : ''}{formatCurrency(s.amount)}
                  </div>
                  
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {s.isAuto ? (
                        <>
                          <Info className="w-3 h-3" />
                          Auto izračun
                        </>
                      ) : 'Ručni unos'}
                    </div>
                    <div className="flex gap-2">
                      {linkedMaterial && (
                         <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold border border-slate-100">
                            <Package className="w-3 h-3 text-slate-400" />
                            {linkedMaterial.name}
                         </div>
                      )}
                      {linkedWork && (
                         <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold border border-slate-100">
                            <Hammer className="w-3 h-3 text-slate-400" />
                            {linkedWork.name}
                         </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "absolute -bottom-10 -right-10 w-32 h-32 blur-3xl opacity-10 rounded-full",
                  s.amount >= 0 ? "bg-emerald-500" : "bg-red-500 text-red-600"
                )}></div>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="bg-emerald-50 p-6 rounded-3xl flex gap-4 items-start border border-emerald-100">
         <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
            <ArrowDownRight className="w-5 h-5" />
         </div>
         <div>
            <p className="text-sm font-bold text-emerald-900 mb-1">Upravljanje uštedama</p>
            <p className="text-sm text-emerald-700 leading-relaxed">
              Uštede se automatski računaju iz razlike planiranog i plaćenog troška materijala, ali ih možete dodavati i ručno. 
              Ručne uštede možete povezati s konkretnim radovima ili materijalima radi bolje evidencije.
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
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <PiggyBank className="w-6 h-6 text-emerald-600" />
                  {editingId ? 'Uredi uštedu' : 'Nova ušteda'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Naziv uštede</label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="npr. Popust na pločice"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Iznos uštede (€)</label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    value={formData.amount || ''}
                    onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-medium uppercase tracking-wider">Unesite pozitivan iznos za uštedu, negativan za prekoračenje</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Poveži s materijalom</label>
                    <select 
                      value={formData.materialId || ''}
                      onChange={e => setFormData({...formData, materialId: e.target.value || undefined})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    >
                      <option value="">Nijedan</option>
                      {state.materials.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Poveži s radovima</label>
                    <select 
                      value={formData.workId || ''}
                      onChange={e => setFormData({...formData, workId: e.target.value || undefined})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    >
                      <option value="">Nijedan</option>
                      {state.works.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Odustani
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
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
        onConfirm={() => confirmDeleteId && deleteSaving(confirmDeleteId)}
        title="Izbriši uštedu?"
        message="Jeste li sigurni da želite izbrisati ovu uštedu? Automatske uštede se ne mogu brisati ovdje, već promjenom cijene materijala."
      />
    </div>
  );
}
