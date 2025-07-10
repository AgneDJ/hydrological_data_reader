import pandas as pd
from datetime import datetime

# Generate the filename dynamically based on today's date
today_date = datetime.today().strftime('%Y-%m-%d')
input_file = f"table_data_duom_lent_{today_date}.csv"
output_file = "Temperaturos.xlsx"

try:
    # Load the CSV file
    df = pd.read_csv(input_file, encoding='utf-8')

    # List of required station names
    stations_to_keep = [
        'Alytaus AMS', 'Kauno AMS', 'Klaipėdos AMS', 'Lazdijų AMS', 'Panevėžio AMS',
        'Raseinių AMS', 'Šiaulių AMS', 'Šilutės AMS', 'Telšių AMS', 'Ukmergės AMS',
        'Utenos AMS', 'Varėnos AMS', 'Vilniaus AMS'
    ]

    # Selecting required columns
    columns_to_keep = ["Stotis[name]", "Vidutinėoro temperatūrapraėjusią parą",
                       "Žemiausiaoro temperatūrašią naktį"]

    # Filtering the dataset
    filtered_df = df[df["Stotis[name]"].isin(
        stations_to_keep)][columns_to_keep]

    # Save to Excel file
    filtered_df.to_excel(output_file, index=False, engine='openpyxl')
    print(f"Filtered data saved successfully as {output_file}")

except FileNotFoundError:
    print(
        f"Error: The file {input_file} was not found. Make sure the file exists in the directory.")
