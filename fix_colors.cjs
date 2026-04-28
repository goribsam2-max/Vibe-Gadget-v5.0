const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    let filepath = path.join(dir, file);
    let stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, callback);
    } else if (stat.isFile() && filepath.endsWith('.tsx')) {
      callback(filepath);
    }
  });
}

let filesChanged = 0;

['src/components', 'src/pages', 'components', 'pages'].forEach(folder => {
  walk(folder, filepath => {
    let content = fs.readFileSync(filepath, 'utf8');
    let newContent = content;

    newContent = newContent.replace(/className=(["'])(.*?)\1|className=\{`(.*?)`\}/gs, (match, p1, p2, p3) => {
      let classes = p2 !== undefined ? p2 : p3;
      let prefix = p2 !== undefined ? `className=${p1}` : 'className={`';
      let suffix = p2 !== undefined ? p1 : '`}';

      let classList = classes.split(/(\s+)/); // Preserve whitespace
      
      let fixedList = classList.map(c => {
        let trimmed = c.trim();
        if (!trimmed) return c; // keep whitespaces

        if (trimmed === 'bg-white' && !classes.includes('dark:bg-')) {
            return 'bg-white dark:bg-[#09090b] dark:text-white dark:border-white/10';
        }
        if (trimmed === 'text-black' && !classes.includes('dark:text-white') && !classes.includes('dark:text-zinc-50') && !classes.includes('dark:text-zinc-100')) {
            return 'text-zinc-900 dark:text-zinc-50';
        }
        if ((trimmed === 'bg-[#f4f4f5]' || trimmed === 'bg-f-gray') && !classes.includes('dark:bg-')) {
            return 'bg-[#f4f4f5] dark:bg-zinc-800/80';
        }
        if (trimmed === 'bg-black' && !classes.includes('dark:bg-')) {
            return 'bg-black dark:bg-white dark:text-black';
        }
        return c;
      });

      return prefix + fixedList.join('') + suffix;
    });

    if (newContent !== content) {
      fs.writeFileSync(filepath, newContent, 'utf8');
      console.log(`Updated ${filepath}`);
      filesChanged++;
    }
  });
});
console.log(`Updated ${filesChanged} files with dark mode classes.`);
