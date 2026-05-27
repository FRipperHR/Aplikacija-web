import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, User, UserRole, UserPermissions, Category, Material, Delivery, Work, Saving, Payment, Credit, AuditLog, AppModule } from '../types';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface AppContextType {
  state: AppState;
  isLoading: boolean;
  syncStatus: SyncStatus;
  currentUser: User | null;
  login: (username: string, identifier: string) => Promise<boolean>;
  logout: () => void;
  updateMemberPin: (userId: string, newPin: string) => Promise<void>;
  updateUserProfile: (userId: string, displayName: string, avatar: string) => void;
  
  // State mutations
  addUser: (name: string, pin: string, permissions?: UserPermissions) => Promise<void>;
  updateUserPermissions: (userId: string, permissions: UserPermissions) => void;
  resetUserPin: (userId: string, newPin: string) => Promise<void>;
  deleteUser: (userId: string) => void;
  
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  
  addMaterial: (material: Omit<Material, 'id'>) => string;
  updateMaterial: (id: string, material: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  
  addDelivery: (delivery: Omit<Delivery, 'id'>) => void;
  updateDelivery: (id: string, delivery: Partial<Delivery>) => void;
  deleteDelivery: (id: string) => void;
  
  addWork: (work: Omit<Work, 'id'>) => void;
  updateWork: (id: string, work: Partial<Work>) => void;
  deleteWork: (id: string) => void;
  
  addSaving: (saving: Omit<Saving, 'id'>) => void;
  updateSaving: (id: string, saving: Partial<Saving>) => void;
  deleteSaving: (id: string) => void;
  
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  
  addCredit: (credit: Omit<Credit, 'id' | 'repayments'>) => void;
  updateCredit: (id: string, credit: Partial<Credit>) => void;
  deleteCredit: (id: string) => void;
  addRepayment: (creditId: string, amount: number, note?: string) => void;
  approveRepayment: (creditId: string, repaymentId: string, userId: string) => void;
  deleteRepayment: (creditId: string, repaymentId: string) => void;

  setLoanTarget: (amount: number) => void;
  createSnapshot: (note: string) => void;
  deleteSnapshot: (id: string) => void;
  updateSettings: (settings: { geminiApiKey?: string }) => void;
  
  importData: (jsonData: string) => boolean;
  exportData: () => string;
  addAuditLog: (action: AuditLog['action'], entity: AuditLog['entity'], details: string) => void;
  hasWriteAccess: (moduleName: AppModule) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_PERMISSIONS: UserPermissions = {
  kredit: true,
  uplate: true,
  ustede: true,
  materijali: true,
  dostava: true,
  radovi: true,
  kategorije: true,
  izvjesca: true,
  adminZona: false,
  backup: false,
  readOnly: false,
  allowedCategories: [],
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const hashPinStatic = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for non-secure contexts (HTTP)
  // This is a simple non-cryptographic hash as a last resort
  let hash = 0;
  const pinStr = pin.toString();
  for (let i = 0; i < pinStr.length; i++) {
    const char = pinStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'fallback-' + Math.abs(hash).toString(16);
};

const INITIAL_STATE: AppState = {
  users: [],
  categories: [
    { id: '1', name: 'Kuhinja' },
    { id: '2', name: 'Kupaonica' },
    { id: '3', name: 'Dnevni boravak' },
  ],
  materials: [],
  deliveries: [],
  works: [],
  savings: [],
  payments: [],
  auditLogs: [],
};

const migrateData = (data: AppState): AppState => {
  const now = new Date().toISOString().split('T')[0];
  if (!data) return data;
  return {
    ...data,
    materials: (data.materials || []).map(m => ({ ...m, date: m.date || now })),
    deliveries: (data.deliveries || []).map(d => ({ ...d, date: d.date || now })),
    works: (data.works || []).map(w => ({ ...w, date: w.date || now })),
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setInternalState] = useState<AppState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  const setState: typeof setInternalState = useCallback((updater) => {
    setInternalState(prev => {
      const next = typeof updater === 'function' ? (updater as any)(prev) : updater;
      
      const dataChanged = 
        prev.materials !== next.materials ||
        prev.deliveries !== next.deliveries ||
        prev.works !== next.works ||
        prev.savings !== next.savings ||
        prev.payments !== next.payments ||
        prev.categories !== next.categories ||
        prev.users !== next.users ||
        prev.loanTarget !== next.loanTarget;
        
      // Ensure we don't accidentally override an explicitly set lastModified
      if (dataChanged && (!next.lastModified || next.lastModified === prev.lastModified)) {
         return { ...next, lastModified: new Date().toISOString() };
      }
      return next;
    });
  }, []);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem('renovacija_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Load state from API on mount and setup polling
  useEffect(() => {
    const fetchState = async () => {
      try {
        const response = await fetch('/api/state');
        if (response.ok) {
          const rawData = await response.json();
          const data = migrateData(rawData);
          setSyncStatus('success');
          setState((prev) => {
            // Only update if server has newer data, or we have no data
            if (!prev.lastModified || !data.lastModified || new Date(data.lastModified) > new Date(prev.lastModified)) {
              return data;
            }
            return prev;
          });
        } else if (isLoading) {
          // Fallback to localStorage on initial load if API fails
          const saved = localStorage.getItem('renovacija_app_state');
          if (saved) {
             const data = migrateData(JSON.parse(saved));
             setState(data);
          }
        }
      } catch (error) {
        if (!isLoading) {
          // If polling, just do a silent warning so we don't spam the UI with red error boxes if server restarts
          console.warn('Sync warning: Could not reach server');
        } else {
          console.error('Failed to fetch state:', error);
        }
        setSyncStatus('error');
        if (isLoading) {
          const saved = localStorage.getItem('renovacija_app_state');
          if (saved) {
             const data = migrateData(JSON.parse(saved));
             setState(data);
          }
        }
      } finally {
        if (isLoading) setIsLoading(false);
      }
    };

    fetchState(); // Initial fetch
    
    // Poll for updates every 3 seconds
    const intervalId = setInterval(fetchState, 3000);
    return () => clearInterval(intervalId);
  }, [isLoading, setState]);

  // Save state to API and localStorage when it changes
  useEffect(() => {
    if (isLoading) return;

    localStorage.setItem('renovacija_app_state', JSON.stringify(state));
    
    const saveState = async () => {
      setSyncStatus('syncing');
      try {
        const response = await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state),
        });
        if (response.ok) {
          setSyncStatus('success');
        } else {
          setSyncStatus('error');
        }
      } catch (error) {
        console.warn('Sync warning: Failed to save state to API');
        setSyncStatus('error');
      }
    };

    const timeoutId = setTimeout(saveState, 1000); // Debounce save
    return () => clearTimeout(timeoutId);
  }, [state, isLoading]);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('renovacija_current_user', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('renovacija_current_user');
    }
  }, [currentUser]);

  const login = async (username: string, identifier: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin: identifier })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          const user = data.user;
          setCurrentUser(user);
          
          // Auto-backup on login
          setState(prev => {
            const stateToSave = { ...prev, snapshots: undefined };
            const newSnapshot = {
              id: generateId(),
              date: new Date().toISOString(),
              note: `Automatski backup: Prijava korisnika ${user.username}`,
              data: JSON.stringify(stateToSave)
            };
            
            // Add audit log for login
            const newLog: AuditLog = {
              id: generateId(),
              date: new Date().toISOString(),
              userId: user.id,
              username: user.username,
              action: 'LOGIN',
              entity: 'USER',
              details: 'Uspješna prijava u sustav'
            };
            
            return {
              ...prev,
              snapshots: [newSnapshot, ...(prev.snapshots || [])].slice(0, 10), // Keep 10 max
              auditLogs: [newLog, ...(prev.auditLogs || [])].slice(0, 50) // Keep last 50 logs
            };
          });
          
          return true;
        }
      }
    } catch (e) {
      console.warn("Login failed via API", e);
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const addAuditLog = useCallback((action: AuditLog['action'], entity: AuditLog['entity'], details: string) => {
    setState(prev => {
      if (!currentUser) return prev;
      const newLog: AuditLog = {
        id: generateId(),
        date: new Date().toISOString(),
        userId: currentUser.id,
        username: currentUser.username,
        action,
        entity,
        details
      };
      return {
        ...prev,
        auditLogs: [newLog, ...(prev.auditLogs || [])].slice(0, 50)
      };
    });
  }, [currentUser, setState]);

  const hasWriteAccess = useCallback((moduleName: AppModule) => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;
    if (!currentUser.permissions.readOnly) return true;
    
    // If user is readOnly, check if they have specific write access to this module
    if (currentUser.permissions.allowedWriteModules && currentUser.permissions.allowedWriteModules.includes(moduleName)) {
      return true;
    }
    
    return false;
  }, [currentUser]);

  const updateMemberPin = async (userId: string, newPin: string) => {
    const hashed = await hashPinStatic(newPin);
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, pin: hashed } : u)
    }));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, pin: hashed } : null);
    }
  };

  const updateUserProfile = (userId: string, displayName: string, avatar: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, displayName, avatar } : u)
    }));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, displayName, avatar } : null);
    }
  };

  const addUser = async (name: string, pin: string, permissions?: UserPermissions) => {
    const hashed = await hashPinStatic(pin);
    const newUser: User = {
      id: Date.now().toString(),
      username: name,
      pin: hashed,
      role: UserRole.MEMBER,
      permissions: permissions || { ...DEFAULT_PERMISSIONS },
    };
    setState(prev => ({ ...prev, users: [...prev.users, newUser] }));
  };

  const updateUserPermissions = (userId: string, permissions: UserPermissions) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, permissions } : u)
    }));
  };

  const resetUserPin = async (userId: string, newPin: string) => {
    const hashed = await hashPinStatic(newPin);
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, pin: hashed } : u)
    }));
  };

  const deleteUser = (userId: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== userId)
    }));
  };

  const addCategory = (name: string) => {
    setState(prev => ({
      ...prev,
      categories: [...prev.categories, { id: Date.now().toString(), name }]
    }));
  };

  const updateCategory = (id: string, name: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, name } : c)
    }));
  };

  const deleteCategory = (id: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id)
    }));
  };

  // Synchronization Logic for Materials
  const syncMaterialArtifacts = (material: Material, oldMaterial?: Material) => {
    setState(prev => {
      let nextDeliveries = [...prev.deliveries];
      let nextWorks = [...prev.works];
      let nextSavings = [...prev.savings];

      // Handle Delivery
      if (material.deliveryCost > 0) {
        const existingDeliveryIdx = nextDeliveries.findIndex(d => d.materialIds.includes(material.id));
        if (existingDeliveryIdx > -1) {
          nextDeliveries[existingDeliveryIdx] = {
            ...nextDeliveries[existingDeliveryIdx],
            amount: material.deliveryCost,
            name: `Dostava: ${material.name}`,
            date: material.date
          };
        } else {
          nextDeliveries.push({
            id: `del-${material.id}`,
            name: `Dostava: ${material.name}`,
            amount: material.deliveryCost,
            materialIds: [material.id],
            date: material.date
          });
        }
      } else {
        nextDeliveries = nextDeliveries.filter(d => !d.materialIds.includes(material.id) || d.materialIds.length > 1);
        // If it was linked to multiple, we should just remove this material ID from it
        nextDeliveries = nextDeliveries.map(d => ({
          ...d,
          materialIds: d.materialIds.filter(mid => mid !== material.id)
        })).filter(d => d.materialIds.length > 0 || d.amount > 0);
      }

      // Handle Work
      if (material.workCost > 0) {
        const existingWorkIdx = nextWorks.findIndex(w => w.materialIds.includes(material.id));
        if (existingWorkIdx > -1) {
          nextWorks[existingWorkIdx] = {
            ...nextWorks[existingWorkIdx],
            amount: material.workCost,
            name: `Radovi: ${material.name}`,
            date: material.date
          };
        } else {
          nextWorks.push({
            id: `work-${material.id}`,
            name: `Radovi: ${material.name}`,
            amount: material.workCost,
            materialIds: [material.id],
            date: material.date
          });
        }
      } else {
        nextWorks = nextWorks.map(w => ({
          ...w,
          materialIds: w.materialIds.filter(mid => mid !== material.id)
        })).filter(w => w.materialIds.length > 0 || w.amount > 0);
      }

      // Handle Auto Saving
      const savingAmountValue = material.savingAmount;
      if (savingAmountValue !== 0 || material.hasSaving) {
        const existingSavingIdx = nextSavings.findIndex(s => s.materialId === material.id && s.isAuto);
        if (existingSavingIdx > -1) {
          nextSavings[existingSavingIdx] = {
            ...nextSavings[existingSavingIdx],
            amount: savingAmountValue,
            name: `Ušteda: ${material.name}`,
            note: material.savingNote
          };
        } else {
          nextSavings.push({
            id: `sav-mat-${material.id}`,
            name: `Ušteda: ${material.name}`,
            amount: savingAmountValue,
            materialId: material.id,
            isAuto: true,
            note: material.savingNote
          });
        }
      } else {
        nextSavings = nextSavings.filter(s => s.materialId !== material.id);
      }

      return {
        ...prev,
        deliveries: nextDeliveries,
        works: nextWorks,
        savings: nextSavings
      };
    });
  };

  const addMaterial = (m: Omit<Material, 'id'>) => {
    if (!hasWriteAccess('materijali')) return '';
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const newMaterial = { ...m, id };
    setState(prev => ({
      ...prev,
      materials: [...prev.materials, newMaterial]
    }));
    syncMaterialArtifacts(newMaterial);
    addAuditLog('CREATE', 'MATERIAL', `Dodan materijal: ${m.name}`);
    return id;
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    const mat = state.materials.find(m => m.id === id);
    if (!mat) return;
    if (!hasWriteAccess('materijali')) return;

    setState(prev => {
      const updatedMaterials = prev.materials.map(m => m.id === id ? { ...m, ...updates } : m);
      return { ...prev, materials: updatedMaterials };
    });
    setTimeout(() => {
      const latestMaterial = state.materials.find(m => m.id === id);
      if (latestMaterial) syncMaterialArtifacts({ ...latestMaterial, ...updates });
      addAuditLog('UPDATE', 'MATERIAL', `Ažuriran materijal: ${latestMaterial?.name || id}`);
    }, 0);
  };

  const deleteMaterial = (id: string) => {
    const mat = state.materials.find(m => m.id === id);
    if (!mat) return;
    if (!hasWriteAccess('materijali')) return;

    setState(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m.id !== id),
      deliveries: prev.deliveries.map(d => ({ ...d, materialIds: d.materialIds.filter(mid => mid !== id) })).filter(d => d.materialIds.length > 0 || d.id.startsWith('manual')),
      works: prev.works.map(w => ({ ...w, materialIds: w.materialIds.filter(mid => mid !== id) })).filter(w => w.materialIds.length > 0 || w.id.startsWith('manual')),
      savings: prev.savings.filter(s => s.materialId !== id)
    }));
    addAuditLog('DELETE', 'MATERIAL', `Obrisan materijal: ${mat.name}`);
  };

  const addDelivery = (d: Omit<Delivery, 'id'>) => {
    if (!hasWriteAccess('dostava')) return '';
    const id = `manual-${Date.now()}`;
    const newDel = { ...d, id };
    setState(prev => ({ ...prev, deliveries: [...prev.deliveries, newDel] }));
    syncDeliveryArtifacts(newDel);
    addAuditLog('CREATE', 'DELIVERY', `Dodana dostava: ${d.name}`);
    return id;
  };
  const updateDelivery = (id: string, updates: Partial<Delivery>) => {
    const del = state.deliveries.find(d => d.id === id);
    if (!del) return;
    if (!hasWriteAccess('dostava')) return;
    
    setState(prev => ({ ...prev, deliveries: prev.deliveries.map(d => d.id === id ? { ...d, ...updates } : d) }));
    setTimeout(() => {
      const latest = state.deliveries.find(d => d.id === id);
      if (latest) syncDeliveryArtifacts(latest);
      addAuditLog('UPDATE', 'DELIVERY', `Ažurirana dostava: ${updates.name || id}`);
    }, 0);
  };
  const deleteDelivery = (id: string) => {
    const del = state.deliveries.find(d => d.id === id);
    if (!del) return;
    if (!hasWriteAccess('dostava')) return;
    
    setState(prev => ({ 
      ...prev, 
      deliveries: prev.deliveries.filter(d => d.id !== id),
      savings: prev.savings.filter(s => s.deliveryId !== id)
    }));
    addAuditLog('DELETE', 'DELIVERY', `Obrisana dostava: ${del.name}`);
  };

  const syncDeliveryArtifacts = (del: Delivery) => {
    setState(prev => {
      let nextSavings = [...prev.savings];
      const savingAmountValue = del.savingAmount || 0;
      if (savingAmountValue !== 0 || del.hasSaving) {
        const existingSavingIdx = nextSavings.findIndex(s => s.deliveryId === del.id && s.isAuto);
        if (existingSavingIdx > -1) {
          nextSavings[existingSavingIdx] = {
            ...nextSavings[existingSavingIdx],
            amount: savingAmountValue,
            name: `Ušteda: ${del.name}`,
            note: del.savingNote
          };
        } else {
          nextSavings.push({
            id: `sav-del-${del.id}`,
            name: `Ušteda: ${del.name}`,
            amount: savingAmountValue,
            deliveryId: del.id,
            isAuto: true,
            note: del.savingNote
          });
        }
      } else {
        nextSavings = nextSavings.filter(s => s.deliveryId !== del.id);
      }
      return { ...prev, savings: nextSavings };
    });
  };

  const addWork = (w: Omit<Work, 'id'>) => {
    if (!hasWriteAccess('radovi')) return;
    const id = `manual-${Date.now()}`;
    const newWork = { ...w, id };
    setState(prev => ({ ...prev, works: [...prev.works, newWork] }));
    syncWorkArtifacts(newWork);
    addAuditLog('CREATE', 'WORK', `Dodani radovi: ${w.name}`);
  };
  const updateWork = (id: string, updates: Partial<Work>) => {
    const work = state.works.find(w => w.id === id);
    if (!work) return;
    if (!hasWriteAccess('radovi')) return;
    
    setState(prev => ({ ...prev, works: prev.works.map(w => w.id === id ? { ...w, ...updates } : w) }));
    setTimeout(() => {
      const latest = state.works.find(w => w.id === id);
      if (latest) syncWorkArtifacts(latest);
      addAuditLog('UPDATE', 'WORK', `Ažurirani radovi: ${updates.name || id}`);
    }, 0);
  };
  const deleteWork = (id: string) => {
    const work = state.works.find(w => w.id === id);
    if (!work) return;
    if (!hasWriteAccess('radovi')) return;
    
    setState(prev => ({ 
      ...prev, 
      works: prev.works.filter(w => w.id !== id),
      savings: prev.savings.filter(s => s.workId !== id)
    }));
    addAuditLog('DELETE', 'WORK', `Obrisani radovi: ${work.name}`);
  };

  const syncWorkArtifacts = (work: Work) => {
    setState(prev => {
      let nextSavings = [...prev.savings];
      const savingAmountValue = work.savingAmount;
      if (savingAmountValue !== 0 || work.hasSaving) {
        const existingSavingIdx = nextSavings.findIndex(s => s.workId === work.id && s.isAuto);
        if (existingSavingIdx > -1) {
          nextSavings[existingSavingIdx] = {
            ...nextSavings[existingSavingIdx],
            amount: savingAmountValue,
            name: `Ušteda: ${work.name}`,
            note: work.savingNote
          };
        } else {
          nextSavings.push({
            id: `sav-work-${work.id}`,
            name: `Ušteda: ${work.name}`,
            amount: savingAmountValue,
            workId: work.id,
            isAuto: true,
            note: work.savingNote
          });
        }
      } else {
        nextSavings = nextSavings.filter(s => s.workId !== work.id);
      }
      return { ...prev, savings: nextSavings };
    });
  };

  const addSaving = (s: Omit<Saving, 'id'>) => {
    if (!hasWriteAccess('ustede')) return;
    setState(prev => ({ ...prev, savings: [...prev.savings, { ...s, id: `manual-${Date.now()}` }] }));
    addAuditLog('CREATE', 'SAVING', `Dodana ušteda: ${s.name}`);
  };
  const updateSaving = (id: string, updates: Partial<Saving>) => {
    const sav = state.savings.find(s => s.id === id);
    if (!sav) return;
    if (!hasWriteAccess('ustede')) return;
    
    setState(prev => ({ ...prev, savings: prev.savings.map(s => s.id === id ? { ...s, ...updates } : s) }));
    addAuditLog('UPDATE', 'SAVING', `Ažurirana ušteda: ${updates.name || id}`);
  };
  const deleteSaving = (id: string) => {
    const sav = state.savings.find(s => s.id === id);
    if (!sav) return;
    if (!hasWriteAccess('ustede')) return;
    
    setState(prev => ({ ...prev, savings: prev.savings.filter(s => s.id !== id) }));
    addAuditLog('DELETE', 'SAVING', `Obrisana ušteda: ${sav.name}`);
  };

  const addPayment = (p: Omit<Payment, 'id'>) => {
    if (!hasWriteAccess('uplate')) return;
    setState(prev => ({ ...prev, payments: [...prev.payments, { ...p, id: Date.now().toString() }] }));
    addAuditLog('CREATE', 'PAYMENT', `Dodana uplata: ${p.name}`);
  };
  const updatePayment = (id: string, updates: Partial<Payment>) => {
    const payment = state.payments.find(p => p.id === id);
    if (!payment) return;
    if (!hasWriteAccess('uplate')) return;

    setState(prev => ({ ...prev, payments: prev.payments.map(p => p.id === id ? { ...p, ...updates } : p) }));
    addAuditLog('UPDATE', 'PAYMENT', `Ažurirana uplata: ${updates.name || id}`);
  };
  const deletePayment = (id: string) => {
    const payment = state.payments.find(p => p.id === id);
    if (!payment) return;
    if (!hasWriteAccess('uplate')) return;
    
    setState(prev => ({ ...prev, payments: prev.payments.filter(p => p.id !== id) }));
    addAuditLog('DELETE', 'PAYMENT', `Obrisana uplata: ${payment.name}`);
  };

  const addCredit = (c: Omit<Credit, 'id' | 'repayments'>) => {
    if (!hasWriteAccess('kredit')) return;
    setState(prev => ({ 
      ...prev, 
      credits: [...(prev.credits || []), { ...c, id: Date.now().toString(), repayments: [] }] 
    }));
    addAuditLog('CREATE', 'CREDIT', `Dodan kredit: ${c.name}`);
  };
  
  const updateCredit = (id: string, updates: Partial<Credit>) => {
    if (!hasWriteAccess('kredit')) return;
    setState(prev => ({
      ...prev,
      credits: (prev.credits || []).map(c => c.id === id ? { ...c, ...updates } : c)
    }));
    addAuditLog('UPDATE', 'CREDIT', `Ažuriran kredit: ${id}`);
  };
  
  const deleteCredit = (id: string) => {
    if (!hasWriteAccess('kredit')) return;
    setState(prev => ({
      ...prev,
      credits: (prev.credits || []).filter(c => c.id !== id)
    }));
    addAuditLog('DELETE', 'CREDIT', `Obrisan kredit: ${id}`);
  };

  const addRepayment = (creditId: string, amount: number, note?: string) => {
    if (!hasWriteAccess('kredit')) return;
    setState(prev => ({
      ...prev,
      credits: (prev.credits || []).map(c => {
        if (c.id === creditId) {
          return {
            ...c,
            repayments: [
              ...c.repayments,
              {
                id: Date.now().toString(),
                amount,
                date: new Date().toISOString(),
                status: 'PENDING',
                note
              }
            ]
          };
        }
        return c;
      })
    }));
    addAuditLog('CREATE', 'CREDIT', `Dodana uplata za kredit: ${creditId}`);
  };

  const approveRepayment = (creditId: string, repaymentId: string, userId: string) => {
    if (!currentUser || !currentUser.permissions.approveCredit) return;
    setState(prev => ({
      ...prev,
      credits: (prev.credits || []).map(c => {
        if (c.id === creditId) {
          return {
            ...c,
            repayments: c.repayments.map(r => 
              r.id === repaymentId ? { ...r, status: 'CONFIRMED', confirmedBy: userId } : r
            )
          };
        }
        return c;
      })
    }));
    addAuditLog('UPDATE', 'CREDIT', `Uplata kredita odobrena: ${repaymentId}`);
  };

  const deleteRepayment = (creditId: string, repaymentId: string) => {
    if (!hasWriteAccess('kredit')) return;
    setState(prev => ({
      ...prev,
      credits: (prev.credits || []).map(c => {
        if (c.id === creditId) {
          return {
            ...c,
            repayments: c.repayments.filter(r => r.id !== repaymentId)
          };
        }
        return c;
      })
    }));
    addAuditLog('DELETE', 'CREDIT', `Obrisana uplata kredita: ${repaymentId}`);
  };

  const setLoanTarget = (amount: number) => {
    if (!hasWriteAccess('kredit')) return;
    setState(prev => ({ ...prev, loanTarget: amount }));
    addAuditLog('UPDATE', 'SYSTEM', `Ažuriran ciljani iznos kredita na ${amount}`);
  };

  const createSnapshot = (note: string) => {
    // Prevent exponential growth: omit snapshots from the state being saved inside a snapshot
    const stateToSave = { ...state, snapshots: undefined };
    const data = JSON.stringify(stateToSave);
    const newSnapshot = {
      id: generateId(),
      date: new Date().toISOString(),
      note,
      data
    };
    setState(prev => ({
      ...prev,
      snapshots: [newSnapshot, ...(prev.snapshots || [])].slice(0, 5) // Keep last 5
    }));
  };

  const deleteSnapshot = (id: string) => {
    setState(prev => ({
      ...prev,
      snapshots: (prev.snapshots || []).filter(s => s.id !== id)
    }));
  };

  const updateSettings = (settings: { geminiApiKey?: string }) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...(prev.settings || {}),
        ...settings
      }
    }));
  };

  const importData = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.users && data.categories) {
        setState(data);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const exportData = () => {
    setInternalState(prev => ({ ...prev, lastSynced: new Date().toISOString() }));
    return JSON.stringify(state, null, 2);
  };

  return (
    <AppContext.Provider value={{
      state, isLoading, syncStatus, currentUser, login, logout, updateMemberPin, updateUserProfile,
      addUser, updateUserPermissions, resetUserPin, deleteUser,
      addCategory, updateCategory, deleteCategory,
      addMaterial, updateMaterial, deleteMaterial,
      addDelivery, updateDelivery, deleteDelivery,
      addWork, updateWork, deleteWork,
      addSaving, updateSaving, deleteSaving,
      addPayment, updatePayment, deletePayment,
      addCredit, updateCredit, deleteCredit, addRepayment, approveRepayment, deleteRepayment,
      setLoanTarget,
      createSnapshot, deleteSnapshot,
      updateSettings,
      importData, exportData,
      addAuditLog,
      hasWriteAccess
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
