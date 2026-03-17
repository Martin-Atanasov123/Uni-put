import React, { useState } from 'react';
import questionsData from '../../../data/riasec_questions.json';

/**
 * RIASEC Calculator - Изчислява RIASEC профил от отговори
 */
class RIASECCalculator {
  constructor() {
    // Mapping на въпросите към типовете (от JSON файла)
    this.questions = questionsData.questions;
    this.questionsByType = this.groupQuestionsByType();
  }

  groupQuestionsByType() {
    const grouped = { R: [], I: [], A: [], S: [], E: [], C: [] };
    this.questions.forEach(q => {
      grouped[q.type].push(q.id);
    });
    return grouped;
  }

  /**
   * СТЪПКА 1: Изчисляване на RAW SCORES
   * Събира отговорите за всеки тип (R, I, A, S, E, C)
   */
  calculateRawScores(answers) {
    const rawScores = {};
    
    Object.keys(this.questionsByType).forEach(type => {
      const questionIds = this.questionsByType[type];
      const sum = questionIds.reduce((total, qId) => {
        return total + (answers[qId] || 0);
      }, 0);
      rawScores[type] = sum;
    });
    
    return rawScores;
  }

  /**
   * СТЪПКА 2: НОРМАЛИЗАЦИЯ (0-100 скала)
   * Формула: ((raw - min) / (max - min)) × 100
   */
  normalizeScores(rawScores) {
    const questionsPerType = 10;
    const minScore = questionsPerType * 1;  // Минимум: 10 × 1 = 10
    const maxScore = questionsPerType * 5;  // Максимум: 10 × 5 = 50
    
    const normalized = {};
    
    Object.keys(rawScores).forEach(type => {
      const raw = rawScores[type];
      const norm = ((raw - minScore) / (maxScore - minScore)) * 100;
      normalized[type] = Math.round(norm);
    });
    
    return normalized;
  }

  /**
   * СТЪПКА 3: ГЕНЕРИРАНЕ НА HOLLAND CODE
   * Взема топ 3 типа по score
   */
  generateHollandCode(normalizedScores) {
    const sorted = Object.entries(normalizedScores)
      .sort((a, b) => b[1] - a[1])  // Сортира descending
      .slice(0, 3);  // Взема топ 3
    
    return sorted.map(([type, score]) => type).join('');
  }

  /**
   * ВАЛИДАЦИЯ на отговорите
   */
  validateAnswers(answers) {
    const issues = [];
    
    // Проверка 1: Всички въпроси отговорени
    if (Object.keys(answers).length < 60) {
      issues.push({
        type: 'incomplete',
        message: `Отговорени само ${Object.keys(answers).length} от 60 въпроса`
      });
    }

    // Проверка 2: Твърде много неутрални (3)
    const neutralCount = Object.values(answers).filter(v => v === 3).length;
    if (neutralCount > 30) {
      issues.push({
        type: 'warning',
        message: 'Прекалено много неутрални отговори. Опитай се да бъдеш по-конкретен.'
      });
    }

    // Проверка 3: Всички еднакви
    const uniqueValues = [...new Set(Object.values(answers))];
    if (uniqueValues.length === 1) {
      issues.push({
        type: 'error',
        message: 'Всички отговори са еднакви. Моля отговаряй честно.'
      });
    }

    return issues;
  }

  /**
   * ГЛАВНА ФУНКЦИЯ - Изчислява пълния RIASEC профил
   */
  calculate(answers) {
    // Валидация
    const validation = this.validateAnswers(answers);
    if (validation.some(v => v.type === 'error')) {
      return {
        error: true,
        issues: validation
      };
    }

    // 1. Raw scores
    const rawScores = this.calculateRawScores(answers);
    
    // 2. Normalized scores (0-100)
    const normalizedScores = this.normalizeScores(rawScores);
    
    // 3. Holland Code (топ 3)
    const hollandCode = this.generateHollandCode(normalizedScores);
    
    // 4. Проверка за диференциация
    const scores = Object.values(normalizedScores);
    const range = Math.max(...scores) - Math.min(...scores);
    
    return {
      error: false,
      rawScores,
      normalizedScores,
      hollandCode,
      warnings: validation,
      lowDifferentiation: range < 20
    };
  }
}

/**
 * RIASEC Quiz Component
 */
function RIASECQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const calculator = new RIASECCalculator();
  const questions = questionsData.questions;

  const handleAnswer = (value) => {
    const questionId = questions[currentQuestion].id;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Автоматично напред след отговор
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 300);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    const calculatedResults = calculator.calculate(answers);
    setResults(calculatedResults);
    setShowResults(true);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];
  const currentAnswer = answers[currentQ.id];

  if (showResults && results) {
    return <ResultsView results={results} />;
  }

  return (
    <div className="riasec-quiz">
      {/* Progress Bar */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        <span className="progress-text">
          Въпрос {currentQuestion + 1} от {questions.length}
        </span>
      </div>

      {/* Question */}
      <div className="question-container">
        <div className="question-type">{currentQ.type} - {currentQ.category}</div>
        <h2 className="question-text">{currentQ.text}</h2>

        {/* Answer Options */}
        <div className="answer-options">
          {[1, 2, 3, 4, 5].map(value => (
            <button
              key={value}
              className={`answer-button ${currentAnswer === value ? 'selected' : ''}`}
              onClick={() => handleAnswer(value)}
            >
              <span className="answer-value">{value}</span>
              <span className="answer-label">
                {questionsData.scaleLabels[value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="navigation">
        <button 
          onClick={handleBack} 
          disabled={currentQuestion === 0}
          className="nav-button"
        >
          ← Назад
        </button>
        
        {currentQuestion === questions.length - 1 && Object.keys(answers).length === 60 ? (
          <button onClick={handleSubmit} className="submit-button">
            Виж резултатите
          </button>
        ) : (
          <button 
            onClick={() => currentQuestion < questions.length - 1 && setCurrentQuestion(currentQuestion + 1)}
            disabled={currentQuestion === questions.length - 1}
            className="nav-button"
          >
            Напред →
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Results View Component
 */
function ResultsView({ results }) {
  if (results.error) {
    return (
      <div className="error-view">
        <h2>Има проблем с отговорите</h2>
        {results.issues.map((issue, i) => (
          <p key={i} className={`issue-${issue.type}`}>{issue.message}</p>
        ))}
      </div>
    );
  }

  const { normalizedScores, hollandCode, lowDifferentiation } = results;
  
  // Сортираме scores за визуализация
  const sortedScores = Object.entries(normalizedScores)
    .sort((a, b) => b[1] - a[1]);

  const typeNames = {
    R: 'Realistic (Реалистичен)',
    I: 'Investigative (Изследовател)',
    A: 'Artistic (Артистичен)',
    S: 'Social (Социален)',
    E: 'Enterprising (Предприемчив)',
    C: 'Conventional (Конвенционален)'
  };

  return (
    <div className="results-view">
      <h1>Твоят RIASEC Профил</h1>
      
      {/* Holland Code */}
      <div className="holland-code">
        <h2>Holland Code: <span className="code">{hollandCode}</span></h2>
        <p>Това са трите типа, които най-добре те описват</p>
      </div>

      {/* Warnings */}
      {lowDifferentiation && (
        <div className="warning-box">
          ⚠️ Резултатите показват сходни scores за всички типове. 
          Това може да означава, че имаш широк спектър от интереси или 
          че трябва да отговориш по-честно на въпросите.
        </div>
      )}

      {/* Score Bars */}
      <div className="scores-section">
        <h3>Твоите RIASEC Scores:</h3>
        {sortedScores.map(([type, score]) => (
          <div key={type} className="score-item">
            <div className="score-header">
              <span className="type-label">{type}</span>
              <span className="type-name">{typeNames[type]}</span>
              <span className="score-value">{score}%</span>
            </div>
            <div className="score-bar-container">
              <div 
                className="score-bar" 
                style={{ 
                  width: `${score}%`,
                  backgroundColor: getScoreColor(score)
                }}
              ></div>
            </div>
            <div className="score-interpretation">
              {getScoreInterpretation(score)}
            </div>
          </div>
        ))}
      </div>

      {/* Next Steps */}
      <div className="next-steps">
        <button className="view-specialties-btn">
          Виж подходящи специалности
        </button>
        <button className="view-careers-btn">
          Виж подходящи професии
        </button>
      </div>
    </div>
  );
}

/**
 * Helper функции
 */
function getScoreColor(score) {
  if (score >= 80) return '#10b981'; // Green
  if (score >= 60) return '#3b82f6'; // Blue
  if (score >= 40) return '#f59e0b'; // Orange
  return '#6b7280'; // Gray
}

function getScoreInterpretation(score) {
  if (score >= 80) return 'Много силен интерес';
  if (score >= 60) return 'Силен интерес';
  if (score >= 40) return 'Умерен интерес';
  if (score >= 20) return 'Нисък интерес';
  return 'Много нисък интерес';
}

export default RIASECQuiz;

/**
 * ПРИМЕР ЗА ИЗПОЛЗВАНЕ В API:
 * 
 * // 1. Събери отговорите от frontend
 * const userAnswers = {
 *   1: 5, 2: 4, 3: 3, 4: 5, 5: 2, 6: 4, 7: 5, 8: 3, 9: 4, 10: 4,
 *   11: 5, 12: 5, 13: 4, 14: 5, 15: 4, 16: 5, 17: 5, 18: 4, 19: 5, 20: 5,
 *   // ... всички 60 въпроса
 * };
 * 
 * // 2. Изчисли RIASEC профила
 * const calculator = new RIASECCalculator();
 * const results = calculator.calculate(userAnswers);
 * 
 * // 3. Използвай normalizedScores за matching в database
 * const response = await fetch('/api/riasec/match', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     scores: results.normalizedScores,  // {R: 73, I: 88, A: 38, S: 20, E: 30, C: 75}
 *     hollandCode: results.hollandCode   // "ICR"
 *   })
 * });
 */
