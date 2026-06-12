const fs = require('fs').promises;
const path = require('path');

const root = process.cwd();

async function main() {
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const name = entry.name;
    if (name === 'frontend' || name === 'backend' || name === '.git') continue;
    const src = path.join(root, name);
    const dest = path.join(root, 'frontend', name);
    try {
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.rename(src, dest);
      console.log(`Moved ${src} -> ${dest}`);
    } catch (err) {
      console.error(`Failed to move ${src}:`, err.message);
    }
  }
  console.log('Root move complete.');
}

main().catch(err => { console.error(err); process.exit(1); });
