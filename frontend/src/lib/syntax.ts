/**
 * Minimal, dependency-free Python tokenizer used purely for display.
 * It never affects what is executed.
 */

export type TokenKind =
  | "plain"
  | "keyword"
  | "string"
  | "number"
  | "comment"
  | "builtin"
  | "def"
  | "deco";

export interface Token {
  kind: TokenKind;
  text: string;
}

const KEYWORDS = new Set([
  "False", "None", "True", "and", "as", "assert", "async", "await", "break", "class",
  "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global",
  "if", "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise", "return",
  "try", "while", "with", "yield",
]);

const BUILTINS = new Set([
  "print", "len", "range", "int", "float", "str", "list", "dict", "set", "tuple", "sum",
  "min", "max", "abs", "sorted", "enumerate", "zip", "map", "filter", "bool", "round",
  "isinstance", "open", "input", "type", "reversed", "any", "all",
]);

const TOKEN_RE =
  /(#.*$)|((?:[rRbBfFuU]{0,2})(?:"""|'''))|((?:[rRbBfFuU]{0,2})"(?:\\.|[^"\\])*"?|(?:[rRbBfFuU]{0,2})'(?:\\.|[^'\\])*'?)|(\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(@[A-Za-z_][\w.]*)|([A-Za-z_]\w*)|(\s+)|(.)/g;

/**
 * Tokenize Python source into per-line token lists.
 * Handles triple-quoted strings that span multiple lines.
 */
export function highlightPython(code: string): Token[][] {
  const lines = code.split("\n");
  const result: Token[][] = [];
  let tripleDelim: string | null = null;

  for (const line of lines) {
    const tokens: Token[] = [];
    let rest = line;

    // Continue an open triple-quoted string
    if (tripleDelim) {
      const end = rest.indexOf(tripleDelim);
      if (end === -1) {
        result.push([{ kind: "string", text: rest }]);
        continue;
      }
      tokens.push({ kind: "string", text: rest.slice(0, end + 3) });
      rest = rest.slice(end + 3);
      tripleDelim = null;
    }

    let prevWord = "";
    TOKEN_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while (rest.length > 0 && (match = TOKEN_RE.exec(rest)) !== null) {
      const [text, comment, tripleStart, str, num, deco, word, space] = match;
      if (match.index !== undefined && text === "") break;

      if (comment) {
        tokens.push({ kind: "comment", text });
      } else if (tripleStart) {
        const delim = tripleStart.slice(-3);
        const after = rest.slice(match.index + text.length);
        const close = after.indexOf(delim);
        if (close === -1) {
          tokens.push({ kind: "string", text: text + after });
          tripleDelim = delim;
          TOKEN_RE.lastIndex = rest.length;
        } else {
          const full = text + after.slice(0, close + 3);
          tokens.push({ kind: "string", text: full });
          TOKEN_RE.lastIndex = match.index + full.length;
        }
      } else if (str) {
        tokens.push({ kind: "string", text });
      } else if (num) {
        tokens.push({ kind: "number", text });
      } else if (deco) {
        tokens.push({ kind: "deco", text });
      } else if (word) {
        if (KEYWORDS.has(word)) {
          tokens.push({ kind: "keyword", text });
        } else if (prevWord === "def" || prevWord === "class") {
          tokens.push({ kind: "def", text });
        } else if (BUILTINS.has(word)) {
          tokens.push({ kind: "builtin", text });
        } else {
          tokens.push({ kind: "plain", text });
        }
        prevWord = word;
        continue;
      } else {
        tokens.push({ kind: "plain", text });
        if (!space) prevWord = "";
        continue;
      }
      prevWord = "";
    }

    result.push(tokens);
  }

  return result;
}
