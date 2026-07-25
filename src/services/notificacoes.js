// Notificações do navegador para o CRM.
//
// ESCOPO — leia antes de esperar mais do que isto entrega:
// São notificações LOCAIS (Notification API), que só disparam com o app aberto
// em alguma aba. Push de verdade (celular com o app fechado) precisa de Web
// Push com chaves VAPID e um servidor mandando as mensagens — o bot no Railway
// serviria, mas é trabalho de backend que não cabia nesta fase. Está anotado no
// PLANO-WHATSAPP-CRM.md como pendência.
//
// Mesmo assim resolve o caso mais comum: o painel fica aberto o dia todo e
// hoje não avisa nada — nem cliente esperando resposta há horas.

const CHAVE_ULTIMO_RESUMO = "vv_ultimo_resumo_diario";

export function suportaNotificacao() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function permissaoNotificacao() {
  return suportaNotificacao() ? Notification.permission : "denied";
}

/** Pede permissão. Só chame a partir de um clique — o navegador exige gesto. */
export async function pedirPermissao() {
  if (!suportaNotificacao()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

function notificar(titulo, corpo, tag) {
  if (!suportaNotificacao() || Notification.permission !== "granted") return null;
  try {
    const n = new Notification(titulo, {
      body: corpo,
      tag,               // mesma tag substitui a anterior em vez de empilhar
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    });
    n.onclick = () => { window.focus(); n.close(); };
    return n;
  } catch {
    return null;
  }
}

/**
 * Avisa quando um cliente novo passa a esperar resposta (SLA de 1h).
 * Recebe a lista atual e a anterior para notificar só o que mudou — sem isso
 * viraria alarme repetido a cada verificação.
 */
export function notificarSLA(filaAtual, jaAvisados) {
  const novos = filaAtual.filter((f) => !jaAvisados.has(f.conv.phone));
  if (novos.length === 0) return jaAvisados;

  if (novos.length === 1) {
    const { conv, horas } = novos[0];
    const nome = conv.leadData?.nome || conv.phone;
    notificar("Cliente esperando resposta", `${nome} há ${horas}h sem retorno.`, "sla");
  } else {
    notificar("Clientes esperando resposta", `${novos.length} conversas sem retorno há mais de 1h.`, "sla");
  }

  const atualizado = new Set(jaAvisados);
  novos.forEach((f) => atualizado.add(f.conv.phone));
  return atualizado;
}

/**
 * Resumo das tarefas do dia, uma vez por dia (guardado no localStorage).
 */
export function notificarResumoDiario(qtdTarefas) {
  if (qtdTarefas <= 0) return false;
  const hoje = new Date().toDateString();
  try {
    if (localStorage.getItem(CHAVE_ULTIMO_RESUMO) === hoje) return false;
    localStorage.setItem(CHAVE_ULTIMO_RESUMO, hoje);
  } catch {
    return false;
  }
  notificar(
    "Follow-ups de hoje",
    `${qtdTarefas} ${qtdTarefas === 1 ? "cliente para contatar" : "clientes para contatar"} hoje.`,
    "resumo-diario"
  );
  return true;
}
