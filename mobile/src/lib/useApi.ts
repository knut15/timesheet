import { useEffect, useState } from "react";

/**
 * 화면이 열릴 때, key 가 바뀔 때, reload() 를 부를 때 데이터를 읽는다. 웹 web/src/lib/useApi.ts 와 같다.
 * key 에는 load 가 쓰는 값을 모두 담는다.
 */
export function useApi<T>(load: () => Promise<{ data?: T; error?: unknown }>, key: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    load()
      .then((r) => {
        if (!alive) return;
        setError(r.error ?? null);
        if (r.data !== undefined) setData(r.data);
      })
      .catch((e: unknown) => alive && setError(e));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load 가 쓰는 값은 key 에 담겨 있다
  }, [key, version]);

  return { data, error, reload: () => setVersion((v) => v + 1) };
}
