import os
import shutil
import time
from datetime import datetime, timedelta


def copy_with_fallback(source_file, destination_file):
    """
    Copies a file from source to destination. If the file at the destination is open and cannot be overwritten,
    it saves the file with a different name.
    """
    fallback_destination = destination_file.replace('.xlsx', '_.xlsx')
    try:
        shutil.copy2(source_file, destination_file)
        print(f"Copied {source_file} to {destination_file}")

        # Delete the fallback file if it exists after a successful copy
        if os.path.exists(fallback_destination):
            os.remove(fallback_destination)
            print(f"Deleted fallback file: {fallback_destination}")
    except PermissionError:
        # Fallback filename if the destination file cannot be overwritten
        shutil.copy2(source_file, fallback_destination)
        print(f"File is open. Saved as {fallback_destination}")


def delete_old_files(folder_path, days=7):
    """
    Deletes files older than a specified number of days in the given folder.
    """
    now = time.time()
    cutoff = now - (days * 86400)  # 86400 seconds per day

    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path):
            file_mtime = os.path.getmtime(file_path)
            if file_mtime < cutoff:
                try:
                    os.remove(file_path)
                    print(f"Deleted old file: {file_path}")
                except Exception as e:
                    print(f"Failed to delete {file_path}: {e}")


def copy_files_from_folder(source_folder, destination_folder, clean_old=False):
    """
    Copies files from the source folder to the destination folder, skipping files that already exist.
    Optionally deletes files older than 7 days in both folders if clean_old=True.
    """
    if not os.path.exists(destination_folder):
        os.makedirs(destination_folder)

    # Delete old files if requested
    if clean_old:
        print("Cleaning old files in source and destination folders...")
        delete_old_files(source_folder)
        delete_old_files(destination_folder)

    for file_name in os.listdir(source_folder):
        source_file = os.path.join(source_folder, file_name)
        destination_file = os.path.join(destination_folder, file_name)

        # Only copy if the file doesn't already exist in the destination
        if not os.path.exists(destination_file):
            shutil.copy2(source_file, destination_file)
            print(f"Copied {file_name} to {destination_folder}")
        else:
            print(
                f"Skipped {file_name} - already exists in {destination_folder}")


# Paths for the first file to be copied
source_file = r"C:\Users\agned\Documents\Darbo Dokumentai\HidroDuomenys\Dienos situacija_test 2.xlsx"
destination_file = r"\\192.168.1.30\Dokumentai\PPS\2. Išoriniai\Hidrologinės prognozės\@ Prognozės\Test\Dienos situacija_test 2.xlsx"
copy_with_fallback(source_file, destination_file)

# Paths for the second set of files (Hymer)
source_folder = r"C:\Users\agned\Documents\Darbo Dokumentai\HidroDuomenys\Hymer"
destination_folder = r"\\192.168.1.30\Dokumentai\PPS\2. Išoriniai\Hidrologinės prognozės\@ Prognozės\Test\Hymer"
copy_files_from_folder(source_folder, destination_folder, clean_old=True)

# Paths for the new file to be copied
new_source_file = r"C:\Users\agned\Documents\Darbo Dokumentai\HidroDuomenys\Ledui_vid_temp\@Ledų atsiradimas_ežerai,upės(versija3).xlsx"
new_destination_file = r"\\192.168.1.30\Dokumentai\PPS\2. Išoriniai\Hidrologinės prognozės\@ Prognozės\Prognozės\Ledai\@Ledų atsiradimas_ežerai,upės(versija3).xlsx"
copy_with_fallback(new_source_file, new_destination_file)
