import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Cena 3D (React Three Fiber): useFrame muda objetos do three.js a cada quadro, fora do
    // ciclo de render do React — é o padrão do R3F, não um efeito colateral de render.
    // As sementes aleatórias do vapor são criadas uma única vez (useMemo).
    files: ["src/components/scene/**"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
