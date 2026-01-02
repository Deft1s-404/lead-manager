import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EvolutionIntegrationService } from './evolution-integration.service';
import type { EvolutionSessionResponse } from './evolution-integration.service';
import { EvolutionGenerateQrDto } from './dto/evolution-generate-qr.dto';
import { EvolutionCreateInstanceDto } from './dto/evolution-create-instance.dto';

type AuthenticatedUser = {
  userId: string;
  email: string;
};

@Controller('integrations/evolution')
export class EvolutionController {
  constructor(private readonly evolutionIntegrationService: EvolutionIntegrationService) {}

  @Get('instances')
  getCurrent(@CurrentUser() user: AuthenticatedUser): Promise<EvolutionSessionResponse | null> {
    return this.evolutionIntegrationService.getCurrentSession(user.userId);
  }

  @Get('instances/list')
  listInstances(@CurrentUser() user: AuthenticatedUser): Promise<EvolutionSessionResponse[]> {
    return this.evolutionIntegrationService.listManagedInstances(user.userId);
  }

  @Post('instances')
  startSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: EvolutionGenerateQrDto
  ): Promise<EvolutionSessionResponse> {
    return this.evolutionIntegrationService.startSession(user.userId, dto.number);
  }

  @Post('instances/create')
  createInstance(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: EvolutionCreateInstanceDto
  ): Promise<EvolutionSessionResponse> {
    return this.evolutionIntegrationService.createManagedInstance(
      user.userId,
      dto.instanceName,
      dto.webhookUrl,
      dto.slotId
    );
  }

  @Post('instances/:instanceId/qr')
  refreshQr(
    @CurrentUser() user: AuthenticatedUser,
    @Param('instanceId') instanceId: string,
    @Body() dto: EvolutionGenerateQrDto
  ): Promise<EvolutionSessionResponse> {
    return this.evolutionIntegrationService.refreshQr(user.userId, instanceId, dto.number);
  }

  @Get('instances/:instanceId/status')
  getStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('instanceId') instanceId: string
  ): Promise<EvolutionSessionResponse> {
    return this.evolutionIntegrationService.getStatus(user.userId, instanceId);
  }

  @Delete('instances/:instanceId')
  disconnect(
    @CurrentUser() user: AuthenticatedUser,
    @Param('instanceId') instanceId: string
  ): Promise<EvolutionSessionResponse> {
    return this.evolutionIntegrationService.disconnect(user.userId, instanceId);
  }

  @Delete('instances/:instanceId/remove')
  removeInstance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('instanceId') instanceId: string
  ): Promise<EvolutionSessionResponse> {
    return this.evolutionIntegrationService.removeInstance(user.userId, instanceId);
  }
}
