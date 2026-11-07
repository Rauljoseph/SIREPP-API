import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsEmail, IsUUID } from 'class-validator';

export enum RolDto {
  GUARDIA = 'GUARDIA',
  SUPERVISOR = 'SUPERVISOR',
  CONSULTA = 'CONSULTA',
  ADMINISTRADOR = 'ADMINISTRADOR',
}

export class CrearUsuarioDto {
  @ApiProperty({ example: 'Juan Pérez González' })
  @IsString()
  @IsNotEmpty()
  nombreCompleto!: string;

  @ApiProperty({ example: 'juan.perez@carabineros.cl' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: RolDto, example: 'GUARDIA' })
  @IsEnum(RolDto)
  rol!: RolDto;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  unidadId!: string;
}