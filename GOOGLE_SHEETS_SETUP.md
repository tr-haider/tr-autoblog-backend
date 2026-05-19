# Google Sheets Integration Setup

This document explains how to use the Google Sheets integration in the backend.

## 📋 Prerequisites

1. **Service Account Credentials** - Already added to `.env`
2. **Google Sheet** - Make sure you have a Google Sheet ready
3. **Share the Sheet** - Share it with the service account email

## 🔑 Environment Variables

The following variables are already configured in `.env`:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=ai-blog-tool-service-account@ai-blog-tool-489411.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-sheet-id-here
```

### ⚠️ Important: Update `GOOGLE_SHEET_ID`

You need to replace `your-sheet-id-here` with your actual Google Sheet ID.

**How to get Sheet ID:**
1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Copy the `SHEET_ID` part and paste it into `.env`

## 🔐 Share Your Sheet

**CRITICAL:** You must share your Google Sheet with the service account email, or it won't work!

1. Open your Google Sheet
2. Click the "Share" button (top right)
3. Add this email: `ai-blog-tool-service-account@ai-blog-tool-489411.iam.gserviceaccount.com`
4. Set permission to **Viewer** (read-only)
5. Click "Send"

## ☁️ Vercel (Production)

`/blog-generator/suggested-topics` works without Google Sheets. **Content tracker** needs these in **Vercel → Project → Settings → Environment Variables** (Production):

| Variable | Example |
|----------|---------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `ai-blog-tool-service-account@....iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | Full key on **one line**, use `\n` for line breaks (not real newlines) |
| `GOOGLE_SHEET_ID` | ID from the sheet URL |

**Private key on Vercel:** copy from your JSON `private_key` field exactly as stored in local `.env` (quoted string with `\n`). Do not commit the JSON file.

After adding variables, **Redeploy** the backend (Deployments → ⋯ → Redeploy).

If misconfigured, the API returns **503** with JSON like:

```json
{
  "message": "Google Sheets is not configured. Set these environment variables: GOOGLE_PRIVATE_KEY, ...",
  "code": "GOOGLE_SHEETS_NOT_CONFIGURED"
}
```

## 🌐 REST API Endpoints

After the backend is running (`npm run start:dev`):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/content-tracker/metadata` | Spreadsheet title and tab list |
| GET | `/content-tracker/rows?sheet=...&status=...&search=...` | Content rows (filtered) |

Optional env:

```env
GOOGLE_SHEET_DEFAULT_TAB=Blogs - AI mostly
```

## 🧪 Testing

After updating the `GOOGLE_SHEET_ID` in `.env`, run the test script:

```bash
cd backend
npm run sheets:test
```

Or directly:

```bash
cd backend
node test-google-sheets.js
```

This will:
- Test authentication
- Fetch spreadsheet metadata
- Display available sheets
- Show sample data from the first sheet

## 💻 Usage in Your Code

### 1. Inject the Service

```typescript
import { GoogleSheetsService } from './google-sheets/google-sheets.service';

constructor(private googleSheetsService: GoogleSheetsService) {}
```

### 2. Fetch Raw Data (as 2D array)

```typescript
// Fetch from default sheet in .env
const data = await this.googleSheetsService.getSheetData();

// Or specify sheet and range
const data = await this.googleSheetsService.getSheetData(
  'your-sheet-id',
  'Topics!A:D'
);
```

### 3. Fetch Parsed Data (as objects)

```typescript
// First row is used as headers, rest as data
const objects = await this.googleSheetsService.getSheetDataAsObjects(
  undefined,
  'Topics!A:E'
);

// Example output:
// [
//   { Topic: 'AI in Healthcare', Priority: 'High', Status: 'Active' },
//   { Topic: 'HIPAA Compliance', Priority: 'Medium', Status: 'Active' }
// ]
```

### 4. Get Spreadsheet Metadata

```typescript
const metadata = await this.googleSheetsService.getSpreadsheetMetadata();

console.log(metadata.title); // Spreadsheet name
console.log(metadata.sheets); // Array of sheet info
```

## 📊 Range Examples

| Range | Description |
|-------|-------------|
| `Sheet1!A:Z` | All columns A-Z from Sheet1 |
| `Topics!A:D` | Columns A-D from Topics sheet |
| `Sheet1!A1:B10` | Specific range A1 to B10 |
| `Sheet1` | All data from Sheet1 |

## 🚀 Example Use Case: Fetch Blog Topics

```typescript
import { Injectable } from '@nestjs/common';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';

@Injectable()
export class TopicService {
  constructor(private googleSheetsService: GoogleSheetsService) {}

  async getBlogTopics() {
    try {
      // Assuming your sheet has columns: Topic, Priority, Category, Status
      const topics = await this.googleSheetsService.getSheetDataAsObjects(
        undefined,
        'Topics!A:D'
      );

      // Filter only active topics
      return topics.filter(topic => topic.Status === 'Active');
    } catch (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }
  }
}
```

## ❌ Troubleshooting

### Error: "The caller does not have permission"

**Solution:** Make sure you've shared the Google Sheet with the service account email.

### Error: "Requested entity was not found"

**Solution:** Double-check that `GOOGLE_SHEET_ID` in `.env` is correct.

### Error: "Failed to initialize Google Sheets auth"

**Solution:** Verify that `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY` are set in `.env`.

## 🔒 Security Notes

1. ✅ All credentials are stored in `.env` (not in JSON files)
2. ✅ Using read-only scope (`spreadsheets.readonly`)
3. ✅ Make sure `.env` is in `.gitignore`
4. ✅ Never commit credentials to version control

## 🗑️ Clean Up

You can now safely delete the JSON credential file:

```bash
rm backend/ai-blog-tool-489411-ac54cf7f3dc5.json
```

All credentials are loaded from `.env` instead.
