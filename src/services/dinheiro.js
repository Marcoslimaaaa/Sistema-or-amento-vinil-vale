// Leitura de dinheiro — o que a pessoa DIGITA e o que o sistema GRAVOU não têm
// o mesmo formato, e confundir os dois multiplica o valor do orçamento.
//
//   digitado no padrão BR     "12.500,50"   "12500,50"   "12.500"   "1.234.567"
//   gravado como número de JS "18734.486"   "12508.3"    "6629.480000000001"
//
// POR QUE ISSO EXISTE
// Até 29/04/2026 o gData() gravava `totOv: String(total)` — número de JS, com
// ponto decimal. O parseMoney de 17/07 (que morava no App.jsx) tirava TODO
// ponto como separador de milhar e lia "18734.486" como 18.734.486. Medido em
// 24/09 na base: 56 orçamentos (27%) abriam no editor e no PDF com o total
// multiplicado por 10, 100, 1.000 ou 10¹². Nenhum tinha sido regravado ainda —
// bastava abrir e salvar um deles.
//
// REGRA
//   - tem vírgula                      → padrão BR: ponto é milhar, vírgula é decimal
//   - só pontos em grupos de 3 dígitos → milhar BR ("12.500", "1.234.567")
//     e o primeiro grupo com 1 a 3
//   - um ponto em qualquer outro jeito → número de JS, ponto decimal
//     ("18734.486", "12508.3", "0.5")
//   - só dígitos                       → inteiro
//
// A ambiguidade que sobra é "187.345": lido como 187.345 (milhar BR), que é o
// que uma pessoa quis dizer ao digitar. Um total gravado pelo JS com exatamente
// 3 casas e abaixo de R$ 1.000 não aparece na base (conferido nos 208
// orçamentos em 24/09, ver dinheiro.test.mjs).

const MILHAR_BR = /^\d{1,3}(\.\d{3})+$/;

/** Texto de dinheiro (BR digitado ou número de JS gravado) → número. 0 se não der. */
export function parseMoney(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  let s = String(v ?? "").replace(/[R$\s ]/g, "");
  if (!s) return 0;
  const negativo = s.startsWith("-");
  if (negativo) s = s.slice(1);
  let n;
  if (s.includes(",")) n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  else if (MILHAR_BR.test(s)) n = parseFloat(s.replace(/\./g, ""));
  else n = parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  return negativo ? -n : n;
}
