import { Module } from '@nestjs/common';
import { TopicResearchService } from './topic-research.service';
import { TopicResearchController } from './topic-research.controller';

@Module({
  providers: [TopicResearchService],
  controllers: [TopicResearchController],
  exports: [TopicResearchService],
})
export class TopicResearchModule {} 