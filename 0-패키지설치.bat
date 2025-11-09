@echo off
echo ========================================
echo    패키지 설치 시작...
echo ========================================
echo.

echo [1/2] 프론트엔드 패키지 설치 중...
call npm install
echo.

echo [2/2] 백엔드 패키지 설치 중...
cd backend
call npm install
cd ..
echo.

echo ========================================
echo    패키지 설치 완료!
echo ========================================
pause





