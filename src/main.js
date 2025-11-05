console.log("=== main.js loaded ===");

// Multiple texture sources (fallback chain)
const TEXTURE_SOURCES = [
    'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.4/assets/minecraft/',
    'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.1/assets/minecraft/',
    'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21/assets/minecraft/',
    'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.4/assets/minecraft/',
    'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.2/assets/minecraft/',
    'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20/assets/minecraft/',
    'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.4/assets/minecraft/'
];

// Materials list functionality
function createMaterialsList(litematicBlocks) {
    console.log("Creating materials list with", litematicBlocks.length, "blocks");

    const list = document.getElementById('material-list');
    if (!list) {
        console.error("Material list element not found!");
        return;
    }

    list.innerHTML = '';

    if (litematicBlocks.length > 0) {
        litematicBlocks.forEach((block) => {
            const item = document.createElement('div');
            item.className = 'material-item' + (block.checked ? ' checked' : '');

            // Checkbox
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'material-checkbox-container';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'material-checkbox';
            checkbox.checked = block.checked;
            checkbox.addEventListener('change', (e) => {
                block.checked = e.target.checked;
                item.classList.toggle('checked', e.target.checked);
                saveCheckboxes();
            });
            checkboxContainer.appendChild(checkbox);

            // Icon with multiple sources and variants
            const imgContainer = document.createElement('div');
            imgContainer.className = 'material-img-container';
            const icon = document.createElement('img');
            icon.className = 'material-img';

            // Generate name variants
            const name = block.name.toLowerCase();
            const variants = generateNameVariants(name);

            let sourceIndex = 0;
            let variantIndex = 0;

            function tryNextSource() {
                if (sourceIndex >= TEXTURE_SOURCES.length) {
                    // All sources exhausted
                    console.warn('❌ Failed for: ' + block.name);
                    icon.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%23555"/><text x="24" y="30" text-anchor="middle" fill="white" font-size="20">?</text></svg>';
                    return;
                }

                if (variantIndex >= variants.length) {
                    // Try next source with first variant
                    sourceIndex++;
                    variantIndex = 0;
                    tryNextSource();
                    return;
                }

                const source = TEXTURE_SOURCES[sourceIndex];
                const variant = variants[variantIndex];
                icon.src = source + 'textures/item/' + variant + '.png';
                variantIndex++;
            }

            icon.onerror = tryNextSource;
            icon.onload = function() {
                const fileName = icon.src.split('/').pop();
                const version = icon.src.match(/minecraft-assets\/([^/]+)\//)?.[1] || 'unknown';
                console.log('✅ ' + block.name + ' → ' + fileName + ' (v' + version + ')');
            };

            tryNextSource();
            imgContainer.appendChild(icon);

            // Block name
            const nameDiv = document.createElement('div');
            nameDiv.className = 'material-name';
            nameDiv.textContent = block.name;

            // Quantity
            const quantityDiv = document.createElement('div');
            quantityDiv.className = 'material-quantity';
            quantityDiv.textContent = block.count.toString();

            // Stacks
            const stacksDiv = document.createElement('div');
            stacksDiv.className = 'material-stacks';
            stacksDiv.textContent = formatStacks(block.count);

            // Append all elements
            item.appendChild(checkboxContainer);
            item.appendChild(imgContainer);
            item.appendChild(nameDiv);
            item.appendChild(quantityDiv);
            item.appendChild(stacksDiv);

            list.appendChild(item);
        });
    } else {
        list.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 40px 20px;">Load a litematic file</p>';
    }
}

function generateNameVariants(name) {
    const variants = [];

    // Base variants
    variants.push(name.replace(/\s+/g, '_'));              // dark_oak_fence_gate
    variants.push(name.replace(/\s+/g, '-'));              // dark-oak-fence-gate
    variants.push(name.replace(/\s+/g, ''));               // darkoakfencegate

    // Special replacements
    variants.push(name.replace(/\s+wall\s+banner/gi, '_banner'));  // red_banner
    variants.push(name.replace(/\s+wall/gi, ''));          // remove wall
    variants.push(name.replace(/\s+standing/gi, ''));      // remove standing

    // Leaves variations
    if (name.includes('leaves') || name.includes('leaf')) {
        variants.push(name.replace(/\s+leaf$/i, '_leaves'));
        variants.push(name.replace(/\s+leaves$/i, '_leaves'));
        variants.push(name.replace(/\s+leaf\s+/gi, '_leaves_'));
    }

    // Planks, bricks, etc
    const specialEndings = ['planks', 'bricks', 'leaves', 'carpet', 'wool', 'fence', 'gate', 'door', 'slab', 'stairs'];
    specialEndings.forEach(ending => {
        const pattern = new RegExp('\\s+' + ending + '$', 'i');
        if (pattern.test(name)) {
            variants.push(name.replace(pattern, '_' + ending));
        }
    });

    // Fence gate special case
    variants.push(name.replace(/fence\s+gate/gi, 'fence_gate'));

    // First + last word
    const words = name.split(/\s+/);
    if (words.length > 1) {
        variants.push(words[0] + '_' + words[words.length - 1]);
        variants.push(words[0] + words[words.length - 1]);
    }

    // Singular to plural
    if (!name.endsWith('s')) {
        variants.push(name.replace(/\s+/g, '_') + 's');
    }

    // Remove duplicates and return
    return [...new Set(variants)];
}

function formatStacks(count) {
    if (count < 64) {
        return count.toString();
    } else if (count === 64) {
        return '1 x 64';
    } else {
        const stacks = Math.floor(count / 64);
        const remainder = count % 64;
        if (remainder === 0) {
            return stacks + ' x 64';
        } else {
            return stacks + ' x 64 + ' + remainder;
        }
    }
}

function saveCheckboxes() {
    if (typeof litematicBlocks === 'undefined') return;

    const checks = {};
    litematicBlocks.forEach(block => {
        checks[block.name] = block.checked;
    });
    localStorage.setItem('blockChecks', JSON.stringify(checks));
    console.log("Checkboxes saved to localStorage");
}

// Export functions to global scope
window.createMaterialsList = createMaterialsList;
window.formatStacks = formatStacks;
window.saveCheckboxes = saveCheckboxes;

console.log("=== main.js initialization complete ===");
console.log("Texture sources configured: " + TEXTURE_SOURCES.length);