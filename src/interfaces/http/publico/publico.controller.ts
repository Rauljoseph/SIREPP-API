import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ConsultarPlacaPublicaUseCase } from '../../../application/placa-publica/consultar-placa-publica.use-case';
import { Public } from '../../../shared/auth/public.decorator';

@ApiTags('Consulta pública')
@Public()
@Controller('api/v1/publico/placas')
export class PublicoController {
  constructor(
    private readonly consultarPlaca: ConsultarPlacaPublicaUseCase,
  ) {}

  @Get(':placa')
  @ApiOperation({
    summary: 'Consultar estado público de una placa patente',
    description: 'Endpoint público sin autenticación. Permite a cualquier ciudadano consultar si su placa patente ha sido encontrada o está en búsqueda.',
  })
  @ApiParam({
    name: 'placa',
    description: 'Placa patente a consultar (formato BBCC12 o XX1234)',
    example: 'HRTP45',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado de la consulta',
    schema: {
      example: {
        encontrada: true,
        placa: 'HRTP45',
        estado: 'EN_CUSTODIA',
        mensaje: 'Esta placa patente fue encontrada y se encuentra bajo custodia policial.',
        unidad: {
          nombre: '10ª Comisaría de La Cisterna',
          direccion: 'Av. El Parrón 1234',
          comuna: 'La Cisterna',
          region: 'Metropolitana',
          latitud: -33.527,
          longitud: -70.657,
          horarioAtencion: 'Lunes a Viernes 08:00 - 14:00 hrs',
          telefono: '+56 2 2345 6789',
        },
        requisitosRetiro: '• Cédula de identidad vigente del propietario\n• Certificado de inscripción del vehículo o padrón\n• Constancia de extravío o denuncia (si aplica)\n• En caso de representante: poder notarial simple',
        fechaIngreso: '2026-11-15T00:00:00.000Z',
      },
    },
  })
  async consultarPlacaPublica(@Param('placa') placa: string) {
    return this.consultarPlaca.ejecutar(placa);
  }
}