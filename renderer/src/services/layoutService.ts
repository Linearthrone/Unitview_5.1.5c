import { getDb } from '../lib/database-simple';
import type { LayoutName, UserPreferences, AssignmentSet } from '../types/patient';

export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const db = await getDb();
    
    // Get last selected layout
    const layoutStmt = db.prepare('SELECT value FROM user_preferences WHERE key = ?');
    const layoutRow = layoutStmt.get('lastSelectedLayout') as { value: string } | undefined;
    const lastSelectedLayout = layoutRow ? layoutRow.value : 'North-South View';
    
    // Get layout locked status
    const lockedStmt = db.prepare('SELECT value FROM user_preferences WHERE key = ?');
    const lockedRow = lockedStmt.get('isLayoutLocked') as { value: string } | undefined;
    const isLayoutLocked = lockedRow ? lockedRow.value === 'true' : false;
    
    return {
      lastSelectedLayout,
      isLayoutLocked,
    };
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return {
      lastSelectedLayout: 'North-South View',
      isLayoutLocked: false,
    };
  }
}

export async function saveUserPreferences(preferences: UserPreferences): Promise<void> {
  try {
    const db = await getDb();
    
    const transaction = db.transaction(() => {
      // Save last selected layout
      const layoutStmt = db.prepare(`
        INSERT OR REPLACE INTO user_preferences (key, value) VALUES (?, ?)
      `);
      layoutStmt.run('lastSelectedLayout', preferences.lastSelectedLayout);
      
      // Save layout locked status
      const lockedStmt = db.prepare(`
        INSERT OR REPLACE INTO user_preferences (key, value) VALUES (?, ?)
      `);
      lockedStmt.run('isLayoutLocked', preferences.isLayoutLocked.toString());
    });
    
    transaction();
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
}

export async function getAvailableLayouts(): Promise<LayoutName[]> {
  try {
    const db = await getDb();
    const stmt = db.prepare('SELECT name FROM layouts ORDER BY name');
    const rows = stmt.all() as { name: string }[];
    
    const layouts = rows.map(row => row.name);
    
    // Always include the default layout if it doesn't exist
    if (!layouts.includes('North-South View')) {
      await createLayout('North-South View');
      return ['North-South View', ...layouts];
    }
    
    return layouts;
  } catch (error) {
    console.error('Error fetching available layouts:', error);
    return ['North-South View'];
  }
}

export async function createLayout(layoutName: LayoutName): Promise<void> {
  try {
    const db = await getDb();
    const stmt = db.prepare('INSERT INTO layouts (name) VALUES (?)');
    stmt.run(layoutName);
  } catch (error) {
    // Layout might already exist, which is fine
    console.error('Error creating layout (might already exist):', error);
  }
}

export async function deleteLayout(layoutName: LayoutName): Promise<void> {
  try {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM layouts WHERE name = ?');
    stmt.run(layoutName);
  } catch (error) {
    console.error('Error deleting layout:', error);
  }
}

export async function saveAssignmentSet(assignmentSet: AssignmentSet): Promise<void> {
  try {
    const db = await getDb();
    const stmt = db.prepare(`
      INSERT INTO assignment_sets (
        id, layout_name, shift, date, charge_nurse_name, assignments
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      assignmentSet.id,
      assignmentSet.layoutName,
      assignmentSet.shift,
      assignmentSet.date.toISOString(),
      assignmentSet.chargeNurseName,
      JSON.stringify(assignmentSet.assignments)
    );
  } catch (error) {
    console.error('Error saving assignment set:', error);
  }
}

export async function getAssignmentSets(layoutName: LayoutName): Promise<AssignmentSet[]> {
  try {
    const db = await getDb();
    const stmt = db.prepare('SELECT * FROM assignment_sets WHERE layout_name = ? ORDER BY date DESC');
    const rows = stmt.all(layoutName);
    
    return rows.map(row => ({
      id: row.id,
      layoutName: row.layout_name,
      shift: row.shift,
      date: new Date(row.date),
      chargeNurseName: row.charge_nurse_name,
      assignments: JSON.parse(row.assignments),
    }));
  } catch (error) {
    console.error('Error fetching assignment sets:', error);
    return [];
  }
}

export async function deleteAssignmentSet(id: string): Promise<void> {
  try {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM assignment_sets WHERE id = ?');
    stmt.run(id);
  } catch (error) {
    console.error('Error deleting assignment set:', error);
  }
}