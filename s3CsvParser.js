import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
dayjs.extend(customParseFormat);

const s3 = new S3Client();

export async function parseVintedFromCsvS3(bucket, key) {
    console.log('parseVintedFromCsvS3', bucket, key);
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3.send(command);

    return new Promise((resolve, reject) => {
        const results = [];
        let headerReached = false;
        let headerCols = [];
        let buffer = '';
        let currentBlock = null;
        let motifVinted = false;

        const stream = Readable.from(response.Body);
        stream.on('data', chunk => { buffer += chunk.toString(); });
        stream.on('end', () => {
            const rawLines = buffer.split('\n');
            for (let i = 0; i < rawLines.length; i++) {
                const line = rawLines[i].trim();
                if (!headerReached) {
                    if (line.toLowerCase().replace(/\s/g, '').startsWith("date;naturedel'opération")) {
                        headerReached = true;
                        headerCols = line.split(';').map(h => h.replace(/"/g, '').trim());
                    }
                    continue;
                }
                if (!line) continue;
                // Si la ligne commence par une date JJ/MM/AAAA
                if (/^"?\d{2}\/\d{2}\/\d{4}/.test(line)) {
                    // Si le bloc précédent a un motif Vinted, on l'ajoute
                    if (currentBlock && motifVinted) {
                        results.push(currentBlock);
                    }
                    // Nouveau bloc
                    const cols = line.split(';').map(col => col.replace(/"/g, '').trim());
                    const dateStr = cols[0].replace(/"/g, '').replace(/\r/g, '').trim();
                    const date = dayjs(dateStr, 'DD/MM/YYYY', true).isValid() ? dayjs(dateStr, 'DD/MM/YYYY').format('YYYY-MM-DD') : null;
                    if (!date) {
                        console.log('Date invalide détectée dans le CSV:', cols[0]);
                    }
                    console.log('Parsing date:', dateStr, '->', dayjs(dateStr, 'DD/MM/YYYY', true).format());
                    const montant = parseFloat(cols[3]?.replace(',', '.'));
                    currentBlock = { date, montant };
                    motifVinted = false;
                } else {
                    // Sous-ligne du bloc courant
                    if (line.toLowerCase().includes('vinted')) {
                        motifVinted = true;
                    }
                }
            }
            // Dernier bloc
            if (currentBlock && motifVinted) {
                results.push(currentBlock);
            }
            resolve(results);
        });
        stream.on('error', reject);
    });
} 