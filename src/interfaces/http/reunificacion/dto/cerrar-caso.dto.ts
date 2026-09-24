import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CerrarCasoDto {
  @ApiProperty({ example: '12.345.678-9' })
  @IsString()
  @IsNotEmpty()
  receptorRut!: string;

  @ApiProperty({ example: 'Juan Pérez González' })
  @IsString()
  @IsNotEmpty()
  receptorNombre!: string;
}