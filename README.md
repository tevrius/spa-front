# Mountain & Sea Spa — склад и закупки

React-приложение управляющего для контроля запасов, рисков, расчёта закупки, бюджета и общения с помощником. Frontend находится в `frontend/`. Mock API подключён как отдельный репозиторий в `backend/`.

## Запуск

Нужен Docker с Compose. На Windows команды выполняются в WSL из директории `spa-front`:

```bash
git submodule update --init
docker compose up --build
```

Приложение: http://localhost:5173 · документация API: http://localhost:8000/docs

Если эти порты заняты, внешние порты можно переопределить переменными `FRONTEND_PORT` и `BACKEND_PORT`.

Адрес API задаётся переменной `VITE_API_URL` (по умолчанию frontend использует прокси Vite на сервис `backend`). Для отдельного локального запуска смотрите [`frontend/.env.example`](frontend/.env.example).

Данные mock API синтетические и возвращаются к исходному состоянию после перезапуска. Расчёты выполняются только на сервере; frontend отображает ответы и их обоснования. Заказы автоматически не размещаются.
