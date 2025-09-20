import os
import xarray as xr
import pandas as pd

input_folder = r"C:\Users\kanis\Downloads\KANISHKA\PROJECT\sih floatchat\data\.nc files"
output_folder = r"C:\Users\kanis\Downloads\KANISHKA\PROJECT\sih floatchat\data\csv_output"

os.makedirs(output_folder, exist_ok=True)

# Variables we care about
vars_to_extract = ["PRES", "TEMP", "PSAL", "LATITUDE", "LONGITUDE"]


for file in os.listdir(input_folder):
    if file.endswith(".nc"):
        input_path = os.path.join(input_folder, file)
        output_path = os.path.join(output_folder, file.replace(".nc", ".csv"))

        try:
            ds = xr.open_dataset(input_path)

            # Keep only available variables
            available = [v for v in vars_to_extract if v in ds.variables]

            if not available:
                print(f"⚠️ No data variables found in {file}, skipping...")
                continue

            # Convert to dataframe
            df = ds[available].to_dataframe().reset_index()

            # Save as CSV
            df.to_csv(output_path, index=False)
            print(f"✅ Converted {file} -> {output_path}")

        except Exception as e:
            print(f"❌ Failed to convert {file}: {e}")



