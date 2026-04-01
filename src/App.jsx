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
    dow === 3 ? 3 :
    dow === 4 ? 2 : 1;
  d.setDate(d.getDate() + offset);
  return { adjusted: d, wasAdjusted: true, originalDow: dow };
};

/** 判断某日期是否在五一/十一假期区间 */
const isHolidayRange = (date) => {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return (m === 5 && d >= 1 && d <= 3) || (m === 10 && d >= 1 && d <= 7);
};

/** 是否为工作日 */
const isWorkday = (date) => {
  const dow = date.getDay();
  return dow >= 1 && dow <= 5;
};

/**
 * 保证计划日期“符合常识”：
 * 1. 不能早于今天
 * 2. 不能在生日当天或生日之后
 * 3. 如果按规则调整后仍不合理，则统一建议今天开始准备
 */
const normalizePlanDate = (candidateDate, today, nextBirthday) => {
  const result = {
    finalDate: new Date(candidateDate),
    useTodaySuggestion: false,
    reason: "",
  };

  if (result.finalDate < today) {
    result.finalDate = new Date(today);
    result.useTodaySuggestion = true;
    result.reason = "原计划日期早于今天，说明时间已经比较紧迫，建议今天开始准备。";
    return result;
  }

  if (result.finalDate >= nextBirthday) {
    result.finalDate = new Date(today);
    result.useTodaySuggestion = true;
    result.reason = "原计划日期落在生日当天或生日之后，不符合常识，建议今天开始准备。";
    return result;
  }

  return result;
};

/** 生成唯一 id */
const makeId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/** 创建亲友对象 */
const createRelative = (name, relation, birthDate) => ({
  id: makeId(),
  name: name.trim(),
  relation: relation.trim(),
  birthDate,
  planInfo: null,
});

/** 为某位亲友构造计划信息 */
const buildPlanForRelative = (relative, todayStr, advDays) => {
  const n = parseInt(advDays, 10);

  if (!relative || !todayStr || isNaN(n) || n <= 0) {
    return {
      error: "请输入合法的提前天数（必须是大于 0 的整数）。"
    };
  }

  const today = new Date(todayStr);
  const { next, days } = calcNextBirthday(relative.birthDate, todayStr);

  if (n > days) {
    return {
      error: `提前 ${n} 天已经早于今天，不符合常识。建议今天开始准备。`,
      suggestionDate: new Date(today)
    };
  }

  const raw = new Date(next);
  raw.setDate(raw.getDate() - n);

  let candidateDate = new Date(raw);
  let wasAdjusted = false;
  let originalDow = raw.getDay();
  let holidayProtected = false;
  let specialMessage = "";

  if (isWorkday(raw)) {
    if (!isHolidayRange(raw)) {
      const result = adjustToSaturday(raw);
      candidateDate = result.adjusted;
      wasAdjusted = result.wasAdjusted;
      originalDow = result.originalDow;

      if (wasAdjusted) {
        specialMessage =
          `${formatDate(raw)} 是${DAY_NAMES[originalDow]}，属于工作日，且不在 5月1日—3日、10月1日—7日期间，因此自动调整为最近的周六。`;
      }
    } else {
      holidayProtected = true;
      specialMessage =
        `${formatDate(raw)} 虽然是工作日，但处于 5月1日—3日 或 10月1日—7日 区间内，因此不调整到周六。`;
    }
  }

  const normalized = normalizePlanDate(candidateDate, today, next);

  if (normalized.useTodaySuggestion) {
    specialMessage = normalized.reason;
  }

  return {
    error: "",
    n,
    today,
    nextBirthday: next,
    daysToBirthday: days,
    rawDate: raw,
    candidateDate,
    finalDate: normalized.finalDate,
    wasAdjusted,
    originalDow,
    holidayProtected,
    useTodaySuggestion: normalized.useTodaySuggestion,
    specialMessage,
  };
};

