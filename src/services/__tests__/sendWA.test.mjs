// Teste do fluxo de decisão do sendWA — qual canal ele escolhe e, principalmente,
// quando devolve ok:false (que é o que impede o falso positivo no CRM).
//
// wa.js usa import.meta.env e window; stubamos os dois antes de importar.
globalThis.window = { open: (...a) => { globalThis.__abriuWaMe = true; return {}; } };

const respostas = { status: null, send: null };
globalThis.fetch = async (url) => {
  if (String(url).includes("/api/status")) return respostas.status();
  if (String(url).includes("/api/send-message")) return respostas.send();
  throw new Error("url inesperada: " + url);
};
const json = (body, ok = true, status = 200) => ({ ok, status, json: async () => body });

const { sendWA, resetChannelCache } = await import("../wa.js");

let ok = 0, total = 0;
const check = (nome, real, esperado) => {
  total++;
  const passou = JSON.stringify(real) === JSON.stringify(esperado);
  if (passou) ok++;
  console.log(`${passou ? "PASS" : "FALHOU"}  ${nome.padEnd(46)} → ${JSON.stringify(real)}`);
  if (!passou) console.log(`        esperado: ${JSON.stringify(esperado)}`);
};

const H = (h) => Date.now() - h * 3600 * 1000;
const reset = () => { resetChannelCache(); globalThis.__abriuWaMe = false; };

// --- sem telefone / sem texto: nunca é sucesso ---
reset(); respostas.status = () => json({ whatsapp: null });
check("sem telefone", (await sendWA({ phone: "", text: "oi" })).ok, false);
reset();
check("texto vazio", (await sendWA({ phone: "13996781966", text: "  " })).ok, false);

// --- canal manual: cai no wa.me ---
reset(); respostas.status = () => json({ server: "online", whatsapp: null });
let r = await sendWA({ phone: "13996781966", text: "oi" });
check("provider desconectado → wa.me", { ok: r.ok, canal: r.canal }, { ok: true, canal: "wa.me" });
check("  e abriu a janela do WhatsApp", globalThis.__abriuWaMe, true);

// --- bot conectado (Z-API): envia pelo bot ---
reset();
respostas.status = () => json({ whatsapp: { connected: true } });
respostas.send = () => json({ success: true });
r = await sendWA({ phone: "13996781966", text: "oi" });
check("bot conectado → canal bot", { ok: r.ok, canal: r.canal }, { ok: true, canal: "bot" });
check("  e NÃO abriu wa.me", globalThis.__abriuWaMe, false);

// --- bot falha no envio: cai para wa.me ---
reset();
respostas.send = () => json({ error: "provider caiu" }, false, 500);
r = await sendWA({ phone: "13996781966", text: "oi" });
check("bot falha → fallback wa.me", { ok: r.ok, canal: r.canal }, { ok: true, canal: "wa.me" });

// --- bot falha e fallback proibido: ok:false (não registra interação) ---
reset();
r = await sendWA({ phone: "13996781966", text: "oi", permitirFallback: false });
check("bot falha sem fallback → ok:false", r.ok, false);

// --- Cloud API oficial DENTRO da janela: texto livre ---
reset();
respostas.status = () => json({ whatsapp: { provider: "meta-cloud" } });
respostas.send = () => json({ success: true });
r = await sendWA({ phone: "13996781966", text: "oi", conv: { lastUserMessageAt: H(2) } });
check("oficial dentro da janela → texto livre", { ok: r.ok, canal: r.canal }, { ok: true, canal: "oficial" });

// --- Cloud API oficial FORA da janela: não tenta texto livre, vai pro wa.me ---
reset();
respostas.send = () => { throw new Error("NÃO deveria chamar send-message fora da janela"); };
r = await sendWA({ phone: "13996781966", text: "oi", conv: { lastUserMessageAt: H(30) } });
check("oficial fora da janela → wa.me", { ok: r.ok, canal: r.canal }, { ok: true, canal: "wa.me" });

// --- fora da janela sem fallback: erro explicativo ---
reset();
r = await sendWA({ phone: "13996781966", text: "oi", conv: { lastUserMessageAt: H(30) }, permitirFallback: false });
check("fora da janela sem fallback → ok:false", r.ok, false);
check("  com erro sobre a janela", /janela de 24h/.test(r.erro), true);

// --- bot fora do ar (fetch estoura) ---
reset();
respostas.status = () => { throw new Error("ECONNREFUSED"); };
r = await sendWA({ phone: "13996781966", text: "oi" });
check("bot inacessível → wa.me", { ok: r.ok, canal: r.canal }, { ok: true, canal: "wa.me" });

// --- 401 (chave errada) não deve travar o envio ---
reset();
respostas.status = () => json({ error: "não autorizado" }, false, 401);
r = await sendWA({ phone: "13996781966", text: "oi" });
check("401 do bot → wa.me", { ok: r.ok, canal: r.canal }, { ok: true, canal: "wa.me" });

console.log(`\n${ok}/${total} casos`);
process.exit(ok === total ? 0 : 1);
