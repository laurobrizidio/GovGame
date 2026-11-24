import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fundo: '#F1EEE6', cartao: { DEFAULT: '#FBFAF6', alt: '#F6F3EB' },
        painel: '#F4F2EA', trilho: '#EAE6DA',
        linha: { DEFAULT: '#D9D4C7', suave: '#E4E0D3' },
        cinza: { trilho: '#D5DAD3', zona: '#C4C9C2', medio: '#9CA39B', barra: '#8A8F87' },
        tinta: '#15211C', corpo: '#3A4540', suave: '#56615B',
        verde: { DEFAULT: '#0E5A3C', escuro: '#0A4A30', zona: '#A9CDB8', claro: '#DCEBE2', faixa: '#CFE3D6' },
        ambar: { DEFAULT: '#E3A21A', medio: '#C9961A', texto: '#7A5200', nota: '#5A4200',
          faixa: '#F4DFA8', fundo: '#FFF6DE', 'nota-fundo': '#FFF4D6' },
        vermelho: { DEFAULT: '#B8322A', escuro: '#7A2B25', final: '#7A1F18', fundo: '#F7E3E0',
          linha: '#FCEFED', borda: '#E7B3AE', faixa: '#EDC3BE', claro: '#FFB4AB', 'claro-2': '#FFD9D4' },
        topo: { DEFAULT: '#15211C', 'texto-2': '#C9D1CB', 'texto-3': '#B8C2BB', trilho: '#3B4A42' },
      },
      fontFamily: {
        titulo: ['"Bricolage Grotesque Variable"', 'sans-serif'],
        texto: ['"IBM Plex Sans"', 'sans-serif'],
      },
    },
  },
} satisfies Config
