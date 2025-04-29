// src/app.module.ts
import { Module } from '@nestjs/common';
import { DeployController } from './deploy/deploy.controller';
import { DeployService } from './deploy/deploy.service';

@Module({
  controllers: [DeployController],
  providers: [DeployService],
})
export class AppModule {}
