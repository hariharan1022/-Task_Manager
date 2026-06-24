import { useRef, useEffect, useState, useCallback } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { php } from "@codemirror/lang-php";
import { sql } from "@codemirror/lang-sql";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Copy, Check, Loader2 } from "lucide-react";

type Lang = "javascript" | "python" | "java" | "html" | "css" | "php" | "sql";

const LANG_EXT: Record<Lang, ReturnType<typeof javascript>> = {
  javascript: javascript(),
  python: python(),
  java: java(),
  html: html(),
  css: css(),
  php: php(),
  sql: sql(),
};

const LANG_BOILERPLATE: Record<Lang, string> = {
  javascript: '// Write your JavaScript code here\n\nconsole.log("Hello, World!");',
  python: '# Write your Python code here\n\nprint("Hello, World!")',
  java: '// Write your Java code here\n\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}',
  html: '<!-- Write your HTML here -->\n\n<h1>Hello, World!</h1>\n<p>Start coding...</p>',
  css: '/* Write your CSS here */\n\nbody {\n  background: #f0f0f0;\n  font-family: sans-serif;\n}',
  php: '<?php\n// Write your PHP code here\n\necho "Hello, World!";\n?>',
  sql: '-- Write your SQL here\n\nSELECT "Hello, World!" AS greeting;',
};

const SLUG_TO_LANG: Record<string, Lang> = {
  python: "python", java: "java", html: "html", css: "css",
  javascript: "javascript", php: "php", sql: "sql", mysql: "sql",
  django: "python", numpy: "python", pandas: "python", scipy: "python",
  matplotlib: "python",
};

interface CodeEditorProps {
  code?: string;
  language?: Lang;
  courseSlug?: string;
  readOnly?: boolean;
  showRun?: boolean;
  onChange?: (code: string) => void;
}

function simulatePython(code: string): string {
  const lines: string[] = [];
  for (const line of code.split("\n")) {
    const trimmed = line.trim();
    const printMatch = trimmed.match(/^print\s*\(\s*(.*?)\s*\)\s*$/);
    if (printMatch) {
      let content = printMatch[1];
      if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
        content = content.slice(1, -1);
      }
      content = content.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
      content = content.replace(/\{.*?\}/g, (m) => {
        const expr = m.slice(1, -1).trim();
        return `[${expr}]`;
      });
      lines.push(content);
      continue;
    }
    if (trimmed.startsWith("#") || trimmed.startsWith("//")) continue;
    if (trimmed.startsWith("import ") || trimmed.startsWith("from ")) continue;
  }
  return lines.length ? lines.join("\n") : "✓ Code executed successfully (no output)\n";
}

function simulateJava(code: string): string {
  const lines: string[] = [];
  for (const line of code.split("\n")) {
    const trimmed = line.trim();
    const printMatch = trimmed.match(/^System\.out\.(?:println|print)\s*\(\s*(.*?)\s*\)\s*;?\s*$/);
    if (printMatch) {
      let content = printMatch[1];
      if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
        content = content.slice(1, -1);
      }
      content = content.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
      lines.push(content);
    }
  }
  return lines.length ? lines.join("\n") : "✓ Code executed successfully (no output)\n";
}

function simulatePhp(code: string): string {
  const lines: string[] = [];
  for (const line of code.split("\n")) {
    const trimmed = line.trim();
    const echoMatch = trimmed.match(/^echo\s+(.*?)\s*;\s*$/);
    if (echoMatch) {
      let content = echoMatch[1];
      if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
        content = content.slice(1, -1);
      }
      content = content.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
      lines.push(content);
      continue;
    }
    const printMatch = trimmed.match(/^print\s*\(\s*(.*?)\s*\)\s*;\s*$/);
    if (printMatch) {
      let content = printMatch[1];
      if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
        content = content.slice(1, -1);
      }
      content = content.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
      lines.push(content);
    }
  }
  return lines.length ? lines.join("\n") : "✓ Code executed successfully (no output)\n";
}

function simulateSql(code: string): string {
  const lines: string[] = [];
  const selects = code.match(/SELECT\s+(.*?)\s+(?:FROM|WHERE|ORDER|GROUP|LIMIT|;|$)/gis);
  if (selects) {
    for (const sel of selects) {
      const cols = sel.replace(/^SELECT\s+/i, "").split(/FROM/i)[0].trim();
      if (cols !== "*" && !cols.includes(",")) {
        const m = cols.match(/"(.+?)"/);
        if (m) lines.push(m[1]);
        else lines.push(cols);
      } else {
        lines.push("Query executed successfully");
      }
    }
  }
  return lines.length ? lines.join("\n") : "Query OK, 0 rows affected\n";
}

