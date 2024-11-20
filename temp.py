from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Set up the webdriver
driver = webdriver.Chrome()

# Open the webpage
driver.get('http://himed.meteo.lt/index.php/biuletenis/')

# Optional: print page source to verify content
# Print the first 1000 characters for a quick check
print(driver.page_source[:1000])

# Optional: wait for and switch to iframe if applicable
# try:
#     iframe = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, 'iframe')))
#     driver.switch_to.frame(iframe)
# except Exception as e:
#     print("No iframe found or loading timeout:", e)

# Try waiting for the table or use a broader selector
try:
    table = WebDriverWait(driver, 15).until(
        EC.presence_of_element_located(
            (By.TAG_NAME, 'table'))  # Broader selector for demo
    )
    print("Table found!")
except Exception as e:
    print("Table not found:", e)

# Close the browser
driver.quit()
