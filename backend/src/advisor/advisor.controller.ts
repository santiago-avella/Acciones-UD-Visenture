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

@Controller('advisor')
//@UseGuards(JwtAuthGuard)
export class AdvisorController {
  constructor(private readonly advisorService: AdvisorService) {}

  @Get('certified')
  async getCertifiedAdvisors() {
    return this.advisorService.getCertifiedAdvisors();
  }

  @Post('assign/:advisorId')
  async assignAdvisor(
    @Req() req: Request,
    @Param('advisorId') advisorId: string,
  ) {
    const userId = (req.user as { identity_document: string }).identity_document;
    return this.advisorService.assignAdvisor(userId, advisorId);
  }

  @Get('my-advisor')
  async getMyAdvisor(@Req() req: Request) {
    const userId = (req.user as { identity_document: string }).identity_document;
    const advisor = await this.advisorService.getAssignedAdvisor(userId);
    
    if (!advisor) {
      throw new NotFoundException('No tienes un comisionista asignado');
    }
    
    return {
      identity_document: advisor.identity_document,
      first_name: advisor.first_name,
      last_name: advisor.last_name,
      phone: advisor.phone,
    };
  }
}