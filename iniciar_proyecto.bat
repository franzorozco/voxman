@echo off
echo Iniciando todos los servicios en esta misma consola...
echo.

npx concurrently -n "LARAVEL,WEBSOCKETS,WORKER,VITE" -c "bgRed.bold,bgBlue.bold,bgYellow.bold,bgGreen.bold" "cd Backend && php artisan serve" "cd Backend && php artisan reverb:start" "cd Backend && php artisan queue:work" "cd Frontend && npm run dev"
