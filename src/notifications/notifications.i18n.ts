export type NotificationLocale = 'fr' | 'en';

export function resolveNotificationLocale(
  locale: string | null | undefined,
): NotificationLocale {
  return locale?.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

const someone: Record<NotificationLocale, string> = {
  fr: 'Quelqu’un',
  en: 'Someone',
};

export function messageNotificationCopy(
  locale: NotificationLocale,
  senderFirstName: string | null | undefined,
  content: string,
) {
  const sender = senderFirstName?.trim();
  return {
    title: sender
      ? locale === 'fr'
        ? `${sender} vous a envoyé un message`
        : `${sender} sent you a message`
      : locale === 'fr'
        ? 'Nouveau message'
        : 'New message',
    body: content.slice(0, 100),
  };
}

export function rideInvitationCopy(
  locale: NotificationLocale,
  senderFirstName: string | null | undefined,
) {
  const sender = senderFirstName?.trim() || someone[locale];
  return {
    title:
      locale === 'fr' ? 'Nouvelle invitation de balade' : 'New walk invitation',
    body:
      locale === 'fr'
        ? `${sender} vous invite à rejoindre une balade`
        : `${sender} invited you to join a walk`,
  };
}

export function invitationAcceptedCopy(
  locale: NotificationLocale,
  joinerFirstName: string | null | undefined,
) {
  const joiner = joinerFirstName?.trim() || someone[locale];
  return {
    title: locale === 'fr' ? 'Invitation acceptée' : 'Invitation accepted',
    body:
      locale === 'fr'
        ? `${joiner} a accepté votre invitation de balade`
        : `${joiner} accepted your walk invitation`,
  };
}

export function participantJoinedCopy(
  locale: NotificationLocale,
  joinerFirstName: string | null | undefined,
) {
  const joiner = joinerFirstName?.trim() || someone[locale];
  return {
    title: locale === 'fr' ? 'Nouveau participant' : 'New participant',
    body:
      locale === 'fr'
        ? `${joiner} a rejoint votre balade`
        : `${joiner} joined your walk`,
  };
}
