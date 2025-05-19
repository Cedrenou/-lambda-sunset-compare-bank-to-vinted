import { JWT } from 'google-auth-library';
import dayjs from 'dayjs';
import { parseVintedFromCsvS3 } from './s3CsvParser.js';
import { getSheetRows, cocherCase, getAllSheetNames } from './googleSheet.js';
import { findMatchingTransaction } from './matcher.js';

export const handler = async (event) => {
    try {
        console.log('Début du traitement Lambda');
        const bucket = event.Records[0].s3.bucket.name;
        const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

        const spreadsheetId = process.env.SPREADSHEET_ID;
        const auth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheetNames = await getAllSheetNames(auth, spreadsheetId);
        const csvRows = await parseVintedFromCsvS3(bucket, key);

        for (const sheetName of sheetNames) {
            console.log(`Traitement de l'onglet : ${sheetName}`);
            const sheetRows = await getSheetRows(auth, spreadsheetId, sheetName);
            let nbMatches = 0;
            for (const row of sheetRows) {
                if (row.verifie || !row.montant) continue;
                const match = findMatchingTransaction(row, csvRows);
                if (match) {
                    await cocherCase(auth, spreadsheetId, sheetName, row.rowIndex);
                    nbMatches++;
                }
            }
            console.log(`Onglet "${sheetName}" : ${nbMatches} transactions cochées`);
        }
        console.log('Fin du traitement Lambda');
    } catch (error) {
        console.error('Erreur dans la lambda :', error);
        throw error;
    }
};