// Teste do cardápio de vinil. Roda com: node src/data/__tests__/vinil.test.mjs
import { VOPTS, vinilOpt, vinilNome, vinilDesc, opcoesVinil, nomeItemVinil, VINIL_PADRAO } from "../vinil.js";

let ok = 0, total = 0;
const check = (nome, real, esperado) => {
  total++;
  const passou = JSON.stringify(real) === JSON.stringify(esperado);
  if (passou) ok++;
  console.log(`${passou ? "PASS" : "FALHOU"}  ${nome.padEnd(60)} → ${JSON.stringify(real)}${passou ? "" : " (esperado " + JSON.stringify(esperado) + ")"}`);
};

// --- o cardápio do Marcos (01/10/2026): espessura → garantia ---
const anos = (t) => vinilOpt(t).w;
check("Acqualiner 0,6 = 3 anos", anos("0,6mm"), 3);
check("Acqualiner 0,63 = 3 anos", anos("0,63mm"), 3);
check("Acqualiner 0,7 = 3 anos", anos("0,7mm"), 3);
check("Acqualiner 0,73 = 4 anos", anos("0,73mm"), 4);
check("Locomotiva 0,65 = 36 meses", anos("0,65mm-locomotiva"), 3);
check("Locomotiva 0,8 = 36 meses", anos("0,8mm-locomotiva"), 3);
check("tela armada 1,5 = 5 anos", anos("1,5mm"), 5);
check("marca do 0,65", vinilOpt("0,65mm-locomotiva").marca, "LOCOMOTIVA");
check("marca do 0,73", vinilOpt("0,73mm").marca, "ACQUALINER");
check("nome do 0,8 da Locomotiva diz tramado", vinilNome("0,8mm-locomotiva"), "LOCOMOTIVA 0,8mm tramado");

// --- orçamento salvo: as chaves de antes abrem do mesmo jeito ---
check("salvo com 0,7mm: mesmo nome", vinilNome("0,7mm"), "ACQUALINER 0,7mm");
check("salvo com 0,7mm: mesma garantia", anos("0,7mm"), 3);
check("salvo com 0,8mm: mesmo nome", vinilNome("0,8mm"), "ACQUALINER 0,8mm");
check("salvo com 0,8mm: mesma garantia (4 anos)", anos("0,8mm"), 4);
check("salvo com 0,8mm: mesmo estoque", vinilOpt("0,8mm").estoque, "Vinil 0,8mm");
check("salvo com 1,5mm: continua manta", vinilOpt("1,5mm").armada, true);
check("descrição do 0,7 igual à de antes", vinilDesc("0,7mm"), "ACQUALINER 0,7mm · Resist. até 32°C");
check("chave desconhecida cai no padrão 0,7", vinilOpt("x").t, "0,7mm");
check("sem chave cai no padrão 0,7", vinilOpt(undefined).t, VINIL_PADRAO);

// --- o seletor ---
const valores = (atual) => opcoesVinil(atual).map((o) => o.value);
check("orçamento novo não oferece o 0,8 antigo", valores("0,7mm").includes("0,8mm"), false);
check("orçamento novo oferece as 7 do cardápio", valores("0,7mm"), ["0,6mm", "0,63mm", "0,7mm", "0,73mm", "0,65mm-locomotiva", "0,8mm-locomotiva", "1,5mm"]);
check("orçamento salvo com 0,8mm mostra a opção dele", valores("0,8mm").includes("0,8mm"), true);
check("e marca que é antiga", opcoesVinil("0,8mm").find((o) => o.value === "0,8mm").label, "ACQUALINER 0,8mm (4a) · antigo");
check("rótulo de uma opção atual", opcoesVinil("0,7mm")[4].label, "LOCOMOTIVA 0,65mm (3a)");

// --- item do revestimento e estoque ---
check("item do vinil Acqualiner", nomeItemVinil("0,63mm"), "Vinil ACQUALINER");
check("item do vinil Locomotiva", nomeItemVinil("0,8mm-locomotiva"), "Vinil LOCOMOTIVA");
check("só o 0,7 e o 0,8 antigo têm estoque cadastrado", VOPTS.filter((v) => v.estoque).map((v) => v.t), ["0,7mm", "0,8mm"]);
check("tramado só em Azul Celeste e Eagle Blue", vinilOpt("0,8mm-locomotiva").estampas, ["Azul Celeste", "Eagle Blue"]);
check("chaves sem repetição", new Set(VOPTS.map((v) => v.t)).size, VOPTS.length);

console.log(`\n${ok}/${total} casos`);
process.exit(ok === total ? 0 : 1);
