// Marca do projeto (caixa isométrica com as peças A/B/C entrando), na paleta roxa da página.
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 220" className={className} aria-hidden="true" focusable="false">
      <rect x="-6" y="176" width="150" height="6" rx="3" fill="#2a1d3d" />
      <polygon points="4,164 22,172 4,180" fill="#e879f9" />
      <polygon points="26,161 48,172 26,183" fill="#a970ff" />
      <polygon points="52,158 78,172 52,186" fill="#c58cff" />
      <polygon points="130,25 204,68 130,110 56,68" fill="#e9dcff" />
      <polygon points="56,68 130,110 130,195 56,152" fill="#8b3dff" />
      <polygon points="204,68 204,152 130,195 130,110" fill="#4a1a9e" />
      <polygon points="130,25 167,46.5 93,89.5 56,68" fill="#f6f1ff" opacity="0.5" />
    </svg>
  );
}
