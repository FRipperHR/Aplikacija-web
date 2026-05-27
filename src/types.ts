/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export type AppModule = 'materijali' | 'dostava' | 'radovi' | 'ustede' | 'uplate' | 'kredit';

export interface UserPermissions {
  kredit: boolean;
  uplate: boolean;
  ustede: boolean;
  materijali: boolean;
  dostava: boolean;
  radovi: boolean;
  kategorije: boolean;
  izvjesca: boolean;
  adminZona: boolean;
  backup: boolean;
  canScanReceipts?: boolean; // Can use AI scanner
  approveCredit?: boolean; // Can approve credits
  readOnly?: boolean; // If true, the user can only view allowed sections, but cannot add/edit/delete
  allowedCategories?: string[]; // IDs of categories they can access. If empty or undefined, they can access all.
  allowedWriteModules?: AppModule[]; // Modules they can write to, overriding readOnly
}

export interface AuditLog {
  id: string;
  date: string;
  userId: string;
  username: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'OTHER';
  entity: 'MATERIAL' | 'CATEGORY' | 'USER' | 'PAYMENT' | 'WORK' | 'DELIVERY' | 'SAVING' | 'SYSTEM' | 'CREDIT';
  details: string;
}

export interface User {
  id: string;
  username: string; // or Full Name
  displayName?: string;
  avatar?: string;
  pin: string;
  role: UserRole;
  permissions: UserPermissions;
}

export interface Category {
  id: string;
  name: string;
}

export interface Material {
  id: string;
  name: string;
  categoryId: string;
  unit?: string;
  quantity: number;
  pricePerUnit: number;
  savingAmount: number;
  deliveryCost: number;
  workCost: number;
  hasSaving?: boolean;
  savingNote?: string;
  date: string;
}

export interface Delivery {
  id: string;
  name: string;
  amount: number;
  savingAmount: number;
  hasSaving?: boolean;
  savingNote?: string;
  materialIds: string[]; // Linked materials
  note?: string;
  date: string;
}

export interface Work {
  id: string;
  name: string;
  amount: number;
  savingAmount: number;
  hasSaving?: boolean;
  savingNote?: string;
  materialIds: string[]; // Linked materials
  note?: string;
  date: string;
}

export interface Saving {
  id: string;
  name: string;
  amount: number;
  materialId?: string; // If auto-generated from material
  workId?: string; // Linked to a specific work
  deliveryId?: string; // Linked to a specific delivery
  isAuto: boolean;
  note?: string;
}

export interface Payment {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  type: 'general' | 'loan';
  date: string;
}

export interface CreditRepayment {
  id: string;
  amount: number;
  date: string;
  status: 'PENDING' | 'CONFIRMED';
  confirmedBy?: string | null;
  note?: string;
}

export interface Credit {
  id: string;
  name: string;
  totalAmount: number;
  date: string;
  repayments: CreditRepayment[];
}

export interface AppState {
  users: User[];
  categories: Category[];
  materials: Material[];
  deliveries: Delivery[];
  works: Work[];
  savings: Saving[];
  payments: Payment[];
  credits?: Credit[];
  loanTarget?: number;
  snapshots?: {
    id: string;
    date: string;
    note: string;
    data: string;
  }[];
  auditLogs?: AuditLog[];
  settings?: {
    geminiApiKey?: string;
  };
  lastModified?: string;
  lastSynced?: string;
}
