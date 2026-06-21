import { Module } from '@nestjs/common';
import { DogsModule } from '../dogs/dogs.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [DogsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
