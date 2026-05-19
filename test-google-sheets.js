require('dotenv').config();
const { google } = require('googleapis');

async function testGoogleSheets() {
  try {
    console.log('🔄 Testing Google Sheets integration...\n');

    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!clientEmail || !privateKey) {
      throw new Error(
        'GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY must be set in .env',
      );
    }

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID not set in .env file');
    }

    console.log('✅ Loaded credentials for:', clientEmail);

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📊 Fetching spreadsheet metadata...\n');

    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    console.log('📄 Spreadsheet:', metadata.data.properties.title);
    console.log('📑 Available sheets:');
    metadata.data.sheets.forEach((sheet) => {
      console.log(
        `  - ${sheet.properties.title} (${sheet.properties.gridProperties.rowCount} rows × ${sheet.properties.gridProperties.columnCount} cols)`,
      );
    });

    const firstSheetName = metadata.data.sheets[0].properties.title;
    const range = `${firstSheetName}!A:Z`;

    console.log(`\n🔄 Fetching data from range: ${range}...\n`);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    console.log(`✅ Fetched ${rows.length} rows\n`);

    if (rows.length > 0) {
      console.log('📋 First 5 rows (sample):');
      console.log('─'.repeat(80));
      rows.slice(0, 5).forEach((row, index) => {
        console.log(`Row ${index + 1}:`, row);
      });
      console.log('─'.repeat(80));

      if (rows.length > 1) {
        const headers = rows[0];
        const dataRows = rows.slice(1, 4);

        console.log('\n📦 Parsed as objects (first 3 records):');
        console.log('─'.repeat(80));
        dataRows.forEach((row, index) => {
          const obj = {};
          headers.forEach((header, i) => {
            obj[header] = row[i] || '';
          });
          console.log(`\nRecord ${index + 1}:`, JSON.stringify(obj, null, 2));
        });
      }
    } else {
      console.log('⚠️  No data found in the sheet');
    }

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 404 || error.code === 403) {
      console.error('\n💡 Make sure:');
      console.error('   1. The GOOGLE_SHEET_ID in .env is correct');
      console.error(
        '   2. The sheet is shared with:',
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      );
    }
    process.exit(1);
  }
}

testGoogleSheets();
