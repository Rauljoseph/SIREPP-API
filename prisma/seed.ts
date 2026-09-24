import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Unidad de prueba
  const unidad = await prisma.unidad.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      nombre: '3ª Comisaría de Santiago',
      tipo: 'COMISARIA',
      direccion: 'Av. Matta 1012',
      region: 'Metropolitana',
      comuna: 'Santiago',
      horarioAtencion: 'Lunes a Viernes 08:00 - 20:00',
      telefono: '226781234',
      activa: true,
    },
  });

  console.log('Unidad creada:', unidad.nombre);

  // Usuario de prueba (el que usan los controllers como hardcoded)
  const funcionario = await prisma.usuario.upsert({
    where: { id: '00000000-0000-0000-0000-000000000000' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000000',
      keycloakSub: 'dev-user-001',
      nombreCompleto: 'Funcionario de Prueba',
      email: 'funcionario@test.cl',
      rol: 'GUARDIA',
      unidadId: unidad.id,
      servicioActivo: true,
    },
  });

  console.log('Funcionario creado:', funcionario.nombreCompleto);

  // Segundo funcionario (supervisor para anulaciones)
  const supervisor = await prisma.usuario.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      keycloakSub: 'dev-user-002',
      nombreCompleto: 'Supervisor de Prueba',
      email: 'supervisor@test.cl',
      rol: 'SUPERVISOR',
      unidadId: unidad.id,
      servicioActivo: true,
    },
  });

  console.log('Supervisor creado:', supervisor.nombreCompleto);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });