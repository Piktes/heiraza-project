const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function generateHash(password) {
    try {
        const hash = await bcrypt.hash(password, 12);
        const outputPath = path.join(__dirname, 'hash_new.txt');
        fs.writeFileSync(outputPath, hash);
        console.log(`Hash written to ${outputPath}`);
    } catch (err) {
        console.error(err);
    }
}

generateHash('Sahs2207$');
