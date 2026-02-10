import os
import json

def generate_quest_index():
    # Configuration
    # We assume this script is run from the project root or scripts/ folder
    # Adjust paths to be absolute or relative to known anchor
    base_dir = os.path.join(os.getcwd(), 'quest-prompts')
    
    # If we are in the scripts folder, move up one level
    if not os.path.exists(base_dir):
        base_dir = os.path.join(os.getcwd(), '..', 'quest-prompts')
        
    output_path = os.path.join(os.getcwd(), 'apps', 'dawn-ui', 'src', 'data', 'generated_quests.json')
    # If running from scripts/, adjust output path
    if not os.path.exists(os.path.dirname(output_path)):
         output_path = os.path.join(os.getcwd(), '..', 'apps', 'dawn-ui', 'src', 'data', 'generated_quests.json')

    print(f"Scanning: {base_dir}")
    print(f"Output: {output_path}")

    quest_index = {}

    # FAIL FORWARD PROMPT INJECTION
    # We append this to the system_prompt in every file
    fail_forward_instruction = (
        " CRITICAL NARRATIVE RULE: The player cannot fail. "
        "Outcome spectrum is: Excellent, Good, Poor. "
        "Even a 'Poor' result drives the story forward, complicating the next step rather than halting progress."
    )

    # Walk the directory
    for root, dirs, files in os.walk(base_dir):
        # We are looking for folders like G1-S1-O1
        folder_name = os.path.basename(root)
        
        # Check if this folder follows the Gx-Sx-Ox pattern
        parts = folder_name.split('-')
        if len(parts) == 3 and parts[0].startswith('G') and parts[1].startswith('S') and parts[2].startswith('O'):
            location_id = folder_name
            quest_index[location_id] = {}

            # Look for affinity files by suffix
            for filename in files:
                lower_name = filename.lower()
                affinity_key = None
                
                if lower_name.endswith('str.json'):
                    affinity_key = 'STR'
                elif lower_name.endswith('dex.json'):
                    affinity_key = 'DEX'
                elif lower_name.endswith('int.json'):
                    affinity_key = 'INT'
                
                if affinity_key:
                    file_path = os.path.join(root, filename)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                            
                            # Inject instruction
                            if 'system_prompt' in data:
                                data['system_prompt'] += fail_forward_instruction
                            
                            quest_index[location_id][affinity_key] = data
                            print(f"  Loaded {affinity_key} for {location_id} from {filename}")
                    except Exception as e:
                        print(f"  ERROR reading {file_path}: {e}")

    # Write the output
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(quest_index, f, indent=2)
        print(f"Successfully generated quest index with {len(quest_index)} locations.")
    except Exception as e:
        print(f"FATAL ERROR writing output: {e}")

if __name__ == "__main__":
    generate_quest_index()
