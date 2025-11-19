import { getDb } from './lib/database-simple';

export const databaseDebug = async () => {
  console.log('=== DATABASE DEBUG ===');
  
  try {
    const db = await getDb();
    
    // Check database structure
    const data = db.exportData();
    console.log('Database structure:', {
      hasUsers: !!data.users,
      usersCount: data.users?.length || 0,
      hasUnitSettings: !!data.unit_settings,
      unitSettingsCount: data.unit_settings?.length || 0,
      hasNurses: !!data.nurses,
      nursesCount: data.nurses?.length || 0,
      hasPatients: !!data.patients,
      patientsCount: data.patients?.length || 0,
    });
    
    // Test adding a user
    console.log('Testing user creation...');
    const testUser = {
      id: `test-${Date.now()}`,
      name: 'Test User',
      role: 'user' as const,
      employeeNumber: `TEST${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    db.saveUser(testUser);
    console.log('✅ Test user created');
    
    // Verify user was saved
    const savedUser = db.getUser(testUser.id);
    console.log('✅ Test user retrieved:', savedUser ? 'SUCCESS' : 'FAILED');
    
    // Test adding a unit
    console.log('Testing unit creation...');
    const testUnit = {
      id: `unit-${Date.now()}`,
      name: 'Test Unit',
      createdAt: new Date().toISOString(),
    };
    
    db.saveUnitSettings(testUnit);
    console.log('✅ Test unit created');
    
    // Verify unit was saved
    const savedUnit = db.getUnitSetting(testUnit.id);
    console.log('✅ Test unit retrieved:', savedUnit ? 'SUCCESS' : 'FAILED');
    
    // Check localStorage directly
    console.log('Checking localStorage directly...');
    const rawData = localStorage.getItem('unitview_data');
    if (rawData) {
      const parsedData = JSON.parse(rawData);
      console.log('Raw localStorage data:', {
        usersCount: parsedData.users?.length || 0,
        unitsCount: parsedData.unit_settings?.length || 0,
      });
    } else {
      console.log('❌ No data in localStorage');
    }
    
  } catch (error) {
    console.error('Database debug failed:', error);
  }
  
  console.log('=== END DATABASE DEBUG ===');
};