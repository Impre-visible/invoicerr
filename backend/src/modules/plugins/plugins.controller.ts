import { PluginsService } from '@/modules/plugins/plugins.service';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';


@Controller('plugins')
export class PluginsController {
  constructor(private readonly pluginsService: PluginsService) { }

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

  @Get('in-app')
  async getInAppPlugins() {
    return this.pluginsService.getInAppPlugins();
  }

  @Get('provider/:type')
  async getProvider(@Param('type') type: string) {
    const provider = await this.pluginsService.getProvider(type);
    if (!provider) {
      return { message: `No active provider found for type: ${type}` };
    }
    return {
      id: provider.id,
      name: provider.name,
      type: type,
      hasProvider: true
    };
  }
}
