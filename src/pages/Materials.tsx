import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Package,
  Layers,
  Euro,
  Info,
  Truck,
  Hammer
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Material } from '../types';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export default function Materials() {
  const { state, addMaterial, updateMaterial, deleteMaterial } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const filteredMaterials = state.materials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [formData, setFormData] = useState({
    name: '',
    categoryId: state.categories[0]?.id || '',
    quantity: 1,
    pricePerUnit: 0,
    deliveryCost: 0,
    workCost: 0,
    plannedCost: 0,
    actualPaid: 0,
  });

  const handleOpenAdd = () => {
    setEditingMaterial(null);
    setFormData({
      name: '',
      categoryId: state.categories[0]?.id || '',
      quantity: 1,
      pricePerUnit: 0,
      deliveryCost: 0,
      workCost: 0,
      plannedCost: 0,
      actualPaid: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Material) => {
    setEditingMaterial(m);
    setFormData({
      name: m.name,
      categoryId: m.categoryId,
      quantity: m.quantity,
      pricePerUnit: m.pricePerUnit,
      deliveryCost: m.deliveryCost,
      workCost: m.workCost,
      plannedCost: m.plannedCost,
      actualPaid: m.actualPaid,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMaterial) {
      updateMaterial(editingMaterial.id, formData);
    } else {
      addMaterial(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">MATERIJALI</h1>
          <p className="text-xs text-slate-500 font-medium tracking-wide">Upravljajte nabavkom i troškovima materijala</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-5 rounded-lg text-xs shadow-sm transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Novi materijal
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pretraži materijale..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Naziv i Kategorija</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Količina</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Jed. Cijena</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Planirano</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Uplaćeno</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ušteda</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400 italic text-sm">
                  Nema pronađenih materijala.
                </td>
              </tr>
            ) : (
              filteredMaterials.map((m) => {
                const materialCost = m.quantity * m.pricePerUnit;
                const saving = m.plannedCost - m.actualPaid;
                const categoryName = state.categories.find(c => c.id === m.categoryId)?.name || 'Ostalo';

                return (
                  <motion.tr 
                    layout
                    key={m.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-800 text-[13px] truncate">{m.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black text-sky-500 uppercase tracking-tighter">
                              {categoryName}
                            </p>
                            {state.deliveries.some(d => d.materialIds.includes(m.id)) && (
                              <Truck className="w-3 h-3 text-blue-400" />
                            )}
                            {state.works.some(w => w.materialIds.includes(m.id)) && (
                              <Hammer className="w-3 h-3 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-[13px] font-medium text-slate-600">
                       {m.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-700">
                       {formatCurrency(m.pricePerUnit)}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-medium text-slate-400">
                       {formatCurrency(m.plannedCost)}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-black text-slate-900">
                       {formatCurrency(m.actualPaid)}
                    </td>
                    <td className="px-4 py-3 text-right">
                       <span className={cn(
                         "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter",
                         saving > 0 ? "bg-emerald-100 text-emerald-700" : saving < 0 ? "bg-red-100 text-red-700" : "bg-sky-100 text-sky-700"
                       )}>
                         {formatCurrency(saving)}
                       </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1 transition-opacity justify-end">
                         <button onClick={() => handleOpenEdit(m)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-all">
                            <Edit2 className="w-3.5 h-3.5" />
                         </button>
                         <button onClick={() => setConfirmDeleteId(m.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                         </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {editingMaterial ? 'Uredi materijal' : 'Dodaj novi materijal'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Naziv materijala</label>
                    <input 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="npr. Keramičke pločice"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Kategorija</label>
                    <select 
                      value={formData.categoryId}
                      onChange={e => setFormData({...formData, categoryId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    >
                      {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Količina</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      placeholder="1"
                      value={formData.quantity || ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        const newCost = (val * formData.pricePerUnit) + formData.deliveryCost + formData.workCost;
                        setFormData({...formData, quantity: val, plannedCost: Number(newCost.toFixed(2))});
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Cijena po komadu (€)</label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.pricePerUnit || ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        const newCost = (formData.quantity * val) + formData.deliveryCost + formData.workCost;
                        setFormData({...formData, pricePerUnit: val, plannedCost: Number(newCost.toFixed(2))});
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Trošak dostave (€)</label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.deliveryCost || ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        const newCost = (formData.quantity * formData.pricePerUnit) + val + formData.workCost;
                        setFormData({...formData, deliveryCost: val, plannedCost: Number(newCost.toFixed(2))});
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Trošak radova (€)</label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.workCost || ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        const newCost = (formData.quantity * formData.pricePerUnit) + formData.deliveryCost + val;
                        setFormData({...formData, workCost: val, plannedCost: Number(newCost.toFixed(2))});
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="bg-blue-50 p-6 rounded-2xl md:col-span-2 grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-blue-700 mb-2 uppercase tracking-tighter">Planirani trošak mat. (€)</label>
                        <input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.plannedCost || ''}
                          onChange={e => setFormData({...formData, plannedCost: parseFloat(e.target.value) || 0})}
                          className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-black text-blue-900"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-blue-700 mb-2 uppercase tracking-tighter">Stvarno plaćeno (€)</label>
                        <input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.actualPaid || ''}
                          onChange={e => setFormData({...formData, actualPaid: parseFloat(e.target.value) || 0})}
                          className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-black text-blue-900"
                        />
                     </div>
                     <div className="col-span-2 pt-2 border-t border-blue-100 mt-2 flex justify-between items-center">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Automatska ušteda:</span>
                        <span className="text-lg font-black text-blue-900">{formatCurrency(formData.plannedCost - formData.actualPaid)}</span>
                     </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                   >
                     Odustani
                   </button>
                   <button 
                    type="submit"
                    className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
                   >
                     Spremi materijal
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
        onConfirm={() => confirmDeleteId && deleteMaterial(confirmDeleteId)}
        title="Izbriši materijal?"
        message="Jeste li sigurni da želite izbrisati ovaj materijal? Svi povezani podaci o uštedama će također biti izbrisani."
      />
    </div>
  );
}
