import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { EstadoFisico } from '../../../../domain/enums';
import { IsPlacaChilena } from '../../../../shared/validators/placa-chilena.validator';

export class CrearHallazgoDto {
  @ApiProperty({ example: 'BBCC12' })
  @IsString()
  @IsNotEmpty()
  @IsPlacaChilena()
  placa!: string;

  @ApiProperty({ enum: EstadoFisico, example: EstadoFisico.BUENO })
  @IsEnum(EstadoFisico)
  estadoFisico!: EstadoFisico;

  @ApiProperty({ example: 'Encontrada en buen estado en calle Providencia', required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  unidadId!: string;
}