function App() {
  /**
   * step:
   * 0 欢迎界面
   * 1 录入亲友
   * 2 选择亲友并输入今天日期/提前天数
   * 3 当前亲友结果显示
   * 4 结束汇总界面
   */
  const [step, setStep] = useState(0);

  // 多位亲友列表
  const [relatives, setRelatives] = useState([]);

  // 亲友录入表单
  const [relativeName, setRelativeName] = useState("");
  const [relativeRelation, setRelativeRelation] = useState("");
  const [relativeBirthDate, setRelativeBirthDate] = useState("");

  // 当前选择的亲友
  const [selectedRelativeId, setSelectedRelativeId] = useState("");

  // 今天日期和提前天数
  const [todayDate, setTodayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [advDays, setAdvDays] = useState("");

  // 当前正在查看/计算的计划结果
  const [currentRelativePlan, setCurrentRelativePlan] = useState(null);

  // 输入错误提示
  const [errorMsg, setErrorMsg] = useState("");

  const selectedRelative =
    relatives.find((item) => item.id === selectedRelativeId) || null;

  const finishedRelatives = relatives.filter((item) => item.planInfo);

  // 添加亲友
  const handleAddRelative = () => {
    if (!relativeName || !relativeRelation || !relativeBirthDate) return;

    const newRelative = createRelative(
      relativeName,
      relativeRelation,
      relativeBirthDate
    );

    setRelatives((prev) => [...prev, newRelative]);
    setRelativeName("");
    setRelativeRelation("");
    setRelativeBirthDate("");
  };

  // 删除亲友
  const handleDeleteRelative = (id) => {
    setRelatives((prev) => prev.filter((item) => item.id !== id));
    if (selectedRelativeId === id) {
      setSelectedRelativeId("");
    }
  };

  // 为当前选中的亲友计算计划
  const handleCalcRelativePlan = () => {
    setErrorMsg("");

    if (!selectedRelative) {
      setErrorMsg("请先选择一位亲友。");
      return;
    }

    if (!todayDate) {
      setErrorMsg("请输入今天的日期。");
      return;
    }

    if (!advDays) {
      setErrorMsg("请输入提前多少天做计划。");
      return;
    }

    const result = buildPlanForRelative(selectedRelative, todayDate, advDays);

    if (!result) {
      setErrorMsg("计划日期计算失败，请检查输入。");
      return;
    }

    if (result.error) {
      setErrorMsg(result.error);

      if (result.suggestionDate) {
        const preview = calcNextBirthday(selectedRelative.birthDate, todayDate);
        setCurrentRelativePlan({
          error: "",
          n: parseInt(advDays, 10),
          today: new Date(todayDate),
          nextBirthday: preview.next,
          daysToBirthday: preview.days,
          rawDate: result.suggestionDate,
          candidateDate: result.suggestionDate,
          finalDate: result.suggestionDate,
          wasAdjusted: false,
          originalDow: result.suggestionDate.getDay(),
          holidayProtected: false,
          useTodaySuggestion: true,
          specialMessage: result.error,
        });
        setStep(3);
      }

      return;
    }

    setCurrentRelativePlan(result);
    setStep(3);
  };

  // 保存当前亲友计划
  const handleSaveRelativePlan = () => {
    if (!selectedRelative || !currentRelativePlan) return;

    setRelatives((prev) =>
      prev.map((item) =>
        item.id === selectedRelative.id
          ? { ...item, planInfo: currentRelativePlan }
          : item
      )
    );
  };

  // 继续为其他亲友制定
  const handleContinueForOthers = () => {
    handleSaveRelativePlan();
    setSelectedRelativeId("");
    setCurrentRelativePlan(null);
    setAdvDays("");
    setErrorMsg("");
    setStep(2);
  };

  // 保存并结束
  const handleFinishAll = () => {
    handleSaveRelativePlan();
    setStep(4);
  };

  // 回到初始状态，重新开始
  const reset = () => {
    setStep(0);
    setRelatives([]);
    setRelativeName("");
    setRelativeRelation("");
    setRelativeBirthDate("");
    setSelectedRelativeId("");
    setTodayDate(new Date().toISOString().slice(0, 10));
    setAdvDays("");
    setCurrentRelativePlan(null);
    setErrorMsg("");
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

  const content = (() => {
    if (step === 0) {
      return (
        <div className="card center">
          <h1>生日聚会计划便签</h1>
          <p className="sub">
            欢迎使用生日聚会计划工具！<br />
            可录入多位亲友，并为他们分别制定生日聚会计划日期。
          </p>
          <p className="welcome-hint">按任意键继续</p>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="card">
          <h2 className="title">录入亲友信息</h2>
          <p className="hint">请输入若干亲友的姓名、关系、出生日期，并保存。</p>

          <label className="field-label">姓名</label>
          <input
            type="text"
            value={relativeName}
            onChange={(e) => setRelativeName(e.target.value)}
            placeholder="例如：张三"
          />

          <label className="field-label">与用户的关系</label>
          <input
            type="text"
            value={relativeRelation}
            onChange={(e) => setRelativeRelation(e.target.value)}
            placeholder="例如：父亲、母亲、闺蜜、同学"
          />

          <label className="field-label">出生日期</label>
          <input
            type="date"
            value={relativeBirthDate}
            onChange={(e) => setRelativeBirthDate(e.target.value)}
          />

          <div className="btn-group">
            <button
              className="btn btn-secondary"
              onClick={handleAddRelative}
              disabled={!relativeName || !relativeRelation || !relativeBirthDate}
            >
              添加亲友
            </button>

            <button
              className="btn btn-primary"
              onClick={() => setStep(2)}
              disabled={relatives.length === 0}
            >
              下一步：选择亲友 &rarr;
            </button>
          </div>

          <div className="list-box">
            <h3 className="small-title">已录入亲友</h3>

            {relatives.length === 0 ? (
              <p className="hint">当前还没有录入任何亲友。</p>
            ) : (
              relatives.map((item, index) => (
                <div className="person-item" key={item.id}>
                  <div className="person-main">
                    <strong>{index + 1}. {item.name}</strong>
                    <span>（{item.relation}）</span>
                    <span>{item.birthDate}</span>
                  </div>

                  <button
                    className="mini-btn"
                    onClick={() => handleDeleteRelative(item.id)}
                  >
                    删除
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="card">
          <h2 className="title">确定“制定生日聚会计划的日期”</h2>
          <p className="hint">请先选择一位亲友，再输入今天日期和提前天数。</p>

          <div className="select-list">
            {relatives.map((item, index) => (
              <label
                key={item.id}
                className={`select-item ${selectedRelativeId === item.id ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="relative"
                  value={item.id}
                  checked={selectedRelativeId === item.id}
                  onChange={() => setSelectedRelativeId(item.id)}
                />
                <div>
                  <div className="select-line">
                    {index + 1}. {item.name}（{item.relation}）
                  </div>
                  <div className="select-sub">出生日期：{item.birthDate}</div>
                  {item.planInfo && (
                    <div className="planned-tag">
                      已制定计划：{formatDate(item.planInfo.finalDate)}（{dayName(item.planInfo.finalDate)}）
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>

          <label className="field-label">今天的日期</label>
          <input
            type="date"
            value={todayDate}
            onChange={(e) => setTodayDate(e.target.value)}
          />

          {selectedRelative && (
            <div className="info-box">
              <div className="info-row">
                <span className="info-label">下次生日日期</span>
                <span className="info-value">
                  {formatDate(calcNextBirthday(selectedRelative.birthDate, todayDate).next)}
                  （{dayName(calcNextBirthday(selectedRelative.birthDate, todayDate).next)}）
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">距离今天还有</span>
                <span className="info-value">
                  {calcNextBirthday(selectedRelative.birthDate, todayDate).days} 天
                </span>
              </div>
            </div>
          )}

          <label className="field-label">希望提前多少天做聚会计划？</label>
          <input
            type="number"
            min="1"
            value={advDays}
            onChange={(e) => setAdvDays(e.target.value)}
            placeholder="例如：7"
          />

          {errorMsg && (
            <div className="error-tip">
              {errorMsg}
            </div>
          )}

          <div className="btn-group">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              &larr; 返回录入
            </button>

            <button
              className="btn btn-primary"
              onClick={handleCalcRelativePlan}
              disabled={!selectedRelativeId || !todayDate || !advDays || parseInt(advDays, 10) <= 0}
            >
              确定计划日期 &rarr;
            </button>
          </div>
        </div>
      );
    }

    if (step === 3 && selectedRelative && currentRelativePlan) {
      return (
        <div className="card">
          <h2 className="title">当前亲友的生日计划结果</h2>

          <div className="result-box">
            <div className="result-row">
              <span className="r-label">姓名</span>
              <span className="r-value">{selectedRelative.name}</span>
            </div>

            <div className="result-row">
              <span className="r-label">与用户的关系</span>
              <span className="r-value">{selectedRelative.relation}</span>
            </div>

            <div className="result-row">
              <span className="r-label">出生日期</span>
              <span className="r-value">{selectedRelative.birthDate}</span>
            </div>

            <div className="result-row">
              <span className="r-label">下次生日日期</span>
              <span className="r-value">
                {formatDate(currentRelativePlan.nextBirthday)}（{dayName(currentRelativePlan.nextBirthday)}）
              </span>
            </div>

            <div className="result-row">
              <span className="r-label">距离今天的天数</span>
              <span className="r-value">{currentRelativePlan.daysToBirthday} 天</span>
            </div>

            <div className="result-row">
              <span className="r-label">距离下次生日前 {currentRelativePlan.n} 天的日期</span>
              <span className="r-value">
                {formatDate(currentRelativePlan.rawDate)}（{dayName(currentRelativePlan.rawDate)}）
              </span>
            </div>

            {currentRelativePlan.specialMessage && (
              <div className={currentRelativePlan.useTodaySuggestion ? "adjust-tip warning-tip" : "adjust-tip"}>
                {currentRelativePlan.specialMessage}
              </div>
            )}

            <div className="result-row highlight">
              <span className="r-label">预计准备制定生日计划的日期</span>
              <span className="r-value">
                {formatDate(currentRelativePlan.finalDate)}（{dayName(currentRelativePlan.finalDate)}）
              </span>
            </div>

            {currentRelativePlan.useTodaySuggestion && (
              <div className="today-suggest-box">
                当前情况说明原计划已经不够合理，建议你今天就开始准备生日聚会计划。
              </div>
            )}
          </div>

          <div className="btn-group">
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              重新确定当前亲友
            </button>

            <button className="btn btn-secondary" onClick={handleContinueForOthers}>
              为其他亲友继续制定
            </button>

            <button className="btn btn-primary" onClick={handleFinishAll}>
              确认并结束
            </button>
          </div>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="card center">
          <h1>计划制定完成！</h1>
          <p className="sub">
            以下是已经确定“制定生日聚会计划日期”的所有亲友信息：
          </p>

          {finishedRelatives.length === 0 ? (
            <p className="hint">当前没有已确认计划的亲友。</p>
          ) : (
            <div className="summary-table">
              <div className="summary-head">
                <span>姓名</span>
                <span>关系</span>
                <span>出生日期</span>
                <span>制定计划的日期</span>
              </div>

              {finishedRelatives.map((item) => (
                <div className="summary-row" key={item.id}>
                  <span>{item.name}</span>
                  <span>{item.relation}</span>
                  <span>{item.birthDate}</span>
                  <span>
                    {formatDate(item.planInfo.finalDate)}（{dayName(item.planInfo.finalDate)}）
                  </span>
                </div>
              ))}
            </div>
          )}

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