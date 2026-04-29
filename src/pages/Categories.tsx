import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Tags, Plus, Edit2, Trash2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export default function Categories() {
  const { state, addCategory, updateCategory, deleteCategory } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<{id: string, name: string} | null>(null);
  const [name, setName] = useState('');

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: {id: string, name: string}) => {
    setEditingCategory(c);
    setName(c.name);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategory(editingCategory.id, name);
    } else {
      addCategory(name);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Kategorije</h1>
          <p className="text-slate-500 mt-1 font-medium">Upravljajte grupama troškova i materijala</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nova kategorija
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col divide-y divide-slate-100">
        {state.categories.map((c) => (
          <motion.div
            layout
            key={c.id}
            className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
          >
             <div className="flex items-center gap-4">
               <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">
                  <Tags className="w-5 h-5" />
               </div>
               <h3 className="font-bold text-slate-900">{c.name}</h3>
             </div>
            
            <div className="flex items-center gap-1">
               <button 
                  onClick={() => handleOpenEdit(c)} 
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Preimenuj"
               >
                  <Edit2 className="w-4 h-4" />
               </button>
               <button 
                  onClick={() => setConfirmDeleteId(c.id)} 
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Izbriši"
               >
                  <Trash2 className="w-4 h-4" />
               </button>
            </div>
          </motion.div>
        ))}
        {state.categories.length === 0 && (
          <div className="p-8 text-center text-slate-400">
             Nema kreiranih kategorija.
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-6 rounded-3xl flex gap-4 items-start border border-blue-100">
         <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
            <Info className="w-5 h-5" />
         </div>
         <div>
            <p className="text-sm font-bold text-blue-900 mb-1">Važno o kategorijama</p>
            <p className="text-sm text-blue-700 leading-relaxed">
              Izmjena naziva kategorije automatski će se odraziti na sve materijale i uplate povezane s tom kategorijom. 
              Sustav ne sadrži kategoriju "Režije" prema vašim zahtjevima.
            </p>
         </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
                 <Plus className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">{editingCategory ? 'Uredi kategoriju' : 'Nova kategorija'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                  required 
                  autoFocus
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="npr. Spavaća soba"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-center" 
                />
                <div className="flex gap-3 pt-4">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl">Odustani</button>
                   <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl">Spremi</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && deleteCategory(confirmDeleteId)}
        title="Izbriši kategoriju?"
        message="Jeste li sigurni da želite izbrisati ovu kategoriju? Materijali koji su u njoj će ostati bez kategorije."
      />
    </div>
  );
}
