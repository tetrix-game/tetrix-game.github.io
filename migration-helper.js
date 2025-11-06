// MIGRATION HELPER - Run this in browser console if you have important game data to migrate

async function migrateToGranularStorage() {
  try {
    console.log('🔄 Starting migration to granular storage...');
    
    // Load from legacy store
    const response = await fetch('/api/legacy-data'); // This is just an example
    
    // In the browser console, you can do this instead:
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('TetrixGameDB', 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const transaction = db.transaction(['gameState'], 'readonly');
    const store = transaction.objectStore('gameState');
    const request = store.get('current');
    
    const legacyData = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (legacyData?.tiles?.length === 100) {
      console.log('📦 Found legacy data:', legacyData);
      
      // Force save to granular stores by calling our migration
      const event = new CustomEvent('force-migration', { detail: legacyData });
      window.dispatchEvent(event);
      
      console.log('✅ Migration completed! Refresh the page.');
    } else {
      console.log('❌ No legacy data found to migrate.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
migrateToGranularStorage();