const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'src', 'pages');

const replacements = [
  { match: /bg-white/g, replace: 'bg-white dark:bg-slate-900' },
  { match: /text-slate-900/g, replace: 'text-slate-900 dark:text-white' },
  { match: /text-slate-800/g, replace: 'text-slate-800 dark:text-slate-200' },
  { match: /text-slate-700/g, replace: 'text-slate-700 dark:text-slate-300' },
  { match: /text-slate-600/g, replace: 'text-slate-600 dark:text-slate-400' },
  { match: /text-slate-500/g, replace: 'text-slate-500 dark:text-slate-400' },
  { match: /border-slate-200/g, replace: 'border-slate-200 dark:border-slate-800' },
  { match: /border-slate-100/g, replace: 'border-slate-100 dark:border-slate-800/50' },
  { match: /bg-slate-50\b/g, replace: 'bg-slate-50 dark:bg-slate-800' },
  { match: /bg-slate-100\b/g, replace: 'bg-slate-100 dark:bg-slate-800/50' },
  { match: /bg-sky-50\b/g, replace: 'bg-sky-50 dark:bg-sky-500/10' },
  { match: /bg-sky-100\b/g, replace: 'bg-sky-100 dark:bg-sky-500/20' },
  { match: /bg-emerald-50\b/g, replace: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { match: /bg-emerald-100\b/g, replace: 'bg-emerald-100 dark:bg-emerald-500/20' },
  { match: /text-sky-600/g, replace: 'text-sky-600 dark:text-sky-400' },
  { match: /text-sky-700/g, replace: 'text-sky-700 dark:text-sky-300' },
  { match: /text-sky-800/g, replace: 'text-sky-800 dark:text-sky-200' },
  { match: /text-sky-900/g, replace: 'text-sky-900 dark:text-sky-100' },
  { match: /text-emerald-600/g, replace: 'text-emerald-600 dark:text-emerald-400' },
  { match: /text-emerald-700/g, replace: 'text-emerald-700 dark:text-emerald-300' },
  { match: /text-emerald-800/g, replace: 'text-emerald-800 dark:text-emerald-200' },
  { match: /text-emerald-900/g, replace: 'text-emerald-900 dark:text-emerald-100' },
  { match: /text-amber-600/g, replace: 'text-amber-600 dark:text-amber-400' },
  { match: /text-amber-700/g, replace: 'text-amber-700 dark:text-amber-300' },
  { match: /text-red-500/g, replace: 'text-red-500 dark:text-red-400' },
  { match: /text-red-600/g, replace: 'text-red-600 dark:text-red-400' },
  { match: /bg-red-50\b/g, replace: 'bg-red-50 dark:bg-red-500/10' },
  { match: /bg-red-100\b/g, replace: 'bg-red-100 dark:bg-red-500/20' },
];

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(r => {
    content = content.replace(r.match, r.replace);
  });
  // Prevent duplicate darks:
  content = content.replace(/dark:(bg|text|border|shadow)-[a-z0-9/]+ dark:\1-[a-z0-9/]+/g, (match) => {
    return match.split(' ')[0]; // just take the first if there are duplicates
  });
  fs.writeFileSync(file, content, 'utf8');
}

fs.readdirSync(DIR).forEach(file => {
  if (file.endsWith('.tsx') && file !== 'Dashboard.tsx' && file !== 'Login.tsx') {
    processFile(path.join(DIR, file));
  }
});

console.log('Done mapping components');
