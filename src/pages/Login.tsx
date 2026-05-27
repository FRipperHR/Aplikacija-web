import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, User, Home } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(username, identifier);
    if (!success) {
      setError('Neispravni podaci za prijavu. Provjerite korisničko ime i lozinku/PIN.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      <div className="max-w-md w-full relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10"
        >
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-sky-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-sky-600/30 ring-4 ring-sky-50">
              <Home className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Apartman</h1>
            <p className="text-sm font-medium text-slate-500 mt-2">Nadzor renovacije i adaptacije</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">
                Korisničko ime
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Unesite korisničko ime"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">
                Lozinka / PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Unesite lozinku ili PIN"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all font-mono"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl flex items-center border border-red-100"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all"
            >
              Prijavi se
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
