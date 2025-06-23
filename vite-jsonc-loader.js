import { createFilter, dataToEsm } from "@rollup/pluginutils";
import jsonminify from "jsonminify";

export default function jsonc(options = {}) {
  const filter = createFilter(options.include, options.exclude);
  const indent = "indent" in options ? options.indent : "\t";

  return {
    name: "jsonc",

    // eslint-disable-next-line no-shadow
    transform(code, id) {
      if (id.slice(-6) !== ".jsonc" || !filter(id)) return null;

      try {
        const parsed = JSON.parse(jsonminify(code));
        return {
          code: dataToEsm(parsed, {
            preferConst: options.preferConst,
            compact: options.compact,
            namedExports: options.namedExports,
            includeArbitraryNames: options.includeArbitraryNames,
            indent,
          }),
          map: { mappings: "" },
        };
      } catch (err) {
        const message = "Could not parse JSONC file";
        this.error({ message, id, cause: err });
        return null;
      }
    },
  };
};
