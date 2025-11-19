// Debug localStorage functionality
export const debugLocalStorage = () => {
  console.log('=== localStorage Debug ===');
  
  // Test basic localStorage functionality
  try {
    const testKey = 'unitview_test';
    const testValue = { timestamp: Date.now(), test: 'working' };
    
    localStorage.setItem(testKey, JSON.stringify(testValue));
    const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
    
    console.log('✅ localStorage read/write test:', retrieved);
    localStorage.removeItem(testKey);
  } catch (error) {
    console.error('❌ localStorage test failed:', error);
  }
  
  // Check existing unitview data
  try {
    const existing = localStorage.getItem('unitview_data');
    if (existing) {
      const data = JSON.parse(existing);
      console.log('✅ Found existing unitview_data:', {
        users: data.users?.length || 0,
        unit_settings: data.unit_settings?.length || 0,
        nurses: data.nurses?.length || 0,
        patients: data.patients?.length || 0,
      });
    } else {
      console.log('❌ No unitview_data found in localStorage');
    }
  } catch (error) {
    console.error('❌ Error reading unitview_data:', error);
  }
  
  console.log('=== End Debug ===');
};