const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUCKET_NAME = 'litematic-textures';
const TEXTURES_PATH = './textures'; // Путь к папке с текстурами

// Функция для получения всех файлов рекурсивно
function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
        } else {
            arrayOfFiles.push(filePath);
        }
    });

    return arrayOfFiles;
}

// Функция для загрузки файла в R2
function uploadFile(localPath) {
    // Получаем относительный путь для R2 (убираем ./textures/)
    const r2Path = localPath.replace(/\\/g, '/').replace('./textures/', 'textures/');

    try {
        console.log(`Загружаю: ${r2Path}`);

        // Используем правильное экранирование для Windows
        const cmd = `wrangler r2 object put "${BUCKET_NAME}/${r2Path}" --file="${localPath}"`;

        execSync(cmd, {
            stdio: 'pipe',
            encoding: 'utf-8'
        });

        console.log(`✓ Загружено`);
        return true;
    } catch (error) {
        console.error(`✗ Ошибка: ${r2Path}`);
        return false;
    }
}

// Основная функция
async function main() {
    if (!fs.existsSync(TEXTURES_PATH)) {
        console.error(`Папка ${TEXTURES_PATH} не найдена!`);
        console.error('Запустите скрипт из корневой папки проекта litematic-viewer-main');
        process.exit(1);
    }

    console.log('Получаю список файлов...');
    const files = getAllFiles(TEXTURES_PATH);
    console.log(`Найдено файлов: ${files.length}`);
    console.log('Начинаю загрузку...\n');

    let uploaded = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
        const success = uploadFile(files[i]);

        if (success) {
            uploaded++;
        } else {
            failed++;
        }

        if ((i + 1) % 50 === 0) {
            console.log(`\n--- Прогресс: ${i + 1}/${files.length} файлов ---`);
            console.log(`Успешно: ${uploaded}, Ошибок: ${failed}\n`);
        }
    }

    console.log(`\n========================================`);
    console.log(`✅ Загрузка завершена!`);
    console.log(`Успешно: ${uploaded} файлов`);
    console.log(`Ошибок: ${failed} файлов`);
    console.log(`========================================`);
    console.log(`\nВаши текстуры доступны по адресу:`);
    console.log(`https://pub-cfc7d64529454591960858c4ae2d9197.r2.dev/textures/`);
}

main();