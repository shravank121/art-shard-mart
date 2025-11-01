export const errorLogger = (message, err) => {
    console.error(`❌ [${new Date().toISOString()}] ${message}:`, err.message || err);
  };
  
  export const infoLogger = (message) => {
    console.log(`ℹ️ [${new Date().toISOString()}] ${message}`);
  };
  