import { useEffect, useState } from "react";
import { getChannelStatus, CANAL } from "../../services/wa.js";

// Badge do estado do canal de WhatsApp.
//
// Existe porque o sistema tinha dois caminhos de envio e nenhum sinal de qual
// estava vivo: com o provider caído, mensagens "enviadas" pela aba WhatsApp
// simplesmente sumiam. Agora o estado fica à vista, e em modo manual o usuário
// já sabe que o envio vai abrir no aparelho dele.

const ESTILOS = {
  [CANAL.OFICIAL]: { cor: "#16a34a", bg: "#dcfce7", icone: "🟢", texto: "WhatsApp oficial" },
  [CANAL.BOT]: { cor: "#0284c7", bg: "#e0f2fe", icone: "🔵", texto: "Bot conectado" },
  [CANAL.MANUAL]: { cor: "#d97706", bg: "#fef3c7", icone: "🟡", texto: "Modo manual" },
};

export default function CanalStatus({ compacto = false }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let vivo = true;
    const checar = async () => {
      const s = await getChannelStatus();
      if (vivo) setStatus(s);
    };
    checar();
    const id = setInterval(checar, 60000);
    return () => { vivo = false; clearInterval(id); };
  }, []);

  if (!status) return null;
  const e = ESTILOS[status.canal] || ESTILOS[CANAL.MANUAL];

  return (
    <div
      title={status.detalhe}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: compacto ? "3px 8px" : "5px 10px",
        borderRadius: "20px",
        background: e.bg,
        color: e.cor,
        fontSize: compacto ? "9px" : "10px",
        fontWeight: "700",
        border: `1px solid ${e.cor}33`,
        whiteSpace: "nowrap",
      }}
    >
      <span>{e.icone}</span>
      <span>{e.texto}</span>
      {!compacto && status.canal === CANAL.MANUAL && (
        <span style={{ fontWeight: "500", opacity: 0.8 }}>· envios abrem no seu WhatsApp</span>
      )}
    </div>
  );
}
