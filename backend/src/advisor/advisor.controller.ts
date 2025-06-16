// src/advisor/advisor.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { AdvisorService } from './advisor.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { User } from 'src/users/users.entity';
import { AuthenticatedRequest } from './dto/auth-request.dto';

@Controller('advisor')
@UseGuards(JwtAuthGuard)
export class AdvisorController {
  constructor(private readonly advisorService: AdvisorService) { }

  @Get('certified')
  async getCertifiedAdvisors() {
    return this.advisorService.getCertifiedAdvisors();
  }

  @Post('assign/:advisorId')
  async assignAdvisor(
    @Req() req: AuthenticatedRequest,
    @Param('advisorId') advisorId: string,
  ) {
    if (!req.user?.userId) {
      throw new NotFoundException('Usuario no autenticado correctamente');
    }
    const userId = req.user.userId; 
    return this.advisorService.assignAdvisor(userId, advisorId);
  }

  @Get('my-advisor')
  async getMyAdvisor(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return await this.advisorService.getAssignedAdvisor(userId);
  }
}