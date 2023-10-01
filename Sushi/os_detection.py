import platform

def detect():
    
    os_name = platform.system()
    
    if os_name == "Linux":
        return "Linux"

    if os_name == "Windows":
        return "Windows"
    
    if os_name == ("freebsd" or "openbsd"):
        return "freebsd"

    if os_name == "Darwin":
        return "Darwin"
    
    if os_name == ("Java" or " "):
        return "OS not detected"
