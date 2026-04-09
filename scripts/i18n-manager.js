const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '../messages');
const LOCALES = ['es', 'en', 'pt', 'zh'];

/**
 * Utility to deep set a value in an object using a dot-notated path.
 */
function setByPath(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

/**
 * Utility to deep get keys of an object.
 */
function getDeepKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((res, el) => {
    if (Array.isArray(obj[el])) {
      return res;
    } else if (typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, ...getDeepKeys(obj[el], prefix + el + '.')];
    }
    return [...res, prefix + el];
  }, []);
}

/**
 * Add a key to all language files.
 * Usage: node i18n-manager.js add section.key es="Val" en="Val" ...
 */
function addKey(keyPath, translations) {
  LOCALES.forEach(locale => {
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Use the provided translation or a placeholder
    const val = translations[locale] || `[MISSING: ${translations['es'] || keyPath}]`;
    
    setByPath(content, keyPath, val);
    
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated ${locale}.json: ${keyPath} -> ${val}`);
  });
}

/**
 * Sync all files based on es.json as master.
 */
function syncKeys() {
  const masterPath = path.join(MESSAGES_DIR, 'es.json');
  const masterContent = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
  const masterKeys = getDeepKeys(masterContent);

  LOCALES.filter(l => l !== 'es').forEach(locale => {
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let updated = false;

    masterKeys.forEach(key => {
      // Simple check for existence (could be deep but for now checking dot path)
      const keys = key.split('.');
      let cur = content;
      let exists = true;
      for (const k of keys) {
        if (!cur[k]) {
          exists = false;
          break;
        }
        cur = cur[k];
      }

      if (!exists) {
        // Find the Spanish value to use as placeholder hint
        let esVal = masterContent;
        for (const k of keys) esVal = esVal[k];
        
        setByPath(content, key, `[TODO: ${esVal}]`);
        updated = true;
        console.log(`⚠️  Added placeholder to ${locale}.json: ${key}`);
      }
    });

    if (updated) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    }
  });
}

const [,, command, ...args] = process.argv;

if (command === 'add') {
  const keyPath = args[0];
  const translations = {};
  args.slice(1).forEach(arg => {
    const [lang, ...rest] = arg.split('=');
    translations[lang] = rest.join('=').replace(/^"(.*)"$/, '$1');
  });
  addKey(keyPath, translations);
} else if (command === 'sync') {
  syncKeys();
} else {
  console.log('Usage:');
  console.log('  node i18n-manager.js add <path.key> es="Value" en="Value" ...');
  console.log('  node i18n-manager.js sync');
}
