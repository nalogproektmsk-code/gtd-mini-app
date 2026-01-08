import React, { useState } from "react";
import { sortTask } from "../api";
import { motion } from "framer-motion";

interface Props {
  telegramId: string;
  task: any;
  onClose: () => void;
}

const SortWizard: React.FC<Props> = ({ telegramId, task, onClose }) => {
  const [step, setStep] = useState(1);

  const [needAction, setNeedAction] = useState<boolean | null>(null);
  const [urgent, setUrgent] = useState<boolean | null>(null);
  const [doByMe, setDoByMe] = useState<boolean | null>(null);
  const [oneStep, setOneStep] = useState<boolean | null>(null);
  const [canDoNow, setCanDoNow] = useState<boolean | null>(null);
  const [hasDatetime, setHasDatetime] = useState<boolean | null>(null);

  const [datetime, setDatetime] = useState("");
  const [responsible, setResponsible] = useState("");
  const [projectOutcome, setProjectOutcome] = useState("");
  const [projectSteps, setProjectSteps] = useState("");
  const [projectFirstStep, setProjectFirstStep] = useState("");

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const finish = async () => {
    const payload: any = {
      need_action: needAction ?? false,
      urgent_this_week: urgent,
      do_by_me: doByMe,
      one_step: oneStep,
      can_do_now: canDoNow,
      has_datetime: hasDatetime,
      datetime: datetime ? new Date(datetime).toISOString() : null,
      responsible: responsible || null,
      project_outcome: projectOutcome || null,
      project_steps: projectSteps || null,
      project_first_step: projectFirstStep || null,
    };
    await sortTask(telegramId, task.id, payload);
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <p>Нужно ли с этим что-то делать?</p>
            <button
              onClick={() => {
                setNeedAction(false);
                finish();
              }}
            >
              Нет
            </button>
            <button
              onClick={() => {
                setNeedAction(true);
                next();
              }}
            >
              Да
            </button>
          </>
        );
      case 2:
        return (
          <>
            <p>Это нужно срочно (на этой неделе)?</p>
            <button
              onClick={() => {
                setUrgent(false);
                finish();
              }}
            >
              Нет
            </button>
            <button
              onClick={() => {
                setUrgent(true);
                next();
              }}
            >
              Да
            </button>
            <button onClick={back}>Назад</button>
          </>
        );
      case 3:
        return (
          <>
            <p>Это нужно делать тебе?</p>
            <button
              onClick={() => {
                setDoByMe(false);
                next();
              }}
            >
              Нет
            </button>
            <button
              onClick={() => {
                setDoByMe(true);
                next();
              }}
            >
              Да
            </button>
            <button onClick={back}>Назад</button>
          </>
        );
      case 4:
        if (doByMe === false) {
          return (
            <>
              <p>Укажи, кому поручить задачу:</p>
              <input
                placeholder="Ответственный"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
              />
              <button onClick={finish}>Сохранить в лист поручений</button>
              <button onClick={back}>Назад</button>
            </>
          );
        }
        return (
          <>
            <p>Это задача в один шаг?</p>
            <button
              onClick={() => {
                setOneStep(false);
                next();
              }}
            >
              Нет
            </button>
            <button
              onClick={() => {
                setOneStep(true);
                next();
              }}
            >
              Да
            </button>
            <button onClick={back}>Назад</button>
          </>
        );
      case 5:
        if (oneStep === false) {
          return (
            <>
              <p>Это проект. Опиши его:</p>
              <textarea
                placeholder="Конечная цель проекта"
                value={projectOutcome}
                onChange={(e) => setProjectOutcome(e.target.value)}
              />
              <textarea
                placeholder="Список шагов (по одному в строке)"
                value={projectSteps}
                onChange={(e) => setProjectSteps(e.target.value)}
              />
              <p>Выбери первый шаг из списка:</p>
              <select
                value={projectFirstStep}
                onChange={(e) => setProjectFirstStep(e.target.value)}
              >
                <option value="">Не выбран</option>
                {projectSteps
                  .split("\n")
                  .filter((s) => s.trim())
                  .map((s, idx) => (
                    <option key={idx} value={s}>
                      {s}
                    </option>
                  ))}
              </select>
              <button
                onClick={finish}
                disabled={!projectOutcome || !projectFirstStep}
              >
                Создать проект
              </button>
              <button onClick={back}>Назад</button>
            </>
          );
        }
        return (
          <>
            <p>Можешь сделать это сейчас (2–5 минут)?</p>
            <button
              onClick={() => {
                setCanDoNow(true);
                finish();
              }}
            >
              Да
            </button>
            <button
              onClick={() => {
                setCanDoNow(false);
                next();
              }}
            >
              Нет
            </button>
            <button onClick={back}>Назад</button>
          </>
        );
      case 6:
        return (
          <>
            <p>У задачи есть конкретная дата/время?</p>
            <button
              onClick={() => {
                setHasDatetime(false);
                finish();
              }}
            >
              Нет, просто в «Сегодня»
            </button>
            <button
              onClick={() => {
                setHasDatetime(true);
                next();
              }}
            >
              Да
            </button>
            <button onClick={back}>Назад</button>
          </>
        );
      case 7:
        return (
          <>
            <p>Укажи дату и время:</p>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
            />
            <button onClick={finish}>Сохранить в календарь</button>
            <button onClick={back}>Назад</button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(3px)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.2 }}
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 16,
          width: "90%",
          boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        }}
      >
        <h3>Мастер сортировки</h3>
        <p>
          <b>{task.text}</b>
        </p>
        {renderStep()}
        <button onClick={onClose} style={{ marginTop: 8 }}>
          Закрыть
        </button>
      </motion.div>
    </div>
  );
};

export default SortWizard;
