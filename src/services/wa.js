// Camada única de envio de WhatsApp do painel.
//
// POR QUE ISSO EXISTE
// Antes havia dois caminhos paralelos: a aba WhatsApp e o chat do CRM iam pelo
// bot (/api/send-message), enquanto Tarefas de Hoje e o modal de resgate iam
// por wa.me. Quando o provider do bot caía — como está agora, com o Z-API
// encerrado e a Cloud API ainda não liberada — os dois primeiros falhavam e o
// usuário não tinha como saber qual estava vivo.
//
// Aqui todo envio passa pela mesma porta, que escolhe o canal:
//   bot      → provider conectado e conversa dentro da janela de 24h
//   template → fora da janela, na Cloud API oficial (exige template aprovado)
//   wa.me    → fallback, abre o WhatsApp do aparelho; funciona SEMPRE
//
// REGRA DE OURO: quem chama só registra interação no CRM se o retorno vier
// `ok: true`. Foi assim que nasceram os falsos positivos que tiravam lead da
// régua de follow-up sem ninguém ter falado com o cliente.

import { normalizePhone, openWaMe } from "../components/crm/regua.js";
import { dentroDaJanela, ultimaMensagemDoCliente, horasRestantesDaJanela } from "./janela.js";

// Reexporta para quem já importa a janela a partir daqui.
export { dentroDaJanela, ultimaMensagemDoCliente, horasRestantesDaJanela };

export const BOT_URL = "https://vinil-vale-whatsapp-bot-production.up.railway.app";

// Chave da API do bot. Enquanto não estiver definida na Vercel, as chamadas
// seguem sem header — o bot está em modo compatibilidade e aceita.
const API_KEY = import.meta.env?.VITE_BOT_API_KEY || "";

