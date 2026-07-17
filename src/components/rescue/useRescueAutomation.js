import { useEffect, useRef } from "react";
import { REGUA } from "../crm/regua";

export function useRescueAutomation({ hist, crmTags, crmNextContact, getDaysSince, saveCrmMeta, onSugerirPerda, ready = false }) {
  const ranRef = useRef(false);
  const dataRef = useRef({ hist, crmTags, crmNextContact, getDaysSince, saveCrmMeta, onSugerirPerda });

  // Keep refs up to date without triggering effect
  dataRef.current = { hist, crmTags, crmNextContact, getDaysSince, saveCrmMeta, onSugerirPerda };

  useEffect(() => {
    // Só roda depois que hist, interações e crmMeta chegaram da nuvem —
    // rodar antes tagueava tudo errado (dias=999) e sobrescrevia o crmMeta.
    if (!ready || ranRef.current) return;
    const timer = setTimeout(() => {
      if (ranRef.current) return;
      ranRef.current = true;

      const { hist, crmTags, crmNextContact, getDaysSince, saveCrmMeta, onSugerirPerda } = dataRef.current;
      if (!hist || hist.length === 0) return;

      let changed = false;
      const newTags = { ...crmTags };
      let firstSuggestion = null;

      hist.forEach((q) => {
        const status = q.status || "lead";
        if (!["lead", "negociacao", "orcamento"].includes(status)) return;

        const days = getDaysSince(q.id);
        // Sem nenhuma referência de contato (lead antigo sem data) — não tagueia no escuro
        if (days >= REGUA.desconhecido) return;
        const tags = newTags[q.id] || [];
        let updated = [...tags];

        if (days >= REGUA.resgate.aguardando && !updated.includes("Aguardando")) updated.push("Aguardando");
        if (days >= REGUA.resgate.ligar && !updated.includes("Retornar")) updated.push("Retornar");
        if (days >= REGUA.resgate.urgente && !updated.includes("Urgente")) updated.push("Urgente");

        if (updated.length !== tags.length) {
          newTags[q.id] = updated;
          changed = true;
        }

        if (days >= REGUA.resgate.perda && !firstSuggestion) {
          firstSuggestion = { q, days };
        }
      });

      if (changed) saveCrmMeta(crmNextContact, newTags);
      if (firstSuggestion) onSugerirPerda(firstSuggestion.q, firstSuggestion.days);
    }, 3000);

    return () => clearTimeout(timer);
  }, [ready]);
}
