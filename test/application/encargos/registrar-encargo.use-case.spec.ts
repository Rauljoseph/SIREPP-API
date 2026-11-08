import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistrarEncargoUseCase, RegistrarEncargoInput } from '../../../src/application/encargos/registrar-encargo.use-case';
import { Encargo } from '../../../src/domain/entities';
import { TipoEvento, TipoEventoDominio } from '../../../src/domain/enums';
import { PlacaInvalidaException, AccesoDenegadoException } from '../../../src/domain/exceptions';

// ── Mocks ────────────────────────────────────────────────

const mockEncargoRepo = {
  guardar: vi.fn(),
  buscarVigentePorPlaca: vi.fn(),
  buscarPorId: vi.fn(),
  listar: vi.fn(),
  actualizar: vi.fn(),
};

const mockEventoRepo = {
  guardar: vi.fn(),
  listar: vi.fn(),
};

const mockVehiculoRegistry = {
  existePlaca: vi.fn(),
};

const mockConciliar = {
  desdeEncargo: vi.fn(),
  desdeHallazgo: vi.fn(),
};

const mockNotificar = {
  ejecutar: vi.fn(),
};

const mockHallazgoRepo = {
  guardar: vi.fn(),
  buscarPorId: vi.fn(),
  buscarPorPlaca: vi.fn(),
  listar: vi.fn(),
  actualizar: vi.fn(),
};

const mockUnidadRepo = {
  buscarPorId: vi.fn(),
  listar: vi.fn(),
  guardar: vi.fn(),
  actualizar: vi.fn(),
};

const mockUsuarioRepo = {
  buscarPorId: vi.fn(),
  buscarPorKeycloakSub: vi.fn(),
  listar: vi.fn(),
  guardar: vi.fn(),
  actualizar: vi.fn(),
};

// ── Datos de prueba ──────────────────────────────────────

const INPUT_VALIDO: RegistrarEncargoInput = {
  placa: 'ABCD12',
  tipoEvento: TipoEvento.ROBO,
  denuncianteRut: '12345678-9',
  denuncianteNombre: 'Juan Pérez',
  denuncianteEmail: 'juan@example.com',
  canalNotificacion: 'EMAIL',
  fechaHecho: new Date('2026-10-01'),
  unidadId: '11111111-1111-1111-1111-111111111111',
  funcionarioId: '22222222-2222-2222-2222-222222222222',
};

const ENCARGO_GUARDADO = {
  id: 'enc-001',
  placa: 'ABCD12',
  tipoEvento: TipoEvento.ROBO,
  unidadId: INPUT_VALIDO.unidadId,
  funcionarioId: INPUT_VALIDO.funcionarioId,
  denuncianteRut: INPUT_VALIDO.denuncianteRut,
  denuncianteNombre: INPUT_VALIDO.denuncianteNombre,
  denuncianteEmail: INPUT_VALIDO.denuncianteEmail,
  canalNotificacion: INPUT_VALIDO.canalNotificacion,
  fechaHecho: INPUT_VALIDO.fechaHecho,
};

// ── Suite ─────────────────────────────────────────────────

