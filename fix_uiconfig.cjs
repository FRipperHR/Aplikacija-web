const fs = require('fs');

// Admin zone
let content = fs.readFileSync('src/pages/AdminZone.tsx', 'utf8');
content = content.replace(/, updateUIConfig /g, " ");
content = content.replace(/  const \[appName, setAppName\] = useState\(.*?\);\n/g, "");
content = content.replace(/  const \[welcomeTitle, setWelcomeTitle\] = useState\(.*?\);\n/g, "");
fs.writeFileSync('src/pages/AdminZone.tsx', content);

// Dashboard
content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
content = content.replace(/\{state\.uiConfig\?\.welcomeTitle\} \{state\.uiConfig\?\.appName\}/g, "Dobrodošli u sustav Renovacija apartman");
fs.writeFileSync('src/pages/Dashboard.tsx', content);

// Login
content = fs.readFileSync('src/pages/Login.tsx', 'utf8');
content = content.replace(/  const uiConfig = .*?;\n/g, "");
content = content.replace(/\{uiConfig\.appName\}/g, "Renovacija apartman");
content = content.replace(/\{uiConfig\.welcomeTitle\}/g, "Pratite troškove adaptacije i renovacije");
fs.writeFileSync('src/pages/Login.tsx', content);

// Sidebar
content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
content = content.replace(/\{state\.uiConfig\?\.appName(.*?) \/\*.*\*\//g, "'RENOVACIJA'"); 
content = content.replace(/title=\{state\.uiConfig\?\.appName\}/g, "title='RENOVACIJA'"); 
content = content.replace(/\{state\.uiConfig\?\.appName\?\.toUpperCase\(\) \|\| 'RENOVACIJA'\}/g, "RENOVACIJA");
fs.writeFileSync('src/components/Sidebar.tsx', content);

console.log("Cleaned up remaining uiConfig references.");
