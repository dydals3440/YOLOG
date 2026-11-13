import vm from "node:vm";

export interface InjectedScript {
  async?: boolean;
  src?: string;
}

/** 빌드된 GA 초기화 스크립트를 네트워크 없이 실행하는 최소 브라우저 대역이다. */
export function runGaBootstrap(bootstrap: string, hostname: string, repetitions = 1) {
  const scripts: InjectedScript[] = [];
  const window: { dataLayer?: unknown[][] } = {};
  const context = vm.createContext({
    window,
    URL,
    location: {
      hostname,
      href: `https://${hostname}/post/example?utm_source=test&email=private#heading`,
    },
    document: {
      createElement: (): InjectedScript => ({}),
      head: { appendChild: (script: InjectedScript) => scripts.push(script) },
    },
  });

  for (let count = 0; count < repetitions; count += 1) {
    vm.runInContext(bootstrap, context, { timeout: 1000 });
  }

  const configs = (window.dataLayer ?? [])
    .map((args) => Array.from(args))
    .filter(([command]) => command === "config");

  return { scripts, configs };
}
