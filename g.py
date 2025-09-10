import requests
import os
import pandas as pd
import numpy as np
import xarray as xr
import sqlite3

# List of 50 global Argo float IDs
argo_float_ids = [
     "3902319", "3902377",  "5904122",
    "3901804", "5904257",  "2902092", "4901764", "5904245",
    "5904664", "4901514", "5904107", "5904587",
    "4902148", "5904098", "3902334", "5904690", "4901700",
    "5904101", "4902102", "2902096",
    "5904021", "6902737", "5904102", "4902110", "3902338",
    "5904118", "5904603", "4902120", "6902739", "5904569", "5904571",
    "5904660", "5904661", "5904576", "5904577",
    "5904670", "5904671"]

# Base URL for the Argo GDAC mirror
BASE_URL = "https://data-argo.ifremer.fr/dac/"
GDAC_INDEX_URL = "https://data-argo.ifremer.fr/ar_index_global_prof.txt"

dest_dir = "data/argo_nc"
os.makedirs(dest_dir, exist_ok=True)

# -----------------
## Step 1: Download files using the GDAC index 💾
# -----------------
def get_file_path_from_gdac(float_id, index_df):
    """
    Finds the correct file path for a float ID from the GDAC index DataFrame.
    """
    try:
        # The file column contains the path relative to the DAC directory.
        # Correctly search for the float ID string
        float_rows = index_df[index_df['file'].str.contains(f"/{float_id}/")]
        
        if not float_rows.empty:
            # We want the 'S' (synthetic) profile file if available, otherwise the 'R' or 'D' profile.
            # Let's get the first one that matches
            relative_path = float_rows['file'].iloc[0]
            url = f"{BASE_URL}{relative_path}"
            return url
        else:
            print(f"Float {float_id} not found in the global index.")
            return None
    except Exception as e:
        print(f"Error accessing GDAC index for float {float_id}: {e}")
        return None

# Load the GDAC index file once
try:
    print("Downloading GDAC index file for float paths...")
    # The index file starts with metadata, so we need to skip the first 8 lines
    global_index_df = pd.read_csv(GDAC_INDEX_URL, skiprows=8, sep=',', header=0, dtype=str)
    print("GDAC index file downloaded successfully.")
except Exception as e:
    print(f"Failed to download GDAC index file: {e}")
    global_index_df = None

if global_index_df is not None:
    for float_id in argo_float_ids:
        url = get_file_path_from_gdac(float_id, global_index_df)
        
        if url:
            # The file name is the last part of the URL path
            local_filename = url.split('/')[-1]
            dest = os.path.join(dest_dir, local_filename)
            
            if os.path.exists(dest):
                print(f"File for float {float_id} already exists. Skipping download.")
                continue
                
            print(f"Downloading data for float {float_id}...")
            
            try:
                response = requests.get(url, stream=True, timeout=30)
                response.raise_for_status()
                
                with open(dest, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                        
                print(f"Successfully downloaded {float_id}.")
                
            except requests.exceptions.RequestException as e:
                print(f"Error downloading {url}: {e}")
            except Exception as e:
                print(f"An unexpected error occurred for {url}: {e}")
else:
    print("Cannot proceed with download. GDAC index file is not available.")