// Li Junheng完成了大部分的代码工作，包括css中字体、按键的设计，计算生日、剩余天数和计划日期的算法等
// Xiao Zhaotong完成了欢迎界面和结束界面“按任意键继续/返回”这一操作的设计并补充了计划日期的一些特殊情况

import { useState, useEffect } from "react";
import "./App.css";

const DAY_NAMES = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

const formatDate = (date) =>
  `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

const dayName = (date) => DAY_NAMES[date.getDay()];

/** 在指定年份创建生日日期，处理 2/29 等溢出情况 */
const birthdayInYear = (year, month, day) => {
  const d = new Date(year, month, day);
  // 如果月份溢出（例如非闰年 2/29 → 3/1），回退到当月最后一天（2/28）
  if (d.getMonth() !== month) return new Date(year, month + 1, 0);
  return d;
};

/** 计算下次生日及天数差 */
const calcNextBirthday = (birthStr, todayStr) => {
  const birth = new Date(birthStr);
  const today = new Date(todayStr);
  let next = birthdayInYear(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next <= today) {
    next = birthdayInYear(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
  }
  const days = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
  return { next, days };
};

/**
 * 若计划日期为工作日，调整到最近的周六：
 *   周一、周二 → 前一个周六
 *   周三、周四、周五 → 后一个周六
 */
const adjustToSaturday = (date) => {
  const d = new Date(date);
  const dow = d.getDay();

  if (dow === 0 || dow === 6) return { adjusted: d, wasAdjusted: false, originalDow: dow };
  const offset =
    dow === 1 ? -2 :
    dow === 2 ? -3 :
    dow === 3 ?  3 :
    dow === 4 ?  2 : 1; // fri
  d.setDate(d.getDate() + offset);
  return { adjusted: d, wasAdjusted: true, originalDow: dow };
};

function App() {
  // step 用来控制当前显示哪一个页面
  const [step, setStep] = useState(0);
  const [birthDate, setBirthDate] = useState("");
  const [todayDate, setTodayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [nextBday, setNextBday] = useState(null);
  const [daysToBday, setDaysToBday] = useState(0);
  const [advDays, setAdvDays] = useState("");
  const [plan, setPlan] = useState(null);

  // 计算下次生日并进入下一步
  const handleCalcBirthday = () => {
    if (!birthDate || !todayDate) return;
    const { next, days } = calcNextBirthday(birthDate, todayDate);
    setNextBday(next);
    setDaysToBday(days);
    setStep(2);
  };

  // 根据提前天数计算计划日期
  // 考虑特殊情况：即最近的周六晚于生日或早于当天？
  const handleCalcPlan = () => {
    const n = parseInt(advDays, 10);
    if (isNaN(n) || n <= 0) return;

    const raw = new Date(nextBday);
    raw.setDate(raw.getDate() - n);

    // 获取今天日期
  const today = new Date(todayDate);

  // 先按原规则调整到最近的周六
  const { adjusted, wasAdjusted, originalDow } = adjustToSaturday(raw);

  let finalDate = new Date(adjusted);

  // 如果最近的周六在生日当天或生日之后，改为前一个周六
  if (finalDate >= nextBday) {
    finalDate.setDate(finalDate.getDate() - 7);
  }

  // 如果调整后的周六在今天之前，改为后一个周六
  if (finalDate < today) {
    finalDate.setDate(finalDate.getDate() + 7);
  }

  // 如果仍然不合法，则直接使用今天
  if (finalDate < today || finalDate >= nextBday) {
    finalDate = new Date(today.getTime());
  }

    setPlan({ n, rawDate: new Date(raw), finalDate, wasAdjusted, originalDow });
    setStep(3);
  };

  // 回到初始状态，重新开始
  const reset = () => {
    setStep(0);
    setBirthDate("");
    setAdvDays("");
    setPlan(null);
    setNextBday(null);
  };

  /* 键盘监听：第一页按任意键开始，最后一页按任意键重新开始 */
  useEffect(() => {
    const handleKey = () => {
      if (step === 0) {
        setStep(1);
      } else if (step === 4) {
        reset();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [step]);


  /* ── 所有步骤统一渲染，用 key={step} 触发缓动 ── */
  const content = (() => {
    /* Step 0: 欢迎界面，按任意键继续 */
    if (step === 0) {
      return (
        <div className="card center">
          <h1>生日聚会计划便签</h1>
          <p className="sub">欢迎使用生日聚会计划工具！<br/>帮你计算下次生日并制定聚会准备计划。</p>
          <p className="welcome-hint">按任意键继续</p>
        </div>
      );
    }
    /* Step 1: 输入日期 */
    if (step === 1) {
      return (
        <div className="card">
          <h2 className="title">输入日期信息</h2>
          <p className="hint">请输入你的出生日期和今天的日期，程序将计算下次生日。</p>

          <label className="field-label">出生日期</label>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />

          <label className="field-label">今天的日期</label>
          <input type="date" value={todayDate} onChange={(e) => setTodayDate(e.target.value)} />

          <button
            className="btn btn-primary"
            onClick={handleCalcBirthday}
            disabled={!birthDate || !todayDate}
          >
            计算下次生日 &rarr;
          </button>
        </div>
      );
    }
    /* Step 2: 制定计划日期 */
    if (step === 2) {
      return (
        <div className="card">
          <h2 className="title">生日聚会计划制定日期</h2>

          <div className="info-box">
            <div className="info-row">
              <span className="info-label">下次生日日期</span>
              <span className="info-value">{formatDate(nextBday)}（{dayName(nextBday)}）</span>
            </div>
            <div className="info-row">
              <span className="info-label">距离今天还有</span>
              <span className="info-value">{daysToBday} 天</span>
            </div>
          </div>

          <label className="field-label">希望提前多少天做聚会计划？</label>
          <input
            type="number"
            min="1"
            value={advDays}
            onChange={(e) => setAdvDays(e.target.value)}
            placeholder="例如：7"
          />

          <button
            className="btn btn-primary"
            onClick={handleCalcPlan}
            disabled={!advDays || parseInt(advDays, 10) <= 0}
          >
            确定计划日期 &rarr;
          </button>
        </div>
      );
    }
    /* Step 3: 结果显示 */
    if (step === 3) {
      return (
        <div className="card">
          <h2 className="title">生日聚会计划结果</h2>

          <div className="result-box">
            <div className="result-row">
              <span className="r-label">下次生日日期</span>
              <span className="r-value">{formatDate(nextBday)}（{dayName(nextBday)}）</span>
            </div>
            <div className="result-row">
              <span className="r-label">距离今天的天数</span>
              <span className="r-value">{daysToBday} 天</span>
            </div>
            <div className="result-row">
              <span className="r-label">距离下次生日前 {plan.n} 天的日期</span>
              <span className="r-value">{formatDate(plan.rawDate)}（{dayName(plan.rawDate)}）</span>
            </div>

            {plan.wasAdjusted && (
              <div className="adjust-tip">
                {plan.finalDate.toDateString() === new Date(todayDate).toDateString()
                  ? "时间紧迫，建议从今天开始计划,下次记得早点准备哦"
                  : `${formatDate(plan.rawDate)} 为${DAY_NAMES[plan.originalDow]}（工作日），已自动调整为最近的周六。`}
              </div>
            )}

            <div className="result-row highlight">
              <span className="r-label">预计准备制定生日计划的日期</span>
              <span className="r-value">{formatDate(plan.finalDate)}（{dayName(plan.finalDate)}）</span>
            </div>
          </div>

          <div className="btn-group">
            <button className="btn btn-secondary" onClick={() => { setAdvDays(""); setPlan(null); setStep(2); }}>
              重新确定计划日期
            </button>
            <button className="btn btn-primary" onClick={() => setStep(4)}>
              确认并完成
            </button>
          </div>
        </div>
      );
    }
    /* Step 4: 结束界面 */
    if (step === 4) {
      return (
        <div className="card center">
          <h1>计划制定完成！</h1>
          <p className="sub">
            请记住在 <strong>{formatDate(plan.finalDate)}</strong>（{dayName(plan.finalDate)}）<br/>制定你的生日聚会计划。
          </p>
          <p className="hint">祝你有一个完美的生日聚会！</p>
          <p className="welcome-hint">按任意键返回</p>
        </div>
      );
    }
    return null;
  })();

  return (
    <div className="page" key={step}>
      {content}
      {step >= 1 && (
        <div className="step-dots">
          {[1, 2, 3, 4].map((s) => (
            <span key={s} className={`dot${step === s ? " active" : ""}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
