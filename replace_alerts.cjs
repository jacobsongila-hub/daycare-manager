const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

const files = walk(directoryPath);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // If there's an alert
  if (content.includes('alert(')) {
    // Check if useNotification is already imported
    if (!content.includes('useNotification')) {
      const depth = file.split(path.sep).length - directoryPath.split(path.sep).length;
      const prefix = depth === 1 ? './' : '../'.repeat(depth - 1);
      content = content.replace(/(import React.*?;\n)/, `$1import { useNotification } from '${prefix}context/NotificationContext';\n`);
    }

    // Check if addToast is defined inside the component
    if (!content.includes('const { addToast } = useNotification();')) {
      content = content.replace(/(export default function \w+\(.*\) {\n)/, `$1  const { addToast } = useNotification();\n`);
    }

    // Replace basic alert('message') with addToast('message', 'error')
    // We assume most alerts in catches are errors. 
    // Specific success ones like in AdminSettings will be corrected manually or handled if needed.
    content = content.replace(/alert\((.*?)\);?/g, (match, msg) => {
      // rough heuristic for success vs error
      if (msg.toLowerCase().includes('success') || msg.toLowerCase().includes('saved')) {
        return `addToast(${msg}, 'success');`;
      }
      return `addToast(${msg}, 'error');`;
    });
    
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
