import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import './table.css';

// Импортируем колонки для разных типов данных
import dopColumns from '../utils/columnDopTable';
// import siteColumns from '../utils/columnSiteTable'; // Потом добавим

const Favorites = () => {
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTable, setActiveTable] = useState('dop'); // 'dop' или 'sites'
  
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);

  // Определяем колонки в зависимости от активной таблицы
  const getColumns = () => {
    switch (activeTable) {
      case 'dop':
        // ВОЗВРАЩАЕМ ВСЕ КОЛОНКИ КРОМЕ ИЗБРАННОГО
        return dopColumns.filter(col => col.key !== 'favorite');
      // case 'sites':
      //   return siteColumns.filter(col => col.key !== 'favorite');
      default:
        return dopColumns.filter(col => col.key !== 'favorite');
    }
  };

  const columns = getColumns();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    loadFavorites();
  }, [token, navigate, activeTable]);

  const loadFavorites = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/favorites`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Ошибка загрузки избранного");
      const data = await res.json();
      setFavoriteItems(data);
    } catch (error) {
      console.error("Ошибка:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (itemId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/favorites/remove/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Ошибка удаления");
      
      // Обновляем список
      setFavoriteItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error("Ошибка:", error);
    }
  };

  const removeAllFavorites = async () => {
    if (!window.confirm("Вы уверены, что хотите удалить все избранные записи?")) return;
    
    try {
      const results = await Promise.all(
        favoriteItems
          .filter(item => item !== null)
          .map(item => 
            fetch(`${process.env.REACT_APP_API_URL}/api/favorites/remove/${item.id}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
          )
      );

      if (results.every(res => res.ok)) {
        setFavoriteItems([]);
      } else {
        console.error("Ошибка при удалении некоторых записей");
      }
    } catch (error) {
      console.error("Ошибка:", error);
    }
  };

  // Вспомогательные функции
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

  if (!user) {
    return <h2>Загрузка...</h2>;
  }

  if (loading) {
    return (
      <div className="table__container">
        <div className="table-header">
          <Link to="/dop-work" className="form-link">← Назад к таблице</Link>
          <h1>Избранное</h1>
        </div>
        <div className="empty-state">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="table__container">
      <div className="table-header">
        <Link to="/dop-work" className="form-link">← Назад к таблице</Link>
        <h1>Избранное</h1>
        {favoriteItems.length > 0 && (
          <button 
            onClick={removeAllFavorites}
            className="btn-delete"
            style={{ marginLeft: 'auto' }}
          >
            🗑️ Удалить все
          </button>
        )}
      </div>

      {favoriteItems.length > 0 ? (
        <div className="table-section">
          <h2 className="table-section-title">
            Дополнительные работы
          </h2>
          
          <div className="table-body favorites-table">
            <div className="table-header-row">
              {columns.map(column => (
                <div 
                  key={column.key} 
                  className="header-cell"
                  style={{ width: column.width }}
                >
                  <div className="header-content">
                    <span>{column.label}</span>
                  </div>
                </div>
              ))}
              <div className="header-cell" style={{ width: '100px' }}>Действия</div>
            </div>
            
            {favoriteItems.filter(item => item !== null).map((item) => (
              <div key={item.id} className="table-row favorite-row">
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
                <div className="data-cell actions-cell" style={{ width: '100px' }}>
                  <button 
                    onClick={() => removeFromFavorites(item.id)}
                    className="btn-delete"
                    title="Удалить из избранного"
                  >
                    🗑️ Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          В избранном пока ничего нет
        </div>
      )}
    </div>
  );
};

export default Favorites;