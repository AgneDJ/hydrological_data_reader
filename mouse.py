from datetime import datetime, timedelta
import pyautogui
import time
import subprocess
import schedule
print("🟢 Script started")


print("🟢 All imports successful")

remote_ip = "172.20.10.151"
target_x, target_y = 661, 815


def launch_rdp_and_click():
    now = datetime.now().strftime("%H:%M:%S")
    print(f"✅ Task triggered at {now}")
    try:
        subprocess.Popen(["mstsc", "/v:" + remote_ip])
        print(f"🖥️ RDP launched to {remote_ip} @ {now}")
    except Exception as e:
        print(f"❌ Failed to start RDP session: {e}")
    time.sleep(1)
    pyautogui.moveTo(target_x, target_y)
    pyautogui.click()
    print(f"🖱️ Mouse clicked at ({target_x}, {target_y}) @ {now}")


# Force test 1 minute in the future
future_time = (datetime.now() + timedelta(minutes=1)).strftime("%H:%M")
rdp_times = [future_time]

print("📅 Scheduling tasks:")
for t in rdp_times:
    schedule.every().day.at(t).do(launch_rdp_and_click)
    print(f"✅ Scheduled RDP + click at {t}")

print("\n🧾 Registered schedule:")
for job in schedule.jobs:
    print("•", job)

print(
    f"\n⏳ Scheduler running. Waiting for tasks... System time is {datetime.now().strftime('%H:%M:%S')}\n")

while True:
    print(datetime.now().strftime("%H:%M:%S"), "- checking...")
    schedule.run_pending()
    time.sleep(0.5)
