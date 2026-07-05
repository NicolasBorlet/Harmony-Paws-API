import {
  buildSupportReportHtml,
  buildSupportReportText,
} from './email-templates';

describe('email-templates', () => {
  const context = {
    typeLabel: 'Signalement de bug pendant une balade',
    reporterEmail: 'alice@example.com',
    reporterName: 'Alice Martin',
    reporterId: '550e8400-e29b-41d4-a716-446655440000',
    message: 'Le GPS <script>alert(1)</script> s\'est figé.',
    metadata: {
      'ID activité': 'act-123',
      'Version app': '1.0.0',
    },
  };

  it('escapes HTML in support report template', () => {
    const html = buildSupportReportHtml(context);

    expect(html).toContain('Alice Martin (alice@example.com)');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('builds plain text support report', () => {
    const text = buildSupportReportText(context);

    expect(text).toContain('Signalement de bug pendant une balade');
    expect(text).toContain('alice@example.com');
    expect(text).toContain('Le GPS <script>alert(1)</script> s\'est figé.');
  });
});
