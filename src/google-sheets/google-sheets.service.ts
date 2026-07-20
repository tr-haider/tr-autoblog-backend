import {
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { google, sheets_v4 } from 'googleapis';
import { ConfigService } from '@nestjs/config';

function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, '\n');
}

@Injectable()
export class GoogleSheetsService implements OnModuleInit {
  private sheets: sheets_v4.Sheets;
  private auth: InstanceType<typeof google.auth.JWT>;
  private ready = false;
  private initError: string | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      await this.ensureInitialized();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.initError = message;
      console.error('❌ Google Sheets init failed (app will start):', message);
    }
  }

  private getConfig() {
    const clientEmail =
      this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL') ||
      this.configService.get<string>('googleSheets.serviceAccountEmail');
    const privateKey =
      this.configService.get<string>('GOOGLE_PRIVATE_KEY') ||
      this.configService.get<string>('googleSheets.privateKey');
    const spreadsheetId =
      this.configService.get<string>('GOOGLE_SHEET_ID') ||
      this.configService.get<string>('googleSheets.spreadsheetId');

    return { clientEmail, privateKey, spreadsheetId };
  }

  private async ensureInitialized(): Promise<void> {
    if (this.ready) {
      return;
    }

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.initializeAuth();
    try {
      await this.initPromise;
    } catch (error) {
      this.initPromise = null;
      throw error;
    }
  }

  private async initializeAuth(): Promise<void> {
    const { clientEmail, privateKey, spreadsheetId } = this.getConfig();

    const missing: string[] = [];
    if (!clientEmail) missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    if (!privateKey) missing.push('GOOGLE_PRIVATE_KEY');
    if (!spreadsheetId) missing.push('GOOGLE_SHEET_ID');

    if (missing.length > 0) {
      throw new ServiceUnavailableException({
        message: `Google Sheets is not configured. Set these environment variables: ${missing.join(', ')}`,
        code: 'GOOGLE_SHEETS_NOT_CONFIGURED',
        missing,
      });
    }

    const normalizedKey = normalizePrivateKey(privateKey!);
    if (!normalizedKey.includes('BEGIN PRIVATE KEY')) {
      throw new ServiceUnavailableException({
        message:
          'GOOGLE_PRIVATE_KEY appears invalid. Paste the full key with \\n for line breaks (see GOOGLE_SHEETS_SETUP.md).',
        code: 'GOOGLE_SHEETS_INVALID_KEY',
      });
    }

    try {
      this.auth = new google.auth.JWT({
        email: clientEmail,
        key: normalizedKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.ready = true;
      this.initError = null;
      console.log('✅ Google Sheets authentication initialized');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ServiceUnavailableException({
        message: `Google Sheets authentication failed: ${message}`,
        code: 'GOOGLE_SHEETS_AUTH_FAILED',
      });
    }
  }

  private async ensureReady(): Promise<void> {
    if (this.ready) {
      return;
    }

    if (this.initError) {
      throw new ServiceUnavailableException({
        message: this.initError,
        code: 'GOOGLE_SHEETS_NOT_CONFIGURED',
      });
    }

    await this.ensureInitialized();

    if (!this.ready) {
      throw new ServiceUnavailableException({
        message: 'Google Sheets service failed to initialize',
        code: 'GOOGLE_SHEETS_NOT_READY',
      });
    }
  }

  getDefaultTab(): string {
    return (
      this.configService.get<string>('GOOGLE_SHEET_DEFAULT_TAB') ||
      this.configService.get<string>('googleSheets.defaultTab') ||
      'Blogs - AI mostly'
    );
  }

  buildRange(sheetName: string): string {
    const quoted = sheetName.includes(' ')
      ? `'${sheetName.replace(/'/g, "''")}'`
      : sheetName;
    return `${quoted}!A:AH`;
  }

  async getSheetData(
    spreadsheetId?: string,
    range: string = 'Sheet1!A:AH',
  ): Promise<string[][]> {
    await this.ensureReady();

    const sheetId = spreadsheetId || this.getConfig().spreadsheetId;
    if (!sheetId) {
      throw new ServiceUnavailableException({
        message: 'GOOGLE_SHEET_ID is not set',
        code: 'GOOGLE_SHEETS_NOT_CONFIGURED',
      });
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      });
      return (response.data.values as string[][]) || [];
    } catch (error) {
      throw this.wrapGoogleError(error);
    }
  }

  async getSheetDataAsObjects(
    spreadsheetId?: string,
    range?: string,
  ): Promise<Record<string, string>[]> {
    const effectiveRange = range || this.buildRange(this.getDefaultTab());
    const rows = await this.getSheetData(spreadsheetId, effectiveRange);

    if (rows.length === 0) {
      return [];
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    return dataRows.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
  }

  async getSpreadsheetMetadata(spreadsheetId?: string) {
    await this.ensureReady();

    const sheetId = spreadsheetId || this.getConfig().spreadsheetId;
    if (!sheetId) {
      throw new ServiceUnavailableException({
        message: 'GOOGLE_SHEET_ID is not set',
        code: 'GOOGLE_SHEETS_NOT_CONFIGURED',
      });
    }

    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: sheetId,
      });

      return {
        title: response.data.properties?.title,
        sheets: response.data.sheets?.map((sheet) => ({
          title: sheet.properties?.title,
          sheetId: sheet.properties?.sheetId,
          rowCount: sheet.properties?.gridProperties?.rowCount,
          columnCount: sheet.properties?.gridProperties?.columnCount,
        })),
      };
    } catch (error) {
      throw this.wrapGoogleError(error);
    }
  }

  private wrapGoogleError(error: unknown): ServiceUnavailableException {
    const err = error as { message?: string; code?: number; response?: { data?: { error?: { message?: string } } } };
    const googleMessage =
      err?.response?.data?.error?.message || err?.message || 'Unknown Google API error';

    if (err?.code === 403 || googleMessage.toLowerCase().includes('permission')) {
      return new ServiceUnavailableException({
        message:
          'Google Sheets permission denied. Share the spreadsheet with the service account email.',
        code: 'GOOGLE_SHEETS_PERMISSION_DENIED',
        detail: googleMessage,
      });
    }

    return new ServiceUnavailableException({
      message: `Google Sheets API error: ${googleMessage}`,
      code: 'GOOGLE_SHEETS_API_ERROR',
    });
  }
}
