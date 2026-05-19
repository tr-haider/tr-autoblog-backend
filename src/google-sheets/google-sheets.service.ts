import { Injectable, OnModuleInit } from '@nestjs/common';
import { google, sheets_v4 } from 'googleapis';
import { ConfigService } from '@nestjs/config';
import { JWT } from 'google-auth-library';

@Injectable()
export class GoogleSheetsService implements OnModuleInit {
  private sheets: sheets_v4.Sheets;
  private auth: JWT;
  private ready = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeAuth();
  }

  private async initializeAuth() {
    const clientEmail = this.configService.get<string>(
      'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    );
    const privateKey = this.configService.get<string>('GOOGLE_PRIVATE_KEY');

    if (!clientEmail || !privateKey) {
      throw new Error(
        'GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY must be set in .env',
      );
    }

    this.auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.ready = true;
    console.log('✅ Google Sheets authentication initialized');
  }

  private ensureReady() {
    if (!this.ready) {
      throw new Error('Google Sheets service is not initialized yet');
    }
  }

  getDefaultTab(): string {
    return (
      this.configService.get<string>('GOOGLE_SHEET_DEFAULT_TAB') ||
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
    this.ensureReady();
    const sheetId =
      spreadsheetId || this.configService.get<string>('GOOGLE_SHEET_ID');

    if (!sheetId) {
      throw new Error('Spreadsheet ID not provided');
    }

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    return (response.data.values as string[][]) || [];
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
    this.ensureReady();
    const sheetId =
      spreadsheetId || this.configService.get<string>('GOOGLE_SHEET_ID');

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
  }
}
