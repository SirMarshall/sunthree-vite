const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  // context.appOutDir is the path to the unpacked application folder
  // e.g., dist/linux-unpacked
  const enginePath = path.join(context.appOutDir, 'resources', 'engine', 'engine');

  console.log(`INFO: afterPack hook running for: ${context.appOutDir}`);

  if (fs.existsSync(enginePath)) {
    console.log(`INFO: Found engine at: ${enginePath}`);
    try {
      // Set permissions to rwxr-xr-x (0755)
      fs.chmodSync(enginePath, '0755');
      console.log('SUCCESS: Set execute permissions on engine.');
    } catch (err) {
      console.error('ERROR: Failed to set permissions on engine:', err);
      // Fail the build if we can't set permissions
      throw err;
    }
  } else {
    console.warn('WARN: Could not find engine to set permissions.');
  }
};