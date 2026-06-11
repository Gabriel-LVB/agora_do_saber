import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error:null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Ágora render error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-5">
        <section className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 p-7 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-500 mb-3">Ágora 2.0</p>
          <h1 className="font-serif text-2xl font-bold mb-3">Não consegui abrir esta tela.</h1>
          <p className="text-sm leading-relaxed text-gray-400 mb-6">
            Seus dados não foram apagados. Recarregue a página para tentar novamente.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full rounded-xl bg-yellow-600 px-4 py-3 font-bold text-white hover:bg-yellow-700"
          >
            Recarregar página
          </button>
          <details className="mt-5 text-xs text-gray-500">
            <summary className="cursor-pointer font-bold">Detalhes técnicos</summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-950 p-3">
              {this.state.error?.message || 'Erro desconhecido'}
            </pre>
          </details>
        </section>
      </main>
    );
  }
}
