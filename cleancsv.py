import os
import pandas as pd

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

            print(f"✅ Cleaned {file} -> {output_path}")
        except Exception as e:
            print(f"❌ Failed to process {file}: {e}")



