export const calculateWeek = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  const dayOfWeek = date.getDay();
  const monday = new Date(date);
  
  if (dayOfWeek === 0) {
    monday.setDate(date.getDate() + 1);
  } else if (dayOfWeek === 6) {
    monday.setDate(date.getDate() + 2);
  } else {
    monday.setDate(date.getDate() - (dayOfWeek - 1));
  }

  const formatForDB = (dateObj) => {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${year}-${month}-${day}`;
  };

  return formatForDB(monday);
};

export const formatWeekForDisplay = (weekDateString) => {
  if (!weekDateString) return '';
  
  const date = new Date(weekDateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}.${month}.${year}`;
};

// Дополнительная функция для получения диапазона недели
export const getWeekRange = (weekDateString) => {
  if (!weekDateString) return '';
  
  const monday = new Date(weekDateString);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  
  const formatDate = (dateObj) => {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}.${month}.${year}`;
  };
  
  return `${formatDate(monday)} - ${formatDate(friday)}`;
};