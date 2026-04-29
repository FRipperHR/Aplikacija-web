import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, User, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { login, state } = useApp();
  const [username, setUsername] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'admin' | 'member'>('admin');
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(username, identifier);
    if (!success) {
      setError('Neispravni podaci za prijavu. Provjerite korisničko ime i ' + (mode === 'admin' ? 'lozinku.' : 'PIN.'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-8 md:p-10"
        >
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Renovacija apartman</h1>
            <p className="text-slate-500 mt-2">Pratite troškove adaptacije i renovacije</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
            <button
              onClick={() => { setMode('admin'); setError(''); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${mode === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Admin
            </button>
            <button
              onClick={() => { setMode('member'); setError(''); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${mode === 'member' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Članovi
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Korisničko ime / Ime
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="npr. josip"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {mode === 'admin' ? 'Lozinka' : 'PIN'}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type={mode === 'admin' ? 'password' : 'text'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={mode === 'admin' ? '••••••••' : 'Unesite PIN'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  required
                />
              </div>
              {mode === 'member' && (
                <p className="mt-2 text-xs text-slate-400">PIN može sadržavati slova i brojeve.</p>
              )}
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-center border border-red-100"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-200 active:scale-[0.98] transition-all"
            >
              Prijavi se
            </button>
          </form>

          <footer className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold">
              Moderno vođenje renovacije
            </p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
}
