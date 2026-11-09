import { BadGatewayException, ConflictException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name);
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.timeoutMs = parseInt(this.config.get<string>('KEYCLOAK_ADMIN_TIMEOUT_MS', '15000'), 10);
  }

  private configuracionRequerida(variable: string) {
    const valor = this.config.get<string>(variable)?.trim();
    if (!valor) {
      const mensaje = `Falta configurar ${variable} en el servidor de SIREPP.`;
      this.logger.warn(mensaje);
      throw new ServiceUnavailableException(mensaje);
    }
    return valor;
  }

  private get issuer() {
    return this.configuracionRequerida('KEYCLOAK_ISSUER').replace(/\/$/, '');
  }

  private async request(path: string, method: string, body?: unknown) {
    const clientId = this.configuracionRequerida('KEYCLOAK_ADMIN_CLIENT_ID');
    const secret = this.configuracionRequerida('KEYCLOAK_ADMIN_CLIENT_SECRET');

    const issuer = new URL(this.issuer);
    const realmPath = issuer.pathname.lastIndexOf('/realms/');
    const adminUrl = new URL(issuer);
    const [pathname, query] = path.split('?');
    adminUrl.pathname = issuer.pathname.slice(0, realmPath) + '/admin' + issuer.pathname.slice(realmPath) + '/users' + pathname;
    if (query) adminUrl.search = query;
    try {
      const token = await fetch(this.issuer + '/protocol/openid-connect/token', {
        method: 'POST',
        body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: secret }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!token.ok) throw new Error('Client authentication failed');
      const { access_token: accessToken } = await token.json() as { access_token: string };
      return await fetch(adminUrl, {
        method,
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      this.logger.error(`Error al comunicarse con Keycloak: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadGatewayException('No se pudo comunicar con Keycloak.');
    }
  }

  async crearCuenta(email: string, nombreCompleto: string) {
    this.configuracionRequerida('KEYCLOAK_INVITATION_REDIRECT_URI');
    const [firstName, ...apellidos] = nombreCompleto.trim().split(/\s+/);
    const response = await this.request('', 'POST', {
      username: email,
      email,
      firstName,
      lastName: apellidos.join(' '),
      enabled: true,
      requiredActions: ['VERIFY_EMAIL', 'CONFIGURE_TOTP', 'UPDATE_PASSWORD'],
    });
    if (response.status === 409) {
      throw new ConflictException('Este correo electrónico ya está vinculado a una cuenta.');
    }
    const id = response.headers.get('location')?.split('/').pop();
    if (response.status !== 201 || !id) {
      this.logger.warn(`Alta en Keycloak: HTTP ${response.status}, identificador presente: ${Boolean(id)}.`);
      throw new BadGatewayException('No se pudo crear la cuenta en Keycloak.');
    }
    return id;
  }

  async eliminarCuenta(id: string) {
    const response = await this.request('/' + encodeURIComponent(id), 'DELETE');
    if (!response.ok && response.status !== 404) {
      throw new BadGatewayException('No se pudo revertir el alta en Keycloak.');
    }
  }

  async enviarInvitacion(id: string) {
    const redirectUri = this.configuracionRequerida('KEYCLOAK_INVITATION_REDIRECT_URI');
    const userPath = '/' + encodeURIComponent(id);
    const response = await this.request(userPath, 'GET');
    if (!response.ok) throw new BadGatewayException('No se pudo consultar la cuenta en Keycloak.');
    const user = await response.json() as { enabled: boolean; requiredActions?: string[] };
    if (!user.enabled || !user.requiredActions?.includes('UPDATE_PASSWORD')) {
      throw new ConflictException('Esta cuenta ya no tiene una invitación pendiente.');
    }
    const credentials = await this.request(userPath + '/credentials', 'GET');
    if (!credentials.ok) throw new BadGatewayException('No se pudo comprobar el estado de la cuenta.');
    const registered = await credentials.json() as { type: string }[];
    if (registered.some(({ type }) => type === 'password')) {
      throw new ConflictException('Esta cuenta ya tiene una contraseña.');
    }
    const tieneOtp = registered.some(({ type }) => type === 'otp');
    if (!tieneOtp && !user.requiredActions.includes('CONFIGURE_TOTP')) {
      const updated = await this.request(userPath, 'PUT', {
        requiredActions: [...user.requiredActions, 'CONFIGURE_TOTP'],
      });
      if (!updated.ok) throw new BadGatewayException('No se pudo dejar pendiente la configuración del autenticador.');
    }

    // OTP and password setup belong to the account's pending actions.
    // An old invitation must not add password setup back after recovery.
    const actions = ['VERIFY_EMAIL'];
    const query = new URLSearchParams({
      lifespan: '3600',
      client_id: this.config.get<string>('KEYCLOAK_INVITATION_CLIENT_ID', 'sirepp-web'),
      redirect_uri: redirectUri,
    });
    const sent = await this.request(userPath + '/execute-actions-email?' + query, 'PUT', actions);
    if (!sent.ok) {
      const errorBody = await sent.text().catch(() => '(sin cuerpo)');
      this.logger.error(`execute-actions-email falló: HTTP ${sent.status} — ${errorBody}`);
      throw new BadGatewayException('No se pudo enviar la invitación desde Keycloak.');
    }
  }
}