import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { IsPlacaChilena } from '../../../../shared/validators/placa-chilena.validator';

export class LecturaPorticoDto {
  @ApiProperty({ example: 'BBCC12' })
  @IsString()
  @IsNotEmpty()
  @IsPlacaChilena()
  placa!: string;

  @ApiProperty({ example: 'PORTICO-RUTA5-KM120' })
  @IsString()
  @IsNotEmpty()
  portico!: string;

  @ApiProperty({ example: 0.92, minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  nivelConfianza!: number;

  @ApiProperty({ example: '2026-09-23T14:30:00.000Z' })
  @IsDateString()
  timestampLectura!: string;
}