-- CreateEnum
CREATE TYPE "TipoUnidad" AS ENUM ('COMISARIA', 'SUBCOMISARIA', 'TENENCIA', 'RETEN');

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('GUARDIA', 'SUPERVISOR', 'CONSULTA', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('EXTRAVIO', 'ROBO', 'HURTO');

-- CreateEnum
CREATE TYPE "EstadoEncargo" AS ENUM ('VIGENTE', 'REUNIFICADO', 'CERRADO', 'ANULADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "EstadoFisico" AS ENUM ('BUENO', 'DETERIORADO', 'ILEGIBLE');

-- CreateEnum
CREATE TYPE "EstadoReunificacion" AS ENUM ('PENDIENTE_RETIRO', 'ENTREGADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('REUNIFICACION', 'LECTURA_PORTICO');

-- CreateEnum
CREATE TYPE "EstadoNotificacion" AS ENUM ('PENDIENTE', 'ENVIADA', 'FALLIDA');

-- CreateEnum
CREATE TYPE "TipoEventoDominio" AS ENUM ('PLACA_ENCARGADA', 'PLACA_HALLADA', 'PLACA_REUNIFICADA', 'PLACA_LEIDA', 'CASO_CERRADO', 'ENCARGO_ANULADO');

-- CreateTable
CREATE TABLE "unidad" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "tipo" "TipoUnidad" NOT NULL,
    "direccion" VARCHAR(400) NOT NULL,
    "region" VARCHAR(100) NOT NULL,
    "comuna" VARCHAR(100) NOT NULL,
    "horario_atencion" VARCHAR(200),
    "telefono" VARCHAR(20),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "keycloak_sub" VARCHAR(255) NOT NULL,
    "nombre_completo" VARCHAR(200) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "rol" "Rol" NOT NULL,
    "unidad_id" UUID NOT NULL,
    "servicio_activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encargo" (
    "id" UUID NOT NULL,
    "placa" VARCHAR(10) NOT NULL,
    "tipo_evento" "TipoEvento" NOT NULL,
    "estado" "EstadoEncargo" NOT NULL DEFAULT 'VIGENTE',
    "denunciante_rut_cifrado" VARCHAR(500) NOT NULL,
    "denunciante_nombre_cifrado" VARCHAR(500) NOT NULL,
    "denunciante_email_cifrado" VARCHAR(500) NOT NULL,
    "canal_notificacion" VARCHAR(50) NOT NULL,
    "constancia_numero" VARCHAR(50),
    "fecha_hecho" DATE NOT NULL,
    "observaciones" TEXT,
    "unidad_id" UUID NOT NULL,
    "funcionario_id" UUID NOT NULL,
    "anulado_por" UUID,
    "motivo_anulacion" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hallazgo" (
    "id" UUID NOT NULL,
    "placa" VARCHAR(10) NOT NULL,
    "estado_fisico" "EstadoFisico" NOT NULL,
    "observaciones" TEXT,
    "unidad_id" UUID NOT NULL,
    "funcionario_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hallazgo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reunificacion" (
    "id" UUID NOT NULL,
    "encargo_id" UUID NOT NULL,
    "hallazgo_id" UUID NOT NULL,
    "estado" "EstadoReunificacion" NOT NULL DEFAULT 'PENDIENTE_RETIRO',
    "fecha_conciliacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_entrega" TIMESTAMP(3),
    "funcionario_entrega_id" UUID,
    "receptor_rut_cifrado" VARCHAR(500),
    "receptor_nombre_cifrado" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reunificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacion" (
    "id" UUID NOT NULL,
    "reunificacion_id" UUID,
    "evento_lectura_id" UUID,
    "tipo" "TipoNotificacion" NOT NULL,
    "destinatario_email_cifrado" VARCHAR(500) NOT NULL,
    "estado" "EstadoNotificacion" NOT NULL DEFAULT 'PENDIENTE',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "ultimo_intento_at" TIMESTAMP(3),
    "resultado" TEXT,
    "message_id" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_lectura" (
    "id" UUID NOT NULL,
    "placa" VARCHAR(10) NOT NULL,
    "portico" VARCHAR(100) NOT NULL,
    "nivel_confianza" DOUBLE PRECISION NOT NULL,
    "encargo_id" UUID NOT NULL,
    "notificado" BOOLEAN NOT NULL DEFAULT false,
    "timestamp_lectura" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_lectura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_dominio" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoEventoDominio" NOT NULL,
    "payload" JSONB NOT NULL,
    "procesado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_dominio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "usuario_id" UUID NOT NULL,
    "accion" VARCHAR(20) NOT NULL,
    "entidad" VARCHAR(50) NOT NULL,
    "entidad_id" UUID,
    "detalle" JSONB,
    "ip" INET NOT NULL,
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_keycloak_sub_key" ON "usuario"("keycloak_sub");

-- CreateIndex
CREATE INDEX "usuario_keycloak_sub_idx" ON "usuario"("keycloak_sub");

-- CreateIndex
CREATE INDEX "encargo_placa_idx" ON "encargo"("placa");

-- CreateIndex
CREATE INDEX "encargo_estado_idx" ON "encargo"("estado");

-- CreateIndex
CREATE INDEX "encargo_unidad_id_idx" ON "encargo"("unidad_id");

-- CreateIndex
CREATE INDEX "hallazgo_placa_idx" ON "hallazgo"("placa");

-- CreateIndex
CREATE INDEX "hallazgo_unidad_id_idx" ON "hallazgo"("unidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "reunificacion_encargo_id_key" ON "reunificacion"("encargo_id");

-- CreateIndex
CREATE UNIQUE INDEX "reunificacion_hallazgo_id_key" ON "reunificacion"("hallazgo_id");

-- CreateIndex
CREATE UNIQUE INDEX "notificacion_evento_lectura_id_key" ON "notificacion"("evento_lectura_id");

-- CreateIndex
CREATE INDEX "notificacion_estado_idx" ON "notificacion"("estado");

-- CreateIndex
CREATE INDEX "notificacion_reunificacion_id_idx" ON "notificacion"("reunificacion_id");

-- CreateIndex
CREATE INDEX "evento_lectura_placa_idx" ON "evento_lectura"("placa");

-- CreateIndex
CREATE INDEX "evento_lectura_encargo_id_idx" ON "evento_lectura"("encargo_id");

-- CreateIndex
CREATE INDEX "evento_dominio_procesado_created_at_idx" ON "evento_dominio"("procesado", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_usuario_id_idx" ON "audit_log"("usuario_id");

-- CreateIndex
CREATE INDEX "audit_log_entidad_entidad_id_idx" ON "audit_log"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encargo" ADD CONSTRAINT "encargo_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encargo" ADD CONSTRAINT "encargo_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encargo" ADD CONSTRAINT "encargo_anulado_por_fkey" FOREIGN KEY ("anulado_por") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hallazgo" ADD CONSTRAINT "hallazgo_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hallazgo" ADD CONSTRAINT "hallazgo_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reunificacion" ADD CONSTRAINT "reunificacion_encargo_id_fkey" FOREIGN KEY ("encargo_id") REFERENCES "encargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reunificacion" ADD CONSTRAINT "reunificacion_hallazgo_id_fkey" FOREIGN KEY ("hallazgo_id") REFERENCES "hallazgo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reunificacion" ADD CONSTRAINT "reunificacion_funcionario_entrega_id_fkey" FOREIGN KEY ("funcionario_entrega_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_reunificacion_id_fkey" FOREIGN KEY ("reunificacion_id") REFERENCES "reunificacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_evento_lectura_id_fkey" FOREIGN KEY ("evento_lectura_id") REFERENCES "evento_lectura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_lectura" ADD CONSTRAINT "evento_lectura_encargo_id_fkey" FOREIGN KEY ("encargo_id") REFERENCES "encargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
