import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

/**
 * Глобален компонент за управление на грешки (Error Boundary).
 * Улавя JavaScript грешки в който и да е дъщерен компонент, логва ги и показва fallback UI.
 * 
 * @class GlobalErrorBoundary
 * @extends {React.Component}
 */
class GlobalErrorBoundary extends React.Component {
  /**
   * @param {Object} props
   * @param {React.ReactNode} props.children - Елементите, които да бъдат наблюдавани за грешки
   * @param {Function} [props.onRetry] - Callback функция, която се изпълнява при опит за възстановяване
   */
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Статичен метод за обновяване на стейта при възникнала грешка.
   * @param {Error} error - Възникналата грешка
   * @returns {Object} - Новото състояние
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Жизнен цикъл за логване на детайли за грешката.
   * @param {Error} error
   * @param {React.ErrorInfo} errorInfo
   */
  componentDidCatch(error, errorInfo) {
    console.error("GlobalErrorBoundary улови грешка:", error, errorInfo);
  }

  /**
   * Нулира състоянието на грешката и позволява повторен опит за рендиране.
   */
  handleRetry = () => {
    this.setState({ hasError: false, error: null }, () => {
      if (this.props.onRetry) {
        this.props.onRetry();
      }
    });
  };

  /**
   * Пълно опресняване на браузъра като последен вариант за възстановяване.
   */
  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Може да се рендира произволен персонализиран fallback UI
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-base-100 rounded-[2.5rem] shadow-2xl border border-error/20 p-8 md:p-12 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-error/10 rounded-3xl flex items-center justify-center text-error mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            
            <h2 className="text-3xl font-black mb-4 tracking-tight">Упс! Нещо се обърка.</h2>
            
            <p className="text-base-content/60 mb-8 leading-relaxed font-medium">
              Приложението срещна неочаквана грешка. Не се притеснявай, данните ти са в безопасност. Моля, опитай да опресниш компонента или се върни към началната страница.
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={this.handleRetry}
                className="btn btn-primary rounded-2xl font-black gap-2 h-14 shadow-lg shadow-primary/20"
              >
                <RefreshCcw size={20} /> Опитай отново
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={this.handleReload}
                  className="btn btn-ghost bg-base-200 hover:bg-base-300 rounded-2xl font-bold gap-2"
                >
                  Опресни страницата
                </button>
                <a 
                  href="/"
                  className="btn btn-ghost bg-base-200 hover:bg-base-300 rounded-2xl font-bold gap-2"
                >
                  <Home size={18} /> Начало
                </a>
              </div>
            </div>

            {import.meta.env.DEV && (
              <div className="mt-8 p-4 bg-error/5 rounded-xl text-left overflow-auto max-h-40 border border-error/10">
                <p className="text-xs font-mono text-error font-bold mb-2 uppercase tracking-widest opacity-50">Детайли за грешката (Dev):</p>
                <code className="text-[10px] text-error/80 leading-tight block">
                  {this.state.error?.toString()}
                </code>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default GlobalErrorBoundary;
