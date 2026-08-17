import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

const FONT_DISPLAY = "'Manrope', system-ui, sans-serif";

/* Se qualquer tela quebrar ao renderizar, a pessoa vê uma mensagem
   amigável dentro do próprio app (com os dados preservados) em vez da
   página de erro do navegador. */
export default class ErroTela extends React.Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro) {
    if (typeof console !== "undefined") console.error(erro);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.erro) {
      this.setState({ erro: null });
    }
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div className="flex flex-col items-center justify-center text-center py-10">
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
          <AlertTriangle size={20} className="text-neutral-500" />
        </div>
        <h2
          className="text-[17px] font-extrabold text-neutral-900 mb-2"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          Algo travou nesta tela
        </h2>
        <p className="text-[13.5px] text-neutral-500 leading-relaxed mb-5 max-w-[16rem]">
          Suas respostas continuam salvas. Toque abaixo para carregar a tela de novo.
        </p>
        <button
          onClick={() => this.setState({ erro: null })}
          className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-[14px] font-bold text-neutral-900"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          <RotateCcw size={15} /> Tentar de novo
        </button>
      </div>
    );
  }
}
