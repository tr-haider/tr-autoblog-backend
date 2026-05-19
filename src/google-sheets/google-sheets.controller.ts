import { Controller, Get, Query } from '@nestjs/common';
import { GoogleSheetsService } from './google-sheets.service';
import { ContentTrackerRowsQueryDto } from '../dto/content-tracker.dto';
import {
  filterContentTrackerRows,
  mapRawRowToContentTracker,
  paginateRows,
  summarizeContentTrackerRows,
} from './content-tracker.mapper';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 15;

@Controller('content-tracker')
export class GoogleSheetsController {
  constructor(private readonly googleSheetsService: GoogleSheetsService) {}

  @Get('metadata')
  async getMetadata() {
    return this.googleSheetsService.getSpreadsheetMetadata();
  }

  @Get('rows')
  async getRows(@Query() query: ContentTrackerRowsQueryDto) {
    const sheet = query.sheet || this.googleSheetsService.getDefaultTab();
    const range = this.googleSheetsService.buildRange(sheet);

    const rawRows = await this.googleSheetsService.getSheetDataAsObjects(
      undefined,
      range,
    );

    const rows = rawRows.map(mapRawRowToContentTracker);
    const filtered = filterContentTrackerRows(rows, {
      status: query.status,
      search: query.search,
    });

    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const paginated = paginateRows(filtered, page, limit);

    const statuses = [...new Set(rows.map((r) => r.status).filter(Boolean))].sort();

    return {
      sheet,
      statuses,
      summary: summarizeContentTrackerRows(filtered),
      ...paginated,
    };
  }
}
