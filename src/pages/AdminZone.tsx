import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, UserPlus, ChevronDown, ChevronUp, Lock, CheckCircle2, Circle, Trash2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole, UserPermissions } from '../types';
import { cn } from '../lib/utils';
import { ConfirmModal } from '../components/ui/ConfirmModal';

const PermissionToggle = ({ 
  label, 
  value, 
  onChange 
}: { 
  label: string, 
  value: boolean, 
  onChange: (val: boolean) => void 
}) => (
  <div 
    onClick={() => onChange(!value)}
    className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-800/50 hover:bg-slate-100 dark:bg-slate-800/50 transition-colors cursor-pointer"
  >
    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">{label}</span>
    <div className={cn(
      "w-8 h-4.5 rounded-full relative transition-colors",
      value ? "bg-sky-400" : "bg-slate-300"
    )}>
      <div className={cn(
        "absolute top-0.5 w-3.5 h-3.5 bg-white dark:bg-slate-900 rounded-full transition-all shadow-sm shadow-black/10",
        value ? "right-0.5" : "left-0.5"
      )} />
    </div>
  </div>
);

const UserRow = ({ user, isAdmin, onDelete }: { user: User, isAdmin: boolean, onDelete: (id: string) => void, key?: string }) => {
  const { state, updateUserPermissions, resetUserPin, currentUser } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newPin, setNewPin] = useState('');

  const handlePermissionChange = (key: keyof UserPermissions, val: any) => {
    updateUserPermissions(user.id, { ...user.permissions, [key]: val });
  };

  const handleResetPin = async () => {
    if (newPin) {
      await resetUserPin(user.id, newPin);
      setNewPin('');
      alert('PIN uspješno resetiran!');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-3 shadow-sm">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center font-bold text-white text-[10px] border border-white/10 shrink-0">
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-[13px]">{user.username}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className={cn(
                 "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                 user.role === UserRole.ADMIN ? "bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300" : "bg-amber-100 text-amber-700 dark:text-amber-300"
               )}>
                 {user.role === UserRole.ADMIN ? 'Admin' : 'Member'}
               </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user.role !== UserRole.ADMIN && user.id !== currentUser?.id && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(user.id);
              }}
              className="p-2 text-slate-300 hover:text-red-500 dark:text-red-400 hover:bg-red-50 dark:bg-red-500/10 rounded-lg transition-all"
              title="Izbriši korisnika"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-800/30"
          >
             <div className="p-4">
               {user.role === UserRole.ADMIN ? (
                 <div className="mb-4 p-4 bg-sky-50 dark:bg-sky-500/10 border border-sky-100 rounded-xl text-center">
                   <p className="text-sm font-bold text-sky-800 dark:text-sky-200">Administrator ima sva prava pristupa sustavu.</p>
                   <p className="text-xs text-sky-600 dark:text-sky-400 mt-1">Nije moguće mijenjati pojedinačne dozvole za admin korisnike.</p>
                 </div>
               ) : (
                 <>
                   <div className="mb-4">
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        <PermissionToggle label="Kredit" value={user.permissions.kredit} onChange={(v) => handlePermissionChange('kredit', v)} />
                        <PermissionToggle label="Uplate" value={user.permissions.uplate} onChange={(v) => handlePermissionChange('uplate', v)} />
                        <PermissionToggle label="Uštede" value={user.permissions.ustede} onChange={(v) => handlePermissionChange('ustede', v)} />
                        <PermissionToggle label="Materijali" value={user.permissions.materijali} onChange={(v) => handlePermissionChange('materijali', v)} />
                        <PermissionToggle label="Dostava" value={user.permissions.dostava} onChange={(v) => handlePermissionChange('dostava', v)} />
                        <PermissionToggle label="Radovi" value={user.permissions.radovi} onChange={(v) => handlePermissionChange('radovi', v)} />
                        <PermissionToggle label="Kategorije" value={user.permissions.kategorije} onChange={(v) => handlePermissionChange('kategorije', v)} />
                        <PermissionToggle label="Kredit Odobrenje" value={user.permissions.approveCredit || false} onChange={(v) => handlePermissionChange('approveCredit', v)} />
                        <PermissionToggle label="Izvješća" value={user.permissions.izvjesca} onChange={(v) => handlePermissionChange('izvjesca', v)} />
                        <PermissionToggle label="Skeniranje" value={user.permissions.canScanReceipts || false} onChange={(v) => handlePermissionChange('canScanReceipts', v)} />
                        <PermissionToggle label="Admin Zona" value={user.permissions.adminZona} onChange={(v) => handlePermissionChange('adminZona', v)} />
                        <PermissionToggle label="Backup" value={user.permissions.backup} onChange={(v) => handlePermissionChange('backup', v)} />
                        <PermissionToggle label="Samo pregled (Read Only)" value={user.permissions.readOnly || false} onChange={(v) => handlePermissionChange('readOnly', v)} />
                     </div>
                   </div>

                   {user.permissions.readOnly && (
                     <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
                       <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 leading-none uppercase tracking-tighter">Omogući Pisanje (Write) Za Module:</p>
                       <div className="flex flex-wrap gap-2">
                         {[
                           { id: 'materijali', name: 'Materijali' },
                           { id: 'dostava', name: 'Dostava' },
                           { id: 'radovi', name: 'Radovi' },
                           { id: 'ustede', name: 'Uštede' },
                           { id: 'uplate', name: 'Uplate' },
                           { id: 'kredit', name: 'Kredit' }
                         ].map(mod => (
                           <label key={mod.id} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 cursor-pointer hover:bg-slate-50 dark:bg-slate-800">
                             <input 
                               type="checkbox" 
                               checked={user.permissions.allowedWriteModules?.includes(mod.id as any) || false}
                               onChange={(e) => {
                                 const set = new Set(user.permissions.allowedWriteModules || []);
                                 if (e.target.checked) set.add(mod.id as any);
                                 else set.delete(mod.id as any);
                                 handlePermissionChange('allowedWriteModules', Array.from(set));
                               }}
                               className="w-3 h-3 text-sky-500 rounded border-slate-300 focus:ring-sky-500"
                             />
                             <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-none">{mod.name}</span>
                           </label>
                         ))}
                       </div>
                     </div>
                   )}
                 </>
               )}

               {user.role !== UserRole.ADMIN && (
                 <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 flex gap-4 items-end">
                    <div className="flex-1 max-w-xs">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 leading-none uppercase tracking-tighter">Sigurnost: Resetiraj PIN</label>
                      <input 
                        type="text"
                        value={newPin}
                        onChange={e => setNewPin(e.target.value)}
                        placeholder="Novi PIN"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 font-mono text-[13px] focus:ring-2 focus:ring-sky-500/20 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <button 
                      onClick={handleResetPin}
                      className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shrink-0"
                    >
                      Resetirati
                    </button>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function AdminZone() {
  const { state, addUser, deleteUser, updateSettings } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  
  const DEFAULT_PERMS: UserPermissions = {
    kredit: true, uplate: true, ustede: true, materijali: true, 
    dostava: true, radovi: true, kategorije: true, izvjesca: true, 
    adminZona: false, backup: false, readOnly: false, allowedCategories: []
  };
  const [newPermissions, setNewPermissions] = useState<UserPermissions>(DEFAULT_PERMS);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    await addUser(newName, newPin, newPermissions);
    setIsModalOpen(false);
    setNewName('');
    setNewPin('');
    setNewPermissions(DEFAULT_PERMS);
  };

  const handleNewPermissionChange = (key: keyof UserPermissions, val: any) => {
    setNewPermissions(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">ADMIN ZONA</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">Upravljanje članovima tima, dozvolama i postavkama</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-5 rounded-lg text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Dodaj člana
          </button>
        </div>
      </header>
      
      <div className="flex flex-col gap-1">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Članovi projekta</h2>
        {state.users.map(u => (
          <UserRow key={u.id} user={u} isAdmin={u.role === UserRole.ADMIN} onDelete={setConfirmDeleteId} />
        ))}
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm mt-6">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Postavke Umjetne Inteligencije (AI Skeniranje računa)</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Gemini API Ključ (API Key)</label>
            <input 
              type="password" 
              value={state.settings?.geminiApiKey || ''}
              onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
              placeholder="Unesite svoj Google Gemini API Key" 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-mono text-slate-900 dark:text-white" 
            />
            <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
              Ovaj API ključ je potreban za skeniranje računa pomoću AI-ja. Ključ možete dobiti na <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">Google AI Studio stranici</a>. Važno: Postavke se spremaju redovito.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm mt-6">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Dnevnik aktivnosti (Zadnjih 50)</h2>
        {(!state.auditLogs || state.auditLogs.length === 0) ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">Nema zabilježenih aktivnosti</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">Datum</th>
                  <th className="px-3 py-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">Korisnik</th>
                  <th className="px-3 py-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">Akcija</th>
                  <th className="px-3 py-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">Entitet</th>
                  <th className="px-3 py-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">Detalji</th>
                </tr>
              </thead>
              <tbody>
                {state.auditLogs.map(log => (
                  <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:bg-slate-800/50">
                    <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">{new Date(log.date).toLocaleString('hr-HR')}</td>
                    <td className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300">{log.username}</td>
                    <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400"><span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800/50 rounded text-[9px] font-black text-slate-600 dark:text-slate-400">{log.action}</span></td>
                    <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">{log.entity}</td>
                    <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 truncate max-w-[200px]" title={log.details}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                 <UserPlus className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">Dodaj novog člana</h2>
              <form onSubmit={handleAddMember} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ime i prezime / Korisničko ime</label>
                  <input required value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Početni PIN</label>
                  <input required value={newPin} onChange={e => setNewPin(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-900 dark:text-white" placeholder="npr. 4455" />
                  <p className="mt-2 text-xs text-slate-400">PIN može sadržavati slova i brojeve.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Početna prava pristupa</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                     <PermissionToggle label="Kredit" value={newPermissions.kredit} onChange={(v) => handleNewPermissionChange('kredit', v)} />
                     <PermissionToggle label="Uplate" value={newPermissions.uplate} onChange={(v) => handleNewPermissionChange('uplate', v)} />
                     <PermissionToggle label="Uštede" value={newPermissions.ustede} onChange={(v) => handleNewPermissionChange('ustede', v)} />
                     <PermissionToggle label="Materijali" value={newPermissions.materijali} onChange={(v) => handleNewPermissionChange('materijali', v)} />
                     <PermissionToggle label="Dostava" value={newPermissions.dostava} onChange={(v) => handleNewPermissionChange('dostava', v)} />
                     <PermissionToggle label="Radovi" value={newPermissions.radovi} onChange={(v) => handleNewPermissionChange('radovi', v)} />
                     <PermissionToggle label="Kategorije" value={newPermissions.kategorije} onChange={(v) => handleNewPermissionChange('kategorije', v)} />
                     <PermissionToggle label="Kredit Odobrenje" value={newPermissions.approveCredit || false} onChange={(v) => handleNewPermissionChange('approveCredit', v)} />
                     <PermissionToggle label="Izvješća" value={newPermissions.izvjesca} onChange={(v) => handleNewPermissionChange('izvjesca', v)} />
                     <PermissionToggle label="Skeniranje" value={newPermissions.canScanReceipts || false} onChange={(v) => handleNewPermissionChange('canScanReceipts', v)} />
                     <PermissionToggle label="Backup" value={newPermissions.backup} onChange={(v) => handleNewPermissionChange('backup', v)} />
                     <PermissionToggle label="Samo pregled (Read Only)" value={newPermissions.readOnly || false} onChange={(v) => handleNewPermissionChange('readOnly', v)} />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-50 dark:bg-slate-800 transition-all">Odustani</button>
                   <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 dark:shadow-none">Dodaj člana</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && deleteUser(confirmDeleteId)}
        title="Izbriši člana tima?"
        message="Jeste li sigurni da želite izbrisati ovog člana? Osoba više neće imati pristup projektu."
      />
    </div>
  );
}