describe('RegistrarEncargoUseCase', () => {
  let useCase: RegistrarEncargoUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    useCase = new RegistrarEncargoUseCase(
      mockEncargoRepo as any,
      mockEventoRepo as any,
      mockVehiculoRegistry as any,
      mockConciliar as any,
      mockNotificar as any,
      mockHallazgoRepo as any,
      mockUnidadRepo as any,
      mockUsuarioRepo as any,
    );

    // Defaults: funcionario con permiso, sin encargo previo, sin conciliación
    mockUsuarioRepo.buscarPorId.mockResolvedValue({
      rol: 'GUARDIA',
      puedeRegistrar: () => true,
    });
    mockEncargoRepo.buscarVigentePorPlaca.mockResolvedValue(null);
    mockEncargoRepo.guardar.mockResolvedValue(ENCARGO_GUARDADO);
    mockEventoRepo.guardar.mockResolvedValue(undefined);
    mockConciliar.desdeEncargo.mockResolvedValue(null);
  });

  // ── Caso exitoso ─────────────────────────────────────

  it('debe registrar un encargo válido y emitir evento de dominio', async () => {
    const resultado = await useCase.ejecutar(INPUT_VALIDO);

    expect(resultado.encargo).toEqual(ENCARGO_GUARDADO);
    expect(resultado.conciliacion).toBeNull();
    expect(mockEncargoRepo.guardar).toHaveBeenCalledTimes(1);
    expect(mockEventoRepo.guardar).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: TipoEventoDominio.PLACA_ENCARGADA,
      }),
    );
  });

  // ── Validación de placa ──────────────────────────────

  it('debe lanzar PlacaInvalidaException si la placa tiene formato inválido', async () => {
    const inputMala = { ...INPUT_VALIDO, placa: '123' };

    await expect(useCase.ejecutar(inputMala)).rejects.toThrow(PlacaInvalidaException);
    expect(mockEncargoRepo.guardar).not.toHaveBeenCalled();
  });

  // ── Encargo duplicado ────────────────────────────────

  it('debe lanzar error si ya existe un encargo vigente para la misma placa', async () => {
    mockEncargoRepo.buscarVigentePorPlaca.mockResolvedValue({ id: 'existente' });

    await expect(useCase.ejecutar(INPUT_VALIDO)).rejects.toThrow(
      /ya existe un encargo vigente/i,
    );
    expect(mockEncargoRepo.guardar).not.toHaveBeenCalled();
  });

  // ── Permisos ─────────────────────────────────────────

  it('debe lanzar AccesoDenegadoException si el funcionario no puede registrar', async () => {
    mockUsuarioRepo.buscarPorId.mockResolvedValue({
      rol: 'CONSULTA',
      puedeRegistrar: () => false,
    });

    await expect(useCase.ejecutar(INPUT_VALIDO)).rejects.toThrow(AccesoDenegadoException);
    expect(mockEncargoRepo.guardar).not.toHaveBeenCalled();
  });

  it('debe continuar si el funcionario no existe en la BD (sin validación)', async () => {
    mockUsuarioRepo.buscarPorId.mockResolvedValue(null);

    const resultado = await useCase.ejecutar(INPUT_VALIDO);

    expect(resultado.encargo).toEqual(ENCARGO_GUARDADO);
  });

  // ── Conciliación automática ──────────────────────────

  it('debe retornar datos de conciliación cuando hay hallazgo previo', async () => {
    const hallazgoMock = {
      id: 'hal-001',
      estadoFisico: 'BUENO',
      createdAt: new Date('2026-09-15'),
      unidadId: '33333333-3333-3333-3333-333333333333',
    };
    const unidadMock = {
      nombre: 'Comisaría Central',
      direccion: 'Av. Principal 100',
      comuna: 'Santiago',
      region: 'Metropolitana',
      horarioAtencion: '08:00-20:00',
      telefono: '+56912345678',
    };

    mockConciliar.desdeEncargo.mockResolvedValue({
      conciliada: true,
      reunificacion: { id: 'reu-001', hallazgoId: 'hal-001' },
    });
    mockHallazgoRepo.buscarPorId.mockResolvedValue(hallazgoMock);
    mockUnidadRepo.buscarPorId.mockResolvedValue(unidadMock);

    const resultado = await useCase.ejecutar(INPUT_VALIDO);

    expect(resultado.conciliacion).not.toBeNull();
    expect(resultado.conciliacion!.reunificacionId).toBe('reu-001');
    expect(resultado.conciliacion!.hallazgo.id).toBe('hal-001');
    expect(resultado.conciliacion!.unidadCustodia).toEqual(unidadMock);
    expect(mockNotificar.ejecutar).toHaveBeenCalledWith({ reunificacionId: 'reu-001' });
  });

  it('debe retornar conciliacion null si no hay hallazgo previo', async () => {
    mockConciliar.desdeEncargo.mockResolvedValue({
      conciliada: false,
      reunificacion: null,
    });

    const resultado = await useCase.ejecutar(INPUT_VALIDO);

    expect(resultado.conciliacion).toBeNull();
    expect(mockNotificar.ejecutar).not.toHaveBeenCalled();
  });

  // ── Resiliencia ──────────────────────────────────────

  it('debe registrar el encargo aunque la conciliación falle', async () => {
    mockConciliar.desdeEncargo.mockRejectedValue(new Error('Error de conciliación'));

    const resultado = await useCase.ejecutar(INPUT_VALIDO);

    expect(resultado.encargo).toEqual(ENCARGO_GUARDADO);
    expect(resultado.conciliacion).toBeNull();
  });

  it('debe registrar el encargo aunque la notificación falle', async () => {
    mockConciliar.desdeEncargo.mockResolvedValue({
      conciliada: true,
      reunificacion: { id: 'reu-001', hallazgoId: 'hal-001' },
    });
    mockHallazgoRepo.buscarPorId.mockResolvedValue({
      id: 'hal-001',
      estadoFisico: 'BUENO',
      createdAt: new Date(),
      unidadId: 'u-1',
    });
    mockUnidadRepo.buscarPorId.mockResolvedValue(null);
    mockNotificar.ejecutar.mockRejectedValue(new Error('SMTP caído'));

    const resultado = await useCase.ejecutar(INPUT_VALIDO);

    expect(resultado.encargo).toEqual(ENCARGO_GUARDADO);
    expect(resultado.conciliacion).not.toBeNull();
  });

  it('debe retornar unidadCustodia null si la unidad no se encuentra', async () => {
    mockConciliar.desdeEncargo.mockResolvedValue({
      conciliada: true,
      reunificacion: { id: 'reu-001', hallazgoId: 'hal-001' },
    });
    mockHallazgoRepo.buscarPorId.mockResolvedValue({
      id: 'hal-001',
      estadoFisico: 'REGULAR',
      createdAt: new Date(),
      unidadId: 'u-inexistente',
    });
    mockUnidadRepo.buscarPorId.mockResolvedValue(null);

    const resultado = await useCase.ejecutar(INPUT_VALIDO);

    expect(resultado.conciliacion!.unidadCustodia).toBeNull();
  });
});