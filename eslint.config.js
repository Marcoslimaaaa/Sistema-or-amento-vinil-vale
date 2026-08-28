import globals from "globals";

// Lint mínimo, com um objetivo só: pegar identificador que não existe.
//
// POR QUE EXISTE
// Em 28/08/2026 o CRM inteiro deu tela branca porque um import se perdeu no
// meio de uma edição: o código chamava `metricasFunil` e o import de
// services/leadUnico.js não estava lá. O build do Vite não verifica isso (ele
// empacota, não confere escopo), os testes cobrem os services e não o App, e a
// falha só aparecia numa aba — a única que usava a função.
//
// Não é um guia de estilo: regra de estilo aqui só geraria ruído num arquivo de
// 4 mil linhas escrito ao longo de meses. É rede de segurança para a classe de
// erro que já custou uma tela branca em produção.

export default [
  {
    files: ["src/**/*.{js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    // Os comentarios eslint-disable do arquivo apontam para regras de plugins
    // que nao instalamos (react-hooks). Como o conjunto de regras aqui e minimo
    // e proposital, ignorar config inline evita erro por regra desconhecida.
    linterOptions: { noInlineConfig: true },
    rules: {
      // A regra que importa.
      "no-undef": "error",
      // Duas vizinhas baratas, do mesmo tipo de defeito:
      "no-dupe-keys": "error",       // chave repetida em objeto silencia a primeira
      "no-unreachable": "error",     // código depois de return nunca roda
      "no-const-assign": "error",
      "no-dupe-class-members": "error",
      "no-obj-calls": "error",
      "no-sparse-arrays": "warn",
    },
  },
  {
    // JSX usa React implicitamente pelo transform do Vite; e os testes rodam em
    // Node, não no navegador.
    files: ["src/**/__tests__/*.mjs"],
    languageOptions: { globals: { ...globals.node } },
  },
];
