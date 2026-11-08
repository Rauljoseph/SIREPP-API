import { ConsultarEncargoUseCase } from '../../../src/application/encargos/consultar-encargo.use-case';
import { EncargoNoEncontradoException } from '../../../src/domain/exceptions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────────

const mockEncargoRepo = {
  guardar: vi.fn(),
  buscarPorId: vi.fn(),
  buscarPorPlaca: vi.fn(),
  buscarVigentePorPlaca: vi.fn(),
  listar: vi.fn(),
  actualizar: vi.fn(),
};

// ── Datos de prueba ──────────────────────────────────────

const ENCARGO_MOCK = {
  id: 'enc-001',
  placa: 'ABCD12',
  estado: 'VIGENTE',
  unidadId: 'u-1',
};

const ENCARGO_CERRADO = {
  id: 'enc-002',
  placa: 'ABCD12',
  estado: 'CERRADO',
  unidadId: 'u-1',
};

// ── Suite ─────────────────────────────────────────────────

describe('ConsultarEncargoUseCase', () => {
  let useCase: ConsultarEncargoUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ConsultarEncargoUseCase(mockEncargoRepo as any);
  });

  // ── porId ────────────────────────────────────────────

  describe('porId', () => {
    it('debe retornar el encargo si existe', async () => {
      mockEncargoRepo.buscarPorId.mockResolvedValue(ENCARGO_MOCK);

      const resultado = await useCase.porId('enc-001');

      expect(resultado).toEqual(ENCARGO_MOCK);
      expect(mockEncargoRepo.buscarPorId).toHaveBeenCalledWith('enc-001');
    });

    it('debe lanzar EncargoNoEncontradoException si no existe', async () => {
      mockEncargoRepo.buscarPorId.mockResolvedValue(null);

      await expect(useCase.porId('no-existe')).rejects.toThrow(EncargoNoEncontradoException);
    });
  });

  // ── porPlaca ─────────────────────────────────────────

  describe('porPlaca', () => {
    it('debe retornar todos los encargos de una placa', async () => {
      mockEncargoRepo.buscarPorPlaca.mockResolvedValue([ENCARGO_MOCK, ENCARGO_CERRADO]);

      const resultado = await useCase.porPlaca('ABCD12');

      expect(resultado).toHaveLength(2);
      expect(mockEncargoRepo.buscarPorPlaca).toHaveBeenCalledWith('ABCD12');
    });

    it('debe retornar array vacío si no hay encargos para la placa', async () => {
      mockEncargoRepo.buscarPorPlaca.mockResolvedValue([]);

      const resultado = await useCase.porPlaca('ZZZZ99');

      expect(resultado).toEqual([]);
    });
  });

  // ── vigentePorPlaca ──────────────────────────────────

  describe('vigentePorPlaca', () => {
    it('debe retornar el encargo vigente si existe', async () => {
      mockEncargoRepo.buscarVigentePorPlaca.mockResolvedValue(ENCARGO_MOCK);

      const resultado = await useCase.vigentePorPlaca('ABCD12');

      expect(resultado).toEqual(ENCARGO_MOCK);
      expect(mockEncargoRepo.buscarVigentePorPlaca).toHaveBeenCalledWith('ABCD12');
    });

    it('debe retornar null si no hay encargo vigente', async () => {
      mockEncargoRepo.buscarVigentePorPlaca.mockResolvedValue(null);

      const resultado = await useCase.vigentePorPlaca('ABCD12');

      expect(resultado).toBeNull();
    });
  });
});