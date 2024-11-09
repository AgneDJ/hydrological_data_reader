import pandas as pd
import re
from datetime import datetime

# Load the data file
file_path = r"C:\Users\agned\Desktop\Daily Hydro Situation\hydrological_data_reader\extracted_data.csv"
with open(file_path, 'r', encoding='utf-8') as file:
    lines = file.readlines()


# Define the list of station names to filter by, ordered as specified
stations_to_keep = [
    "Svyla - Guntauninkai", "Nemunėlis - Tabokinė", "Mūša - Ustukiai", "Mūša - Žilpamūšis", "Lėvuo - Kupiškis",
    "Lėvuo - Bernatoniai", "Tatula - Trečionys", "Smardonė - Likėnai", "Yslykis, Kyburiai", "Venta - Papilė",
    "Venta - Leckava", "Aunuva - Aunuvėnai", "Bartuva - Skuodas", "Atmata - Rusnė", "Nemunas - Druskininkai",
    "Nemunas - Nemajūnai", "Nemunas, Kaunas (nauja VMS 2021 m)", "Nemunas - Lampėdžiai", "Nemunas - Smalininkai",
    "Nemunas - Panemunė", "Nemunas - Šilininkai", "Nemunas - Lazdėnai", "Merkys - Jašiūnai", "Merkys - Puvočiai",
    "Šalčia - Valkininkai", "Ūla - Zervynos", "Skroblus - Dubininkas", "Varėnė - Varėna", "Verknė, Verbyliškės",
    "Strėva - Semeliškės", "Neris - Buivydžiai", "Neris - Vilnius", "Neris - Jonava", "Žeimena - Pabradė",
    "Vilnia - Vilnius", "Šventoji - Anykščiai", "Šventoji - Ukmergė", "Širvinta - Liukonys", "Nevėžis - Traupis",
    "Nevėžis - Panevėžys", "Sanžilės kan. - Bernatoniai", "Šušvė - Šiaulėnai", "Šušvė - Josvainiai",
    "Dubysa - Lyduvėnai", "Kražantė - Pluskiai", "Mituva - Žindaičiai", "Šešupė - Kudirkos Naumiestis",
    "Jūra - Tauragė", "Akmena - Paakmenis", "Šešuvis - Skirgailai", "Minija - Kartena", "Minija - Lankupiai",
    "Upita - Eidukai", "Minija - Priekulė", "Nemunas - Birštonas", "Nemunas - Darsūniškis", "Šyša - Šilutė",
    "Leitė - Kūlynai", "Danė - Klaipėda", "Gėgė - Plaškiai", "Tenenys - Miestaliai", "Šventoji - Šventoji"
]

# Define a list to store structured data
structured_data = []

# Regular expressions for parsing each component
location_pattern = r"^(.*?)Kaupiklis:"
updated_pattern = r"Duomenys atnaujinti: (\S+ \S+)"
water_level_pattern = r"Vandens lygis\s+\(\s*([\d.]+) cm\s*\)"
temperature_pattern = r"Vandens temperatūra\s+\(\s*([\d.]+) C\s*\)"
salinity_pattern = r"Vandens druskingumas\s+\(\s*([-+]?\d*\.?\d+) g/m3\s*\)"

# Process each line
for line in lines:
    # Extract each part using regex
    location = re.search(location_pattern, line)
    last_updated = re.search(updated_pattern, line)
    water_level = re.search(water_level_pattern, line)
    temperature = re.search(temperature_pattern, line)
    salinity = re.search(salinity_pattern, line)

    # Append structured data in a dictionary format with selected columns only
    structured_data.append({
        "Location": location.group(1).strip() if location else None,
        "Last Updated": last_updated.group(1) if last_updated else None,
        "Water Level (cm)": float(water_level.group(1)) if water_level else None,
        "Water Temperature (C)": float(temperature.group(1)) if temperature else None,
        "Water Salinity (g/m3)": float(salinity.group(1)) if salinity else None,
    })

# Convert structured data into a DataFrame with only the selected columns
df_structured = pd.DataFrame(structured_data, columns=[
                             "Location", "Last Updated", "Water Level (cm)", "Water Temperature (C)", "Water Salinity (g/m3)"])

# Filter the DataFrame to include only rows with the specified station names
filtered_df = df_structured[df_structured['Location'].isin(
    stations_to_keep)].copy()

# Set the categorical type for "Location" to ensure the custom order is maintained
filtered_df['Location'] = pd.Categorical(
    filtered_df['Location'], categories=stations_to_keep, ordered=True)

# # Sort the DataFrame by "Location" based on the defined order
# filtered_df = filtered_df.sort_values('Location')

# # Define both output paths
# output_file_path1 = r'\\192.168.1.30\Dokumentai\PPS\2. Išoriniai\Hidrologinės prognozės\@ Prognozės\Test\Hymer\Hymer duomenys.xlsx'
# output_file_path2 = r'C:\Users\agned\Desktop\Daily Hydro Situation\hydrological_data_reader\Completed files\Hymer duomenys.xlsx'

# # Save the filtered and ordered DataFrame to both .xlsx files
# filtered_df.to_excel(output_file_path1, index=False, engine='openpyxl')
# filtered_df.to_excel(output_file_path2, index=False, engine='openpyxl')

# print("Filtered and ordered data has been saved to both locations.")

# Create a timestamp for the filename
timestamp = datetime.now().strftime("%Y-%m-%d_%H_%M")
output_file_name = f"Hymer duomenys_{timestamp}.xlsx"

# Define output path with dynamic filename
output_file_path1 = f'\\\\192.168.1.30\\Dokumentai\\PPS\\2. Išoriniai\\Hidrologinės prognozės\\@ Prognozės\\Test\\Hymer\\{
    output_file_name}'

# Save the filtered and ordered DataFrame to the new file with a timestamped name
filtered_df.to_excel(output_file_path1, index=False, engine='openpyxl')

print(f"Filtered and ordered data has been saved to: {output_file_path1}")
