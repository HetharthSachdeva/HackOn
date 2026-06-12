const fs = require('fs').promises;
const path = require('path');

const root = process.cwd();
const srcDir = path.join(root, 'src');
const publicDir = path.join(root, 'public');
const frontendSrc = path.join(root, 'frontend', 'src');
const frontendPublic = path.join(root, 'frontend', 'public');

async function moveDirContents(src, dest) {
  try {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      await fs.rename(srcPath, destPath);
      console.log(`Moved ${srcPath} -> ${destPath}`);
    }
    // remove src if empty
    const leftover = await fs.readdir(src);
    if (leftover.length === 0) {
      await fs.rmdir(src);
      console.log(`Removed empty directory ${src}`);
    }
  } catch (err) {
    console.error('Error moving', src, '->', dest, err);
    process.exitCode = 1;
  }
}

(async () => {
  console.log('Starting move of frontend assets...');
  const srcExists = await exists(srcDir);
  if (srcExists) {
    await moveDirContents(srcDir, frontendSrc);
  } else {
    console.log('No src directory found at', srcDir);
  }

  const publicExists = await exists(publicDir);
  if (publicExists) {
    await moveDirContents(publicDir, frontendPublic);
  } else {
    console.log('No public directory found at', publicDir);
  }

  console.log('Move complete.');
})();

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
