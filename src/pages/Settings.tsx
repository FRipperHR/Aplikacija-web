import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserCircle, Lock, Shield, CheckCircle2, User, Smile } from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../types';

export default function Settings() {
  const { currentUser, updateMemberPin, updateUserProfile } = useApp();
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStatus, setPinStatus] = useState('');
  
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [profileStatus, setProfileStatus] = useState('');

  const emojis = ['😊', '😎', '👷', '👩‍🔧', '🚀', '💡', '🏡', '🛠️', '🎨', '🔥', '⭐', ''];

  if (!currentUser) return null;

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      alert('Pini se ne podudaraju!');
      return;
    }
    if (newPin.length < 4) {
      alert('PIN mora imati barem 4 znaka.');
      return;
    }
    await updateMemberPin(currentUser.id, newPin);
    setNewPin('');
    setConfirmPin('');
    setPinStatus('PIN uspješno promijenjen!');
    setTimeout(() => setPinStatus(''), 3000);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(currentUser.id, displayName, avatar);
    setProfileStatus('Profil uspješno ažuriran!');
    setTimeout(() => setProfileStatus(''), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Postavke računa</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Upravljajte svojim korisničkim profilom</p>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="bg-slate-900 p-8 text-white flex items-center gap-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
             <UserCircle className="w-32 h-32" />
           </div>
           
           <div className="w-20 h-20 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-400 text-3xl font-bold border-4 border-white/20 relative z-10 shrink-0">
              {currentUser.avatar ? currentUser.avatar : (currentUser.displayName?.[0] || currentUser.username[0]).toUpperCase()}
           </div>
           <div className="relative z-10">
              <h2 className="text-3xl font-black tracking-tight">{currentUser.displayName || currentUser.username}</h2>
              <p className="text-slate-400 mt-1">@{currentUser.username}</p>
              <div className="flex gap-2 mt-3">
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
                 <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <Smile className="w-5 h-5" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Izgled profila</h3>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-md">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Prikazano ime</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="npr. Josip Horvat"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-900 dark:text-white"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Avatar / Emoji</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {emojis.map((em, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAvatar(em)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border ${avatar === em ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 shadow-sm' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                        >
                          {em || <User className="w-5 h-5 text-slate-400" />}
                        </button>
                      ))}
                    </div>
                    <input 
                      type="text" 
                      value={avatar}
                      onChange={e => setAvatar(e.target.value)}
                      placeholder="Ili unesite svoj emoji"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-900 dark:text-white"
                    />
                 </div>
                 
                 {profileStatus && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold flex items-center gap-2 border border-emerald-100 dark:border-emerald-500/20">
                       <CheckCircle2 className="w-5 h-5" />
                       {profileStatus}
                    </motion.div>
                 )}

                 <button 
                  type="submit"
                  className="bg-indigo-600 dark:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-all active:scale-95"
                 >
                   Spremi profil
                 </button>
              </form>
           </section>

           <section className="pt-8 border-t border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-2 mb-6">
                 <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Lock className="w-5 h-5" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Sigurnost</h3>
              </div>

              <form onSubmit={handleUpdatePin} className="space-y-4 max-w-md">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Novi PIN</label>
                    <input 
                      type="text" 
                      value={newPin}
                      onChange={e => setNewPin(e.target.value)}
                      placeholder="Unesite novi PIN"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 dark:text-white"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Potvrdite PIN</label>
                    <input 
                      type="text" 
                      value={confirmPin}
                      onChange={e => setConfirmPin(e.target.value)}
                      placeholder="Ponovite novi PIN"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 dark:text-white"
                    />
                 </div>
                 
                 {pinStatus && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold flex items-center gap-2 border border-emerald-100 dark:border-emerald-500/20">
                       <CheckCircle2 className="w-5 h-5" />
                       {pinStatus}
                    </motion.div>
                 )}

                 <button 
                  type="submit"
                  className="bg-slate-900 dark:bg-sky-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-slate-800 dark:hover:bg-sky-400 transition-all active:scale-95"
                 >
                   Promijeni PIN
                 </button>
              </form>
           </section>

           <section className="pt-8 border-t border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-2 mb-4">
                 <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                    <User className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">Informacije o pristupu</h3>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 leading-relaxed line-clamp-2">
                Vaš račun ima pristup sljedećim sekcijama aplikacije na temelju dozvola koje je postavio administrator.
              </p>
              <div className="flex flex-wrap gap-2">
                 {Object.entries(currentUser.permissions).map(([key, val]) => val && (
                   <span key={key} className="px-3 py-1 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800/50">
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
