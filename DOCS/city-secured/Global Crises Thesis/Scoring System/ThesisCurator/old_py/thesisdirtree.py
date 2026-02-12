import os
import shutil

# Define the root directory where the original structure is located
old_root_dir = r"C:\Users\Willi\OneDrive\Desktop\Thesis Global Crises Management\Thesis"

# Define the new root directory where the new structure will be created
new_root_dir = r"C:\Users\Willi\OneDrive\Desktop\Thesis Global Crises Management\New Thesis"

# Define the new folder structure
new_structure = {
    "Thesis Overview": [
        "01_Proposals",
        "02_First_Steps",
        "03_Desired_Outcomes/The_Vision"
    ],
    "Research & Development": [
        "05_Scoring_System/Methods",
        "05_Scoring_System/Research/Dynamic_Variables",
        "05_Scoring_System/Research/Static_Variables",
        "05_Scoring_System/Research/The_Algorithm",
        "05_Scoring_System/Visuals",
        "07_The_Pillars/Philosophy",
        "07_The_Pillars/Psychology",
        "07_The_Pillars/Science"
    ],
    "AI Integration": [
        "06_AI_Reviews/META",
        "Platform/The_GCMO"
    ],
    "Peer Review & Feedback": [
        "08_Peer_Review/Defense Notes",
        "08_Peer_Review/Presentation",
        "08_Peer_Review/Visuals"
    ],
    "Supporting Resources": [
        "09_Sources/Annotated Bibliography",
        "09_Sources/Bibliography",
        "12_Thesis_Related_Coursework"
    ],
    "Tools & Management": [
        "04_Changelogs",
        "Tools/Thesis_Curator_GPT"
    ]
}

# Function to create new folder structure
def create_new_structure(base_dir, structure):
    for parent_folder, subfolders in structure.items():
        for subfolder in subfolders:
            dir_path = os.path.join(base_dir, parent_folder, subfolder)
            os.makedirs(dir_path, exist_ok=True)
            print(f"Created directory: {dir_path}")

# Move existing files and folders to the new structure
def move_files(old_path, new_path):
    for root, dirs, files in os.walk(old_path):
        for file in files:
            old_file_path = os.path.join(root, file)
            new_file_path = os.path.join(new_path, file)

            # Move the file
            shutil.move(old_file_path, new_file_path)
            print(f"Moved {file} to {new_file_path}")

# Reorganize the folders
def reorganize_structure(old_base_dir, new_base_dir, new_structure):
    # First, create the new structure in the new directory
    create_new_structure(new_base_dir, new_structure)

    # Now move files from old structure into the new one
    for old_folder in os.listdir(old_base_dir):
        old_folder_path = os.path.join(old_base_dir, old_folder)

        if os.path.isdir(old_folder_path):
            # Find where to move the contents based on the new structure
            for new_parent_folder, subfolders in new_structure.items():
                for subfolder in subfolders:
                    if old_folder in subfolder:
                        new_folder_path = os.path.join(new_base_dir, new_parent_folder, subfolder)
                        move_files(old_folder_path, new_folder_path)

# Apply the reorganization process
reorganize_structure(old_root_dir, new_root_dir, new_structure)

print("Reorganization complete!")
