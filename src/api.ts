// src/api.ts

const API_BASE_URL = 'http://localhost:8000'; // URL вашего FastAPI

// Функция для получения токена из localStorage и добавления его в заголовки
const getAuthHeaders = () => {
  const token = localStorage.getItem('hh_access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// 1. Получить список вакансий
export const fetchHHVacanciesFromBackend = async () => {
  const response = await fetch(`${API_BASE_URL}/api/hh/vacancies`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Ошибка сети при загрузке вакансий');
  return response.json();
};

// 2. Получить детали конкретной вакансии (ИМЕННО ЭТОЙ ФУНКЦИИ НЕ ХВАТАЛО)
export const fetchHHVacancyDetailsFromBackend = async (vacancyId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/hh/vacancy/${vacancyId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Ошибка сети при загрузке деталей вакансии');
  return response.json();
};

export const fetchCollectionsForVacancy = async (vacancyId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/hh/negotiations/collections?vacancy_id=${vacancyId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Ошибка при загрузке коллекций');
  return response.json();
};


// 4. Получить отклики из конкретной коллекции
export const fetchNegotiationsByCollection = async (vacancyId: string, collectionId: string) => {
  const token = localStorage.getItem('hh_access_token');
  const response = await fetch(
    `http://localhost:8000/api/hh/negotiations?vacancy_id=${vacancyId}&collection_id=${collectionId}`,
    {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
    }
  );
  console.log(token)
  if (!response.ok) throw new Error('Ошибка при загрузке откликов');
  return response.json();
};

// src/api.ts

export const fetchNegotiationsPage = async (collectionUrl: string, page: number) => {
    const token = localStorage.getItem('hh_access_token');
    const response = await fetch(
        `${API_BASE_URL}/api/hh/negotiations/page?collection_url=${encodeURIComponent(collectionUrl)}&page=${page}`,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        }
    );
    return response.json();
};