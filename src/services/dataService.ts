import {
  collection,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../config/firebase';
import { Division, Employee, Subcont } from '../types';
import { INITIAL_DIVISIONS, INITIAL_EMPLOYEES, INITIAL_SUBCONTS } from './seedData';

const LOCAL_STORAGE_KEY_PREFIX = 'dhj_emp_data_';

// Local storage backup helpers
function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn('LocalStorage read error:', e);
    return fallback;
  }
}

function setLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage write error:', e);
  }
}

class DataService {
  private isInitialized = false;

  // Initialize and seed database if empty
  async initializeData(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // Check divisions
      const divSnap = await getDocs(collection(db, 'divisions'));
      if (divSnap.empty) {
        console.log('Seeding initial divisions to Firestore...');
        for (const div of INITIAL_DIVISIONS) {
          await setDoc(doc(db, 'divisions', div.id), div);
        }
      }

      // Check subconts
      const subSnap = await getDocs(collection(db, 'subconts'));
      if (subSnap.empty) {
        console.log('Seeding initial subconts to Firestore...');
        for (const sub of INITIAL_SUBCONTS) {
          await setDoc(doc(db, 'subconts', sub.id), sub);
        }
      }

      // Check employees
      const empSnap = await getDocs(collection(db, 'employees'));
      if (empSnap.empty) {
        console.log('Seeding initial employees to Firestore...');
        for (const emp of INITIAL_EMPLOYEES) {
          await setDoc(doc(db, 'employees', emp.id), emp);
        }
      }
    } catch (error) {
      console.warn('Firestore initial seeding fallback to local cache:', error);
      // Ensure local cache is populated
      if (!localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + 'divisions')) {
        setLocal('divisions', INITIAL_DIVISIONS);
      }
      if (!localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + 'subconts')) {
        setLocal('subconts', INITIAL_SUBCONTS);
      }
      if (!localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + 'employees')) {
        setLocal('employees', INITIAL_EMPLOYEES);
      }
    }
  }

  // Realtime subscription for Employees
  subscribeEmployees(
    callback: (employees: Employee[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const cached = getLocal<Employee[]>('employees', INITIAL_EMPLOYEES);
    callback(cached);

    try {
      const unsub = onSnapshot(
        collection(db, 'employees'),
        (snapshot) => {
          const employees: Employee[] = [];
          snapshot.forEach((doc) => {
            employees.push({ ...doc.data(), id: doc.id } as Employee);
          });
          // Sort by createdAt descending
          employees.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setLocal('employees', employees);
          callback(employees);
        },
        (error) => {
          console.warn('Employees onSnapshot error, maintaining local state:', error);
          if (onError) onError(error as Error);
          handleFirestoreError(error, OperationType.GET, 'employees');
        }
      );
      return unsub;
    } catch (e) {
      console.warn('Failed to bind onSnapshot for employees, returning fallback unsubscribe:', e);
      return () => {};
    }
  }

  // Realtime subscription for Divisions
  subscribeDivisions(
    callback: (divisions: Division[]) => void
  ): () => void {
    const cached = getLocal<Division[]>('divisions', INITIAL_DIVISIONS);
    callback(cached);

    try {
      const unsub = onSnapshot(
        collection(db, 'divisions'),
        (snapshot) => {
          const divisions: Division[] = [];
          snapshot.forEach((doc) => {
            divisions.push({ ...doc.data(), id: doc.id } as Division);
          });
          setLocal('divisions', divisions);
          callback(divisions);
        },
        (error) => {
          console.warn('Divisions onSnapshot error:', error);
          handleFirestoreError(error, OperationType.GET, 'divisions');
        }
      );
      return unsub;
    } catch (e) {
      return () => {};
    }
  }

  // Realtime subscription for Subconts
  subscribeSubconts(
    callback: (subconts: Subcont[]) => void
  ): () => void {
    const cached = getLocal<Subcont[]>('subconts', INITIAL_SUBCONTS);
    callback(cached);

    try {
      const unsub = onSnapshot(
        collection(db, 'subconts'),
        (snapshot) => {
          const subconts: Subcont[] = [];
          snapshot.forEach((doc) => {
            subconts.push({ ...doc.data(), id: doc.id } as Subcont);
          });
          setLocal('subconts', subconts);
          callback(subconts);
        },
        (error) => {
          console.warn('Subconts onSnapshot error:', error);
          handleFirestoreError(error, OperationType.GET, 'subconts');
        }
      );
      return unsub;
    } catch (e) {
      return () => {};
    }
  }

  // Check NIK uniqueness
  async isNikUnique(nik: string, excludeId?: string): Promise<boolean> {
    const cleanNik = nik.trim().toUpperCase();

    // First check local cache
    const cached = getLocal<Employee[]>('employees', INITIAL_EMPLOYEES);
    const localDuplicate = cached.some(
      (e) => e.nik.toUpperCase() === cleanNik && e.id !== excludeId
    );
    if (localDuplicate) return false;

    // Then check Firestore query
    try {
      const q = query(collection(db, 'employees'), where('nik', '==', cleanNik));
      const snap = await getDocs(q);
      const matches = snap.docs.filter((d) => d.id !== excludeId);
      return matches.length === 0;
    } catch (e) {
      console.warn('Firestore NIK unique check fallback to local check:', e);
      return !localDuplicate;
    }
  }

  // Find Employee by NIK (for Employee self check / correction)
  async getEmployeeByNik(nik: string): Promise<Employee | null> {
    const cleanNik = nik.trim().toUpperCase();
    try {
      const q = query(collection(db, 'employees'), where('nik', '==', cleanNik));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { ...d.data(), id: d.id } as Employee;
      }
    } catch (e) {
      console.warn('getEmployeeByNik Firestore fallback:', e);
    }
    const cached = getLocal<Employee[]>('employees', INITIAL_EMPLOYEES);
    const match = cached.find((e) => e.nik.toUpperCase() === cleanNik);
    return match || null;
  }

  // Create Employee
  async createEmployee(data: Omit<Employee, 'id'>): Promise<Employee> {
    const newId = 'emp-' + Date.now();
    const newEmployee: Employee = {
      ...data,
      id: newId,
      nik: data.nik.trim().toUpperCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update local cache first
    const cached = getLocal<Employee[]>('employees', INITIAL_EMPLOYEES);
    cached.unshift(newEmployee);
    setLocal('employees', cached);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'employees', newId), newEmployee);
    } catch (error) {
      console.warn('Firestore createEmployee write error:', error);
      handleFirestoreError(error, OperationType.CREATE, `employees/${newId}`);
    }

    return newEmployee;
  }

  // Update Employee
  async updateEmployee(id: string, updates: Partial<Employee>): Promise<void> {
    const now = new Date().toISOString();
    const updatedData = {
      ...updates,
      updatedAt: now,
    };

    // Update local
    const cached = getLocal<Employee[]>('employees', INITIAL_EMPLOYEES);
    const index = cached.findIndex((e) => e.id === id);
    if (index !== -1) {
      cached[index] = { ...cached[index], ...updatedData };
      setLocal('employees', cached);
    }

    // Update Firestore
    try {
      await updateDoc(doc(db, 'employees', id), updatedData);
    } catch (error) {
      console.warn('Firestore updateEmployee error:', error);
      handleFirestoreError(error, OperationType.UPDATE, `employees/${id}`);
    }
  }

  // Delete Employee
  async deleteEmployee(id: string): Promise<void> {
    // Remove from local
    const cached = getLocal<Employee[]>('employees', INITIAL_EMPLOYEES);
    const filtered = cached.filter((e) => e.id !== id);
    setLocal('employees', filtered);

    // Remove from Firestore
    try {
      await deleteDoc(doc(db, 'employees', id));
    } catch (error) {
      console.warn('Firestore deleteEmployee error:', error);
      handleFirestoreError(error, OperationType.DELETE, `employees/${id}`);
    }
  }

  // Division CRUD
  async createDivision(name: string): Promise<Division> {
    const id = 'div-' + Date.now();
    const newDiv: Division = {
      id,
      name: name.trim(),
      status: 'Aktif',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cached = getLocal<Division[]>('divisions', INITIAL_DIVISIONS);
    cached.push(newDiv);
    setLocal('divisions', cached);

    try {
      await setDoc(doc(db, 'divisions', id), newDiv);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `divisions/${id}`);
    }
    return newDiv;
  }

  async updateDivision(id: string, updates: Partial<Division>): Promise<void> {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    const cached = getLocal<Division[]>('divisions', INITIAL_DIVISIONS);
    const idx = cached.findIndex((d) => d.id === id);
    if (idx !== -1) {
      cached[idx] = { ...cached[idx], ...updated };
      setLocal('divisions', cached);
    }

    try {
      await updateDoc(doc(db, 'divisions', id), updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `divisions/${id}`);
    }
  }

  async deleteDivision(id: string): Promise<void> {
    const cached = getLocal<Division[]>('divisions', INITIAL_DIVISIONS);
    setLocal('divisions', cached.filter((d) => d.id !== id));

    try {
      await deleteDoc(doc(db, 'divisions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `divisions/${id}`);
    }
  }

  // Subcont CRUD
  async createSubcont(name: string): Promise<Subcont> {
    const id = 'sub-' + Date.now();
    const newSub: Subcont = {
      id,
      name: name.trim(),
      status: 'Aktif',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cached = getLocal<Subcont[]>('subconts', INITIAL_SUBCONTS);
    cached.push(newSub);
    setLocal('subconts', cached);

    try {
      await setDoc(doc(db, 'subconts', id), newSub);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `subconts/${id}`);
    }
    return newSub;
  }

  async updateSubcont(id: string, updates: Partial<Subcont>): Promise<void> {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    const cached = getLocal<Subcont[]>('subconts', INITIAL_SUBCONTS);
    const idx = cached.findIndex((s) => s.id === id);
    if (idx !== -1) {
      cached[idx] = { ...cached[idx], ...updated };
      setLocal('subconts', cached);
    }

    try {
      await updateDoc(doc(db, 'subconts', id), updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `subconts/${id}`);
    }
  }

  async deleteSubcont(id: string): Promise<void> {
    const cached = getLocal<Subcont[]>('subconts', INITIAL_SUBCONTS);
    setLocal('subconts', cached.filter((s) => s.id !== id));

    try {
      await deleteDoc(doc(db, 'subconts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `subconts/${id}`);
    }
  }

  // Reset to default sample seed data
  async resetToSeedData(): Promise<void> {
    setLocal('divisions', INITIAL_DIVISIONS);
    setLocal('subconts', INITIAL_SUBCONTS);
    setLocal('employees', INITIAL_EMPLOYEES);

    try {
      for (const div of INITIAL_DIVISIONS) {
        await setDoc(doc(db, 'divisions', div.id), div);
      }
      for (const sub of INITIAL_SUBCONTS) {
        await setDoc(doc(db, 'subconts', sub.id), sub);
      }
      for (const emp of INITIAL_EMPLOYEES) {
        await setDoc(doc(db, 'employees', emp.id), emp);
      }
    } catch (e) {
      console.warn('Reset seed data Firestore write exception:', e);
    }
  }
}

export const dataService = new DataService();
