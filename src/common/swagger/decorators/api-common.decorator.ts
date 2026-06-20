import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../dto/api-error.dto';

/** Réponses d'erreur standard documentées sur chaque endpoint protégé ou public. */
export function ApiStandardResponses(options?: {
  unauthorized?: boolean;
  forbidden?: boolean;
  notFound?: boolean;
  conflict?: boolean;
  tooManyRequests?: boolean;
}) {
  const {
    unauthorized = false,
    forbidden = false,
    notFound = false,
    conflict = false,
    tooManyRequests = false,
  } = options ?? {};

  const decorators = [
    ApiResponse({
      status: 400,
      description: 'Données invalides (validation class-validator)',
      type: ApiErrorResponseDto,
    }),
    ApiResponse({
      status: 500,
      description: 'Erreur interne du serveur',
      type: ApiErrorResponseDto,
    }),
  ];

  if (unauthorized) {
    decorators.push(
      ApiUnauthorizedResponse({
        description: 'JWT manquant, expiré ou invalide',
        type: ApiErrorResponseDto,
      }),
    );
  }

  if (forbidden) {
    decorators.push(
      ApiResponse({
        status: 403,
        description: 'Accès refusé (ressource appartenant à un autre utilisateur)',
        type: ApiErrorResponseDto,
      }),
    );
  }

  if (notFound) {
    decorators.push(
      ApiResponse({
        status: 404,
        description: 'Ressource introuvable',
        type: ApiErrorResponseDto,
      }),
    );
  }

  if (conflict) {
    decorators.push(
      ApiResponse({
        status: 409,
        description: 'Conflit (ex. email déjà utilisé, demande déjà envoyée)',
        type: ApiErrorResponseDto,
      }),
    );
  }

  if (tooManyRequests) {
    decorators.push(
      ApiResponse({
        status: 429,
        description: 'Limite de débit dépassée (Throttler)',
        type: ApiErrorResponseDto,
      }),
    );
  }

  return applyDecorators(...decorators);
}

/** Endpoint protégé par JWT Bearer. */
export function ApiJwtAuth() {
  return applyDecorators(ApiBearerAuth('JWT-auth'));
}
