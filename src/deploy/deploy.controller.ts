/* eslint-disable prettier/prettier */
import { Body, Controller, Post } from '@nestjs/common';
import { DeployService } from './deploy.service';

@Controller('deploy')
export class DeployController {
    constructor(private readonly deployService: DeployService) { }

    @Post()
    deploy(@Body('repoUrl') repoUrl: string,
        @Body('env') env: string,
    ) {
        return this.deployService.deployRepodeployRepo(repoUrl, env);
    }
}
