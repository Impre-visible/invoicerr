import { Body, Controller, Delete, Get, Post } from '@nestjs/common';

import { PluginsService } from '../plugins/plugins.service';

@Controller('plugins')
export class PluginsController {
  constructor(private readonly pluginsService: PluginsService) {}

  @Get()
  async getPlugins() {
    return this.pluginsService.getPlugins().map((plugin) => ({
      uuid: plugin.__uuid,
      name: plugin.name,
      description: plugin.description,
    }));
  }

  @Get('formats')
  async getFormats() {
    return this.pluginsService.getFormats();
  }

  @Post()
  async addPlugin(@Body() body: { gitUrl: string }) {
    const { gitUrl } = body;
    if (!gitUrl) {
      throw new Error('Git URL is required');
    }
    const name =
      gitUrl
        .split('/')
        .pop()
        ?.replace(/\.git$/, '') || `unknown-plugin-${Date.now()}`;
    const pluginPath = await this.pluginsService.cloneRepo(gitUrl, name);
    const plugin = await this.pluginsService.loadPluginFromPath(pluginPath);
    return {
      uuid: plugin.__uuid,
      name: plugin.name,
      description: plugin.description,
    };
  }

  @Delete()
  async deletePlugin(@Body() body: { uuid: string }) {
    return { success: await this.pluginsService.deletePlugin(body.uuid) };
  }
}
