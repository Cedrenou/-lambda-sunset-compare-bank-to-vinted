import dayjs from 'dayjs';

export function findMatchingTransaction(sheetRow, csvRows) {
    return csvRows.find(c => {
        const montantOk = Math.abs(c.montant - sheetRow.montant) < 0.01;
        const dateSheet = dayjs(sheetRow.date);
        const dateCsv = dayjs(c.date);
        const dateDiff = Math.abs(dateSheet.diff(dateCsv, 'day'));
        return montantOk && dateDiff <= 5;
    });
}