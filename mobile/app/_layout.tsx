// 앱 최상단 — 글꼴·기기 설정을 읽고 로그인 상태를 되살린다. 화면은 전부 스택 위에 올라간다.
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { bootSession, useSession } from "@/auth/session";
import { loadDeviceSettings } from "@/lib/device";
import "@/lib/geofence"; // 백그라운드 위치 작업은 앱이 깨어날 때 가장 먼저 등록돼 있어야 한다
import { C } from "@/theme";

export default function RootLayout() {
  const [fonts] = useFonts({
    "Pretendard-Regular": require("../assets/fonts/Pretendard-Regular.otf"),
    "Pretendard-Medium": require("../assets/fonts/Pretendard-Medium.otf"),
    "Pretendard-SemiBold": require("../assets/fonts/Pretendard-SemiBold.otf"),
    "Pretendard-Bold": require("../assets/fonts/Pretendard-Bold.otf"),
    "GeistMono-Regular": require("../assets/fonts/GeistMono-Regular.ttf"),
  });
  const [device, setDevice] = useState(false);
  const session = useSession();
  useEffect(() => {
    void bootSession();
    void loadDeviceSettings().finally(() => setDevice(true));
  }, []);
  const ready = fonts && device && session.status !== "unknown";
  // 글꼴·로그인 확인이 끝나기 전에는 바탕색만 — 흰 화면이 번쩍이지 않게
  if (!ready) return <View style={{ flex: 1, backgroundColor: C.background }} />;
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.background }, animation: "fade" }} />
    </SafeAreaProvider>
  );
}
