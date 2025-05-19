import { google } from 'googleapis';

export async function getSheetRows(auth, spreadsheetId, sheetName) {
    console.log('getSheetRows', spreadsheetId, sheetName);
    const sheets = google.sheets({ version: 'v4', auth });
    const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A2:I`
    });
    return (data.values || []).map((row, index) => ({
        rowIndex: index + 2,
        date: row[0],
        montant: parseFloat(row[3]?.replace(',', '.') || 0),
        verifie: row[8] === 'TRUE'
    }));
}

export async function cocherCase(auth, spreadsheetId, sheetName, rowIndex) {
    console.log('cocherCase', spreadsheetId, sheetName, rowIndex);
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!I${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[true]] }
    });
} 