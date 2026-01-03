// lib/gmail/parseGmailMessage.ts
export function parseGmailMessage(message: any) {
  const headers = message.payload.headers;

  const getHeader = (name: string) =>
    headers.find((h: any) => h.name === name)?.value || "";

  const subject = getHeader("Subject");
  const from = getHeader("From");
  const to = getHeader("To");
  const date = getHeader("Date");

  // Get body (handle multipart)
  const getBody = (payload: any): string => {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, "base64").toString("utf-8");
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          return Buffer.from(part.body.data, "base64").toString("utf-8");
        }
      }
    }

    return "(No readable body)";
  };

  const body = getBody(message.payload);

  return { subject, from, to, date, body };
}
