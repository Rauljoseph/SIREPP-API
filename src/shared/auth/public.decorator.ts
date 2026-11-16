import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorador para marcar endpoints como públicos.
 * Los endpoints marcados con @Public() no requieren autenticación,
 * incluso con el APP_GUARD global de Keycloak activo.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);