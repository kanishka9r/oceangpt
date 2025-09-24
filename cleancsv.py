import os
import pandas as pd
import sqlite3

# Input folder containing CSVs
input_folder = r"C:\Users\kanis\Downloads\KANISHKA\PROJECT\sih floatchat\data\csv_output"
# Output folder for cleaned CSVs
output_folder = r"C:\Users\kanis\Downloads\KANISHKA\PROJECT\sih floatchat\data\csv_cleaned"

os.makedirs(output_folder, exist_ok=True)

for file in os.listdir(input_folder):
    if file.endswith(".csv"):
        input_path = os.path.join(input_folder, file)
        output_path = os.path.join(output_folder, file)

        try:
            df = pd.read_csv(input_path)

            # Drop rows with any NaN values
            df_cleaned = df.dropna()

            # Save cleaned CSV
            df_cleaned.to_csv(output_path, index=False)

            print(f"Cleaned {file} - {output_path}")
        except Exception as e:
            print(f"Failed to process {file}: {e}")


all_files = [os.path.join(output_folder, f) for f in os.listdir(output_folder) if f.endswith('.csv')]
df_list = [pd.read_csv(f) for f in all_files]
df_combined = pd.concat(df_list, ignore_index=True)

conn = sqlite3.connect(r"C:\Users\kanis\Downloads\KANISHKA\PROJECT\sih floatchat\data\datasql.db")  
table_name = "ocean_table"  # choose your table name
df_combined.to_sql(table_name, conn, if_exists='replace', index=False) 

cursor = conn.cursor()
cursor.execute(f"SELECT * FROM {table_name} LIMIT 5;")
rows = cursor.fetchall()
for row in rows:
    print(row)

conn.close()