function simulateCss(code: string): string {
  const rules = code.match(/([^{]+)\{([^}]+)\}/g);
  if (rules) {
    return `✓ CSS parsed successfully\n${rules.length} rule(s) found`;
  }
  return "✓ CSS parsed successfully\n";
}

export function CodeEditor({ code, language = "javascript", courseSlug, readOnly, showRun = true, onChange }: CodeEditorProps) {
  const lang = courseSlug ? (SLUG_TO_LANG[courseSlug] ?? language) : language;
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [output, setOutput] = useState<string>("");
  const [showOutput, setShowOutput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [outputTab, setOutputTab] = useState<"output" | "preview">("output");

  useEffect(() => {
    if (!editorRef.current) return;
    if (viewRef.current) { viewRef.current.destroy(); }
    const startCode = code ?? LANG_BOILERPLATE[lang];
    const state = EditorState.create({
      doc: startCode,
      extensions: [
        basicSetup,
        oneDark,
        LANG_EXT[lang],
        EditorView.editable.of(!readOnly),
        EditorView.updateListener.of((u) => {
          if (u.docChanged && onChange) onChange(u.state.doc.toString());
        }),
      ],
    });
    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;
    return () => { view.destroy(); viewRef.current = null; };
  }, [lang, readOnly]);

  const getCode = () => viewRef.current?.state.doc.toString() ?? "";

  const setEditorContent = useCallback((content: string) => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      changes: { from: 0, to: viewRef.current.state.doc.length, insert: content },
    });
  }, []);

  useEffect(() => {
    if (code !== undefined && viewRef.current) {
      const current = viewRef.current.state.doc.toString();
      if (current !== code) setEditorContent(code);
    }
  }, [code, setEditorContent]);

  const handleRun = () => {
    setIsRunning(true);
    setError(null);
    const c = getCode();

    try {
      if (lang === "javascript") {
        const logs: string[] = [];
        const mockConsole = { log: (...args: unknown[]) => logs.push(args.map(String).join(" ")) };
        const fn = new Function("console", c);
        fn(mockConsole);
        setOutput(logs.length ? logs.join("\n") : "✓ Code executed successfully (no output)\n");
      } else if (lang === "html") {
        setOutputTab("preview");
        setOutput(c);
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.srcdoc = c;
          }
        }, 50);
      } else if (lang === "python") {
        setOutput(simulatePython(c));
      } else if (lang === "java") {
        setOutput(simulateJava(c));
      } else if (lang === "php") {
        setOutput(simulatePhp(c));
      } else if (lang === "sql") {
        setOutput(simulateSql(c));
      } else if (lang === "css") {
        setOutput(simulateCss(c));
      } else {
        setOutput("✓ Code executed successfully (no output)\n");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setOutput(msg);
    }

    setShowOutput(true);
    setIsRunning(false);
  };

  const handleReset = () => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      changes: { from: 0, to: viewRef.current.state.doc.length, insert: LANG_BOILERPLATE[lang] },
    });
    setOutput("");
    setShowOutput(false);
    setError(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-3 py-2 bg-[#252526] border-b border-white/10">
        <span className="text-[11px] text-gray-400 font-mono uppercase tracking-wider">{lang}</span>
        <div className="flex items-center gap-1">
          {showRun && (
            <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30"
              onClick={handleRun} disabled={isRunning}>
              {isRunning ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
              Run
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1 text-gray-400 hover:text-white" onClick={handleReset}>
            <RotateCcw className="size-3" /> Reset
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1 text-gray-400 hover:text-white" onClick={handleCopy}>
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
      <div ref={editorRef} className="text-sm overflow-x-auto max-w-full" />
      {showOutput && (
        <div className="border-t border-white/10">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-500 font-mono uppercase">Output</span>
              {lang === "html" && (
                <div className="flex gap-2">
                  <button onClick={() => setOutputTab("output")}
                    className={`text-[10px] font-mono uppercase ${outputTab === "output" ? "text-emerald-400" : "text-gray-500 hover:text-white"}`}>
                    Code
                  </button>
                  <button onClick={() => setOutputTab("preview")}
                    className={`text-[10px] font-mono uppercase ${outputTab === "preview" ? "text-emerald-400" : "text-gray-500 hover:text-white"}`}>
                    Preview
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setShowOutput(false)} className="text-[10px] text-gray-500 hover:text-white">&times;</button>
          </div>
          {lang === "html" && outputTab === "preview" ? (
            <iframe ref={iframeRef} sandbox="allow-scripts" className="w-full bg-white min-h-[200px] rounded-b-xl" title="preview" />
          ) : (
            <pre className={`px-4 py-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap ${
              error ? "text-red-400 bg-red-950/20" : "text-green-400"
            } bg-[#121212]`}>{output}</pre>
          )}
        </div>
      )}
    </div>
  );
}
