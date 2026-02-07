export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://kolten-precloacal-tempie.ngrok-free.dev")
  );
}

// export function getAppBaseUrl(): string {
//   return (
//     "https://-precloacal-tempie.ngrok-free.dev")
//     ;
// }
