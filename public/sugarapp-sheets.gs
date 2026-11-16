// Bind this script to the destination Google spreadsheet and deploy as a Web App.
// Execute as the spreadsheet owner; allow access to Anyone.
function doPost(e) {
  var payload = JSON.parse(e.postData.contents);
  if (payload.test === true) return ContentService.createTextOutput('OK');
  if (['Transaksi', 'Pengeluaran', 'Terbuang'].indexOf(payload.sheetType) < 0 || ['CREATE', 'UPDATE', 'DELETE'].indexOf(payload.action) < 0 || !payload.id || !payload.eventId) throw new Error('Invalid event');
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var book = SpreadsheetApp.getActiveSpreadsheet();
    var log = book.getSheetByName('_SugarAppEvents') || book.insertSheet('_SugarAppEvents');
    if (log.getLastRow() && log.getRange(1, 1, log.getLastRow(), 1).createTextFinder(payload.eventId).matchEntireCell(true).findNext()) return ContentService.createTextOutput('Duplicate');
    var sheet = book.getSheetByName(payload.sheetType) || book.insertSheet(payload.sheetType);
    var headers = payload.sheetType === 'Transaksi' ? ['ID', 'Tanggal', 'Waktu', 'Kategori/Item', 'Detail Varian/Kuantitas', 'Metode Bayar', 'Total Nominal', 'HPP', 'Laba Bersih'] : payload.sheetType === 'Pengeluaran' ? ['ID', 'Tanggal', 'Waktu', 'Kategori / Nama Barang', 'Catatan', 'Jumlah Stok Masuk', 'Total Pengeluaran'] : ['ID', 'Tanggal', 'Waktu', 'Nama Barang', 'Jumlah Terbuang', 'Total Kerugian'];
    if (!sheet.getLastRow()) sheet.appendRow(headers);
    if (sheet.getRange(1, 1).getValue() !== 'ID') throw new Error('Use a new ID-first sheet or migrate existing columns first');
    var cell = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(payload.id).matchEntireCell(true).findNext() : null;
    if (payload.action === 'DELETE') {
      if (cell) sheet.deleteRow(cell.getRow());
    } else {
      if (!Array.isArray(payload.rowValues) || payload.rowValues.length !== headers.length) throw new Error('Invalid row');
      // Escape user-entered text to prevent spreadsheet formula injection.
      var values = payload.rowValues.map(function(value) { return typeof value === 'string' && /^[=+\-@]/.test(value) ? "'" + value : value; });
      if (cell) sheet.getRange(cell.getRow(), 1, 1, headers.length).setValues([values]);
      else sheet.appendRow(values);
    }
    log.appendRow([payload.eventId, new Date()]);
    return ContentService.createTextOutput('OK');
  } finally { lock.releaseLock(); }
}