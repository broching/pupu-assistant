export function parseGmailMessage(message: any) {
  const headers = message.payload.headers || [];

  const getHeader = (name: string) =>
    headers.find((h: any) => h.name === name)?.value || "";

  const subject = getHeader("Subject");
  const from = getHeader("From");
  const to = getHeader("To");
  const date = getHeader("Date");
  const inReplyTo = getHeader("In-Reply-To");
  const references = getHeader("References")?.split(" ") || [];

  const isThreadReply = !!inReplyTo;

  // Recursively extract text/plain
  const extractPlainText = (payload: any): string | null => {
    if (payload.mimeType === "text/plain" && payload.body?.data) {
      return Buffer.from(payload.body.data, "base64").toString("utf-8");
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        const text = extractPlainText(part);
        if (text) return text;
      }
    }

    return null;
  };

  const rawBody =
    extractPlainText(message.payload) || "(No plain text body found)";

  const body = cleanEmailBody(rawBody);

  return {
    subject,
    from,
    to,
    date,
    body,
    isThreadReply,
    threadIds: references,
    inReplyTo,
  };
}


function cleanEmailBody(text: string): string {
  return text
    // Remove [image: ...]
    .replace(/\[image:[^\]]*]/gi, "")

    // Remove angle brackets but keep content inside
    .replace(/<([^>]+)>/g, "$1")

    // Remove invisible Unicode spacing junk
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "")

    // Remove long tracking parameters (optional but recommended)
    .replace(/(\?|&)lipi=[^\s]+/gi, "")
    .replace(/(\?|&)trk[a-zA-Z]*=[^\s]+/gi, "")
    .replace(/(\?|&)midToken=[^\s]+/gi, "")
    .replace(/(\?|&)otpToken=[^\s]+/gi, "")

    // Collapse repeated links
    .replace(/(https?:\/\/\S+)(\s+\1)+/g, "$1")

    // Remove LinkedIn footer/legal junk
    .replace(/©\s?\d{4}\sLinkedIn[\s\S]*$/i, "")

    // Normalize whitespace
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")

    // Trim
    .trim();
}
