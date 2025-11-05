var deepslateResources;

// Базовый URL для текстур в R2
const TEXTURES_BASE_URL = 'https://pub-cfc7d64529454591960858c4ae2d9197.r2.dev/';

async function loadDeepslateResources() {
    console.log("loading resources...");

    deepslateResources = await deepslate.ResourceManager.create({
        assets: TEXTURES_BASE_URL,
        atlasParams: {
            mipmap: false
        }
    });

    console.log("✓ Resources loaded");
}

function structureFromLitematic(litematic, minY, maxY) {
    console.log("=== structureFromLitematic called ===");
    console.log(`Y range requested: ${minY} to ${maxY}`);

    if (!litematic || !litematic.regions || litematic.regions.length === 0) {
        console.error("Invalid litematic structure");
        return null;
    }

    const region = litematic.regions[0];
    const blocks = region.blocks;
    const blockPalette = region.blockPalette;

    if (!blocks || !blockPalette) {
        console.error("Missing blocks or palette");
        return null;
    }

    const width = blocks.length;
    const height = blocks[0].length;
    const depth = blocks[0][0].length;

    console.log(`Original structure dimensions: ${width} x ${height} x ${depth}`);

    const actualMinY = Math.max(0, Math.min(minY, height - 1));
    const actualMaxY = Math.max(0, Math.min(maxY, height - 1));

    if (actualMinY > actualMaxY) {
        console.error(`Invalid Y range: ${actualMinY} to ${actualMaxY}`);
        return null;
    }

    const layerCount = actualMaxY - actualMinY + 1;
    console.log(`Actual Y range: ${actualMinY} to ${actualMaxY} (${layerCount} layers)`);

    console.log("Building blocks...");
    const resultBlocks = [];

    for (let x = 0; x < width; x++) {
        for (let y = actualMinY; y <= actualMaxY; y++) {
            for (let z = 0; z < depth; z++) {
                const blockID = blocks[x][y][z];

                if (blockID > 0 && blockID < blockPalette.length) {
                    const blockInfo = blockPalette[blockID];

                    if (blockInfo.Name !== 'minecraft:air') {
                        const blockState = deepslate.BlockState.fromString(blockInfo.Name);

                        if (blockInfo.Properties) {
                            for (const [key, value] of Object.entries(blockInfo.Properties)) {
                                blockState.with(key, value);
                            }
                        }

                        resultBlocks.push({
                            pos: [x, y - actualMinY, z],
                            state: blockState
                        });
                    }
                }
            }
        }
    }

    console.log(`✓ Created ${resultBlocks.length} blocks for layers ${actualMinY} to ${actualMaxY}`);
    const structure = deepslate.Structure.create([width, layerCount, depth], resultBlocks);
    console.log("Structure:", structure);

    return structure;
}