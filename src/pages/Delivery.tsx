import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Truck, Info, Package, Trash2, Plus, X, Edit2 } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { MultiSelect } from '../components/ui/MultiSelect';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Delivery as DeliveryType } from '../types';

export default function Delivery() {
  const { state, addDelivery, updateDelivery, deleteDelivery } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<DeliveryType, 'id'>>({
    name: '',
    amount: 0,
    materialIds: []
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', amount: 0, materialIds: [] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: DeliveryType) => {
    setEditingId(d.id);
    setFormData({
      name: d.name,
      amount: d.amount,
      materialIds: [...d.materialIds]
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateDelivery(editingId, formData);
    } else {
      addDelivery(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dostava</h1>
          <p className="text-slate-500 mt-1 font-medium">Pregled i upravljanje troškovima dostave</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-slate-200 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nova dostava
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.deliveries.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
             <Truck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-400 italic">Nema evidentiranih dostava.</p>
          </div>
        ) : (
          state.deliveries.map((d) => {
            const linkedMaterials = state.materials.filter(m => d.materialIds.includes(m.id));
            
            return (
              <motion.div 
                layout
                key={d.id}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative"
              >
                <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Truck className="w-6 h-6" />
                   </div>
                   <div className="flex items-center gap-2 transition-opacity">
                      <button 
                        onClick={() => handleOpenEdit(d)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(d.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
                
                <h3 className="font-bold text-slate-900 mb-1">{d.name}</h3>
                <div className="text-2xl font-black text-slate-900 mb-4">{formatCurrency(d.amount)}</div>
                
                <div className="pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <Package className="w-3 h-3" />
                    Povezano s:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {linkedMaterials.length > 0 ? linkedMaterials.map(m => (
                      <span key={m.id} className="inline-flex px-2 py-1 bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold border border-slate-100">
                        {m.name}
                      </span>
                    )) : (
                      <span className="text-[10px] text-slate-400 italic">Samostalna stavka</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="bg-blue-50 p-6 rounded-3xl flex gap-4 items-start border border-blue-100">
         <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
            <Info className="w-5 h-5" />
         </div>
         <div>
            <p className="text-sm font-bold text-blue-900 mb-1">Dostava i materijali</p>
            <p className="text-sm text-blue-700 leading-relaxed">
              Dostavu možete dodati samostalno ili je povezati s više materijala odjednom. 
              Iznos dostave se pribraja ukupnim troškovima projekta.
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
                  <Truck className="w-6 h-6 text-blue-600" />
                  {editingId ? 'Uredi dostavu' : 'Nova dostava'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Naziv dostave</label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="npr. Dostava keramike i sanitarija"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Iznos (€)</label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    value={formData.amount || ''}
                    onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Poveznica s materijalima (opcionalno)</label>
                  <MultiSelect 
                    options={state.materials}
                    selectedIds={formData.materialIds}
                    onChange={ids => setFormData({...formData, materialIds: ids})}
                    placeholder="Odaberi materijale..."
                  />
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
        onConfirm={() => confirmDeleteId && deleteDelivery(confirmDeleteId)}
        title="Izbriši dostavu?"
        message="Jeste li sigurni da želite izbrisati ovu stavku dostave? Ova radnja je nepovratna."
      />
    </div>
  );
}
