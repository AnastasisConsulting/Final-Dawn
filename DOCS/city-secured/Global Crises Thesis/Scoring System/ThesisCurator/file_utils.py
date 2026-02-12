import json
from tkinter import filedialog, messagebox

# Function to load a JSON file
def load_json_file(dialog_box):
    file_path = filedialog.askopenfilename(filetypes=[("JSON files", "*.json")])
    if file_path:
        try:
            with open(file_path, "r") as file:
                loaded_json_data = json.load(file)
            dialog_box.insert('end', f"Loaded file: {file_path}\n")
            dialog_box.insert('end', json.dumps(loaded_json_data, indent=4) + "\n")
            messagebox.showinfo("File Loaded", f"Loaded and stored content from: {file_path}")
            return loaded_json_data
        except json.JSONDecodeError:
            messagebox.showerror("Error", "Failed to load JSON file. Please ensure it is properly formatted.")
    return None
