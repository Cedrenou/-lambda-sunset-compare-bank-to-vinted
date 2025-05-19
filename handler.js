import { JWT } from 'google-auth-library';
import dayjs from 'dayjs';
import { parseVintedFromCsvS3 } from './s3CsvParser.js';
import { getSheetRows, cocherCase, getAllSheetNames } from './googleSheet.js';
import { findMatchingTransaction } from './matcher.js';

export const handler = async (event) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    const spreadsheetId = process.env.SPREADSHEET_ID;
    const auth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    // Récupérer tous les noms d'onglets
    const sheetNames = await getAllSheetNames(auth, spreadsheetId);
    const csvRows = await parseVintedFromCsvS3(bucket, key);
    console.log("csvRows:", csvRows);

    for (const sheetName of sheetNames) {
        const sheetRows = await getSheetRows(auth, spreadsheetId, sheetName);
        for (const row of sheetRows) {
            if (row.verifie || !row.montant) continue;
            const match = findMatchingTransaction(row, csvRows);
            if (match) {
                await cocherCase(auth, spreadsheetId, sheetName, row.rowIndex);
            }
        }
    }
};