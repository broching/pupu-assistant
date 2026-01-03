import { escapeHtml } from "./escapeHtml";

export function formatEmailMessage(email: {
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
}) {
  return `
📩 <b>New Email Received</b>

<b>From:</b> ${escapeHtml(email.from)}
<b>To:</b> ${escapeHtml(email.to)}
<b>Date:</b> ${escapeHtml(email.date)}

<b>Subject:</b>
${escapeHtml(email.subject)}

<b>Message:</b>
${escapeHtml(email.body)}
`.trim();
}
