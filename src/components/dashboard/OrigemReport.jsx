import React from "react";
import { relatorioOrigem } from "../../services/origem.js";

// De onde vêm os clientes que fecham.
//
// A pergunta que esta tela responde e nenhuma outra respondia: qual canal
// merece mais verba de anúncio. Não é "de onde vêm mais conversas" — é de onde
// vem RECEITA. Um canal com 40 leads e 1 fechamento perde para um com 6 leads
// e 3 fechamentos, e só a coluna de conversão mostra isso.

const COR = {
  "Instagram Ads": "#e1306c", "Facebook Ads": "#1877f2", "Google Ads": "#ea4335",
  Instagram: "#c13584", Facebook: "#4267b2", "Google / busca": "#fbbc05",
  "Indicação": "#16a34a", "Já era cliente": "#0891b2",
  "Placa / carro / rua": "#f97316", "WhatsApp / grupo": "#25d366",
};
const corDe = (canal) => COR[canal] || "#64748b";

export default function OrigemReport({ hist, achaConversa, t, fmt, blue }) {
  const { linhas, semOrigem, totalLeads, cobertura } = relatorioOrigem(hist, achaConversa);

  if (linhas.length === 0) {
    return (
      <div style={{ background: t.sectionBg, border: `1px solid ${t.cardBorder}`, borderRadius: "10px", padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "30px" }}>📣</div>
        <div style={{ fontSize: "12px", fontWeight: "700", color: t.text, marginTop: "8px" }}>Nenhuma origem registrada ainda</div>
        <div style={{ fontSize: "10px", color: t.textMuted, marginTop: "6px", lineHeight: 1.6, maxWidth: "420px", margin: "6px auto 0" }}>
          O bot marca sozinho quem chega por anúncio do Instagram, Facebook ou Google, e guarda a resposta
          de quem conta como conheceu. Conforme as conversas novas entrarem, os canais aparecem aqui.
        </div>
      </div>
    );
  }

  const maiorReceita = Math.max(...linhas.map((l) => l.receita), 1);
  const totalReceita = linhas.reduce((s, l) => s + l.receita, 0);
  const totalFechados = linhas.reduce((s, l) => s + l.fechados, 0);
  const campeao = linhas.find((l) => l.fechados > 0);

  return (
    <>
      {/* O que fazer com a informação, escrito. Uma tabela sozinha vira
          decoração: aqui vai a leitura que ela permite. */}
      {campeao && (
        <div style={{ background: "linear-gradient(135deg,#001d3d,#0055a4)", borderRadius: "10px", padding: "14px", marginBottom: "12px", color: "#fff" }}>
          <div style={{ fontSize: "9px", opacity: 0.7, fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Canal que mais fatura</div>
          <div style={{ fontSize: "20px", fontWeight: "800", marginTop: "2px" }}>{campeao.canal}</div>
          <div style={{ fontSize: "10px", opacity: 0.85, marginTop: "4px" }}>
            {fmt(campeao.receita)} em {campeao.fechados} {campeao.fechados === 1 ? "venda" : "vendas"} · fecha {campeao.conversao}% do que entra
          </div>
        </div>
      )}

      <div style={{ background: t.sectionBg, borderRadius: "10px", padding: "12px", border: `1px solid ${t.cardBorder}`, marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: t.text }}>Origem dos leads</span>
          <span style={{ fontSize: "9px", color: t.textMuted }}>{fmt(totalReceita)} · {totalFechados} fechados</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(4, minmax(52px, .6fr))", gap: "4px 8px", alignItems: "center" }}>
          {["Canal", "Leads", "Fechou", "Conv.", "Receita"].map((h, i) => (
            <div key={h} style={{ fontSize: "8px", fontWeight: "800", color: t.textMuted, textTransform: "uppercase", letterSpacing: ".4px", textAlign: i === 0 ? "left" : "right", paddingBottom: "2px" }}>{h}</div>
          ))}

          {linhas.map((l) => (
            <React.Fragment key={l.canal}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "10px", fontWeight: "700", color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "2px", background: corDe(l.canal), marginRight: "5px" }} />
                  {l.canal}
                </div>
                <div style={{ height: "3px", background: t.cardBorder, borderRadius: "2px", marginTop: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.round((l.receita / maiorReceita) * 100)}%`, background: corDe(l.canal), borderRadius: "2px" }} />
                </div>
              </div>
              <Cel t={t}>{l.leads}</Cel>
              <Cel t={t} cor={l.fechados > 0 ? "#16a34a" : t.textMuted}>{l.fechados}</Cel>
              <Cel t={t} cor={l.conversao >= 20 ? "#16a34a" : l.conversao > 0 ? "#f59e0b" : t.textMuted}>{l.conversao}%</Cel>
              <Cel t={t} forte>{l.receita > 0 ? fmt(l.receita) : "—"}</Cel>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Sem isto a tabela mente por omissão: uma conversão de 30% calculada
          sobre 20% da base não é a conversão do canal. */}
      <div style={{ fontSize: "9px", color: t.textMuted, lineHeight: 1.6, padding: "0 2px" }}>
        Origem conhecida em <b style={{ color: cobertura >= 60 ? "#16a34a" : "#d97706" }}>{cobertura}%</b> dos {totalLeads} orçamentos
        {semOrigem > 0 && <> — {semOrigem} sem registro, quase todos anteriores à detecção automática.</>}
        {cobertura < 60 && <> Com essa cobertura os números servem para comparar canais entre si, não como total do negócio.</>}
      </div>
    </>
  );
}

const Cel = ({ children, t, cor, forte }) => (
  <div style={{ fontSize: forte ? "10px" : "11px", fontWeight: forte ? "800" : "700", color: cor || t.text, textAlign: "right", whiteSpace: "nowrap" }}>{children}</div>
);
