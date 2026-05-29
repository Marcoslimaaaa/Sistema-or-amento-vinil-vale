import { useEffect, useRef } from "react";

export function useRescueAutomation({ hist, crmTags, crmNextContact, getDaysSince, saveCrmMeta, onSugerirPerda }) {
  const ranRef = useRef(false);
  const dataRef = useRef({ hist, crmTags, crmNextContact, getDaysSince, saveCrmMeta, onSugerirPerda });

  // Keep refs up to date without triggering effect
  dataRef.current = { hist, crmTags, crmNextContact, getDaysSince, saveCrmMeta, onSugerirPerda };

  useEffect(() => {
    if (ranRef.current) return;
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
        const tags = newTags[q.id] || [];
        let updated = [...tags];

        if (days >= 3 && !updated.includes("Aguardando")) updated.push("Aguardando");
        if (days >= 9 && !updated.includes("Retornar")) updated.push("Retornar");
        if (days >= 20 && !updated.includes("Urgente")) updated.push("Urgente");

        if (updated.length !== tags.length) {
          newTags[q.id] = updated;
          changed = true;
        }

        if (days >= 45 && !firstSuggestion) {
          firstSuggestion = { q, days };
        }
      });

      if (changed) saveCrmMeta(crmNextContact, newTags);
      if (firstSuggestion) onSugerirPerda(firstSuggestion.q, firstSuggestion.days);
    }, 30000);

    return () => clearTimeout(timer);
  }, []); // runs once on mount only
}
