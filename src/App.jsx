import { useState, useEffect } from "react";
import "./App.css";

function App() {

  // 任务列表
  const [tasks, setTasks] = useState([]);

  // 输入框内容
  const [text, setText] = useState("");

  // 页面加载时读取本地数据
  useEffect(() => {
    const saved = localStorage.getItem("birthdayTasks");
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  // 当 tasks 改变时保存到浏览器
  useEffect(() => {
    localStorage.setItem("birthdayTasks", JSON.stringify(tasks));
  }, [tasks]);

  // 添加任务
  const addTask = () => {

    if (text.trim() === "") return;

    const newTask = {
      id: Date.now(),
      name: text,
      done: false
    };

    setTasks([...tasks, newTask]);
    setText("");
  };

  // 删除任务
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // 切换完成状态
  const toggleTask = (id) => {
    setTasks(
      tasks.map(task =>
        task.id === id
          ? { ...task, done: !task.done }
          : task
      )
    );
  };

  return (

    <div className="container">

      <h1>🎉 Birthday Party Planner</h1>

      <div className="input-area">

        <input
          type="text"
          placeholder="Add a party plan..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button onClick={addTask}>
          Add
        </button>

      </div>

      <ul>

        {tasks.map(task => (

          <li
            key={task.id}
            className={task.done ? "done" : ""}
          >

            <span
              onClick={() => toggleTask(task.id)}
            >
              {task.name}
            </span>

            <button
              onClick={() => deleteTask(task.id)}
            >
              ❌
            </button>

          </li>

        ))}

      </ul>

    </div>

  );
}

export default App;