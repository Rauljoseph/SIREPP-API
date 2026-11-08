CREATE UNIQUE INDEX "usuario_email_normalizado_key" ON "usuario" (LOWER(BTRIM("email")));
