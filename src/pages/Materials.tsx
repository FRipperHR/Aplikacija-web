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
  Hammer,
  PiggyBank
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Material } from '../types';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export default function Materials() {
  const { state, addMaterial, updateMaterial, deleteMaterial, addDelivery, addWork, hasWriteAccess, currentUser } = useApp();

  // If user has read-only globally but write access to this module, they can add/edit materials.
  const canEdit = hasWriteAccess('materijali');
  const availableCategories = state.categories;
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMaterials = state.materials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  type MaterialItem = {
    id?: string;
    name: string;
    categoryId: string;
    quantity: number;
    pricePerUnit: number;
    savingAmount: number;
    hasSaving?: boolean;
    savingNote?: string;
    date: string;
  };

  const defaultItem = (): MaterialItem => ({
    name: '',
    categoryId: state.categories[0]?.id || '',
    quantity: 1,
    pricePerUnit: 0,
    savingAmount: 0,
    hasSaving: false,
    savingNote: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [formData, setFormData] = useState({
    items: [defaultItem()],
    deliveryCost: 0,
    workCost: 0,
  });

  const handleOpenAdd = () => {
    setEditingMaterial(null);
    setFormData({
      items: [defaultItem()],
      deliveryCost: 0,
      workCost: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Material) => {
    setEditingMaterial(m);
    setFormData({
      items: [{
        name: m.name,
        categoryId: m.categoryId,
        quantity: m.quantity,
        pricePerUnit: m.pricePerUnit,
        savingAmount: m.savingAmount || 0,
        hasSaving: m.hasSaving || false,
        savingNote: m.savingNote || '',
        date: m.date || new Date().toISOString().split('T')[0],
      }],
      deliveryCost: m.deliveryCost,
      workCost: m.workCost,
    });
    setIsModalOpen(true);
  };

  const updateItem = (index: number, updates: Partial<MaterialItem>) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      const item = { ...newItems[index], ...updates };
      newItems[index] = item;
      return { ...prev, items: newItems };
    });
  };

  const updateSharedCost = (key: 'deliveryCost' | 'workCost', val: number) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMaterial) {
      updateMaterial(editingMaterial.id, {
        name: formData.items[0].name,
        categoryId: formData.items[0].categoryId,
        quantity: formData.items[0].quantity,
        pricePerUnit: formData.items[0].pricePerUnit,
        savingAmount: formData.items[0].savingAmount,
        deliveryCost: formData.deliveryCost,
        workCost: formData.workCost,
        hasSaving: formData.items[0].hasSaving,
        savingNote: formData.items[0].savingNote,
        date: formData.items[0].date,
      });
    } else {
      // Adding multiple
      const newIds: string[] = [];
      formData.items.forEach(item => {
         const material: Omit<Material, 'id'> = {
           name: item.name,
           categoryId: item.categoryId,
           quantity: item.quantity,
           pricePerUnit: item.pricePerUnit,
           savingAmount: item.savingAmount,
           // if multiple items, deliveryCost and workCost per material should be 0 because we will link them to a shared entity
           deliveryCost: formData.items.length > 1 ? 0 : formData.deliveryCost,
           workCost: formData.items.length > 1 ? 0 : formData.workCost,
           hasSaving: item.hasSaving,
           savingNote: item.savingNote,
           date: item.date,
         };
         const id = addMaterial(material);
         if (id) newIds.push(id);
      });
      
      if (formData.items.length > 1) {
         if (formData.deliveryCost > 0) {
            addDelivery({
               name: `Zajednička dostava (${formData.items.length} stavke)`,
               amount: formData.deliveryCost,
               savingAmount: 0,
               materialIds: newIds,
               note: `Kreirano za: ${formData.items.map(i => i.name).join(', ')}`,
               date: formData.items[0].date
            });
         }
         if (formData.workCost > 0) {
            addWork({
               name: `Zajednički radovi (${formData.items.length} stavke)`,
               amount: formData.workCost,
               savingAmount: 0,
               materialIds: newIds,
               note: `Kreirano za: ${formData.items.map(i => i.name).join(', ')}`,
               date: formData.items[0].date
            });
         }
      }
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">MATERIJALI</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">Upravljajte nabavkom i troškovima materijala</p>
        </div>
        {canEdit && (
          <button 
            onClick={handleOpenAdd}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-5 rounded-lg text-xs shadow-sm transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Novi materijal
          </button>
        )}
      </header>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pretraži materijale..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Naziv i Kategorija</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Količina</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Jed. Cijena</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Ukupno Bruto</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Ušteda</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right font-bold text-sky-600">Neto Investicija</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-12"></th>
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
                const bruto = m.quantity * m.pricePerUnit;
                // Sum all savings linked to this material from global state
                const specificSavings = state.savings.filter(s => s.materialId === m.id);
                const totalSaving = specificSavings.reduce((acc, s) => acc + s.amount, 0);
                const neto = bruto - totalSaving;
                const categoryName = state.categories.find(c => c.id === m.categoryId)?.name || 'Ostalo';

                return (
                  <motion.tr 
                    layout
                    key={m.id} 
                    className="hover:bg-slate-50 dark:bg-slate-800/50 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-[13px] truncate">{m.name}</p>
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
                    <td className="px-4 py-3 text-center text-[13px] font-medium text-slate-600 dark:text-slate-400">
                       {m.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-700 dark:text-slate-300">
                       {formatCurrency(m.pricePerUnit)}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-medium text-slate-400">
                       <span className={cn(totalSaving !== 0 && "line-through opacity-50")}>
                        {formatCurrency(bruto)}
                       </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                       <span className={cn(
                         "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter",
                         totalSaving > 0 ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : totalSaving < 0 ? "bg-red-100 dark:bg-red-500/20 text-red-700" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                       )}>
                         -{formatCurrency(totalSaving)}
                       </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-black text-slate-900 dark:text-white">
                       {formatCurrency(neto)}
                    </td>
                    <td className="px-4 py-3 text-right">
                       {canEdit && (
                         <div className="flex items-center gap-1 transition-opacity justify-end">
                            <button onClick={() => handleOpenEdit(m)} className="p-1.5 text-slate-400 hover:text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:bg-sky-500/10 rounded transition-all">
                               <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setConfirmDeleteId(m.id)} className="p-1.5 text-slate-400 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-500/10 rounded transition-all">
                               <Trash2 className="w-3.5 h-3.5" />
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
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                {editingMaterial ? 'Uredi materijal' : 'Dodaj novi materijal'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-6">
                  {formData.items.map((item, index) => (
                    <div key={index} className="relative p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50">
                      {formData.items.length > 1 && (
                        <div className="absolute -top-3 -right-3">
                          <button 
                            type="button" 
                            onClick={() => setFormData(p => ({...p, items: p.items.filter((_, i) => i !== index)}))}
                            className="bg-red-100 text-red-600 rounded-full p-2 hover:bg-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Naziv materijala {index + 1}</label>
                          <input 
                            required
                            value={item.name}
                            onChange={e => updateItem(index, { name: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            placeholder="npr. Keramičke pločice"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Kategorija</label>
                            <select 
                              value={item.categoryId}
                              onChange={e => updateItem(index, { categoryId: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            >
                              {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Datum kupnje</label>
                            <input 
                              type="date"
                              required
                              value={item.date}
                              onChange={e => updateItem(index, { date: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Komada</label>
                            <input 
                              type="number"
                              required
                              min="0.01" step="0.01"
                              value={item.quantity || ''}
                              onChange={e => updateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Cijena/kom (€)</label>
                            <input 
                              type="number"
                              step="0.01" required
                              value={item.pricePerUnit || ''}
                              onChange={e => updateItem(index, { pricePerUnit: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                          </div>
                        </div>

                         <div className="md:col-span-2 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl space-y-4">
                           <div className="flex items-center gap-2 mb-2">
                             <input 
                               type="checkbox"
                               id={`saving-${index}`}
                               checked={item.hasSaving}
                               onChange={e => updateItem(index, { hasSaving: e.target.checked })}
                               className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                             />
                             <label htmlFor={`saving-${index}`} className="text-sm font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                               <PiggyBank className="w-4 h-4" />
                               Ova stavka ima uštedu
                             </label>
                           </div>

                           {item.hasSaving && (
                             <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                               <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mb-1 uppercase tracking-tighter">Iznos uštede (€)</label>
                                    <input 
                                      type="number" step="0.01"
                                      value={item.savingAmount || ''}
                                      onChange={e => updateItem(index, { savingAmount: parseFloat(e.target.value) || 0 })}
                                      className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 text-sm font-bold text-emerald-900 dark:text-emerald-100"
                                      placeholder="0.00"
                                    />
                                 </div>
                                 <div className="flex flex-col justify-end">
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Nova Neto Cijena</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                      {formatCurrency((item.quantity * item.pricePerUnit) - (item.savingAmount || 0))}
                                    </p>
                                 </div>
                               </div>

                               <div>
                                 <label className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mb-1 uppercase tracking-tighter">Napomena o uštedi</label>
                                 <input 
                                   type="text"
                                   value={item.savingNote || ''}
                                   onChange={e => updateItem(index, { savingNote: e.target.value })}
                                   placeholder="Kako ste uštedjeli?"
                                   className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 text-sm text-emerald-900 dark:text-emerald-100"
                                 />
                               </div>
                             </motion.div>
                           )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {!editingMaterial && (
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, items: [...p.items, defaultItem()] }))}
                      className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-500 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Dodaj još jedan materijal (+ istoj dostavi)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-default">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Zajednički trošak dostave (€)</label>
                    <input 
                      type="number" step="0.01"
                      value={formData.deliveryCost || ''}
                      onChange={e => updateSharedCost('deliveryCost', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Zajednički trošak radova (€)</label>
                    <input 
                      type="number" step="0.01"
                      value={formData.workCost || ''}
                      onChange={e => updateSharedCost('workCost', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-50 dark:bg-slate-800 transition-all"
                   >
                     Odustani
                   </button>
                   <button 
                    type="submit"
                    className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
                   >
                     {editingMaterial ? 'Spremi promjene' : 'Spremi sve materijale'}
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
