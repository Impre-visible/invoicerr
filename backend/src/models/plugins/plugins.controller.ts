import { Controller, Get } from '@nestjs/common';

import { LoginRequired } from 'src/decorators/login-required.decorator';
import { PluginsService } from '../plugins/plugins.service';

@Controller('plugins')
export class PluginsController {
    constructor(private readonly pluginsService: PluginsService) { }

    @Get()
    @LoginRequired()
    async getPlugins() {
        return this.pluginsService.getPlugins();
    }

    @Get('formats')
    @LoginRequired()
    async getFormats() {
        return this.pluginsService.getFormats();
    }
}
