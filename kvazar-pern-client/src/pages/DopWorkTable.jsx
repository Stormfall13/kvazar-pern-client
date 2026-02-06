import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

import columns from '../utils/columnDopTable'
import { formatWeekForDisplay } from '../utils/weekCalculator';
import './table.css';

import { serviceDepartments, productDepartments } from '../utils/executorBase';

const DopWorkTable = () => {
  const [reglist, setRegList] = useState([]);
  const [executors, setExecutors] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [favorites, setFavorites] = useState(new Set()); // Для хранения ID избранных записей
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [executorDepartament, setExecutorDepartament] = useState([]);
  
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Новые состояния для CSV
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!user) return;

    const allowedRoles = ["user", "admin"];
    if (!allowedRoles.includes(user.role)) {
      navigate("/");
      return;
    }

    getReglamentAll();
  }, [token, user, navigate]);

  // Функция для определения service и product на основе отдела и ошибок
  const updateServiceProduct = (departament, errors, typeTest) => {
    if (typeTest === 'Наша ошибка' || typeTest === 'Итерация') {
      return { service: '', product: '' };
    }

    const errorCount = parseInt(errors) || 0;
    
    if (serviceDepartments.includes(departament)) {
      // Если ошибок 0, ставим 1, иначе ставим количество ошибок
      const serviceValue = errorCount === 0 ? '1' : String(errorCount);
      return { service: serviceValue, product: '' };
    } else if (productDepartments.includes(departament)) {
      // Если ошибок 0, ставим 1, иначе ставим количество ошибок
      const productValue = errorCount === 0 ? '1' : String(errorCount);
      return { service: '', product: productValue };
    } else {
      return { service: '', product: '' };
    }
  };

  useEffect(() => {
    if (token && user) {
      loadExecutors();
    }
  }, [token, user]);

  
  // Функция для отображения недели
  const renderWeekCell = (weekDateString) => {
    return formatWeekForDisplay(weekDateString);
  };

  // Функция для получения уникальных дат из данных
  useEffect(() => {
    if (reglist.length > 0) {
      const dates = [...new Set(reglist.map(item => item.reportPeriods))].filter(date => date).sort();
      setAvailableDates(dates);
      if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dates[0]); // Установить первую дату по умолчанию
      }
    }
  }, [reglist]);

  // Функция для скачивания CSV
  const downloadCSV = () => {
      if (!selectedDate) {
        alert('Пожалуйста, выберите дату для отчета');
        return;
      }

      // Фильтруем данные по выбранной дате
      const filteredData = reglist.filter(item => item.reportPeriods === selectedDate);
      
      if (filteredData.length === 0) {
        alert('Нет данных для выбранной даты');
        return;
      }

      // Создаем заголовки CSV
      const headers = [
        'ID',
        'Дата',
        'Время',
        'Регламент',
        'Исполнитель',
        'Кол-во работ',
        'Вид работ',
        'Вид проверки',
        'Рекомендации',
        'Ошибки',
        'Критические ошибки',
        'Рек. баллы',
        'Ош. баллы',
        'Крит. баллы',
        'Общий балл',
        'Отчет',
        'Итерации',
        'Баллы',
        'Проверяющий',
        'Отдел',
        'Просрочка тест.',
        'Просрочка исп.',
        'Снято баллов',
        'Спор',
        'Комментарий ошибки',
        'Ссылка на отчет',
        'Отчет времени',
        'Сервис',
        'Продукт',
      ];

      // Создаем строки данных
      const csvRows = filteredData.map(item => [
        item.id || '',
        item.date || '',
        item.timeText || '',
        `"${(item.reglament || '').replace(/"/g, '""')}"`,
        `"${(item.executor || '').replace(/"/g, '""')}"`,
        item.amount || '',
        item.typeWork || '',
        item.typeTest || '',
        item.recommen || 0,
        item.errors || 0,
        item.critic || 0,
        item.recomenPoint || 0,
        item.errorsPoint || 0,
        item.criticPoint || 0,
        item.generalPoint || 0,
        `"${(item.counting || '').replace(/"/g, '""')}"`,
        item.iteration || 0,
        item.point || 0,
        `"${(item.inspector || '').replace(/"/g, '""')}"`,
        `"${(item.departament || '').replace(/"/g, '""')}"`,
        item.delayTester || '',
        item.delayExecutor || '',
        item.pointsRemove || 0,
        item.dispute || 0,
        `"${(item.commentError || '').replace(/"/g, '""')}"`,
        `"${(item.linkReport || '').replace(/"/g, '""')}"`,
        item.reportPeriods || '',
        item.service || '',
        item.product || '' 
      ]);

      // Объединяем заголовки и данные
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      // Создаем Blob и скачиваем
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `отчет_${selectedDate}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowDatePicker(false);
    };

    // Функция для открытия/закрытия выбора даты
    const toggleDatePicker = () => {
      setShowDatePicker(!showDatePicker);
  };


  // Функции для перетаскивания
  const handleMouseDown = (e) => {
    if (!e.target.closest('.floating-btn')) { // Не начинать перетаскивание при клике на кнопки
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - clickPosition.x,
        y: e.clientY - clickPosition.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Ограничиваем позицию в пределах экрана
      const maxX = window.innerWidth - 300; // Ширина floating-actions
      const maxY = window.innerHeight - 200; // Высота floating-actions
      
      setClickPosition({
        x: Math.max(10, Math.min(newX, maxX)),
        y: Math.max(10, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Добавь обработчики событий
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Закрываем кнопки при клике вне области
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.floating-actions') && !e.target.closest('.table-row')) {
        setSelectedRow(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getReglamentAll = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/dop`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Ошибка загрузки данных");
      const data = await res.json();
      setRegList(data);
    } catch (error) {
      console.error("Ошибка:", error);
    }
  };

  /*########### Функции редактирования #############*/

  const handleEdit = (item) => {
    // Определяем service и product для редактируемой записи
    const currentTypeTest = item.typeTest || '';
    const { service, product } = updateServiceProduct(
      item.departament, 
      item.errors,
      currentTypeTest
    );
    
    setEditItem(item);
    setEditFormData({ 
      ...item,
      service: service,
      product: product
    });
    setIsEditing(true);
    setSelectedRow(null);

    // Автоматически заполняем отдел если не заполнен
    if (!item.departament && item.executor && executors.length > 0) {
      const foundExecutor = executors.find(exec => 
        exec.executorName === item.executor
      );
      
      if (foundExecutor && foundExecutor.executorDepartament) {
        setEditFormData(prev => ({
          ...prev,
          departament: foundExecutor.executorDepartament,
          // Обновляем service и product при установке отдела
          ...updateServiceProduct(foundExecutor.executorDepartament, item.errors, currentTypeTest)
        }));
      }
    }
  };

  // Обновлена функция handleSaveEdit с правильными service и product
  const handleSaveEdit = async () => {
    try {
      // Перед сохранением определяем service и product
      const currentTypeTest = editFormData.typeTest || '';
      const { service, product } = updateServiceProduct(
        editFormData.departament, 
        editFormData.errors,
        currentTypeTest
      );

      const finalFormData = {
        ...editFormData,
        service, // Устанавливаем вычисленный service
        product  // Устанавливаем вычисленный product
      };

      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/dop/${editItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(finalFormData),
      });

      if (!res.ok) throw new Error("Ошибка обновления");

      const updatedItem = await res.json();
      
      setRegList(prev => prev.map(item => 
        item.id === editItem.id ? { ...updatedItem.dopWork, service, product } : item
      ));
      
      cancelEdit();
      await getReglamentAll();
    } catch (error) {
      console.error("Ошибка при сохранении:", error);
      alert("Ошибка при сохранении изменений");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту запись?")) {
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/dop/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Ошибка удаления");

      setRegList(prev => prev.filter(item => item.id !== id));
      setSelectedRow(null); // Закрываем кнопки после удаления
      
      if (editItem && editItem.id === id) {
        cancelEdit();
      }
    } catch (error) {
      console.error("Ошибка при удалении:", error);
      alert("Ошибка при удалении записи");
    }
  };

  /*##### АВТО ИЗМЕНЕНИЕ ОТДЕЛА ПОД ИСПОЛНИТЕЛЯ #####*/
  const loadExecutors = async () => {
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
      setExecutors(data);
    } catch (error) {
      console.error("Ошибка загрузки исполнителей:", error);
    }
  };

  const cancelEdit = () => {
    setEditItem(null);
    setEditFormData({});
    setIsEditing(false);
  };

  // Функция для расчета основных баллов (point) по типу проверки
  const calculateMainPoints = (typeTest, typeWork, amount) => {
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

    const bTypeMultipliers = {
      'Не типовая': 6,
      'Средняя': 4,
      'Типовая': 1,
    };

    if (typeTest === 'Первая') {
      const basePoints = typeMultipliers[typeWork] || 0;
      const multiplier = amountMultipliers[amount] || 0;
      return basePoints * multiplier;
    }

    if (typeTest === 'Итерация') {
      const basePoints = bTypeMultipliers[typeWork] || 0;
      const multiplier = amountMultipliers[amount] || 0;
      return basePoints * multiplier;
    }

    if (typeTest === 'Наша ошибка') {
      return 1;
    }

    return 0;
  };

  // Функция перерасчета коэффицентов
  const calculatePointsForEdit = (recommen, errors, critic) => {
    const recomenVal = parseFloat(recommen) || 0;
    const errorsVal = parseFloat(errors) || 0;
    const criticVal = parseFloat(critic) || 0;
    
    const recomenPoint = recomenVal * 0.1;
    const errorsPoint = errorsVal * 0.5;
    const criticPoint = criticVal * 1;
    const generalPoint = recomenPoint + errorsPoint + criticPoint;
    
    return {
      recomenPoint: parseFloat(recomenPoint.toFixed(2)),
      errorsPoint: parseFloat(errorsPoint.toFixed(2)),
      criticPoint: parseFloat(criticPoint.toFixed(2)),
      generalPoint: parseFloat(generalPoint.toFixed(2))
    };
  };

  // Обновлена функция handleInputChange с обновлением service и product
  const handleInputChange = (field, value) => {
    const newFormData = {
      ...editFormData,
      [field]: value
  };

  // Если меняется тип проверки на "Наша ошибка" или "Итерация" - очищаем service и product
  if (field === 'typeTest' && (value === 'Наша ошибка' || value === 'Итерация')) {
    newFormData.service = '';
    newFormData.product = '';
  }

  // Если меняется тип проверки на "Первая" - пересчитываем service и product
  if (field === 'typeTest' && value === 'Первая') {
    const { service, product } = updateServiceProduct(
      newFormData.departament || editFormData.departament,
      newFormData.errors || editFormData.errors,
      value // Теперь передаем новый typeTest
    );
    newFormData.service = service;
    newFormData.product = product;
  }

  // Если меняется исполнитель - автоматически подставляем отдел
  if (field === 'executor' && value) {
    const foundExecutor = executors.find(exec => 
      exec.executorName === value
    );
    
    if (foundExecutor && foundExecutor.executorDepartament) {
      newFormData.departament = foundExecutor.executorDepartament;

      // Автоматически обновляем service и product при смене исполнителя
      const currentTypeTest = newFormData.typeTest || editFormData.typeTest || '';
      const { service, product } = updateServiceProduct(
          foundExecutor.executorDepartament, 
          newFormData.errors || editFormData.errors,
          currentTypeTest
        );
      newFormData.service = service;
      newFormData.product = product;
        
    }
  }

  // Если меняется количество ошибок - обновляем service и product
  if (field === 'errors') {
    const errorCount = parseInt(value) || 0;
    const dept = newFormData.departament || editFormData.departament;
    // Получаем typeTest из newFormData или editFormData
    const typeTest = newFormData.typeTest || editFormData.typeTest || '';
    
    const { service, product } = updateServiceProduct(dept, errorCount, typeTest);
    newFormData.service = service;
    newFormData.product = product;
  }

  // Если меняется отдел вручную - обновляем service и product
    if (field === 'departament') {
      const typeTest = newFormData.typeTest || editFormData.typeTest;
      const errors = newFormData.errors || editFormData.errors;
      
      // Передаем typeTest
      const { service, product } = updateServiceProduct(value, errors, typeTest);
      newFormData.service = service;
      newFormData.product = product;
    }

  // Если меняются поля, влияющие на основные баллы - пересчитываем point
  if (['typeTest', 'typeWork', 'amount'].includes(field)) {
    const calculatedPoint = calculateMainPoints(
      field === 'typeTest' ? value : newFormData.typeTest,
      field === 'typeWork' ? value : newFormData.typeWork,
      field === 'amount' ? value : newFormData.amount
    );
    
    newFormData.point = calculatedPoint;

    // Если меняется typeTest, пересчитываем итерации
    if (field === 'typeTest') {
      newFormData.iteration = value === 'Итерация' ? '1' : '0';
    }
  }

  // Если меняются поля рекомендаций, ошибок или критических - пересчитываем баллы
  if (['recommen', 'errors', 'critic'].includes(field)) {
      const calculated = calculatePointsForEdit(
        field === 'recommen' ? value : newFormData.recommen,
        field === 'errors' ? value : newFormData.errors,
        field === 'critic' ? value : newFormData.critic
      );
      
      newFormData.recomenPoint = calculated.recomenPoint;
      newFormData.errorsPoint = calculated.errorsPoint;
      newFormData.criticPoint = calculated.criticPoint;
      newFormData.generalPoint = calculated.generalPoint;
    }

    setEditFormData(newFormData);
  };

  // Обработчик клика по строке
  const handleRowClick = (item, e) => {
    if (isEditing) return; // Не реагируем на клики во время редактирования
    
    // Если кликаем по той же строке - закрываем кнопки
    if (selectedRow === item.id) {
      setSelectedRow(null);
    } else {
      setSelectedRow(item.id);
      setClickPosition({ x: e.clientX, y: e.clientY });
    }
  };

  /*########### Остальной код фильтров и сортировки остается без изменений #############*/

  const [columnFilters, setColumnFilters] = useState(() => {
    const saved = localStorage.getItem('dopColumnFilters');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('dopColumnFilters', JSON.stringify(columnFilters));
  }, [columnFilters]);

  const applyColumnFilters = (data) => {
    return data.filter(item => {
      return Object.entries(columnFilters).every(([column, filterValue]) => {
        if (!filterValue) return true;
        const value = item[column];
        if (!value) return false;
        return value.toString().toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  };

  const handleColumnFilter = (column, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const clearColumnFilter = (column) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setSearchTerm('');
    setHighlightedId(null);
  };

  const [sortField, setSortField] = useState(localStorage.getItem('dopSortField') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(localStorage.getItem('dopSortOrder') || 'desc');
  const [searchTerm, setSearchTerm] = useState(localStorage.getItem('dopSearchTerm') || '');
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    localStorage.setItem('dopSortField', sortField);
    localStorage.setItem('dopSortOrder', sortOrder);
    localStorage.setItem('dopSearchTerm', searchTerm);
  }, [sortField, sortOrder, searchTerm]);

  const sortedData = [...reglist].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField === 'date' || sortField === 'createdAt' || sortField === 'reportPeriods') {
      aValue = new Date(aValue || 0);
      bValue = new Date(bValue || 0);
    }
    
    if (['point', 'recommen', 'errors', 'critic', 'pointsRemove', 'iteration', 'dispute'].includes(sortField)) {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredData = applyColumnFilters(sortedData)
    .filter(item => 
      searchTerm ? Object.values(item).some(value => 
        value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      ) : true
    )
    .filter(item => 
      showOnlyFavorites ? favorites.has(item.id) : true // Добавь эту строку
  );
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    const dataToSearch = applyColumnFilters(sortedData);
    const foundItem = dataToSearch.find(item => 
      Object.values(item).some(value => 
        value && value.toString().toLowerCase().includes(term.toLowerCase())
      )
    );
    setHighlightedId(foundItem?.id || null);
  };

  const resetSort = () => {
    setSortField('createdAt');
    setSortOrder('desc');
  };

  const resetSearch = () => {
    setSearchTerm('');
    setHighlightedId(null);
  };

  useEffect(() => {
    if (highlightedId) {
      setTimeout(() => {
        const element = document.querySelector(`.table-row.highlighted`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [highlightedId, filteredData]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const renderCellContent = (item, column) => {
    // Обработка колонки недели
    if (column.key === 'week') {
      if (isEditing && editItem?.id === item.id) {
        return (
          <input
            type="text"
            value={formatWeekForDisplay(editFormData[column.key]) || ''}
            onChange={(e) => {
              // Здесь можно добавить логику для изменения недели
              // Но обычно неделя не редактируется вручную
              handleInputChange(column.key, e.target.value);
            }}
            className="edit-input"
            placeholder="Неделя"
            readOnly // Сделать readOnly если не нужно редактировать
          />
        );
      }
      return renderWeekCell(item[column.key]);
    }

    // Обработка колонки избранного
    if (column.key === 'favorite') {
      return (
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Предотвращаем всплытие клика на строку
            toggleFavorite(item.id);
          }}
          className={`favorite-star-btn ${favorites.has(item.id) ? 'favorite-active' : ''}`}
          title={favorites.has(item.id) ? "Удалить из избранного" : "Добавить в избранное"}
        >
          {favorites.has(item.id) ? '⭐' : '☆'}
        </button>
      );
    }

    // Добавляем service и product в отображение (только для дебага или админа)
    if (column.key === 'service' || column.key === 'product') {
      if (isEditing && editItem?.id === item.id) {
        return (
          <span className="service-product-badge">
            {editFormData[column.key] || ' '}
          </span>
        );
      }
      return (
        <span className="service-product-badge">
           {item[column.key] || ' '}
        </span>
      );
    }

    if (isEditing && editItem?.id === item.id) {
      if (column.key === 'executor') {
        return (
          <>
            <input
              type="text"
              value={editFormData[column.key] || ''}
              onChange={(e) => handleInputChange(column.key, e.target.value)}
              className="edit-input"
              list="executors-list"
              placeholder="Выберите исполнителя"
            />
            <datalist id="executors-list">
              {executors.map(exec => (
                <option key={exec.id} value={exec.executorName}>
                  {exec.executorName} ({exec.executorDepartament})
                </option>
              ))}
            </datalist>
          </>
        );
      }
      if (['amount', 'typeWork', 'typeTest'].includes(column.key)) {
        return (
          <>
            <input
              type="text"
              value={editFormData[column.key] || ''}
              onChange={(e) => handleInputChange(column.key, e.target.value)}
              className="edit-input"
              list={`edit-${column.key}-list`}
              placeholder={`Выберите ${column.label.toLowerCase()}`}
            />
            <datalist id={`edit-${column.key}-list`}>
              {column.key === 'amount' && (
                <>
                  <option value="1-2" />
                  <option value="3-5" />
                  <option value="6 и более" />
                </>
              )}
              {column.key === 'typeWork' && (
                <>
                  <option value="Типовая" />
                  <option value="Не типовая" />
                  <option value="Средняя" />
                </>
              )}
              {column.key === 'typeTest' && (
                <>
                  <option value="Первая" />
                  <option value="Итерация" />
                  <option value="Наша ошибка" />
                </>
              )}
            </datalist>
          </>
        );
      }
  
      return (
        <input
          type="text"
          value={editFormData[column.key] || ''}
          onChange={(e) => handleInputChange(column.key, e.target.value)}
          className="edit-input"
          placeholder={`Введите ${column.label.toLowerCase()}`}
        />
      );
  }

    if (column.key === 'date') {
      return formatDate(item[column.key]);
    } else if ((column.key === 'reglament' || column.key === 'linkReport') && isValidUrl(item[column.key])) {
      return (
        <a href={item[column.key]} target="_blank" rel="noopener noreferrer" className="link">
          {truncateText(item[column.key], 30)}
        </a>
      );
    } else if (column.key === 'counting' || column.key === 'commentError') {
      return truncateText(item[column.key], 30);
    } else {
      return item[column.key] || '0';
    }
  };

  // Функция проверки избранного
  const checkIsFavorite = async (dopId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/favorites/check/${dopId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        return data.isFavorite;
      }
      return false;
    } catch (error) {
      console.error("Ошибка проверки избранного:", error);
      return false;
    }
  };

    // Функция загрузки избранного при монтировании
    useEffect(() => {
      if (token && user) {
        loadFavorites();
        loadExecutors();
      }
    }, [token, user]);

    const loadFavorites = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/favorites`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (res.ok) {
      const data = await res.json();
      const favoriteIds = new Set(data.map(item => item.id));
      setFavorites(favoriteIds);
    }
  } catch (error) {
    console.error("Ошибка загрузки избранного:", error);
  }
};

// Функция добавления/удаления из избранного
const toggleFavorite = async (dopId) => {
  try {
    const isCurrentlyFavorite = favorites.has(dopId);
    
    if (isCurrentlyFavorite) {
      // Удаляем из избранного - ИСПРАВЬ ENDPOINT
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/favorites/remove/${dopId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(dopId);
          return newFavorites;
        });
      }
    } else {
        // Добавляем в избранное - ИСПРАВЬ ENDPOINT
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/favorites/add/${dopId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (res.ok) {
          setFavorites(prev => new Set(prev).add(dopId));
        } else if (res.status === 400) {
          alert("Уже в избранном");
        }
      }
    } catch (error) {
      console.error("Ошибка работы с избранным:", error);
    }
  };

  return (
    <div className="table__container">
      <div className="table-header">
        <Link to="/dop-form" className="form-link">Форма</Link>
        <h1>Таблица дополнительных работ</h1>
        {isEditing && (
          <div className="edit-notice">
            ⚠️ Режим редактирования. Редактируете запись ID: {editItem?.id}
          </div>
        )}
      </div>

      <div className="controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Глобальный поиск по всем полям..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={resetSearch} className="reset-btn">
              ✕
            </button>
          )}
        </div>
        
        <div className="sort-section">
              <label className="favorites-filter">
                <input
                  type="checkbox"
                  checked={showOnlyFavorites}
                  onChange={(e) => setShowOnlyFavorites(e.target.checked)}
                />
                <span className="favorites-filter-label">
                  {showOnlyFavorites ? '⭐' : '☆'}
                </span>
              </label>
          <select 
            value={sortField} 
            onChange={(e) => handleSort(e.target.value)}
            className="sort-select"
          >
            {columns.map(col => (
              <option key={col.key} value={col.key}>{col.label}</option>
            ))}
          </select>
          
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
          
          <button onClick={resetSort} className="reset-btn">
            Сбросить сортировку
          </button>

          {/* Новая кнопка скачивания CSV */}
          <div className="csv-download-section">
            <button 
              onClick={toggleDatePicker} 
              className="csv-download-btn"
              title="Скачать CSV отчет"
            >
              📊 Скачать CSV
            </button>
            
            {showDatePicker && (
              <div className="date-picker-modal">
                <div className="date-picker-content">
                  <h3>Выберите дату для отчета</h3>
                  <select 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="date-select"
                  >
                    <option value="">Выберите дату...</option>
                    {availableDates.map(date => (
                      <option key={date} value={date}>
                        {new Date(date).toLocaleDateString('ru-RU')}
                      </option>
                    ))}
                  </select>
                  <div className="date-picker-actions">
                    <button 
                      onClick={downloadCSV} 
                      className="confirm-download-btn"
                      disabled={!selectedDate}
                    >
                      📥 Скачать
                    </button>
                    <button 
                      onClick={() => setShowDatePicker(false)} 
                      className="cancel-download-btn"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {(searchTerm || Object.keys(columnFilters).length > 0) && (
            <button onClick={clearAllFilters} className="reset-btn reset-all-btn">
              Сбросить все фильтры
            </button>
          )}
        </div>
      </div>
      
      {/* Заголовки колонок с фильтрами */}
      <div className="table-header-row">
        {columns.map(column => (
          <div 
            key={column.key} 
            className={`header-cell ${columnFilters[column.key] ? 'active-filter' : ''}`}
            style={{ width: column.width }}
          >
            <div className="header-content">
              <span>{column.label}</span>
              <div className="filter-wrapper">
                <input
                  type="text"
                  placeholder="Фильтр..."
                  value={columnFilters[column.key] || ''}
                  onChange={(e) => handleColumnFilter(column.key, e.target.value)}
                  className="column-filter-input"
                  list={`datalist-${column.key}`}
                />
                {columnFilters[column.key] && (
                  <button 
                    onClick={() => clearColumnFilter(column.key)}
                    className="clear-filter-btn"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            <datalist id={`datalist-${column.key}`}>
              {[...new Set(reglist.map(item => item[column.key]))]
                .filter(value => value)
                .map((value, index) => (
                  <option key={index} value={value} />
                ))}
            </datalist>
          </div>
        ))}
      </div>

      {/* Данные */}
      <div className="table-body">
        {filteredData.map((item) => ( 
          <div 
            key={item.id} 
            className={`table-row ${highlightedId === item.id ? 'highlighted' : ''} ${
              isEditing && editItem?.id === item.id ? 'editing' : ''
            } ${selectedRow === item.id ? 'selected' : ''}`}
            onClick={(e) => handleRowClick(item, e)}
          >
            {columns.map(column => (
              <div 
                key={column.key} 
                className="data-cell"
                style={{ width: column.width }}
                title={item[column.key]}
              >
                {renderCellContent(item, column)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Плавающие кнопки действий при клике */}
      {selectedRow && !isEditing && (
        <div 
          className={`floating-actions ${isDragging ? 'dragging' : ''}`}
          style={{
            left: clickPosition.x,
            top: clickPosition.y,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="floating-actions-header">
            <span>Действия {isDragging && '⤴'}</span>
            <button 
              onClick={() => setSelectedRow(null)}
              className="close-actions-btn"
              title="Закрыть"
            >
              ✕
            </button>
          </div>
          <div className="floating-actions-buttons">
            <button 
              onClick={() => handleEdit(filteredData.find(item => item.id === selectedRow))} 
              className="floating-btn floating-edit"
              title="Редактировать"
            >
              ✏️ Редактировать
            </button>
                <button 
                onClick={() => toggleFavorite(selectedRow)} 
                className={`floating-btn ${favorites.has(selectedRow) ? 'favorite-remove' : 'favorite-add'}`}
                title={favorites.has(selectedRow) ? "Удалить из избранного" : "Добавить в избранное"}
              >
                {favorites.has(selectedRow) ? '⭐ Удалить из избранного' : '☆ Добавить в избранное'}
              </button>
            <button 
              onClick={() => handleDelete(selectedRow)} 
              className="floating-btn floating-delete"
              title="Удалить"
            >
              🗑️ Удалить
            </button>
          </div>
        </div>
      )}

      {/* Кнопки действий при редактировании */}
      {isEditing && (
        <div 
          className="floating-actions editing-actions"
          style={{
            left: '50%',
            top: '100px',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="floating-actions-header">
            <span>Редактирование записи ID: {editItem?.id}</span>
          </div>
          <div className="floating-actions-buttons">
            <button onClick={handleSaveEdit} className="floating-btn floating-save" title="Сохранить">
              💾 Сохранить
            </button>
            <button onClick={cancelEdit} className="floating-btn floating-cancel" title="Отменить">
              ❌ Отменить
            </button>
          </div>
        </div>
      )}

      {filteredData.length === 0 && (
        <div className="empty-state">
          {searchTerm ? 'Ничего не найдено' : 'Нет данных для отображения'}
        </div>
      )}
    </div>
  );
};

export default DopWorkTable;