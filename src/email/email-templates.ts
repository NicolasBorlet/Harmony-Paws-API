function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function row(label: string, value: string | null | undefined): string {
  if (!value) return '';
  return `<tr><td style="padding:8px 12px;font-weight:600;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 12px;">${escapeHtml(value)}</td></tr>`;
}

type SupportReportContext = {
  typeLabel: string;
  reporterEmail: string;
  reporterName: string;
  reporterId: string;
  message: string;
  metadata?: Record<string, string | null | undefined>;
};

export function buildSupportReportHtml(context: SupportReportContext): string {
  const metadataRows = Object.entries(context.metadata ?? {})
    .map(([label, value]) => row(label, value))
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<body style="font-family:system-ui,-apple-system,sans-serif;color:#1f2937;line-height:1.5;">
  <h2 style="margin:0 0 16px;">${escapeHtml(context.typeLabel)}</h2>
  <table style="border-collapse:collapse;width:100%;max-width:640px;">
    ${row('Utilisateur', `${context.reporterName} (${context.reporterEmail})`)}
    ${row('ID utilisateur', context.reporterId)}
    ${metadataRows}
    <tr>
      <td style="padding:8px 12px;font-weight:600;vertical-align:top;">Message</td>
      <td style="padding:8px 12px;white-space:pre-wrap;">${escapeHtml(context.message)}</td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildSupportReportText(context: SupportReportContext): string {
  const lines = [
    context.typeLabel,
    '',
    `Utilisateur: ${context.reporterName} (${context.reporterEmail})`,
    `ID utilisateur: ${context.reporterId}`,
  ];

  for (const [label, value] of Object.entries(context.metadata ?? {})) {
    if (value) lines.push(`${label}: ${value}`);
  }

  lines.push('', 'Message:', context.message);
  return lines.join('\n');
}
