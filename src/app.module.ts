import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlogGeneratorModule } from './blog-generator/blog-generator.module';
import { EmailModule } from './email-service/email.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { TopicResearchModule } from './topic-research/topic-research.module';
import configuration from './config/configuration';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(__dirname, '../.env'),    // Look in backend root directory
        '.env',                                 // Fallback to current working directory
      ],
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    BlogGeneratorModule,
    EmailModule,
    SchedulerModule,
    TopicResearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
