import { ExpirarEncargosUseCase } from '../../../src/application/encargos/expirar-encargos.use-case';
import { TipoEventoDominio } from '../../../src/domain/enums';
import { beforeEach, describe, expect, it, vi } from 'vitest';


// ── Mocks ────────────────────────────────────────────────

const mockEncargoRepo = {
  guardar: vi.fn(),
  buscarPorId: vi.fn(),
  buscarVigentePorPlaca: vi.fn(),
  buscarVigentesAnterioresA: vi.fn(),
  listar: vi.fn(),
  actualizar: vi.fn(),
};

const mockEventoRepo = {
  guardar: vi.fn(),
  listar: vi.fn(),
};

// ── Helpers ──────────────────────────────────────────────

function crearEncargoMock(id: string, placa: string) {
  return {
    id,
    placa,
    cerrar: vi.fn().mockReturnValue({ id, placa, estado: 'CERRADO' }),
  };
}

// ── Suite ─────────────────────────────────────────────────

describe('ExpirarEncargosUseCase', () => {
  let useCase: ExpirarEncargosUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    useCase = new ExpirarEncargosUseCase(
      mockEncargoRepo as any,
      mockEventoRepo as any,
    );

    mockEncargoRepo.buscarVigentesAnterioresA.mockResolvedValue([]);
    mockEncargoRepo.actualizar.mockImplementation((e) => Promise.resolve(e));
    mockEventoRepo.guardar.mockResolvedValue(undefined);
  });

  // ── Sin encargos por expirar ─────────────────────────

  it('debe retornar 0 expirados si no hay encargos antiguos', async () => {
    const resultado = await useCase.ejecutar();

    expect(resultado.expirados).toBe(0);
    expect(resultado.placas).toEqual([]);
    expect(mockEncargoRepo.actualizar).not.toHaveBeenCalled();
  });

  // ── Expiración exitosa ───────────────────────────────

  it('debe expirar todos los encargos anteriores a 6 meses', async () => {
    const enc1 = crearEncargoMock('enc-001', 'ABCD12');
    const enc2 = crearEncargoMock('enc-002', 'WXYZ99');
    mockEncargoRepo.buscarVigentesAnterioresA.mockResolvedValue([enc1, enc2]);

    const resultado = await useCase.ejecutar();

    expect(resultado.expirados).toBe(2);
    expect(resultado.placas).toEqual(['ABCD12', 'WXYZ99']);
    expect(enc1.cerrar).toHaveBeenCalled();
    expect(enc2.cerrar).toHaveBeenCalled();
    expect(mockEncargoRepo.actualizar).toHaveBeenCalledTimes(2);
    expect(mockEventoRepo.guardar).toHaveBeenCalledTimes(2);
  });

  // ── Evento de dominio ────────────────────────────────

  it('debe emitir evento ENCARGO_EXPIRADO con motivo de expiración automática', async () => {
    const enc = crearEncargoMock('enc-001', 'ABCD12');
    mockEncargoRepo.buscarVigentesAnterioresA.mockResolvedValue([enc]);

    await useCase.ejecutar();

    expect(mockEventoRepo.guardar).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: TipoEventoDominio.ENCARGO_EXPIRADO,
        payload: expect.objectContaining({
          encargoId: 'enc-001',
          placa: 'ABCD12',
          motivo: expect.stringContaining('6 meses'),
        }),
      }),
    );
  });

  // ── Fecha límite correcta ────────────────────────────

  it('debe buscar encargos anteriores a 6 meses desde hoy', async () => {
    await useCase.ejecutar();

    const fechaLimite = mockEncargoRepo.buscarVigentesAnterioresA.mock.calls[0][0] as Date;
    const ahora = new Date();
    const hace6Meses = new Date();
    hace6Meses.setMonth(hace6Meses.getMonth() - 6);

    // Tolerancia de 5 segundos por tiempo de ejecución
    const diff = Math.abs(fechaLimite.getTime() - hace6Meses.getTime());
    expect(diff).toBeLessThan(5000);
  });

});