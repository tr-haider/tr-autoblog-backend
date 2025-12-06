import { Module } from '@nestjs/common';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { BlogGeneratorModule } from '../blog-generator/blog-generator.module';
import { EmailModule } from '../email-service/email.module';
import { TopicResearchModule } from '../topic-research/topic-research.module';

@Module({
  imports: [BlogGeneratorModule, EmailModule, TopicResearchModule],
  controllers: [SchedulerController],
  providers: [SchedulerService],
})
export class SchedulerModule {} 