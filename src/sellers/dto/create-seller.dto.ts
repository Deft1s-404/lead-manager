import { WeekDay } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export class CreateSellerDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsEnum(WeekDay)
  availabilityStartDay?: WeekDay | null;

  @IsOptional()
  @IsEnum(WeekDay)
  availabilityEndDay?: WeekDay | null;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'availabilityStartTime must be in HH:MM format'
  })
  availabilityStartTime?: string | null;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'availabilityEndTime must be in HH:MM format'
  })
  availabilityEndTime?: string | null;
}
