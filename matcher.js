import dayjs from 'dayjs';

export function findMatchingTransaction(sheetRow, csvRows) {
    console.log('findMatchingTransaction', sheetRow, csvRows);
    return csvRows.find(c => {
    console.log('Comparaison:', { dateSheet: sheetRow.date, dateCsv: c.date, montantSheet: sheetRow.montant, montantCsv: c.montant });
        const montantOk = Math.abs(c.montant - sheetRow.montant) < 0.01;
        const dateSheet = dayjs(sheetRow.date);
        const dateCsv = dayjs(c.date);
        const dateDiff = Math.abs(dateSheet.diff(dateCsv, 'day'));
        return montantOk && dateDiff <= 5;
    });
}