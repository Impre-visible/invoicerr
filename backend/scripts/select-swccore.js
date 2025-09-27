const { execSync } = require('child_process');

const arch = process.arch;

if (arch === 'arm64') {
    console.log('Installing @swc/core-linux-arm64-gnu for ARM64...');
    try {
        execSync('npm install @swc/core-linux-arm64-gnu --no-save', { stdio: 'inherit' });
    } catch (err) {
        console.error('Failed to install @swc/core-linux-arm64-gnu:', err);
        process.exit(1);
    }
} else {
    console.log('Using standard @swc/core for AMD64...');
    try {
        execSync('npm install @swc/core --no-save', { stdio: 'inherit' });
    } catch (err) {
        console.error('Failed to install @swc/core:', err);
        process.exit(1);
    }
}
