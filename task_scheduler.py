import schedule
import subprocess
import time


# Define paths for the scripts
tasks = {
    "08:00": ["C:\\Users\\agned\\Desktop\\Daily Hydro Situation\\hydrological_data_reader\\index.js"],
    "08:15": [
        "C:\\Users\\agned\\Desktop\\Daily Hydro Situation\\hydrological_data_reader\\for_hymer\\index_pirminis.js",
        "C:\\Users\\agned\\Desktop\\Daily Hydro Situation\\hydrological_data_reader\\for_hymer\\excel_table.py"
    ],
    "13:30": ["C:\\Users\\agned\\Desktop\\Daily Hydro Situation\\hydrological_data_reader\\index.js"],
    "16:30": ["C:\\Users\\agned\\Desktop\\Daily Hydro Situation\\hydrological_data_reader\\index.js"]
}


def check_vpn_connection():
    try:
        # Ping the VPN server to check if VPN is connected
        result = subprocess.run(["ping", "-n", "1", "172.20.102.7"],
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return result.returncode == 0
    except Exception as e:
        print(f"Error checking VPN connection: {e}")
        return False


def connect_vpn():
    try:
        # Replace this command with the appropriate command to connect to FortiClient VPN
        subprocess.run(["forticlient", "connect"], check=True)
        print("Attempting to connect to VPN...")
    except subprocess.CalledProcessError as e:
        print(f"Error connecting to VPN: {e}")


def run_script(script_path):
    while not check_vpn_connection():
        connect_vpn()
        # Wait for 10 seconds before checking the VPN connection again
        time.sleep(10)

    try:
        # Decide on execution command based on script type
        if script_path.endswith('.js'):
            subprocess.run(["node", script_path], check=True)
        elif script_path.endswith('.py'):
            subprocess.run(["python", script_path], check=True)

        print("Success")
    except subprocess.CalledProcessError as e:
        print(f"Failed to run {script_path}: {e}")


# Schedule each task
for run_time, scripts in tasks.items():
    for script in scripts:
        schedule.every().day.at(run_time).do(run_script, script)


# Run the scheduler
while True:
    schedule.run_pending()
    time.sleep(1)  # Prevents high CPU usage
