import React, { useEffect, useState } from "react";
import { fetchTasks, createTask, fetchStats, fetchMotivation } from "../api";
import SortWizard from "./SortWizard";
import { motion, AnimatePresence } from "framer-motion";

interface HomeProps {
  telegramId: string;
  name?: string;
}

const Home: React.FC<HomeProps> = ({ telegramId, name }) => {
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [calendarTasks, setCalendarTasks] = useState<any[]>([]);
  const [inboxTasks, setInboxTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [motivation, setMotivation] = useState<string>("");

  const [newText, setNewText] = useState("");
  const [isKey, setIsKey] = useState(false);
  const [isGolden, setIsGolden] = useState(false);
  const [collaboratorsInput, setCollaboratorsInput] = useState("");

  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const load = async () => {
    const [today, calendar, inbox, st, m] = await Promise.all([
      fetchTasks(telegramId, "today"),
      fetchTasks(telegramId, "calendar"),
      fetchTasks(telegramId, "inbox"),
      fetchStats(telegramId),
      fetchMotivation(telegramId),
    ]);
    setTodayTasks(today);
    setCalendarTasks(calendar);
    setInboxTasks(inbox);
    setStats(st);
    if (m?.text) setMotivation(m.text);
  };

  useEffect(() => {
    load();
  }, []);

  const addTask = async () => {
    if (!newText.trim()) return;
    const collaborators = collaboratorsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await createTask(telegramId, name, {
      text: newText,
      is_key: isKey,
      is_golden: isGolden,
      status: "inbox",
      collaborators,
    });
    setNewText("");
    setIsKey(false);
    setIsGolden(false);
    setCollaboratorsInput("");
    await load();
  };

  const inboxProgress =
    inboxTasks.length === 0
      ? 100
      : Math.round(
          ((todayTasks.length + calendarTasks.length) /
            (todayTasks.length + calendarTasks.length + inboxTasks.length)) *
            100
        );

  return (
    <div
      style={{
        padding: 16,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h2>Сегодня</h2>
      <ul>
        <AnimatePresence>
          {todayTasks.map((t) => (
            <motion.li
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {t.text} {t.is_key ? "⭐" : ""}{" "}
              {t.sorted_at && (
                <small>
                  (распределено:{" "}
                  {new Date(t.sorted_at).toLocaleString()})
                </small>
              )}{" "}
              <button onClick={() => setSelectedTask(t)}>Сортировать</button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <h2>Календарь</h2>
      <ul>
        <AnimatePresence>
          {calendarTasks.map((t) => (
            <motion.li
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {t.text}{" "}
              {t.due_datetime && (
                <small>
                  (когда: {new Date(t.due_datetime).toLocaleString()})
                </small>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <h2>Все задачи (Inbox)</h2>
      <div>Прогресс опустошения головы: {inboxProgress}%</div>
      <ul>
        <AnimatePresence>
          {inboxTasks.map((t) => (
            <motion.li
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {t.text}{" "}
              <small>
                добавлено:{" "}
                {t.created_at
                  ? new Date(t.created_at).toLocaleString()
                  : "время неизвестно"}
              </small>{" "}
              <button onClick={() => setSelectedTask(t)}>
                Мастер сортировки
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <h3>Добавить в Inbox</h3>
      <input
        placeholder="Текст задачи"
        value={newText}
        onChange={(e) => setNewText(e.target.value)}
      />
      <label>
        <input
          type="checkbox"
          checked={isKey}
          onChange={(e) => setIsKey(e.target.checked)}
        />
        Ключевая
      </label>
      <label>
        <input
          type="checkbox"
          checked={isGolden}
          onChange={(e) => setIsGolden(e.target.checked)}
        />
        Золотые часы
      </label>
      <input
        placeholder="Соисполнители (telegram_id через запятую)"
        value={collaboratorsInput}
        onChange={(e) => setCollaboratorsInput(e.target.value)}
      />
      <button onClick={addTask}>Добавить</button>

      {stats && (
        <div style={{ marginTop: 16 }}>
          <div>
            Сегодня выполнено: {stats.today_done} (ключевых:{" "}
            {stats.today_key_done})
          </div>
          <div>
            За неделю: {stats.week_done} (ключевых:{" "}
            {stats.week_key_done})
          </div>
        </div>
      )}

      {motivation && (
        <div style={{ marginTop: 16, fontStyle: "italic" }}>
          {motivation}
        </div>
      )}

      {selectedTask && (
        <SortWizard
          telegramId={telegramId}
          task={selectedTask}
          onClose={async () => {
            setSelectedTask(null);
            await load();
          }}
        />
      )}
    </div>
  );
};

export default Home;
