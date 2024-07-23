import pandas as pd
from bs4 import BeautifulSoup
import openpyxl


def extract_html_table(html_content):
    # Function to extract data from HTML table


def update_excel_with_html(html_content, excel_path, sheet_name):
    # Function to update Excel file with HTML data
    html_df = extract_html_table(html_content)

    # Loads Excel file
    excel_df = pd.read_excel(excel_path, sheet_name=sheet_name)

     # Merges the DataFrames based on 'Date' and 'Station Name'
     updated_df = pd.merge(excel_df, html_df, on=[
          'Date', 'Station Name'], how='outer', suffixes=('_excel', '_html'))

      # Defines columns to update
      columns_to_update = html_df.columns.difference(
           ['Date', 'Station Name'])

    # Update Excel DataFrame with HTML DataFrame values
       for column in columns_to_update:
            updated_df[column] = updated_df[f'{column}_html'].combine_first(
                updated_df[f'{column}_excel'])

        # Drop the temporary columns
        updated_df.drop(columns=[f'{col}_html' for col in columns_to_update] + [
                        f'{col}_excel' for col in columns_to_update], inplace=True)

        # Save the updated DataFrame back to the Excel file
        with pd.ExcelWriter(excel_path, engine='openpyxl', mode='a') as writer:
            writer.book = openpyxl.load_workbook(excel_path)
            writer.sheets = {ws.title: ws for ws in writer.book.worksheets}
            updated_df.to_excel(writer, sheet_name=sheet_name, index=False)
