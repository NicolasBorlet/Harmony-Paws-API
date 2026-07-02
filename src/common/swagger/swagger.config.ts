import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const API_DESCRIPTION = `
API REST **Harmony Paws** — application mobile de balades et socialisation canine.

## Conventions

| Aspect | Détail |
|--------|--------|
| **Format JSON** | Toutes les requêtes et réponses utilisent \`application/json\` |
| **Clés de réponse** | Les réponses sont sérialisées en **snake_case** (\`first_name\`, \`created_at\`, …) |
| **Clés de requête** | Les corps de requête acceptent le **camelCase** (\`firstName\`, \`refreshToken\`, …) |
| **Dates** | ISO 8601 (\`2026-06-19T14:30:00.000Z\`) sauf mention contraire |
| **UUID** | Identifiants utilisateur, chien, activité au format UUID v4 |
| **BigInt** | Identifiants numériques longs (messages, invitations) renvoyés en chaîne |

## Authentification

1. \`POST /auth/register\` ou \`POST /auth/login\` → récupérer \`access_token\` et \`refresh_token\`
2. Inclure \`Authorization: Bearer <access_token>\` sur les routes protégées
3. Renouveler via \`POST /auth/refresh\` avec \`refreshToken\` dans le corps
4. Invalider la session via \`POST /auth/logout\`

## Limitation de débit

Les routes \`/auth/*\` sont soumises au throttling (voir description de chaque route).

## Stockage (MinIO/S3)

Les URLs présignées expirent après **1 heure**. Utiliser \`POST …/upload-url\` puis uploader directement vers l'URL retournée.
`.trim();

export const SWAGGER_TAGS = [
  {
    name: 'system',
    description: 'Santé de l\'infrastructure (load balancer, orchestration)',
  },
  {
    name: 'auth',
    description: 'Inscription, connexion, refresh JWT et déconnexion',
  },
  {
    name: 'users',
    description: 'Profil utilisateur connecté et recherche',
  },
  {
    name: 'dogs',
    description: 'Gestion des chiens, races et comportements',
  },
  {
    name: 'activities',
    description: 'Balades, invitations, statuts live et statistiques GPS',
  },
  {
    name: 'rides',
    description: 'Templates de balades (admin) — pré-remplissage pour création d\'activité',
  },
  {
    name: 'social',
    description: 'Amis, demandes d\'amitié et rencontres',
  },
  {
    name: 'messages',
    description: 'Conversations directes, groupes et messagerie',
  },
  {
    name: 'health',
    description: 'Carnet de santé du chien (vaccins, mesures, documents, rappels)',
  },
  {
    name: 'formations',
    description: 'Catalogue de formations, favoris et achats',
  },
  {
    name: 'stats-badges',
    description: 'Statistiques utilisateur et badges gamification',
  },
  {
    name: 'storage',
    description: 'URLs présignées MinIO/S3 pour upload et téléchargement',
  },
  {
    name: 'dog-friendly-places',
    description: 'Lieux dog-friendly (carte, soumissions utilisateur, modération admin)',
  },
] as const;

export function setupSwagger(app: INestApplication): void {
  const builder = new DocumentBuilder()
    .setTitle('Harmony Paws API')
    .setDescription(API_DESCRIPTION)
    .setVersion('1.0.0')
    .setContact(
      'Harmony Paws',
      'https://harmony-paws.app',
      'support@harmony-paws.app',
    )
    .setLicense('Proprietary', '')
    .addServer('http://localhost:3000', 'Développement local')
    .addServer('https://api.harmony-paws.app', 'Production')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Access token JWT obtenu via /auth/login ou /auth/register. Durée de vie configurable (JWT_ACCESS_EXPIRES).',
      },
      'JWT-auth',
    );

  for (const tag of SWAGGER_TAGS) {
    builder.addTag(tag.name, tag.description);
  }

  const config = builder.build();
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey.replace(/Controller$/, '')}_${methodKey}`,
  });

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Harmony Paws — API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
