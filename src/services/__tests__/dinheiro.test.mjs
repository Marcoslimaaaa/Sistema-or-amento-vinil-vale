// Teste da leitura de dinheiro. Roda com: node src/services/__tests__/dinheiro.test.mjs
import { parseMoney } from "../dinheiro.js";

let ok = 0, total = 0;
const check = (nome, real, esperado) => {
  total++;
  const passou = Math.abs(real - esperado) < 1e-9;
  if (passou) ok++;
  console.log(`${passou ? "PASS" : "FALHOU"}  ${nome.padEnd(52)} → ${real} (esperado ${esperado})`);
};

// --- o que a pessoa digita (padrão BR) ---
check("milhar e centavos: 12.500,50", parseMoney("12.500,50"), 12500.5);
check("só vírgula decimal: 12500,50", parseMoney("12500,50"), 12500.5);
check("milhar sem centavos: 12.500", parseMoney("12.500"), 12500);
check("milhão: 1.234.567", parseMoney("1.234.567"), 1234567);
check("milhão com centavos: 1.234.567,89", parseMoney("1.234.567,89"), 1234567.89);
check("inteiro: 12500", parseMoney("12500"), 12500);
check("com R$ e espaço: R$ 12.500,50", parseMoney("R$ 12.500,50"), 12500.5);

// --- o que o sistema GRAVOU até 29/04 (String(total) de JS) ---
// Valores reais da base, medidos em 24/09. Antes deste módulo eles viravam
// 125.083 / 18.734.486 / 6.629.480.000.000.001.
check("legado 1 casa: 12508.3", parseMoney("12508.3"), 12508.3);
check("legado 3 casas: 18734.486", parseMoney("18734.486"), 18734.486);
check("legado float: 6629.480000000001", parseMoney("6629.480000000001"), 6629.480000000001);
check("legado float: 5555.099999999999", parseMoney("5555.099999999999"), 5555.099999999999);
check("legado 2 casas: 38990.84", parseMoney("38990.84"), 38990.84);
check("campo type=number do registro manual: 12500.5", parseMoney("12500.5"), 12500.5);

// --- bordas ---
check("vazio", parseMoney(""), 0);
check("undefined", parseMoney(undefined), 0);
check("null", parseMoney(null), 0);
check("lixo", parseMoney("abc"), 0);
check("número de verdade", parseMoney(1500.25), 1500.25);
check("NaN vira 0", parseMoney(NaN), 0);
check("negativo BR: -1.500,00", parseMoney("-1.500,00"), -1500);

console.log(`\n${ok}/${total} casos`);
process.exit(ok === total ? 0 : 1);
