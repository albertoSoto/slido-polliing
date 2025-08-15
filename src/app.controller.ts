import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('app/vote')
  getVotingPage() {
    return { title: 'Vote' };
  }

  @Get('admin')
  @Render('app/admin')
  getAdminPage() {
    return { title: 'Admin' };
  }

  @Get('presenter')
  @Render('app/presenter')
  getPresenterPage() {
    return { title: 'Presenter' };
  }

  @Get('vote/:pollId')
  @Render('app/vote')
  getVotePage() {
    return { title: 'Vote' };
  }
}