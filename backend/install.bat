@echo off
setlocal
cd /d "%~dp0"

where composer >nul 2>nul
if errorlevel 1 (
  echo Composer belum terpasang. Download dulu di https://getcomposer.org/download/
  exit /b 1
)

if not exist "vendor\codeigniter4\framework" (
  echo [1/3] Mengunduh CodeIgniter 4...
  call composer create-project codeigniter4/appstarter _ci4_base --no-interaction
  if errorlevel 1 exit /b 1
  echo       Menggabungkan file framework. File project ini tidak ditimpa...
  robocopy _ci4_base . /E /XC /XN /XO /NFL /NDL /NJH /NJS /NP >nul
  rmdir /s /q _ci4_base
) else (
  echo [1/3] CodeIgniter sudah terpasang, lewati unduhan.
)

echo [2/3] Menyalin website ke public\...
copy /y "..\index.html" "public\index.html" >nul
if not exist "public\css" mkdir "public\css"
copy /y "..\css\style.css" "public\css\style.css" >nul
for %%D in (js img models vendor) do robocopy "..\%%D" "public\%%D" /E /NFL /NDL /NJH /NJS /NP >nul

if not exist ".env" (
  echo [3/3] Membuat file .env...
  copy /y ".env.example" ".env" >nul
)

echo.
echo Selesai! Langkah berikutnya:
echo   1. Nyalakan MySQL di XAMPP / Laragon
echo   2. php spark db:create soundbox_db
echo   3. php spark migrate
echo   4. php spark db:seed DatabaseSeeder
echo   5. php spark serve   lalu buka http://localhost:8080  (admin: /admin)
echo Kalau website diubah, jalankan install.bat lagi supaya public\ ikut terbarui.
endlocal
