import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { ApiController } from './api.controller';

// Services would be imported here
// import { ApiService } from './api.service';

@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [ApiController],
  providers: [
    // ApiService would be provided here
  ],
})
export class ApiModule {}