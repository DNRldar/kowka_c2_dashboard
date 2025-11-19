/*
 * High-performance memory scanning engine
 * C++ component for efficient system memory operations
 */

#include <iostream>
#include <windows.h>
#include <tlhelp32.h>
#include <psapi.h>
#include <vector>
#include <string>

class MemoryScanner {
private:
    HANDLE process_handle;
    
public:
    MemoryScanner() : process_handle(nullptr) {}
    
    ~MemoryScanner() {
        if (process_handle) {
            CloseHandle(process_handle);
        }
    }
    
    // Scan process memory for specific patterns
    std::vector<BYTE*> scan_memory_pattern(DWORD process_id, const std::vector<BYTE>& pattern) {
        std::vector<BYTE*> matches;
        
        process_handle = OpenProcess(PROCESS_VM_READ | PROCESS_QUERY_INFORMATION, FALSE, process_id);
        if (!process_handle) {
            return matches;
        }
        
        MEMORY_BASIC_INFORMATION memory_info;
        SYSTEM_INFO system_info;
        GetSystemInfo(&system_info);
        
        BYTE* address = (BYTE*)system_info.lpMinimumApplicationAddress;
        BYTE* max_address = (BYTE*)system_info.lpMaximumApplicationAddress;
        
        while (address < max_address) {
            if (VirtualQueryEx(process_handle, address, &memory_info, sizeof(memory_info))) {
                if (memory_info.State == MEM_COMMIT && memory_info.Protect != PAGE_NOACCESS) {
                    scan_region(memory_info, pattern, matches);
                }
                address += memory_info.RegionSize;
            } else {
                break;
            }
        }
        
        return matches;
    }
    
private:
    void scan_region(MEMORY_BASIC_INFORMATION& memory_info, const std::vector<BYTE>& pattern, std::vector<BYTE*>& matches) {
        BYTE* buffer = new BYTE[memory_info.RegionSize];
        SIZE_T bytes_read;
        
        if (ReadProcessMemory(process_handle, memory_info.BaseAddress, buffer, memory_info.RegionSize, &bytes_read)) {
            for (SIZE_T i = 0; i <= bytes_read - pattern.size(); i++) {
                if (matches_pattern(buffer + i, pattern)) {
                    matches.push_back((BYTE*)memory_info.BaseAddress + i);
                }
            }
        }
        
        delete[] buffer;
    }
    
    bool matches_pattern(BYTE* data, const std::vector<BYTE>& pattern) {
        for (size_t i = 0; i < pattern.size(); i++) {
            if (pattern[i] != 0x00 && data[i] != pattern[i]) { // 0x00 = wildcard
                return false;
            }
        }
        return true;
    }
};

// Export function for Python integration
extern "C" {
    __declspec(dllexport) void* create_memory_scanner() {
        return new MemoryScanner();
    }
    
    __declspec(dllexport) void destroy_memory_scanner(void* scanner) {
        delete static_cast<MemoryScanner*>(scanner);
    }
}
