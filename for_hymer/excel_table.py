import pandas as pd
import re

# Load the data file
file_path = r'C:\Users\agned\Desktop\Daily Hydro Situation\hydrological_data_reader\for_hymer\extracted_data.csv'
with open(file_path, 'r', encoding='utf-8') as file:
    lines = file.readlines()

# Define the list of station names to filter by
stations_to_keep = [
    "Danė - Klaipėda", "Akmena - Paakmenis", "Atmata - Rusnė", "Aunuva - Aunuvėnai", "Bartuva - Skuodas",
    "Dubysa - Lyduvėnai", "Gėgė - Plaškiai", "Jūra - Tauragė", "Kražantė - Pluskiai", "Leitė - Kūlynai",
    "Lėvuo - Bernatoniai", "Lėvuo - Kupiškis", "Merkys - Jašiūnai", "Merkys - Puvočiai", "Minija - Kartena",
    "Minija - Lankupiai", "Minija - Priekulė", "Mituva - Žindaičiai", "Mūša - Ustukiai", "Mūša - Žilpamūšis",
    "Nemunas - Birštonas", "Nemunas - Darsūniškis", "Nemunas - Druskininkai", "Nemunas, Kaunas (nauja VMS 2021 m)",
    "Nemunas - Lampėdžiai", "Nemunas - Lazdėnai", "Nemunas - Nemajūnai", "Nemunas - Panemunė", "Nemunas - Šilininkai",
    "Nemunas - Smalininkai", "Nemunėlis - Tabokinė", "Neris - Buivydžiai", "Neris - Vilnius", "Neris - Jonava",
    "Nevėžis - Traupis", "Nevėžis - Panevėžys", "Šalčia - Valkininkai", "Sanžilės kan. - Bernatoniai",
    "Šešupė - Kudirkos Naumiestis", "Šešuvis - Skirgailai", "Širvinta - Liukonys", "Skroblus - Dubininkas",
    "Smardonė - Likėnai", "Strėva - Semeliškės", "Šušvė - Josvainiai", "Šušvė - Šiaulėnai", "Šventoji - Anykščiai",
    "Šventoji - Šventoji", "Šventoji - Ukmergė", "Svyla - Guntauninkai", "Šyša - Šilutė", "Tatula - Trečionys",
    "Tenenys - Miestaliai", "Ūla - Zervynos", "Upita - Eidukai", "Varėnė - Varėna", "Venta - Leckava", "Venta - Papilė",
    "Verknė, Verbyliškės", "Vilnia - Vilnius", "Yslykis, Kyburiai", "Žeimena - Pabradė"
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
filtered_df = df_structured[df_structured['Location'].isin(stations_to_keep)]

# Save the filtered DataFrame to an .xlsx file in the new directory
output_file_path = r'\\192.168.1.30\Dokumentai\PPS\2. Išoriniai\Hidrologinės prognozės\@ Prognozės\Test\Hymer\filtered_data.xlsx'
filtered_df.to_excel(output_file_path, index=False, engine='openpyxl')

print("Filtered data has been saved to", output_file_path)
