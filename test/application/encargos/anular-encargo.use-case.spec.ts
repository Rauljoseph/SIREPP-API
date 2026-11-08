import { AnularEncargoUseCase, AnularEncargoInput } from '../../../src/application/encargos/anular-encargo.use-case';
import { TipoEventoDominio } from '../../../src/domain/enums';
import { EncargoNoEncontradoException, AccesoDenegadoException } from '../../../src/domain/exceptions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────────

const mockEncargoRepo = {
  guardar: vi.fn(),
  buscarPorId: vi.fn(),
  buscarVigentePorPlaca: vi.fn(),
  listar: vi.fn(),
  actualizar: vi.fn(),
};

const mockEventoRepo = {
  guardar: vi.fn(),
  listar: vi.fn(),
};

const mockUsuarioRepo = {
  buscarPorId: vi.fn(),
  buscarPorKeycloakSub: vi.fn(),
  listar: vi.fn(),
  guardar: vi.fn(),
  actualizar: vi.fn(),
};

// ── Datos de prueba ──────────────────────────────────────

const INPUT_VALIDO: AnularEncargoInput = {
  encargoId: 'enc-001',
  supervisorId: 'sup-001',
  motivo: 'Placa reportada por error',
};

const ENCARGO_EXISTENTE = {
  id: 'enc-001',
  placa: 'ABCD12',
  unidadId: 'u-1',
  funcionarioId: 'f-1',
  anular: vi.fn(),
};

const ENCARGO_ANULADO = {
  ...ENCARGO_EXISTENTE,
  estado: 'ANULADO',
  supervisorId: 'sup-001',
  motivoAnulacion: 'Placa reportada por error',
};

// ── Suite ─────────────────────────────────────────────────

describe('AnularEncargoUseCase', () => {
  let useCase: AnularEncargoUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    useCase = new AnularEncargoUseCase(
      mockEncargoRepo as any,
      mockEventoRepo as any,
      mockUsuarioRepo as any,
    );

    // Defaults
    mockUsuarioRepo.buscarPorId.mockResolvedValue({
      rol: 'SUPERVISOR',
      puedeAnular: () => true,
    });
    mockEncargoRepo.buscarPorId.mockResolvedValue(ENCARGO_EXISTENTE);
    ENCARGO_EXISTENTE.anular.mockReturnValue(ENCARGO_ANULADO);
    mockEncargoRepo.actualizar.mockResolvedValue(ENCARGO_ANULADO);
    mockEventoRepo.guardar.mockResolvedValue(undefined);
  });

  // ── Caso exitoso ─────────────────────────────────────

  it('debe anular el encargo y emitir evento ENCARGO_ANULADO', async () => {
    const resultado = await useCase.ejecutar(INPUT_VALIDO);

    expect(resultado).toEqual(ENCARGO_ANULADO);
    expect(ENCARGO_EXISTENTE.anular).toHaveBeenCalledWith('sup-001', 'Placa reportada por error');
    expect(mockEncargoRepo.actualizar).toHaveBeenCalledWith(ENCARGO_ANULADO);
    expect(mockEventoRepo.guardar).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: TipoEventoDominio.ENCARGO_ANULADO,
      }),
    );
  });

  // ── Encargo no encontrado ────────────────────────────

  it('debe lanzar EncargoNoEncontradoException si el encargo no existe', async () => {
    mockEncargoRepo.buscarPorId.mockResolvedValue(null);

    await expect(useCase.ejecutar(INPUT_VALIDO)).rejects.toThrow(EncargoNoEncontradoException);
    expect(mockEncargoRepo.actualizar).not.toHaveBeenCalled();
  });

  // ── Permisos ─────────────────────────────────────────

  it('debe lanzar AccesoDenegadoException si el usuario no puede anular', async () => {
    mockUsuarioRepo.buscarPorId.mockResolvedValue({
      rol: 'GUARDIA',
      puedeAnular: () => false,
    });

    await expect(useCase.ejecutar(INPUT_VALIDO)).rejects.toThrow(AccesoDenegadoException);
    expect(mockEncargoRepo.buscarPorId).not.toHaveBeenCalled();
    expect(mockEncargoRepo.actualizar).not.toHaveBeenCalled();
  });

  it('debe continuar si el supervisor no existe en la BD', async () => {
    mockUsuarioRepo.buscarPorId.mockResolvedValue(null);

    const resultado = await useCase.ejecutar(INPUT_VALIDO);

    expect(resultado).toEqual(ENCARGO_ANULADO);
  });

  // ── Evento de dominio ────────────────────────────────

  it('debe incluir supervisorId y motivo en el evento de dominio', async () => {
    await useCase.ejecutar(INPUT_VALIDO);

    expect(mockEventoRepo.guardar).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          supervisorId: 'sup-001',
          motivo: 'Placa reportada por error',
        }),
      }),
    );
  });
});