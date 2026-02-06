import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { calculateWeek } from "../utils/weekCalculator";

import closeImg from '../assets/close.svg';
import '../components/formStyles.css';

import { serviceDepartments, productDepartments } from "../utils/executorBase";

const DopForm = () => {
  
  const navigate = useNavigate();

  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);

  const [reglament, setReglament] = useState(localStorage.getItem('reglament') || '');
  const [executor, setExecutor] = useState(localStorage.getItem('executor') || '');
  const [amount, setAmount] = useState(localStorage.getItem('amount') || '1-2');
  const [typeWork, setTypeWork] = useState(localStorage.getItem('typeWork') || 'Типовая');
  const [typeTest, setTypeTest] = useState(localStorage.getItem('typeTest') || '');
  const [recommen, setRecommen] = useState(localStorage.getItem('recommen') || '0');
  const [errors, setErrors] = useState(localStorage.getItem('errors') || '0');
  const [critic, setCritic] = useState(localStorage.getItem('critic') || '0');
  /*##########*/
  const [recomenPoint, setRecommenPoint] = useState(0);
  const [errorsPoint, setErrorPoint] = useState(0);
  const [criticPoint, setCriticPoint] = useState(0);
  const [generalPoint, setGeneralPoint] = useState(0);
  /*##########*/
  const [counting, setCounting] = useState(localStorage.getItem('counting') || '');
  const [iteration, setIteration] = useState(localStorage.getItem('iteration') || '');
  const [point, setPoint] = useState(localStorage.getItem('point') || '');
  const [inspector, setInspector] = useState(user.username);
  const [departament, setDepartament] = useState(localStorage.getItem('departament') || '');
  const [delayTester, setDelayTester] = useState(localStorage.getItem('delayTester') || '');
  const [delayExecutor, setDelayExecutor] = useState(localStorage.getItem('delayExecutor') || '');
  const [commentError, setCommentError] = useState(localStorage.getItem('commentError') || '');
  const [linkReport, setLinkReport] = useState(localStorage.getItem('linkReport') || '');
  const [reportPeriods, setReportPeriods] = useState('');
  const [datePeriods, setDatePeriods] = useState([]);
  const [service, setService] = useState(' ');
  const [product, setProduct] = useState(' ');
  const [week, setWeek] = useState('');

  const [executors, setExecutors] = useState([]);
  const [executorList, setExecutorList] = useState([]);
  const [executorDepartament, setExecutorDepartament] = useState([]);
  

  if (!token) {
    navigate("/login");
    return null;
  }
  
  if (!user) return; // Ждём, пока загрузится пользователь
  
  // ✅ список ролей, которым разрешён доступ
  const allowedRoles = ["user", "admin"];
  if (!allowedRoles.includes(user.role)) {
    navigate("/"); // Нет прав — перенаправляем на главную
    return null;
  }

  useEffect(() => {

    const fetchExecutors = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/executors`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Ошибка загрузки исполнителей");
        const data = await res.json();
        setExecutorList(data);
      } catch (error) {
        console.error("Ошибка:", error);
      }
    };

    fetchExecutors();
  }, [token]);
    
  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/date-periods`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (!res.ok) throw new Error("Ошибка загрузки даты периодов");
        const data = await res.json();
        setDatePeriods(data);
        
        // После загрузки периодов определяем текущий период
        determineCurrentPeriod(data);
      } catch (error) {
        console.error("Ошибка:", error);
      }
    };

    fetchPeriods();
  }, [token])
    

    // Функция для обновления service и product в зависимости от отдела исполнителя и количества ошибок
  const updateServiceAndProduct = () => {
    // Находим выбранного исполнителя в списке
    const selectedExecutor = executorList.find(exec => exec.executorName === executor);
    
    if (selectedExecutor) {
      const dept = selectedExecutor.executorDepartament;
      const errorCount = parseInt(errors) || 0;
      
      // Если это сервисный отдел
      if (serviceDepartments.includes(dept)) {
        // Если ошибок 0, ставим 1, иначе ставим количество ошибок
        const serviceValue = errorCount === 0 ? '1' : String(errorCount);
        setService(serviceValue);
        setProduct('');
      }
      // Если это продуктовый отдел
      else if (productDepartments.includes(dept)) {
        // Если ошибок 0, ставим 1, иначе ставим количество ошибок
        const productValue = errorCount === 0 ? '1' : String(errorCount);
        setProduct(productValue);
        setService('');
      } else {
        // Если отдел не определен ни в одном списке
        setService('');
        setProduct('');
      }
    }
  };

    // Вызываем функцию обновления service/product при изменении исполнителя или количества ошибок
  useEffect(() => {
    if (executor && executorList.length > 0) {
      updateServiceAndProduct();
    }
  }, [executor, errors, executorList]);

  // Обработчик изменения исполнителя
  const handleExecutorChange = (event) => {
    const selectedExecutor = event.target.value;
    
    // Находим информацию о выбранном исполнителе
    const selectedExec = executorList.find(exec => exec.executorName === selectedExecutor);
    
    if (selectedExec) {
      setDepartament(selectedExec.executorDepartament);
      setExecutor(selectedExecutor);
      setLinkReport(reglament.substr(0, 51));
      
      // Обновляем service/product сразу
      const errorCount = parseInt(errors) || 0;
      const dept = selectedExec.executorDepartament;
      
      if (serviceDepartments.includes(dept)) {
        const serviceValue = errorCount === 0 ? '1' : String(errorCount);
        setService(serviceValue);
        setProduct('');
      } else if (productDepartments.includes(dept)) {
        const productValue = errorCount === 0 ? '1' : String(errorCount);
        setProduct(productValue);
        setService('');
      } else {
        setService('');
        setProduct('');
      }
    }
  };

  // Также обновляем при изменении количества ошибок
  useEffect(() => {
    if (executor && executorList.length > 0) {
      updateServiceAndProduct();
    }
  }, [errors]);

  // Функция для установки текущей даты и расчета недели
  const setCurrentDateAndWeek = () => {
    const now = new Date();
    const currentDay = String(now.getDate()).padStart(2, '0');
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = now.getFullYear();
    const currentDate = `${currentYear}-${currentMonth}-${currentDay}`;
    
    
    // Рассчитываем неделю
    const weekDate = calculateWeek(currentDate);
    setWeek(weekDate);
  };

  // Вызови при загрузке формы
  useEffect(() => {
    setCurrentDateAndWeek();
  }, []);

  // Функция для определения текущего периода
  const determineCurrentPeriod = (periods) => {
    const now = new Date();
    const currentDay = String(now.getDate()).padStart(2, '0');
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = now.getFullYear();
    
    const today = new Date(`${currentYear}-${currentMonth}-${currentDay}`);
    
    // Ищем период, в который попадает текущая дата
    const currentPeriod = periods.find(period => {
      const [startDay, startMonth, startYear] = period.startDate.split('.');
      const startDate = new Date(`${startYear}-${startMonth}-${startDay}`);
      
      const [endDay, endMonth, endYear] = period.endDate.split('.');
      const endDate = new Date(`${endYear}-${endMonth}-${endDay}`);
      
      return today >= startDate && today <= endDate;
    });
    
    if (currentPeriod) {
      // Форматируем дату для базы данных (YYYY-MM-DD)
      const [endDay, endMonth, endYear] = currentPeriod.endDate.split('.');
      const formattedDate = `${endYear}-${endMonth.padStart(2, '0')}-01`;
      setReportPeriods(formattedDate);
    }
  };


  useEffect(() => {
    const amountMultipliers = {
      '1-2': 1.5,
      '3-5': 4,
      '6 и более': 8,
    };

    const typeMultipliers = {
      'Не типовая': 16,
      'Средняя': 8,
      'Типовая': 4,
    };

    if (typeTest === 'Первая' && typeWork in typeMultipliers && amount in amountMultipliers) {
      const basePoints = typeMultipliers[typeWork];
      const multiplier = amountMultipliers[amount];
      setPoint(basePoints * multiplier);
    }

    const bTypeMultipliers = {
      'Не типовая': 6,
      'Средняя': 4,
      'Типовая': 1,
    };

    if (typeTest === 'Итерация' && typeWork in bTypeMultipliers && amount in amountMultipliers) {
      const basePoints = bTypeMultipliers[typeWork];
      const multiplier = amountMultipliers[amount];
      setPoint(basePoints * multiplier);
    }

    typeTest === "Наша ошибка" ? setPoint(1) : setPoint(0)
    /*#############################*/
    typeTest === "Итерация" ? setIteration("1") : setIteration("0")
    /*#############################*/
    if (typeTest === "Наша ошибка" || typeTest === "Итерация") {
      setService(' ')
      setProduct(' ')
    }
    /*#############################*/
    setRecommenPoint(recommen * 0.1)
    setErrorPoint(errors * 0.5)
    setCriticPoint(critic * 1.0)
    /*#############################*/
    

    setGeneralPoint(recommen * 0.1 + errors * 0.5 + critic * 1.0)
    /*#############################*/
   
  }, [typeTest, typeWork, amount, recommen, errors, critic]);

  function handleChange(event) {
    const selectedExecutor = event.target.value;
    
    fetch(`${process.env.REACT_APP_API_URL}/api/executors`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        Authorization: `Bearer ${token}`,
      }
    })
      .then(res => res.json())
      .then(response => {
        response.forEach(executorElem => {
          if (selectedExecutor === executorElem.executorName) {
            setDepartament(executorElem.executorDepartament);
          }
        });
        setExecutors(response);
    });
    
    setExecutor(selectedExecutor);
    
    setLinkReport(reglament.substr(0, 51));
  }
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Получаем актуальное время в момент отправки
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // Обновляем неделю на текущую
    const currentDay = String(now.getDate()).padStart(2, '0');
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = now.getFullYear();
    const currentDate = `${currentYear}-${currentMonth}-${currentDay}`;
    const currentWeek = calculateWeek(currentDate);

     // Убедимся, что service и product актуальны перед отправкой
    updateServiceAndProduct();

    const item = {
      "reglament": reglament,
      "timeText": currentTime,
      "executor": executor,
      "amount": amount,
      "typeWork": typeWork,
      "typeTest": typeTest,
      "recommen": recommen,
      "errors": errors,
      "critic": critic,
      "recomenPoint": recomenPoint,
      "errorsPoint": errorsPoint,
      "criticPoint": criticPoint,
      "generalPoint": generalPoint,
      "counting": counting,
      "iteration": iteration,
      "point": point,
      "inspector": inspector,
      "departament": departament,
      "delayTester": delayTester,
      "delayExecutor": delayExecutor,
      "commentError": commentError,
      "week": currentWeek,
      "service": service,
      "product": product,
      "linkReport": linkReport,
      "reportPeriods": reportPeriods,
    };
    // console.log('Отправляемые данные с коэффициентами:', item);
    console.log('Отправляемые данные:', item);
    console.log('Service:', service, 'Product:', product);

    fetch(`${process.env.REACT_APP_API_URL}/api/dop`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(item),
    })
      .then((response) => response.json())
      .then((data) => {
          console.log(data);
      })
      .catch((error) => {
          console.error(error);
      });

      //   window.location.reload()
  };

  function clearExecutor() {
    setExecutor('');
    setDepartament('');
    setService('');
    setProduct('');
    const btnClear = document.querySelector('.btn__clear');
    btnClear.style.display = '';
    localStorage.removeItem('executor');
  }

  function clearForm() {
    //   window.location.reload()
  }

  return (
  <div className="ad__container">
    <button className='clear__form' onClick={clearForm}>🗑️ Очистить форму</button>
    <form onSubmit={handleSubmit} className="form__global">
        <div className="point__work">
            <span className='options__work'>Ссылка на регламент</span>
            <input 
              required 
              value={reglament} 
              onChange={(e) => setReglament(e.target.value)} 
              className="reglament" 
              type="text" 
              placeholder="Введите ссылку на регламент"
            />
        </div>
        
        <div className="point__work">
            <span className='options__work'>Проверяющий</span>
            <input 
              disabled 
              value={inspector} 
              onChange={(e) => setInspector(e.target.value)} 
              className="main__input" 
              type="text" 
              placeholder="Проверяющий"
            />
        </div>
        
        <div className="point__work">
            <div className="point__work-utils">
              <span className="options__work">Исполнители</span>
              <span className="btn__clear" onClick={clearExecutor}>
                  <img src={closeImg} alt="Очистить" />
              </span>
            </div>
            <input 
              required 
              value={executor} 
              onChange={handleExecutorChange} 
              className='executor' 
              type="text" 
              list='Исполнители' 
              placeholder="Выберите исполнителя"
            />
            <datalist id='Исполнители'>
                {executorList.map((executorElement, id) => {
                    return (
                        <option key={id} value={executorElement.executorName}></option>
                    );
                })}
            </datalist>
        </div>
        
        <div className="point__work">
            <span className="options__work">Вид работ</span>
            <input 
              className='type__work' 
              required 
              type="text" 
              list='ВидРабот' 
              value={typeWork} 
              onChange={(e) => setTypeWork(e.target.value)} 
              placeholder="Выберите вид работ"
            />
            <datalist id='ВидРабот'>
                <option value="Типовая"></option>
                <option value="Не типовая"></option>
                <option value="Средняя"></option>
            </datalist>
        </div>
        
        <div className="point__work">
            <span className="options__work">Кол-во работ в рег-те</span>
            <input 
              className='amount' 
              required 
              type="text" 
              list='КоличествоРабот' 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="Выберите количество"
            />
            <datalist id='КоличествоРабот'>
                <option value="1-2"></option>
                <option value="3-5"></option>
                <option value="6 и более"></option>
            </datalist>
        </div>
        
        <div className="point__work">
            <span className="options__work">Вид проверки</span>
            <input 
              className='type__test' 
              required 
              type="text" 
              list='ВидПроверки' 
              value={typeTest} 
              onChange={(e) => setTypeTest(e.target.value)} 
              placeholder="Выберите вид проверки"
            />
            <datalist id='ВидПроверки'>
                <option value="Первая"></option>
                <option value="Итерация"></option>
                <option value="Наша ошибка"></option>
            </datalist>
        </div>
        
        <div className="point__work">
            <span className="options__work">Рекомендации</span>
            <div className="point__wrapp">
                <input 
                  value={recommen} 
                  onChange={(e) => setRecommen(e.target.value)} 
                  className="main__input point__input" 
                  type="text" 
                  min="0"
                  placeholder="0"
                />
            </div>
        </div>
        
        <div className="point__work">
            <span className="options__work">Ошибки</span>
            <div className="point__wrapp">
                <input 
                  value={errors} 
                  onChange={(e) => setErrors(e.target.value)} 
                  className="main__input point__input" 
                  type="text" 
                  min="0"
                  placeholder="0"
                />
            </div>
        </div>
        
        <div className="point__work">
            <span className="options__work">Критические ошибки</span>
            <div className="point__wrapp">
                <input 
                  value={critic} 
                  onChange={(e) => setCritic(e.target.value)} 
                  className="main__input point__input" 
                  type="text" 
                  min="0"
                  placeholder="0"
                />
            </div>
        </div>
        
        <div className="counting__wrapp">
            <span className="options__work">Отчет<span className='red__star'>*</span></span>
            <textarea 
              className='counting' 
              required 
              type="text" 
              value={counting} 
              onChange={(e) => setCounting(e.target.value)} 
              placeholder="Введите отчет о работе..."
            />
        </div>
        
        <div className="point__work">
            <span className="options__work">Просрочка исполнителя</span>
            <input 
              className='main__input' 
              type="text" 
              list='ПросрочкаИсполнителя' 
              value={delayExecutor} 
              onChange={(e) => setDelayExecutor(e.target.value)} 
              placeholder="Тип просрочки"
            />
            <datalist id='ПросрочкаИсполнителя'>
                <option value="Внутренняя"></option>
                <option value="Внешняя"></option>
                <option value="Ответственный"></option>
            </datalist>
        </div>
        
        <div className="point__work">
            <span className="options__work">Просрочка тестировщика</span>
            <input 
              className='main__input' 
              type="text" 
              list='ПросрочкаТестировщика' 
              value={delayTester} 
              onChange={(e) => setDelayTester(e.target.value)} 
              placeholder="Тип просрочки"
            />
            <datalist id='ПросрочкаТестировщика'>
                <option value="Внутренняя"></option>
                <option value="Внешняя"></option>
            </datalist>
        </div>
        
        <button type="submit" className="btn__main">📤 Отправить данные</button>
    </form>
  </div>
  )
}

export default DopForm;
