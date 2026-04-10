import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
    const mql = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
    } else {
      mql.addListener(onChange);
    }

    setIsMobile(mql.matches);

    return () => {
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", onChange);
      } else {
        mql.removeListener(onChange);
      }
    };
  }, []);

  return isMobile;
}
