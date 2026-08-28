import React from "react";

// Cerca de erro: um pedaço quebrado não pode levar o sistema inteiro junto.
//
// POR QUE EXISTE
// Sem isto, qualquer exceção durante o render do React desmonta a árvore toda e
// o que sobra é uma TELA BRANCA — sem mensagem, sem pista, sem caminho de volta.
// Foi o que aconteceu ao abrir o Pipeline em 28/08/2026: o sistema sumiu e não
// havia como saber de onde vinha o erro sem abrir o console do navegador.
//
// A cerca troca a tela branca por três coisas: dizer o que quebrou, dar o botão
// de recarregar e mostrar a mensagem técnica para quem for consertar. O resto do
// sistema continua de pé — quem estava no CRM ainda consegue ir para outra aba.

export default class CercaDeErro extends React.Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro, info) {
    // Vai para o console para quem estiver depurando; não some no silêncio.
    console.error(`[Erro em ${this.props.area || "tela"}]`, erro, info?.componentStack);
  }

  render() {
    if (!this.state.erro) return this.props.children;

    const msg = String(this.state.erro?.message || this.state.erro);
    // Chunk faltando tem causa e solução próprias: veio de um deploy novo com a
    // página antiga aberta, e recarregar resolve.
    const ehChunk = /dynamically imported module|Loading chunk|Importing a module script failed/i.test(msg);

    return (
      <div style={{
        background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px",
        padding: "16px", margin: "10px 0", color: "#7f1d1d",
      }}>
        <div style={{ fontSize: "13px", fontWeight: "800", marginBottom: "6px" }}>
          {ehChunk ? "Esta parte não carregou (o sistema foi atualizado)" : `Algo quebrou em ${this.props.area || "esta tela"}`}
        </div>
        <div style={{ fontSize: "11px", lineHeight: 1.5, marginBottom: "10px" }}>
          {ehChunk
            ? "Sua página está com uma versão antiga em cache. Recarregar resolve — nada foi perdido."
            : "O resto do sistema continua funcionando: dá para trocar de aba normalmente. Se repetir, mande esta mensagem para o suporte."}
        </div>
        <div style={{
          fontSize: "10px", fontFamily: "monospace", background: "#fff", border: "1px solid #fecaca",
          borderRadius: "6px", padding: "7px 9px", marginBottom: "10px", wordBreak: "break-word",
        }}>
          {msg.slice(0, 300)}
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => window.location.reload()}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#dc2626", color: "#fff", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
            Recarregar
          </button>
          <button onClick={() => this.setState({ erro: null })}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #fecaca", background: "transparent", color: "#7f1d1d", fontSize: "11px", cursor: "pointer" }}>
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }
}
