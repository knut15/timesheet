// 알림 전용 서비스 워커. 모바일 Chrome 은 페이지에서 new Notification() 을 막으므로 여기서 띄운다.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// 알림을 누르면 열려 있는 앱 탭으로 돌아가고, 없으면 새로 연다.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if ("focus" in c) return c.focus();
      return self.clients.openWindow("/");
    }),
  );
});
