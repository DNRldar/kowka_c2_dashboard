@echo off
REM Batch script for compiling C++ components
echo Compiling Kowka GEN 7 C++ components...

REM Compile memory scanner
cl /EHsc /LD /Fememory_scanner.dll memory_scanner.cpp /link advapi32.lib

REM Compile packet capture
cl /EHsc /LD /Fepacket_capture.dll packet_capture.cpp /link ws2_32.lib iphlpapi.lib

REM Compile encryption engine
cl /EHsc /LD /Feencryption_engine.dll encryption_engine.cpp /link advapi32.lib

echo C++ components compiled successfully.
pause
