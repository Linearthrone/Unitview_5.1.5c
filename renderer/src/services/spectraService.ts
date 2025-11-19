import { getDb } from '../lib/database-simple';
import type { Spectra } from '../types/nurse';

export async function getSpectraPool(): Promise<Spectra[]> {
  try {
    const db = await getDb();
    const stmt = db.prepare('SELECT * FROM spectra_pool ORDER BY id');
    const rows = stmt.all();
    
    if (rows.length === 0) {
      // Initialize with default spectra data
      await initializeSpectraPool();
      return getSpectraPool(); // Recursive call to fetch the initialized data
    }
    
    return rows.map(row => ({
      id: row.id,
      inService: Boolean(row.in_service),
    }));
  } catch (error) {
    console.error('Error fetching spectra pool:', error);
    return [];
  }
}

async function initializeSpectraPool(): Promise<void> {
  try {
    const db = await getDb();
    const stmt = db.prepare('INSERT INTO spectra_pool (id, in_service) VALUES (?, ?)');
    
    const transaction = db.transaction(() => {
      initialSpectra.forEach(spectra => {
        stmt.run(spectra.id, spectra.inService ? 1 : 0);
      });
    });
    
    transaction();
  } catch (error) {
    console.error('Error initializing spectra pool:', error);
  }
}

export async function updateSpectra(spectraId: string, inService: boolean): Promise<void> {
  try {
    const db = await getDb();
    const stmt = db.prepare('UPDATE spectra_pool SET in_service = ? WHERE id = ?');
    stmt.run(inService ? 1 : 0, spectraId);
  } catch (error) {
    console.error('Error updating spectra:', error);
  }
}

export async function addSpectra(spectraId: string): Promise<void> {
  try {
    const db = await getDb();
    const stmt = db.prepare('INSERT OR IGNORE INTO spectra_pool (id, in_service) VALUES (?, 1)');
    stmt.run(spectraId);
  } catch (error) {
    console.error('Error adding spectra:', error);
  }
}

export async function removeSpectra(spectraId: string): Promise<void> {
  try {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM spectra_pool WHERE id = ?');
    stmt.run(spectraId);
  } catch (error) {
    console.error('Error removing spectra:', error);
  }
}