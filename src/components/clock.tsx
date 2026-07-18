"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "long",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function Clock() {
  // Só mostra depois de montar no cliente, para não divergir do HTML do
  // servidor (o horário do servidor e o do navegador não batem).
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);

    return () => clearInterval(timer);
  }, []);

  if (!now) {
    return <div className="h-9" aria-hidden="true" />;
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="hidden items-center gap-1.5 text-stone-500 sm:flex">
        <CalendarDays className="size-4 text-brand-500" aria-hidden="true" />
        <span className="capitalize">{dateFormatter.format(now)}</span>
      </span>
      <span className="flex items-center gap-1.5 font-medium text-stone-700 tabular-nums">
        <Clock3 className="size-4 text-brand-500" aria-hidden="true" />
        {timeFormatter.format(now)}
      </span>
    </div>
  );
}
