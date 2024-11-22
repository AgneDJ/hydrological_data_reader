import os
import shutil


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


def copy_files_from_folder(source_folder, destination_folder):
    """
    Copies files from the source folder to the destination folder, skipping files that already exist.
    """
    if not os.path.exists(destination_folder):
        os.makedirs(destination_folder)

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

# Copy the first file with a fallback mechanism
copy_with_fallback(source_file, destination_file)

# Paths for the second set of files
source_folder = r"C:\Users\agned\Documents\Darbo Dokumentai\HidroDuomenys\Hymer"
destination_folder = r"\\192.168.1.30\Dokumentai\PPS\2. Išoriniai\Hidrologinės prognozės\@ Prognozės\Test\Hymer"

# Copy files from the source folder, skipping files that already exist
copy_files_from_folder(source_folder, destination_folder)

# Paths for the new file to be copied
new_source_file = r"C:\Users\agned\Documents\Darbo Dokumentai\HidroDuomenys\Ledui_vid_temp\@Ledų atsiradimas_ežerai,upės.xlsx"
new_destination_file = r"\\192.168.1.30\Dokumentai\PPS\2. Išoriniai\Hidrologinės prognozės\@ Prognozės\Prognozės\Ledai\@Ledų atsiradimas_ežerai,upės.xlsx"

# Copy the new file with a fallback mechanism
copy_with_fallback(new_source_file, new_destination_file)
