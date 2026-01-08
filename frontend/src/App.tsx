import React, { useEffect, useState } from "react";
import Home from "./components/Home";

declare global {
  interface Window {
    Telegram: any;
  }
}

const App: React.FC = () => {
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [name, setName] = useState<string | undefined>();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setTelegramId(String(user.id));
        setName(user.first_name);
      }
    } else {
      setTelegramId("dev-user-1");
      setName("Dev User");
    }
  }, []);

  if (!telegramId) {
    return <div style={{ padding: 16 }}>Загрузка...</div>;
  }

  return <Home telegramId={telegramId} name={name} />;
};

export default App;
