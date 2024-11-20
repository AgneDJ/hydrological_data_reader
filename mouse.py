import schedule
import subprocess
import time
import pyautogui
from datetime import datetime, timedelta

# Define paths for the scripts
tasks = {
    "07:10": ["C:\\Users\\agned\\Desktop\\Daily Hydro Situation\\hydrological_data_reader\\index.js",
              "C:\\Users\\agned\\Desktop\\Daily Hydro Situation\\hydrological_data_reader\\for_hymer\\index.js",
              "C:\\Users\\agned\\Desktop\\Daily Hydro Situation\\hydrological_data_reader\\for_hymer\\excel_table.py",
              "C:\Users\agned\Desktop\Daily Hydro Situation\hydrological_data_reader\copytoother.py"
              ],
    "13:10": ["C:\\Users\\agned\\Desktop\\Daily Hydro Situation\\hydrological_data_reader\\index.js",
              "C:\\Users\\agned\\Desktop\\Daily Hydro Situation\\hydrological_data_reader\\for_hymer\\index.js",
              "C:\\Users\\agned\\Desktop\\Daily Hydro Situation\\hydrological_data_reader\\for_hymer\\excel_table.py",
              "C:\Users\agned\Desktop\Daily Hydro Situation\hydrological_data_reader\copytoother.py"],
    "16:10": ["C:\\Users\\agned\\Desktop\\Daily Hydro Situation\\hydrological_data_reader\\index.js",
              "C:\\Users\\agned\\Desktop\\Daily Hydro Situation\\hydrological_data_reader\\for_hymer\\index.js",
              "C:\\Users\\agned\\Desktop\\Daily Hydro Situation\\hydrological_data_reader\\for_hymer\\excel_table.py",
              "C:\Users\agned\Desktop\Daily Hydro Situation\hydrological_data_reader\copytoother.py"],
    "18:20": ["C:\\Users\\agned\\Desktop\\Daily Hydro Situation\\hydrological_data_reader\\index.js",
              "C:\\Users\\agned\\Desktop\\Daily Hydro Situation\\hydrological_data_reader\\for_hymer\\index.js",
              "C:\\Users\\agned\\Desktop\\Daily Hydro Situation\\hydrological_data_reader\\for_hymer\\excel_table.py",
              "C:\Users\agned\Desktop\Daily Hydro Situation\hydrological_data_reader\copytoother.py"]
}

# Coordinates for Monitor 1
target_x = 661  # X-coordinate
target_y = 815  # Y-coordinate


def run_script(script_path):
    if script_path.endswith('.js'):
        subprocess.run(["node", script_path], check=True)
    elif script_path.endswith('.py'):
        subprocess.run(["python", script_path], check=True)
    print("Script Success:", script_path)


def perform_click_action():
    pyautogui.moveTo(target_x, target_y)
    pyautogui.click()
    print(f"Mouse moved to ({target_x}, {target_y}) and clicked at {
          datetime.now().strftime('%H:%M:%S')}")


def schedule_task_with_clicks(run_time, scripts):
    # Schedule the pyautogui action 10 minutes before the task
    time_before = (datetime.strptime(run_time, "%H:%M") -
                   timedelta(minutes=10)).strftime("%H:%M")
    schedule.every().day.at(time_before).do(perform_click_action)

    # Schedule the main task
    for script in scripts:
        schedule.every().day.at(run_time).do(run_script, script)

    # Schedule the pyautogui action 10 minutes after the task
    time_after = (datetime.strptime(run_time, "%H:%M") +
                  timedelta(minutes=10)).strftime("%H:%M")
    schedule.every().day.at(time_after).do(perform_click_action)


# Schedule each task with clicks before and after
for run_time, scripts in tasks.items():
    schedule_task_with_clicks(run_time, scripts)

# Run the scheduler
while True:
    schedule.run_pending()
    time.sleep(1)  # Prevents high CPU usage
