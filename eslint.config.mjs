import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // El patrón de data fetching async en useEffect es válido en este proyecto.
      // La regla react-hooks/set-state-in-effect es demasiado estricta para este caso de uso.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
