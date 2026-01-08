const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export async function fetchTasks(telegramId: string, status?: string) {
  const params = new URLSearchParams({ telegram_id: telegramId });
  if (status) params.append("status", status);
  const res = await fetch(`${BACKEND_URL}/tasks?` + params.toString());
  return res.json();
}

export async function createTask(
  telegramId: string,
  name: string | undefined,
  data: any
) {
  const params = new URLSearchParams({ telegram_id: telegramId });
  if (name) params.append("name", name);
  const res = await fetch(`${BACKEND_URL}/tasks?` + params.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function sortTask(
  telegramId: string,
  taskId: number,
  data: any
) {
  const params = new URLSearchParams({ telegram_id: telegramId });
  const res = await fetch(
    `${BACKEND_URL}/tasks/${taskId}/sort?` + params.toString(),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }
  );
  return res.json();
}

export async function fetchStats(telegramId: string) {
  const params = new URLSearchParams({ telegram_id: telegramId });
  const res = await fetch(`${BACKEND_URL}/stats/weekly?` + params.toString());
  return res.json();
}

export async function fetchMotivation(telegramId: string) {
  const params = new URLSearchParams({ telegram_id: telegramId });
  const res = await fetch(`${BACKEND_URL}/stats/motivation?` + params.toString());
  return res.json();
}
