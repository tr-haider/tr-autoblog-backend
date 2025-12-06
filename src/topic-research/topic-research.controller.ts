import { Controller, Get, Query } from '@nestjs/common';
import { TopicResearchService, TrendingTopic } from './topic-research.service';

@Controller('topic-research')
export class TopicResearchController {
  constructor(private readonly topicResearchService: TopicResearchService) {}

  @Get('trending')
  async getTrendingTopics(): Promise<TrendingTopic[]> {
    return this.topicResearchService.getTrendingTopics();
  }

  @Get('random')
  async getRandomTrendingTopic(): Promise<TrendingTopic> {
    return this.topicResearchService.getRandomTrendingTopic();
  }
} 