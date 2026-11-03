async function run() {
  const r = await fetch('http://localhost:3000/');
  console.log('Status:', r.status);
  const t = await r.text();
  const match = t.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
  if (match) {
    const data = JSON.parse(match[1]);
    console.log('NEXT_DATA:', JSON.stringify(data, null, 2));
  } else {
    console.log('No NEXT_DATA. Body:', t.slice(0, 1000));
  }
}
run();
