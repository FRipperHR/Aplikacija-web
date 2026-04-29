import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserCircle, Lock, Shield, CheckCircle2, User } from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../types';

export default function Settings() {
  const { currentUser, updateMemberPin } = useApp();
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [status, setStatus] = useState('');

  if (!currentUser) return null;

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      alert('Pini se ne podudaraju!');
      return;
    }
    if (newPin.length < 4) {
      alert('PIN mora imati barem 4 znaka.');
      return;
    }
    updateMemberPin(currentUser.id, newPin);
    setNewPin('');
    setConfirmPin('');
    setStatus('PIN uspješno promijenjen!');
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Postavke računa</h1>
        <p className="text-slate-500 mt-1 font-medium">Upravljajte svojim korisničkim profilom</p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-900 p-8 text-white flex items-center gap-6">
           <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-3xl font-bold border-4 border-white/20">
              {currentUser.username[0].toUpperCase()}
           </div>
           <div>
              <h2 className="text-2xl font-bold">{currentUser.username}</h2>
              <div className="flex gap-2 mt-2">
                 <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {currentUser.role === UserRole.ADMIN ? 'Administrator' : 'Član'}
                 </span>
              </div>
           </div>
        </div>

        <div className="p-8 space-y-10">
           <section>
              <div className="flex items-center gap-2 mb-6">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Lock className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900">Promjena PIN-a</h3>
              </div>

              <form onSubmit={handleUpdatePin} className="space-y-4 max-w-md">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Novi PIN</label>
                    <input 
                      type="text" 
                      value={newPin}
                      onChange={e => setNewPin(e.target.value)}
                      placeholder="Unesite novi PIN"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Potvrdite PIN</label>
                    <input 
                      type="text" 
                      value={confirmPin}
                      onChange={e => setConfirmPin(e.target.value)}
                      placeholder="Ponovite novi PIN"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                 </div>
                 
                 {status && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4" />
                       {status}
                    </motion.div>
                 )}

                 <button 
                  type="submit"
                  className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95"
                 >
                   Spremi promjene
                 </button>
              </form>
           </section>

           <section className="pt-8 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                 <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                    <User className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900">Informacije o pristupu</h3>
              </div>
              <p className="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2">
                Vaš račun ima pristup sljedećim sekcijama aplikacije na temelju dozvola koje je postavio administrator.
              </p>
              <div className="flex flex-wrap gap-2">
                 {Object.entries(currentUser.permissions).map(([key, val]) => val && (
                   <span key={key} className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200/50">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                   </span>
                 ))}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}
