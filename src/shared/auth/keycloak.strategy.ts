import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';

interface AccessToken {
  sub?: string;
  exp?: number;
  typ?: string;
}

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    const issuer = config.get('KEYCLOAK_ISSUER', 'http://localhost:8080/realms/sirepp');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer,
      audience: config.get('KEYCLOAK_AUDIENCE', 'sirepp-api'),
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        jwksUri: issuer + '/protocol/openid-connect/certs',
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
      }),
    });
  }

  async validate(token: AccessToken) {
    if (!token.sub || !Number.isFinite(token.exp) || token.typ !== 'Bearer') {
      throw new UnauthorizedException('Token de acceso inválido');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { keycloakSub: token.sub },
      select: {
        id: true,
        rol: true,
        unidadId: true,
        servicioActivo: true,
        unidad: { select: { activa: true } },
      },
    });

    if (!usuario?.servicioActivo || !usuario.unidad.activa) {
      throw new ForbiddenException('Funcionario o unidad sin acceso a SIREPP');
    }

    return { id: usuario.id, rol: usuario.rol, unidadId: usuario.unidadId };
  }
}
