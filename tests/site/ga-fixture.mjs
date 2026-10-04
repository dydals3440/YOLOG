import vm from "node:vm";

/** 생성된 GA 태그를 실행하는 최소 브라우저 대역. 실제 네트워크 요청은 보내지 않는다. */
export function executeBootstrap(bootstrap, hostname, repetitions = 1) {
  const scripts = [];
  const window = {};
  const context = vm.createContext({
    window,
    URL,
    location: {
      hostname,
      href: `https://${hostname}/post/example?utm_source=test&email=private#heading`,
    },
    document: {
      createElement: () => ({}),
      head: { appendChild: (script) => scripts.push(script) },
    },
  });
  for (let i = 0; i < repetitions; i++) {
    vm.runInContext(bootstrap, context, { timeout: 1000 });
  }
  return { scripts, configs: window.dataLayer?.filter((args) => args[0] === "config") ?? [] };
}
