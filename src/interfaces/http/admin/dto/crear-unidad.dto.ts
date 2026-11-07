import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum TipoUnidadDto {
  COMISARIA = 'COMISARIA',
  SUBCOMISARIA = 'SUBCOMISARIA',
  TENENCIA = 'TENENCIA',
  RETEN = 'RETEN',
}

export class CrearUnidadDto {
  @ApiProperty({ example: '1a Comisaría de Santiago Centro' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ enum: TipoUnidadDto, example: 'COMISARIA' })
  @IsEnum(TipoUnidadDto)
  tipo!: TipoUnidadDto;

  @ApiProperty({ example: 'Av. General Mackenna 1314, Santiago' })
  @IsString()
  @IsNotEmpty()
  direccion!: string;

  @ApiProperty({ example: 'Metropolitana' })
  @IsString()
  @IsNotEmpty()
  region!: string;

  @ApiProperty({ example: 'Santiago' })
  @IsString()
  @IsNotEmpty()
  comuna!: string;

  @ApiProperty({ example: 'Lunes a Viernes 08:00-20:00', required: false })
  @IsString()
  @IsOptional()
  horarioAtencion?: string;

  @ApiProperty({ example: '+56229221234', required: false })
  @IsString()
  @IsOptional()
  telefono?: string;
}