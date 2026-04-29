import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Database, Download, Upload, AlertTriangle, CheckCircle2, History, RefreshCcw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { cn, formatCurrency } from '../lib/utils';

export default function Backup() {
  const { state, exportData, importData, createSnapshot, deleteSnapshot } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
  const [showConfirmImport, setShowConfirmImport] = useState(false);
  const [pendingFileContent, setPendingFileContent] = useState<string | null>(null);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `renovacija_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setStatus({ type: 'success', message: 'Backup uspješno spremljen na računalo.' });
    setTimeout(() => setStatus({ type: 'idle', message: '' }), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setPendingFileContent(content);
        setShowConfirmImport(true);
      };
      reader.readAsText(file);
    }
  };

  const confirmImport = () => {
    if (!pendingFileContent) return;
    
    // Create automatic snapshot before import
    createSnapshot('Automatski snapshot prije uvoza podataka');
    
    const success = importData(pendingFileContent);
    if (success) {
      setStatus({ type: 'success', message: 'Podaci uspješno uvezeni! Automatski je napravljen snapshot starog stanja.' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setStatus({ type: 'error', message: 'Greška pri uvozu. Datoteka je možda oštećena ili neispravna.' });
    }
    setPendingFileContent(null);
    setTimeout(() => setStatus({ type: 'idle', message: '' }), 3000);
  };

  const restoreSnapshot = (data: string) => {
    createSnapshot('Snapshot trenutnog stanja prije povratka na staru verziju');
    importData(data);
    setStatus({ type: 'success', message: 'Snapshot uspješno vraćen!' });
    setTimeout(() => setStatus({ type: 'idle', message: '' }), 3000);
  };

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Postavke i Backup</h1>
        <p className="text-slate-500 mt-1 font-medium">Osigurajte svoje podatke i upravljajte ažuriranjima</p>
      </header>

      {status.type !== 'idle' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-6 rounded-3xl flex items-center gap-4 border sticky top-4 z-50 shadow-xl backdrop-blur-md",
            status.type === 'success' ? "bg-emerald-50/90 border-emerald-100 text-emerald-700" : "bg-red-50/90 border-red-100 text-red-700"
          )}
        >
          {status.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          <p className="font-bold">{status.message}</p>
        </motion.div>
      )}

      {/* 1. Main Backup Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center group"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
             <Download className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Export podataka (Lokalni Backup)</h2>
          <p className="text-slate-500 text-xs mb-6 max-w-xs">Preuzmite cijelu bazu u JSON formatu na svoje računalo ili spremite na USB eksterni disk.</p>
          <button onClick={handleExport} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all font-bold">Spremi .JSON</button>
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center group"
        >
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
             <Upload className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Import podataka</h2>
          <p className="text-slate-500 text-xs mb-6 max-w-xs">Učitajte .json datoteku. <strong>Trenutni podaci će biti spremljeni u snapshot.</strong></p>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all font-bold">Učitaj .JSON</button>
        </motion.div>
      </div>

      {/* 3. Snapshots / History */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
              <History className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Interna povijest (Mape u backupu)</h2>
          </div>
          <button 
            onClick={() => createSnapshot('Ručni snapshot')}
            className="text-amber-700 bg-amber-50 px-4 py-2 rounded-xl font-bold text-sm hover:bg-amber-100 transition-all"
          >
            Spremi novo stanje
          </button>
        </div>

        <div className="space-y-3">
          {(!state.snapshots || state.snapshots.length === 0) ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 italic">
               Nema spremljenih verzija u povijesti.
            </div>
          ) : (
            state.snapshots.map(s => (
              <div key={s.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                     <RefreshCcw className="w-4 h-4 text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{s.note}</p>
                    <p className="text-xs text-slate-400">{new Date(s.date).toLocaleString('hr-HR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => restoreSnapshot(s.data)}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all font-bold"
                  >
                    Vrati podatke
                  </button>
                  <button 
                    onClick={() => deleteSnapshot(s.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Update Center */}
      <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10">
           <RefreshCcw className="w-48 h-48" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <RefreshCcw className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold">Update Centar</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-slate-300 mb-6 leading-relaxed">
                Kada preuzmete novi kod (zip/update), trebate zamijeniti datoteke u mapi <strong>/root/webpage/update</strong>. 
                Vaši podaci su sigurni jer su spremljeni u bazi preglednika.
              </p>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-xs font-black shrink-0">1</div>
                  <p className="text-sm text-slate-300"><span className="text-white font-bold">Napravi Export</span> podataka iznad za svaki slučaj.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-xs font-black shrink-0">2</div>
                  <p className="text-sm text-slate-300"><span className="text-white font-bold">Ubaci nove datoteke</span> u vašu serversku mapu.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-xs font-black shrink-0">3</div>
                  <p className="text-sm text-slate-300"><span className="text-white font-bold">Osvježi (F5)</span> stranicu. Podaci će se sami učitati.</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm self-start">
               <div className="flex items-center gap-2 text-amber-400 mb-4">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="font-bold text-sm uppercase tracking-wider">Provjera za ažuriranje</p>
               </div>
               <p className="text-xs text-slate-400 mb-6">Pomoću ovog gumba aplikacija provjerava ima li novih promjena na serveru u mapi /update.</p>
               <button 
                onClick={() => {
                  setStatus({ type: 'success', message: 'Sustav je spreman za prihvat novih datoteka. Zamijenite datoteke na serveru i osvježite stranicu.' });
                  setTimeout(() => setStatus({ type: 'idle', message: '' }), 5000);
                }}
                className="w-full py-4 bg-white text-slate-900 font-black rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
               >
                 Ažuriraj sustav (Update)
               </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showConfirmImport}
        onClose={() => {
          setShowConfirmImport(false);
          setPendingFileContent(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        onConfirm={confirmImport}
        title="Učitaj podatke?"
        message="Jeste li sigurni? Sustav će prije uvoza napraviti automatski snapshot trenutnog stanja u povijest."
        confirmLabel="Učitaj i spremi snapshot"
        variant="warning"
      />
    </div>
  );
}
