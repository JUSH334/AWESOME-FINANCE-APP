@echo off
echo Compiling smart bank statement extractor...

REM Compile all Java files - check both lib and jar folders
javac -cp ".;lib/*;jar/*" *.java

if %errorlevel% neq 0 (
    echo Compilation failed!
    pause
    exit /b %errorlevel%
)

echo.
echo Extracting structured data...
echo.

REM Run the extractor
java -cp ".;lib/*;jar/*" BankStatementExtractor %*

if %errorlevel% neq 0 (
    echo.
    echo Extraction failed!
    pause
    exit /b %errorlevel%
)

echo.
pause