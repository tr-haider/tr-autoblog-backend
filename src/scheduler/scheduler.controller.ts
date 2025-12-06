import { Controller, Post, Get } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('trigger-weekly')
  async triggerWeeklyGeneration() {
    return this.schedulerService.triggerWeeklyGeneration();
  }

  @Post('trigger-daily')
  async triggerDailyGeneration() {
    return this.schedulerService.triggerDailyGeneration();
  }

  @Get('status')
  async getStatus() {
    return {
      status: 'active',
      timestamp: new Date().toISOString(),
      message: 'Scheduler is running and monitoring for scheduled tasks'
    };
  }
} 