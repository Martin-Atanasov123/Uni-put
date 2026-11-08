// Общ дизайн на всички имейли на УниПът (Supabase Auth шаблоните и напомнянията).
// Един източник на истината: scripts/build-email-templates.mjs генерира HTML файловете
// за Supabase от тази функция, а Edge Function-ът я ползва директно.
//
// Имейл клиентите (Outlook, Gmail, Apple Mail) имат слаба CSS поддръжка, затова:
//   • таблици вместо flex/grid, всичко inline, фонове и с bgcolor (резервен цвят);
//   • градиентът е подобрение — без него остава плътен циан;
//   • бутонът е "bulletproof" (връзка в клетка на таблица);
//   • скритият preheader е текстът до темата в пощата.
// Само "erasable" TypeScript — файлът се зарежда и от Deno, и от Node (type stripping).

export const SITE = "https://uniput.eu";
export const SUPPORT_EMAIL = "uniput1000@gmail.com";
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
const MONO = "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace";

export const C = {
    page: "#0B1220",
    card: "#111B2E",
    cardEdge: "#223152",
    inset: "#0D1626",
    text: "#F1F5F9",
    body: "#CBD5E1",
    muted: "#8696B0",
    cyan: "#22D3EE",
    violet: "#8B5CF6",
};

export function esc(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export interface EmailOptions {
    /** Текст, който се вижда до темата в пощенската кутия. */
    preheader: string;
    /** Малък надпис над заглавието (главни букви). */
    eyebrow: string;
    title: string;
    /** Абзаци — доверен HTML (за Supabase шаблоните съдържа Go променливи). */
    paragraphs: string[];
    button?: { label: string; url: string };
    /** Код за еднократна употреба (OTP). */
    code?: { label: string; value: string };
    /** Ред под бутона. */
    secondary?: string;
    /** Рамка „Не си ти?“ */
    note?: { title: string; text: string };
    /** Защо получава имейла (в долния колонтитул). */
    footerReason: string;
    /** Връзка за отписване (само за напомняния). */
    unsubscribeUrl?: string;
}

const p = (html: string) =>
    `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.65;color:${C.body};">${html}</p>`;

function button(label: string, url: string): string {
    return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn-wrap" style="margin:8px 0 8px;">
  <tr>
    <td align="center" bgcolor="${C.cyan}" style="border-radius:12px;background-color:${C.cyan};background-image:linear-gradient(135deg,${C.cyan},${C.violet});">
      <a href="${url}" target="_blank" class="btn" style="display:inline-block;padding:15px 34px;font-family:${FONT};font-size:16px;font-weight:700;line-height:1;color:#06101F;text-decoration:none;border-radius:12px;">${label}&nbsp;&rarr;</a>
    </td>
  </tr>
</table>`;
}

function codeBox(label: string, value: string): string {
    return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 20px;">
  <tr>
    <td bgcolor="${C.inset}" align="center" style="background-color:${C.inset};border:1px solid ${C.cardEdge};border-radius:14px;padding:22px 16px;">
      <div style="font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${C.muted};margin-bottom:10px;">${label}</div>
      <div style="font-family:${MONO};font-size:34px;font-weight:700;letter-spacing:0.28em;color:${C.cyan};line-height:1;">${value}</div>
    </td>
  </tr>
</table>`;
}

function noteBox(title: string, text: string): string {
    return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 0;">
  <tr>
    <td bgcolor="${C.inset}" style="background-color:${C.inset};border-left:3px solid ${C.violet};border-radius:8px;padding:16px 18px;">
      <div style="font-family:${FONT};font-size:14px;font-weight:700;color:${C.text};margin-bottom:4px;">${title}</div>
      <div style="font-family:${FONT};font-size:14px;line-height:1.6;color:${C.muted};">${text}</div>
    </td>
  </tr>
</table>`;
}

export function layout(o: EmailOptions): string {
    const btn = o.button ? button(o.button.label, o.button.url) : "";
    const fallback = o.button
        ? `<p style="margin:18px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${C.muted};">Бутонът не работи? Копирай този адрес в браузъра:<br><a href="${o.button.url}" target="_blank" style="color:${C.cyan};word-break:break-all;text-decoration:none;">${o.button.url}</a></p>`
        : "";
    const unsub = o.unsubscribeUrl
        ? `<br><a href="${o.unsubscribeUrl}" target="_blank" style="color:${C.muted};text-decoration:underline;">Спри тези напомняния</a>`
        : "";
    return `<!DOCTYPE html>
<html lang="bg" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(o.title)}</title>
<style>
  body{margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table{border-collapse:collapse;}
  img{border:0;outline:none;text-decoration:none;}
  a{-webkit-text-decoration-skip:ink;}
  @media only screen and (max-width:620px){
    .outer{padding:20px 12px !important;}
    .pad{padding:30px 22px 32px !important;}
    .h1{font-size:25px !important;}
    .btn-wrap,.btn-wrap td{width:100% !important;}
    .btn{display:block !important;padding:17px 12px !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.page};">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${C.page};">${o.preheader}&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background-color:${C.page};">
  <tr>
    <td align="center" class="outer" style="padding:40px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td align="center" style="padding:0 0 26px;">
            <a href="${SITE}" target="_blank" style="text-decoration:none;"><img src="${SITE}/email/logo.png" width="104" alt="УниПът" style="display:block;width:104px;height:auto;margin:0 auto;"></a>
          </td>
        </tr>
        <tr>
          <td bgcolor="${C.card}" style="background-color:${C.card};border:1px solid ${C.cardEdge};border-radius:20px;overflow:hidden;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td height="4" bgcolor="${C.cyan}" style="height:4px;line-height:4px;font-size:0;background-color:${C.cyan};background-image:linear-gradient(90deg,${C.cyan},${C.violet});">&nbsp;</td></tr>
              <tr>
                <td class="pad" style="padding:40px 40px 42px;">
                  <div style="font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${C.cyan};margin:0 0 14px;">${o.eyebrow}</div>
                  <h1 class="h1" style="margin:0 0 20px;font-family:${FONT};font-size:29px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;color:${C.text};">${o.title}</h1>
                  ${o.paragraphs.map(p).join("\n                  ")}
                  ${o.code ? codeBox(o.code.label, o.code.value) : ""}
                  ${btn}
                  ${o.secondary ? `<p style="margin:14px 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:${C.muted};">${o.secondary}</p>` : ""}
                  ${fallback}
                  ${o.note ? noteBox(o.note.title, o.note.text) : ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:26px 12px 0;font-family:${FONT};font-size:12px;line-height:1.7;color:${C.muted};">
            <strong style="color:${C.body};">УниПът</strong> &middot; безплатният пътеводител за кандидат-студенти<br>
            ${o.footerReason}${unsub}<br>
            Въпроси? <a href="mailto:${SUPPORT_EMAIL}" style="color:${C.cyan};text-decoration:none;">${SUPPORT_EMAIL}</a><br>
            <a href="${SITE}/privacy/" target="_blank" style="color:${C.muted};text-decoration:underline;">Поверителност</a> &nbsp;&middot;&nbsp;
            <a href="${SITE}/terms/" target="_blank" style="color:${C.muted};text-decoration:underline;">Условия</a> &nbsp;&middot;&nbsp;
            <a href="${SITE}" target="_blank" style="color:${C.muted};text-decoration:underline;">uniput.eu</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`;
}
