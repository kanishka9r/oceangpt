import os
import xarray as xr
import pandas as pd
import numpy as np
import sqlite3

dest_dir = "data/argo_nc"
output_parquet = "data/global_argo.parquet"
output_sqlite = "data/global_argo.db"

def apply_qc(data, qc_flags):
    """Filter data based on Argo QC flags 1,2,5."""
    if qc_flags.dtype.type is np.bytes_:
        qc_flags = np.array([x.decode('utf-8') for x in qc_flags])
    mask = np.isin(qc_flags, ['1','2','5'])
    return np.where(mask, data, np.nan)


def extract_sprof_fixed(nc_file):
    try:
        ds = xr.open_dataset(nc_file, decode_timedelta=True)
        rows = []

        # Convert JULD
        if np.issubdtype(ds['JULD'].dtype, np.number):
            juld_values = pd.to_datetime(ds['JULD'].values, origin='1950-01-01', unit='D')
        else:
            juld_values = pd.to_datetime(ds['JULD'].values, errors='coerce')

        var_map = {'PRES':'pressure','TEMP':'temperature','PSAL':'salinity',
                   'DOXY':'oxygen','NITRATE':'nitrate','CHLA':'chlora'}

        n_profiles = ds.sizes.get('N_PROF', 1)
        n_levels = ds.sizes.get('N_LEVELS', 1)

        for p in range(n_profiles):
            lat = float(ds['LATITUDE'].values[p])
            lon = float(ds['LONGITUDE'].values[p])
            juld = juld_values[p] if len(juld_values)>p else pd.NaT

            # Extract platform safely
            platform_obj = ds['PLATFORM_NUMBER'].values[p]
            if isinstance(platform_obj, np.ndarray) or isinstance(platform_obj, xr.DataArray):
                platform = str(platform_obj.item())
            elif isinstance(platform_obj, bytes):
                platform = platform_obj.decode('utf-8')
            else:
                platform = str(platform_obj)

            for lvl in range(n_levels):
                row = {'platform': platform, 'juld': juld, 'lat': lat, 'lon': lon}
                for varname, colname in var_map.items():
                    # Use adjusted if available
                    if f'{varname}_ADJUSTED' in ds:
                        data = ds[f'{varname}_ADJUSTED'].values[p, lvl]
                        qc = ds[f'{varname}_ADJUSTED_QC'].values[p, lvl] if f'{varname}_ADJUSTED_QC' in ds else None
                    elif varname in ds:
                        data = ds[varname].values[p, lvl]
                        qc = ds[f'{varname}_QC'].values[p, lvl] if f'{varname}_QC' in ds else None
                    else:
                        data = np.nan
                        qc = None

                    # Apply QC
                    if qc is not None:
                        if isinstance(qc, bytes):
                            qc = qc.decode('utf-8')
                        if qc not in ['1','2','5']:
                            data = np.nan
                    row[colname] = float(data) if data is not None else np.nan

                rows.append(row)

        ds.close()
        return pd.DataFrame(rows)
    except Exception as e:
        print(f"Error: {e}")
        return pd.DataFrame()

# Gather NC files
nc_files = [os.path.join(dest_dir, f) for f in os.listdir(dest_dir) if f.endswith(".nc")]

all_dfs = []
for nc_file in nc_files:
    df = extract_sprof_fixed(nc_file)
    if not df.empty:
        all_dfs.append(df)

if all_dfs:
    global_df = pd.concat(all_dfs, ignore_index=True)
    
    # Save to Parquet
    global_df.to_parquet(output_parquet, index=False)
    print(f"Saved {len(global_df)} rows to {output_parquet}")

    # Save to SQLite
    conn = sqlite3.connect(output_sqlite)
    global_df.to_sql('argo_profiles', conn, if_exists='replace', index=False)
    conn.close()
    print(f"Saved {len(global_df)} rows to {output_sqlite} (table: argo_profiles)")



# Connect to SQLite (it will create the file if it doesn't exist)
conn = sqlite3.connect(output_sqlite)
df_check = pd.read_sql("SELECT * FROM argo_profiles LIMIT 5", conn)
print(df_check)
conn.close()
