import { getDb } from '../lib/database-simple';
import type { LayoutName } from '../types/patient';
import {
  createDefaultAssignmentPrintLayout,
  sanitizeAssignmentPrintLayout,
  type AssignmentPrintLayoutConfig,
} from '../types/assignment-print-layout';

export async function getAssignmentPrintLayout(
  layoutName: LayoutName,
): Promise<AssignmentPrintLayoutConfig> {
  try {
    const db = await getDb();
    const layout = db.getLayout(layoutName);
    return sanitizeAssignmentPrintLayout(layout?.assignmentPrintLayout);
  } catch (error) {
    console.error('Error loading assignment print layout:', error);
    return createDefaultAssignmentPrintLayout();
  }
}

export async function saveAssignmentPrintLayout(
  layoutName: LayoutName,
  config: AssignmentPrintLayoutConfig,
): Promise<void> {
  try {
    const db = await getDb();
    const layout = db.getLayout(layoutName);
    if (!layout) return;
    const sanitized = sanitizeAssignmentPrintLayout(config);
    db.setLayoutAssignmentPrintLayout(layoutName, sanitized);
  } catch (error) {
    console.error('Error saving assignment print layout:', error);
    throw error;
  }
}
