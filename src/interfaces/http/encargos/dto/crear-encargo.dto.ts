import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsEmail,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { TipoEvento } from '../../../../domain/enums';
import { IsPlacaChilena } from '../../../../shared/validators/placa-chilena.validator';

export class CrearEncargoDto {
  @ApiProperty({ example: 'BBCC12', description: 'Placa patente en formato chileno' })
  @IsString()
  @IsNotEmpty()
  @IsPlacaChilena()
  placa!: string;

  @ApiProperty({ enum: TipoEvento, example: TipoEvento.EXTRAVIO })
  @IsEnum(TipoEvento)
  tipoEvento!: TipoEvento;

  @ApiProperty({ example: '12.345.678-9' })
  @IsString()
  @IsNotEmpty()
  denuncianteRut!: string;

  @ApiProperty({ example: 'Juan Pérez González' })
  @IsString()
  @IsNotEmpty()
  denuncianteNombre!: string;

  @ApiProperty({ example: 'juan.perez@mail.cl' })
  @IsEmail()
  denuncianteEmail!: string;

  @ApiProperty({ example: 'EMAIL', default: 'EMAIL' })
  @IsString()
  @IsOptional()
  canalNotificacion?: string = 'EMAIL';

  @ApiProperty({ example: 'C-2026-001234', required: false })
  @IsString()
  @IsOptional()
  constanciaNumero?: string;

  @ApiProperty({ example: '2026-09-20' })
  @IsDateString()
  fechaHecho!: string;

  @ApiProperty({ example: 'Placa extraviada en estacionamiento', required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  unidadId!: string;
}