/**
 * Weekly Newsletter Email Template
 * Generates HTML and plain text versions of the weekly recap email
 */

export interface NewsletterData {
  archiveId: string;
  weekNumber: number;
  year: number;
  imageUrl: string;
  stats: {
    totalPixels: number;
    contributors: number;
  };
  topContributors: Array<{ userId: string; score: number }>;
  galleryUrl: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aiplaces.art';

/**
 * Format a number with comma separators
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Generate HTML email template for the weekly newsletter
 */
export function generateNewsletterHTML(data: NewsletterData): string {
  const {
    weekNumber,
    year,
    imageUrl,
    stats,
    topContributors,
    galleryUrl,
  } = data;

  const top5 = topContributors.slice(0, 5);
  const unsubscribeUrl = `${APP_URL}/settings?tab=notifications`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIplaces Week ${weekNumber} Recap</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                AIplaces.art
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #a3a3a3;">
                Weekly Canvas Recap
              </p>
            </td>
          </tr>

          <!-- Hero Image Card -->
          <tr>
            <td style="background-color: #171717; border-radius: 16px; overflow: hidden; border: 1px solid #262626;">
              ${imageUrl ? `
              <img
                src="${imageUrl}"
                alt="Week ${weekNumber} Canvas"
                width="598"
                style="display: block; width: 100%; height: auto; border-radius: 16px 16px 0 0;"
              />
              ` : `
              <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); height: 200px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 48px; color: #ffffff; opacity: 0.5;">Week ${weekNumber}</span>
              </div>
              `}

              <div style="padding: 24px;">
                <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #ffffff;">
                  Week ${weekNumber}, ${year}
                </h2>
                <p style="margin: 0; font-size: 14px; color: #a3a3a3;">
                  Another week of collaborative pixel art is complete!
                </p>
              </div>
            </td>
          </tr>

          <!-- Stats Cards -->
          <tr>
            <td style="padding-top: 16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="48%" style="background-color: #171717; border-radius: 12px; padding: 20px; border: 1px solid #262626; vertical-align: top;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.5px;">
                      Total Pixels
                    </p>
                    <p style="margin: 0; font-size: 28px; font-weight: 700; color: #8b5cf6;">
                      ${formatNumber(stats.totalPixels)}
                    </p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background-color: #171717; border-radius: 12px; padding: 20px; border: 1px solid #262626; vertical-align: top;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.5px;">
                      Contributors
                    </p>
                    <p style="margin: 0; font-size: 28px; font-weight: 700; color: #8b5cf6;">
                      ${formatNumber(stats.contributors)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Top Contributors -->
          ${top5.length > 0 ? `
          <tr>
            <td style="padding-top: 24px;">
              <div style="background-color: #171717; border-radius: 12px; padding: 24px; border: 1px solid #262626;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #ffffff;">
                  Top 5 Contributors
                </h3>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  ${top5.map((contributor, index) => `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: ${index < top5.length - 1 ? '1px solid #262626' : 'none'};">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td width="32" style="vertical-align: middle;">
                            <span style="display: inline-block; width: 24px; height: 24px; border-radius: 50%; background-color: ${index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#cd7f32' : '#525252'}; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600; color: ${index < 3 ? '#000000' : '#ffffff'};">
                              ${index + 1}
                            </span>
                          </td>
                          <td style="vertical-align: middle; padding-left: 12px;">
                            <span style="font-size: 14px; color: #ffffff;">
                              ${contributor.userId.slice(0, 8)}...
                            </span>
                          </td>
                          <td align="right" style="vertical-align: middle;">
                            <span style="font-size: 14px; font-weight: 600; color: #8b5cf6;">
                              ${formatNumber(contributor.score)} px
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  `).join('')}
                </table>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <a
                href="${galleryUrl}"
                style="display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;"
              >
                View in Gallery
              </a>
            </td>
          </tr>

          <!-- New Week CTA -->
          <tr>
            <td align="center" style="padding-top: 16px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #a3a3a3;">
                A fresh canvas awaits!
              </p>
              <a
                href="${APP_URL}"
                style="display: inline-block; background-color: transparent; color: #8b5cf6; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #8b5cf6;"
              >
                Start Creating
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 48px; border-top: 1px solid #262626; margin-top: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #525252;">
                      You're receiving this because you subscribed to AIplaces.art
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #525252;">
                      <a href="${unsubscribeUrl}" style="color: #a3a3a3; text-decoration: underline;">
                        Manage preferences
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of the weekly newsletter
 */
export function generateNewsletterText(data: NewsletterData): string {
  const {
    weekNumber,
    year,
    stats,
    topContributors,
    galleryUrl,
  } = data;

  const top5 = topContributors.slice(0, 5);
  const unsubscribeUrl = `${APP_URL}/settings?tab=notifications`;

  const contributorsList = top5
    .map((c, i) => `  ${i + 1}. ${c.userId.slice(0, 8)}... - ${formatNumber(c.score)} pixels`)
    .join('\n');

  return `
AIplaces.art - Weekly Canvas Recap
===================================

Week ${weekNumber}, ${year}

Another week of collaborative pixel art is complete!

STATS
-----
Total Pixels: ${formatNumber(stats.totalPixels)}
Contributors: ${formatNumber(stats.contributors)}

${top5.length > 0 ? `TOP 5 CONTRIBUTORS
------------------
${contributorsList}
` : ''}
VIEW IN GALLERY
---------------
${galleryUrl}

A fresh canvas awaits! Start creating at ${APP_URL}

---
You're receiving this because you subscribed to AIplaces.art
Manage preferences: ${unsubscribeUrl}
  `.trim();
}
