import { useState, useEffect } from "react";
import "./App.css";

function App() {

  // Task list — initialised from localStorage
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("birthdayTasks");
    return saved ? JSON.parse(saved) : [];
  });

  // Input field value
  const [text, setText] = useState("");

  // Feedback toast message
  const [feedback, setFeedback] = useState("");

  // Persist tasks whenever they change
  useEffect(() => {
    localStorage.setItem("birthdayTasks", JSON.stringify(tasks));
  }, [tasks]);

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 2200);
  };

  // Add a task
  const addTask = () => {
    if (text.trim() === "") {
      showFeedback("⚠️ Please type a task before adding!");
      return;
    }
    const newTask = { id: crypto.randomUUID(), name: text.trim(), done: false };
    setTasks([...tasks, newTask]);
    setText("");
    showFeedback("🎉 Task added successfully!");
  };

  // Delete a task
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
    showFeedback("🗑️ Task removed.");
  };

  // Toggle done/undone
  const toggleTask = (id) => {
    setTasks(
      tasks.map(task =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") addTask();
  };

  const pending = tasks.filter(t => !t.done);
  const completed = tasks.filter(t => t.done);
  const progress = tasks.length > 0
    ? Math.round((completed.length / tasks.length) * 100)
    : 0;

  return (
    <div className="page">

      {/* ── Header Section ── */}
      <header className="header-section">
        <div className="header-icon">🎂</div>
        <h1>Birthday Party Planner</h1>
        <p className="subtitle">
          Organise every detail of your perfect celebration — one task at a time.
        </p>
      </header>

      {/* ── Input Section ── */}
      <section className="input-section">
        <h2 className="section-title">✏️ Add a New Task</h2>
        <p className="section-hint">
          Type a task below and press <kbd>Enter</kbd> or click{" "}
          <strong>Add Task</strong> to begin planning.
        </p>
        <div className="input-area">
          <input
            type="text"
            placeholder="e.g. Order the birthday cake, send invitations…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="New task"
          />
          <button
            className="btn btn-primary"
            onClick={addTask}
            title="Add this task to your list"
          >
            + Add Task
          </button>
        </div>
        {feedback && (
          <div className="feedback-toast" role="status">
            {feedback}
          </div>
        )}
      </section>

      {/* ── Tasks Section — two columns ── */}
      <section className="tasks-section">

        {/* Pending column */}
        <div className="column column-pending">
          <h2 className="column-title">
            📋 To Do{" "}
            <span className="badge badge-pending">{pending.length}</span>
          </h2>

          {pending.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">🌟</p>
              <p>No pending tasks!</p>
              <p>Add your first task above to start planning.</p>
            </div>
          ) : (
            <ul className="task-list">
              {pending.map(task => (
                <li key={task.id} className="task-item">
                  <span
                    className="task-name"
                    onClick={() => toggleTask(task.id)}
                    title="Click to mark as done"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && toggleTask(task.id)}
                  >
                    {task.name}
                  </span>
                  <div className="task-actions">
                    <button
                      className="btn btn-done"
                      onClick={() => toggleTask(task.id)}
                      title="Mark as completed"
                    >
                      ✓ Done
                    </button>
                    <button
                      className="btn btn-delete"
                      onClick={() => deleteTask(task.id)}
                      title="Remove this task"
                      aria-label="Delete task"
                    >
                      🗑
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Completed column */}
        <div className="column column-completed">
          <h2 className="column-title">
            ✅ Completed{" "}
            <span className="badge badge-done">{completed.length}</span>
          </h2>

          {completed.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">🎯</p>
              <p>Nothing completed yet.</p>
              <p>Mark a task as done to see it here.</p>
            </div>
          ) : (
            <ul className="task-list">
              {completed.map(task => (
                <li key={task.id} className="task-item task-done">
                  <span
                    className="task-name"
                    onClick={() => toggleTask(task.id)}
                    title="Click to move back to To Do"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && toggleTask(task.id)}
                  >
                    {task.name}
                  </span>
                  <div className="task-actions">
                    <button
                      className="btn btn-undo"
                      onClick={() => toggleTask(task.id)}
                      title="Move back to To Do"
                    >
                      ↩ Undo
                    </button>
                    <button
                      className="btn btn-delete"
                      onClick={() => deleteTask(task.id)}
                      title="Remove this task"
                      aria-label="Delete task"
                    >
                      🗑
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </section>

      {/* ── Progress Footer ── */}
      {tasks.length > 0 && (
        <footer className="footer-section">
          <p>
            {completed.length} of {tasks.length} task
            {tasks.length !== 1 ? "s" : ""} completed — {progress}%
          </p>
          <div className="progress-bar" role="progressbar" aria-label="Task completion progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </footer>
      )}

    </div>
  );
}

export default App;