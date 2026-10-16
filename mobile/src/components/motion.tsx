// 움직임 — 웹 web/src/components/motion.tsx(GSAP)의 앱판. 값은 DESIGN.md §5 와 같다.
// GSAP 은 브라우저 DOM 요소를 움직이는 라이브러리라 앱 화면 요소에는 쓸 수 없다. 앱은 react-native-reanimated 로 같은 값을 낸다.
// "동작 줄이기"를 켠 기기에서는 Reanimated 가 들어오는 움직임을 건너뛴다(ReduceMotion.System). 숫자는 바로 최종 값이 된다.
import { Children, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import Animated, { Easing, FadeIn, FadeInDown, LayoutAnimationConfig } from "react-native-reanimated";
import { T } from "./ui";

/** 곡선 — 웹 power2.out 과 같은 성격(빠르게 출발, 천천히 멈춤) */
export const EASE = Easing.out(Easing.quad);

/** 아래에서 dy 만큼 올라오며 나타나는 들어오기 */
export const rise = (dy: number, ms: number, delay = 0) =>
  FadeInDown.duration(ms).delay(delay).easing(EASE).withInitialValues({ opacity: 0, transform: [{ translateY: dy }] });

/**
 * 화면 진입 — 바로 아래 자식들이 아래에서 8px 올라오며 차례로 나타난다 (0.32초, 0.06초 간격).
 * 처음 그릴 때 한 번만 — 불러오기가 끝나 내용이 바뀌어도 다시 하지 않는다 (2026-10-15 "탭 이동할 때 깜빡거린다").
 */
export function Enter({ children, style, gap = 12 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ gap }, style]}>
      {items.map((child, i) => (
        <Animated.View key={(child as { key?: string }).key ?? i} entering={mounted.current ? undefined : rise(8, 320, i * 60)}>
          {child}
        </Animated.View>
      ))}
    </View>
  );
}

/**
 * 숫자 변화 — 처음에는 0에서, 그다음부터는 이전 값에서 새 값까지 0.6초 동안 올라가며 바뀐다.
 * 스크린리더에는 최종 값만 읽힌다.
 */
export function CountUp({ value, format, size = 14, weight = "regular", color, style }: { value: number; format: (n: number) => string; size?: number; weight?: "regular" | "medium" | "semibold" | "bold"; color?: string; style?: StyleProp<TextStyle> }) {
  const [shown, setShown] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    let raf = 0;
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!alive) return;
      if (reduce || from === value) return setShown(value);
      const start = Date.now();
      const tick = () => {
        const t = Math.min(1, (Date.now() - start) / 600);
        const k = 1 - (1 - t) * (1 - t); // power2.out
        setShown(Math.round(from + (value - from) * k));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [value]);
  return (
    <T mono size={size} weight={weight} color={color} style={style} accessibilityLabel={format(value)}>
      {format(shown)}
    </T>
  );
}

/** 글자가 바뀔 때 — 새 글자가 아래에서 올라온다 (0.22초). 처음 그릴 때는 움직이지 않는다 (출퇴근 상태 "근무 중" → "퇴근함") */
export function SwapText({ text, size = 14, weight = "regular", color, mono = false }: { text: string; size?: number; weight?: "regular" | "medium" | "semibold" | "bold"; color?: string; mono?: boolean }) {
  return (
    <View style={{ overflow: "hidden" }}>
      <LayoutAnimationConfig skipEntering>
        <Animated.View key={text} entering={FadeInDown.duration(220).easing(EASE).withInitialValues({ opacity: 0, transform: [{ translateY: size * 1.4 }] })}>
          <T size={size} weight={weight} color={color} mono={mono}>{text}</T>
        </Animated.View>
      </LayoutAnimationConfig>
    </View>
  );
}

/** 드물게 나타나는 것(완료 상자·저장 알림) — 마운트될 때 아래에서 10px 올라오며 나타난다 (0.35초) */
export function Appear({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={rise(10, 350)} style={style}>
      {children}
    </Animated.View>
  );
}

/** 오류 문구처럼 가볍게 나타나는 것 — 투명도 0→1 + 위로 4px, 0.2초 (웹 .appear) */
export const fadeUp = rise(4, 200);
export { FadeIn };
