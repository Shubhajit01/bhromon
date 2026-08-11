const TIME_ZONE_COOKIE = 'bhromon-time-zone';
const TIME_ZONE_FALLBACK_PARAM = '__time-zone-fallback';

export function needsTimeZoneCookie(request: Request) {
  const isDocumentRequest =
    request.method === 'GET' &&
    request.headers.get('sec-fetch-dest') === 'document' &&
    request.headers.get('accept')?.includes('text/html');
  const hasTimeZoneCookie = request.headers
    .get('cookie')
    ?.split(';')
    .some((cookie) => cookie.trim().startsWith(`${TIME_ZONE_COOKIE}=`));

  return isDocumentRequest && !hasTimeZoneCookie;
}

export function getTimeZoneBootstrapResponse() {
  return new Response(
    `<!doctype html><script>
const name=${JSON.stringify(TIME_ZONE_COOKIE)};
const value=encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone);
document.cookie=name+'='+value+'; Max-Age=31536000; Path=/; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');
if(document.cookie.split('; ').some(cookie=>cookie===name+'='+value)){location.reload()}else{const url=new URL(location.href);url.searchParams.set(${JSON.stringify(TIME_ZONE_FALLBACK_PARAM)},'1');location.replace(url)}
</script>`,
    {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Type': 'text/html; charset=utf-8',
      },
    },
  );
}

export function getTimeZoneFallbackResponse(request: Request) {
  const url = new URL(request.url);

  if (!url.searchParams.has(TIME_ZONE_FALLBACK_PARAM)) {
    return;
  }

  url.searchParams.delete(TIME_ZONE_FALLBACK_PARAM);

  const timeZone = request.cf?.timezone ?? 'UTC';
  const encodedTimeZone = encodeURIComponent(timeZone);
  const secure = url.protocol === 'https:' ? '; Secure' : '';

  return new Response(
    `<!doctype html><script>
const saved=document.cookie.split('; ').some(cookie=>cookie===${JSON.stringify(`${TIME_ZONE_COOKIE}=${encodedTimeZone}`)});
if(saved){location.replace(${JSON.stringify(url.toString())})}else{document.write('Bhromon could not save your time zone. Please enable cookies and reload.')}
</script>`,
    {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Type': 'text/html; charset=utf-8',
        'Set-Cookie': `${TIME_ZONE_COOKIE}=${encodedTimeZone}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`,
      },
    },
  );
}
