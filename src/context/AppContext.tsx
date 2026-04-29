import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, User, UserRole, UserPermissions, Category, Material, Delivery, Work, Saving, Payment, UIConfig, AuditLog } from '../types';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface AppContextType {
  state: AppState;
  isLoading: boolean;
  syncStatus: SyncStatus;
  currentUser: User | null;
  login: (username: string, identifier: string) => boolean;
  logout: () => void;
  updateMemberPin: (userId: string, newPin: string) => void;
  
  // State mutations
  addUser: (name: string, pin: string) => void;
  updateUserPermissions: (userId: string, permissions: UserPermissions) => void;
  resetUserPin: (userId: string, newPin: string) => void;
  deleteUser: (userId: string) => void;
  
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  
  addMaterial: (material: Omit<Material, 'id'>) => void;
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
  setLoanTarget: (amount: number) => void;
  createSnapshot: (note: string) => void;
  deleteSnapshot: (id: string) => void;
  
  importData: (jsonData: string) => boolean;
  exportData: () => string;
  updateUIConfig: (config: Partial<UIConfig>) => void;
  addAuditLog: (action: AuditLog['action'], entity: AuditLog['entity'], details: string) => void;
  hasWriteAccess: (categoryIds?: string[]) => boolean;
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

const INITIAL_STATE: AppState = {
  users: [
    {
      id: 'admin-1',
      username: 'josip',
      pin: 'admin123',
      role: UserRole.ADMIN,
      permissions: { ...DEFAULT_PERMISSIONS, adminZona: true, backup: true },
    },
  ],
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
  uiConfig: {
    welcomeTitle: 'Dobrodošli u sustav',
    welcomeSubtitle: 'Praćenje troškova adaptacije i renovacije',
    appName: 'Apartman troškovnik',
  },
  auditLogs: [],
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
          const data = await response.json();
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
          if (saved) setState(JSON.parse(saved));
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
          if (saved) setState(JSON.parse(saved));
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

  const updateUIConfig = (newConfig: Partial<UIConfig>) => {
    setState(prev => ({
      ...prev,
      uiConfig: { ...(prev.uiConfig || INITIAL_STATE.uiConfig!), ...newConfig }
    }));
  };

  const login = (username: string, identifier: string) => {
    const user = state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user && user.pin === identifier) {
      setCurrentUser(user);
      
      // Auto-backup on login
      setState(prev => {
        const stateToSave = { ...prev, snapshots: undefined };
        const newSnapshot = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          note: `Automatski backup: Prijava korisnika ${user.username}`,
          data: JSON.stringify(stateToSave)
        };
        
        // Add audit log for login
        const newLog: AuditLog = {
          id: crypto.randomUUID(),
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
    return false;
  };

  const logout = () => setCurrentUser(null);

  const addAuditLog = useCallback((action: AuditLog['action'], entity: AuditLog['entity'], details: string) => {
    setState(prev => {
      if (!currentUser) return prev;
      const newLog: AuditLog = {
        id: crypto.randomUUID(),
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

  const hasWriteAccess = useCallback((categoryIds?: string[]) => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;
    if (!currentUser.permissions.readOnly) return true;
    
    // If user is readOnly, check if they have specific write access to ALL provided categories
    if (currentUser.permissions.allowedWriteCategories && currentUser.permissions.allowedWriteCategories.length > 0) {
      if (!categoryIds || categoryIds.length === 0) {
        // Uncategorized items cannot be modified if strictly readOnly
        return false;
      }
      return categoryIds.every(id => currentUser.permissions.allowedWriteCategories!.includes(id));
    }
    
    return false;
  }, [currentUser]);

  const updateMemberPin = (userId: string, newPin: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, pin: newPin } : u)
    }));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, pin: newPin } : null);
    }
  };

  const addUser = (name: string, pin: string) => {
    const newUser: User = {
      id: Date.now().toString(),
      username: name,
      pin,
      role: UserRole.MEMBER,
      permissions: { ...DEFAULT_PERMISSIONS },
    };
    setState(prev => ({ ...prev, users: [...prev.users, newUser] }));
  };

  const updateUserPermissions = (userId: string, permissions: UserPermissions) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, permissions } : u)
    }));
  };

  const resetUserPin = (userId: string, newPin: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, pin: newPin } : u)
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
            name: `Dostava: ${material.name}`
          };
        } else {
          nextDeliveries.push({
            id: `del-${material.id}`,
            name: `Dostava: ${material.name}`,
            amount: material.deliveryCost,
            materialIds: [material.id]
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
            name: `Radovi: ${material.name}`
          };
        } else {
          nextWorks.push({
            id: `work-${material.id}`,
            name: `Radovi: ${material.name}`,
            amount: material.workCost,
            materialIds: [material.id]
          });
        }
      } else {
        nextWorks = nextWorks.map(w => ({
          ...w,
          materialIds: w.materialIds.filter(mid => mid !== material.id)
        })).filter(w => w.materialIds.length > 0 || w.amount > 0);
      }

      // Handle Auto Saving
      const savingAmount = material.plannedCost - material.actualPaid;
      if (savingAmount !== 0) {
        const existingSavingIdx = nextSavings.findIndex(s => s.materialId === material.id && s.isAuto);
        if (existingSavingIdx > -1) {
          nextSavings[existingSavingIdx] = {
            ...nextSavings[existingSavingIdx],
            amount: savingAmount,
            name: `Ušteda: ${material.name}`
          };
        } else {
          nextSavings.push({
            id: `sav-${material.id}`,
            name: `Ušteda: ${material.name}`,
            amount: savingAmount,
            materialId: material.id,
            isAuto: true
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
    if (!hasWriteAccess([m.categoryId])) return;
    const id = Date.now().toString();
    const newMaterial = { ...m, id };
    setState(prev => ({
      ...prev,
      materials: [...prev.materials, newMaterial]
    }));
    syncMaterialArtifacts(newMaterial);
    addAuditLog('CREATE', 'MATERIAL', `Dodan materijal: ${m.name}`);
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    const mat = state.materials.find(m => m.id === id);
    if (!mat) return;
    if (!hasWriteAccess([mat.categoryId])) return;
    if (updates.categoryId && updates.categoryId !== mat.categoryId && !hasWriteAccess([updates.categoryId])) return;

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
    if (!hasWriteAccess([mat.categoryId])) return;

    setState(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m.id !== id),
      deliveries: prev.deliveries.map(d => ({ ...d, materialIds: d.materialIds.filter(mid => mid !== id) })).filter(d => d.materialIds.length > 0 || d.id.startsWith('manual')),
      works: prev.works.map(w => ({ ...w, materialIds: w.materialIds.filter(mid => mid !== id) })).filter(w => w.materialIds.length > 0 || w.id.startsWith('manual')),
      savings: prev.savings.filter(s => s.materialId !== id)
    }));
    addAuditLog('DELETE', 'MATERIAL', `Obrisan materijal: ${mat.name}`);
  };

  const getCategoriesForMaterials = (materialIds: string[]) => {
    return Array.from(new Set(state.materials.filter(m => materialIds.includes(m.id)).map(m => m.categoryId)));
  };

  const addDelivery = (d: Omit<Delivery, 'id'>) => {
    if (!hasWriteAccess(getCategoriesForMaterials(d.materialIds || []))) return;
    setState(prev => ({ ...prev, deliveries: [...prev.deliveries, { ...d, id: `manual-${Date.now()}` }] }));
    addAuditLog('CREATE', 'DELIVERY', `Dodana dostava: ${d.name}`);
  };
  const updateDelivery = (id: string, updates: Partial<Delivery>) => {
    const del = state.deliveries.find(d => d.id === id);
    if (!del) return;
    if (!hasWriteAccess(getCategoriesForMaterials(del.materialIds || []))) return;
    if (updates.materialIds && !hasWriteAccess(getCategoriesForMaterials(updates.materialIds))) return;
    
    setState(prev => ({ ...prev, deliveries: prev.deliveries.map(d => d.id === id ? { ...d, ...updates } : d) }));
    addAuditLog('UPDATE', 'DELIVERY', `Ažurirana dostava: ${updates.name || id}`);
  };
  const deleteDelivery = (id: string) => {
    const del = state.deliveries.find(d => d.id === id);
    if (!del) return;
    if (!hasWriteAccess(getCategoriesForMaterials(del.materialIds || []))) return;
    
    setState(prev => ({ ...prev, deliveries: prev.deliveries.filter(d => d.id !== id) }));
    addAuditLog('DELETE', 'DELIVERY', `Obrisana dostava: ${del.name}`);
  };

  const addWork = (w: Omit<Work, 'id'>) => {
    if (!hasWriteAccess(getCategoriesForMaterials(w.materialIds || []))) return;
    setState(prev => ({ ...prev, works: [...prev.works, { ...w, id: `manual-${Date.now()}` }] }));
    addAuditLog('CREATE', 'WORK', `Dodani radovi: ${w.name}`);
  };
  const updateWork = (id: string, updates: Partial<Work>) => {
    const work = state.works.find(w => w.id === id);
    if (!work) return;
    if (!hasWriteAccess(getCategoriesForMaterials(work.materialIds || []))) return;
    if (updates.materialIds && !hasWriteAccess(getCategoriesForMaterials(updates.materialIds))) return;
    
    setState(prev => ({ ...prev, works: prev.works.map(w => w.id === id ? { ...w, ...updates } : w) }));
    addAuditLog('UPDATE', 'WORK', `Ažurirani radovi: ${updates.name || id}`);
  };
  const deleteWork = (id: string) => {
    const work = state.works.find(w => w.id === id);
    if (!work) return;
    if (!hasWriteAccess(getCategoriesForMaterials(work.materialIds || []))) return;
    
    setState(prev => ({ ...prev, works: prev.works.filter(w => w.id !== id) }));
    addAuditLog('DELETE', 'WORK', `Obrisani radovi: ${work.name}`);
  };

  const getCategoriesForSaving = (saving: Partial<Saving>) => {
     if (saving.materialId) return getCategoriesForMaterials([saving.materialId]);
     if (saving.workId) {
        const w = state.works.find(w => w.id === saving.workId);
        if (w) return getCategoriesForMaterials(w.materialIds || []);
     }
     return [];
  };

  const addSaving = (s: Omit<Saving, 'id'>) => {
    if (!hasWriteAccess(getCategoriesForSaving(s))) return;
    setState(prev => ({ ...prev, savings: [...prev.savings, { ...s, id: `manual-${Date.now()}` }] }));
    addAuditLog('CREATE', 'SAVING', `Dodana ušteda: ${s.name}`);
  };
  const updateSaving = (id: string, updates: Partial<Saving>) => {
    const sav = state.savings.find(s => s.id === id);
    if (!sav) return;
    if (!hasWriteAccess(getCategoriesForSaving(sav))) return;
    if ((updates.materialId || updates.workId) && !hasWriteAccess(getCategoriesForSaving({ ...sav, ...updates }))) return;
    
    setState(prev => ({ ...prev, savings: prev.savings.map(s => s.id === id ? { ...s, ...updates } : s) }));
    addAuditLog('UPDATE', 'SAVING', `Ažurirana ušteda: ${updates.name || id}`);
  };
  const deleteSaving = (id: string) => {
    const sav = state.savings.find(s => s.id === id);
    if (!sav) return;
    if (!hasWriteAccess(getCategoriesForSaving(sav))) return;
    
    setState(prev => ({ ...prev, savings: prev.savings.filter(s => s.id !== id) }));
    addAuditLog('DELETE', 'SAVING', `Obrisana ušteda: ${sav.name}`);
  };

  const addPayment = (p: Omit<Payment, 'id'>) => {
    if (!hasWriteAccess([p.categoryId])) return;
    setState(prev => ({ ...prev, payments: [...prev.payments, { ...p, id: Date.now().toString() }] }));
    addAuditLog('CREATE', 'PAYMENT', `Dodana uplata: ${p.name}`);
  };
  const updatePayment = (id: string, updates: Partial<Payment>) => {
    const payment = state.payments.find(p => p.id === id);
    if (!payment) return;
    if (!hasWriteAccess([payment.categoryId])) return;
    if (updates.categoryId && !hasWriteAccess([updates.categoryId])) return;

    setState(prev => ({ ...prev, payments: prev.payments.map(p => p.id === id ? { ...p, ...updates } : p) }));
    addAuditLog('UPDATE', 'PAYMENT', `Ažurirana uplata: ${updates.name || id}`);
  };
  const deletePayment = (id: string) => {
    const payment = state.payments.find(p => p.id === id);
    if (!payment) return;
    if (!hasWriteAccess([payment.categoryId])) return;
    
    setState(prev => ({ ...prev, payments: prev.payments.filter(p => p.id !== id) }));
    addAuditLog('DELETE', 'PAYMENT', `Obrisana uplata: ${payment.name}`);
  };

  const setLoanTarget = (amount: number) => {
    if (currentUser?.permissions.readOnly) return;
    setState(prev => ({ ...prev, loanTarget: amount }));
    addAuditLog('UPDATE', 'SYSTEM', `Ažuriran ciljani iznos kredita na ${amount}`);
  };

  const createSnapshot = (note: string) => {
    // Prevent exponential growth: omit snapshots from the state being saved inside a snapshot
    const stateToSave = { ...state, snapshots: undefined };
    const data = JSON.stringify(stateToSave);
    const newSnapshot = {
      id: crypto.randomUUID(),
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
      state, isLoading, syncStatus, currentUser, login, logout, updateMemberPin,
      addUser, updateUserPermissions, resetUserPin, deleteUser,
      addCategory, updateCategory, deleteCategory,
      addMaterial, updateMaterial, deleteMaterial,
      addDelivery, updateDelivery, deleteDelivery,
      addWork, updateWork, deleteWork,
      addSaving, updateSaving, deleteSaving,
      addPayment, updatePayment, deletePayment,
      setLoanTarget,
      createSnapshot, deleteSnapshot,
      importData, exportData,
      updateUIConfig, addAuditLog
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
