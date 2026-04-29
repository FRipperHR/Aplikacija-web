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
  entity: 'MATERIAL' | 'CATEGORY' | 'USER' | 'PAYMENT' | 'WORK' | 'DELIVERY' | 'SAVING' | 'SYSTEM';
  details: string;
}

export interface User {
  id: string;
  username: string; // or Full Name
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
  quantity: number;
  pricePerUnit: number;
  deliveryCost: number;
  workCost: number;
  plannedCost: number;
  actualPaid: number;
  // Automatic saving: plannedCost - actualPaid
}

export interface Delivery {
  id: string;
  name: string;
  amount: number;
  materialIds: string[]; // Linked materials
}

export interface Work {
  id: string;
  name: string;
  amount: number;
  materialIds: string[]; // Linked materials
}

export interface Saving {
  id: string;
  name: string;
  amount: number;
  materialId?: string; // If auto-generated from material
  workId?: string; // Linked to a specific work
  isAuto: boolean;
}

export interface Payment {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  type: 'general' | 'loan';
  date: string;
}

export interface AppState {
  users: User[];
  categories: Category[];
  materials: Material[];
  deliveries: Delivery[];
  works: Work[];
  savings: Saving[];
  payments: Payment[];
  loanTarget?: number;
  snapshots?: {
    id: string;
    date: string;
    note: string;
    data: string;
  }[];
  auditLogs?: AuditLog[];
  lastModified?: string;
  lastSynced?: string;
}
