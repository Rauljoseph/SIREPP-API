import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class AnularEncargoDto {
  @ApiProperty({ example: 'Error de digitación en la placa', minLength: 10 })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'El motivo debe tener al menos 10 caracteres' })
  motivo!: string;

  @IsString()
  supervisorId!: string;
}