/** fetch para o bot, já com a chave e um timeout que não trava a interface. */
export async function botFetch(path, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), options.timeoutMs || 15000);
  try {
    return await fetch(`${BOT_URL}${path}`, {
      ...options,
      signal: ctrl.signal,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(API_KEY ? { "x-api-key": API_KEY } : {}),
        ...(options.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// Estado do canal
// ============================================================

export const CANAL = {
  OFICIAL: "oficial", // Cloud API da Meta conectada
  BOT: "bot",         // provider não-oficial (Z-API) conectado
  MANUAL: "manual",   // nenhum provider — só wa.me
};

let cache = { status: null, checkedAt: 0 };
const CACHE_MS = 60 * 1000;

/**
 * Estado atual do canal, com cache de 60s.
 * Nunca lança: qualquer falha vira "manual", que é o modo que sempre funciona.
 */
export async function getChannelStatus(force = false) {
  const agora = Date.now();
  if (!force && cache.status && agora - cache.checkedAt < CACHE_MS) return cache.status;

  let status = { canal: CANAL.MANUAL, detalhe: "Bot fora do ar", online: false };
  try {
    const r = await botFetch("/api/status", { timeoutMs: 8000 });
    if (r.ok) {
      const d = await r.json();
      // whatsapp: null = servidor no ar mas nenhum provider conectado
      if (d?.whatsapp) {
        const oficial = d.whatsapp.provider === "meta-cloud";
        status = {
          canal: oficial ? CANAL.OFICIAL : CANAL.BOT,
          detalhe: oficial ? "WhatsApp oficial conectado" : "Bot conectado",
          online: true,
          info: d.whatsapp,
        };
      } else {
        status = {
          canal: CANAL.MANUAL,
          detalhe: "Nenhum WhatsApp conectado ao bot — envios abrem no aparelho",
          online: false,
        };
      }
    } else if (r.status === 401) {
      status = {
        canal: CANAL.MANUAL,
        detalhe: "Painel sem autorização no bot (confira VITE_BOT_API_KEY)",
        online: false,
      };
    }
  } catch {
    // rede fora, bot dormindo, CORS — tudo cai no modo manual
  }

  cache = { status, checkedAt: agora };
  return status;
}

/** Invalida o cache (usar depois de um erro de envio). */
export function resetChannelCache() {
  cache = { status: null, checkedAt: 0 };
}

// ============================================================
// Envio
// ============================================================

/**
 * Envia uma mensagem pelo melhor canal disponível.
 *
 * @param {object}  p
 * @param {string}  p.phone      telefone do destinatário
 * @param {string}  p.text       texto da mensagem
 * @param {object}  [p.conv]     conversa do Firestore (para a janela de 24h)
 * @param {boolean} [p.permitirFallback=true]  cai para wa.me se o bot falhar
 * @returns {Promise<{ok:boolean, canal:string, erro?:string}>}
 *
 * `ok: true` significa que a mensagem saiu (bot) ou que a janela do WhatsApp
 * realmente abriu (wa.me). Só nesse caso quem chama deve registrar interação.
 */
export async function sendWA({ phone, text, conv, permitirFallback = true }) {
  const full = normalizePhone(phone);
  if (!full) return { ok: false, canal: null, erro: "Cliente sem telefone cadastrado" };
  if (!text || !text.trim()) return { ok: false, canal: null, erro: "Mensagem vazia" };

  const status = await getChannelStatus();

  if (status.online) {
    // Na Cloud API, fora da janela de 24h texto livre é recusado. Sem template
    // configurado, o caminho honesto é o wa.me — não uma falha silenciosa.
    const precisaTemplate = status.canal === CANAL.OFICIAL && !dentroDaJanela(conv);

    if (!precisaTemplate) {
      try {
        const r = await botFetch("/api/send-message", {
          method: "POST",
          body: JSON.stringify({ phone: full, message: text }),
        });
        if (r.ok) return { ok: true, canal: status.canal };

        const corpo = await r.json().catch(() => ({}));
        resetChannelCache();
        if (!permitirFallback) {
          return { ok: false, canal: status.canal, erro: corpo.error || `Erro ${r.status}` };
        }
      } catch (e) {
        resetChannelCache();
        if (!permitirFallback) {
          return { ok: false, canal: status.canal, erro: e.message };
        }
      }
    } else if (!permitirFallback) {
      return {
        ok: false,
        canal: CANAL.OFICIAL,
        erro: "Fora da janela de 24h — só template aprovado pode iniciar a conversa",
      };
    }
  }

  if (!permitirFallback) {
    return { ok: false, canal: null, erro: status.detalhe };
  }

  const abriu = openWaMe(full, text);
  return abriu
    ? { ok: true, canal: "wa.me" }
    : { ok: false, canal: "wa.me", erro: "Não foi possível abrir o WhatsApp" };
}

/**
 * Envia um template aprovado (única forma de iniciar conversa fora da janela).
 * Só funciona com a Cloud API oficial ligada.
 */
export async function sendTemplate({ phone, template, params = [], lang = "pt_BR" }) {
  const full = normalizePhone(phone);
  if (!full) return { ok: false, erro: "Cliente sem telefone cadastrado" };
  try {
    const r = await botFetch("/api/send-template", {
      method: "POST",
      body: JSON.stringify({ phone: full, template, params, lang }),
    });
    const corpo = await r.json().catch(() => ({}));
    return r.ok
      ? { ok: true, canal: CANAL.OFICIAL }
      : { ok: false, canal: CANAL.OFICIAL, erro: corpo.error || `Erro ${r.status}` };
  } catch (e) {
    return { ok: false, canal: CANAL.OFICIAL, erro: e.message };
  }
}

/**
 * Envia um arquivo (PDF do orçamento, imagem...).
 *
 * Não existe fallback automático: o wa.me não anexa arquivo. Quando o canal
 * está manual devolvemos `precisaAnexarManual`, e a interface orienta a baixar
 * o PDF e anexar na conversa — em vez de fingir que enviou.
 */
export async function sendWAFile({ phone, base64, mimetype, fileName, caption, conv }) {
  const full = normalizePhone(phone);
  if (!full) return { ok: false, erro: "Cliente sem telefone cadastrado" };

  const status = await getChannelStatus();
  if (!status.online) {
    return { ok: false, precisaAnexarManual: true, erro: status.detalhe };
  }
  if (status.canal === CANAL.OFICIAL && !dentroDaJanela(conv)) {
    return {
      ok: false,
      precisaAnexarManual: true,
      erro: "Fora da janela de 24h — a Meta não deixa enviar arquivo sem o cliente ter falado antes",
    };
  }

  try {
    const r = await botFetch("/api/send-media", {
      method: "POST",
      timeoutMs: 60000,
      body: JSON.stringify({ phone: full, media: base64, mimetype, fileName, caption: caption || "" }),
    });
    if (r.ok) return { ok: true, canal: status.canal };
    const corpo = await r.json().catch(() => ({}));
    resetChannelCache();
    return { ok: false, precisaAnexarManual: true, erro: corpo.error || `Erro ${r.status}` };
  } catch (e) {
    resetChannelCache();
    return { ok: false, precisaAnexarManual: true, erro: e.message };
  }
}

/** Converte Blob em base64 puro (sem o prefixo data:), para o /api/send-media. */
export function blobParaBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
