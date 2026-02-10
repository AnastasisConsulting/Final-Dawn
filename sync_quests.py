# C:\Users\user\Desktop\Final_Dawn_of_Eideus\Galaxies_Folder\sync_quests.py

import os
import shutil

def sync_quests_by_depth():
    # Base configuration
    source_root = os.getcwd()
    # Ensure we are in Galaxies_Folder or point to it
    if not source_root.endswith("Galaxies_Folder"):
        source_root = os.path.join(source_root, "Galaxies_Folder")
        
    target_dir = os.path.join(source_root, "quests_manifest")
    
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)

    print(f"Executing Depth-3 Scan in: {source_root}")

    # We sort to ensure G1, G2, G3 and S1, S2, S3 order is consistent with your map
    galaxies = sorted([d for d in os.listdir(source_root) if os.path.isdir(os.path.join(source_root, d)) and d != "quests_manifest"])

    copy_count = 0

    for g_idx, g_dir in enumerate(galaxies, 1):
        g_path = os.path.join(source_root, g_dir)
        systems = sorted([d for d in os.listdir(g_path) if os.path.isdir(os.path.join(g_path, d))])
        
        for s_idx, s_dir in enumerate(systems, 1):
            s_path = os.path.join(g_path, s_dir)
            worlds = sorted([d for d in os.listdir(s_path) if os.path.isdir(os.path.join(s_path, d))])
            
            for o_idx, o_dir in enumerate(worlds, 1):
                # Depth 3: Galaxies_Folder/G/S/O/quests.json
                world_path = os.path.join(s_path, o_dir)
                target_file = os.path.join(world_path, "quests.json")
                
                if os.path.exists(target_file):
                    # Construct name: Gx-Sx-Ox_quests.json
                    new_name = f"G{g_idx}-S{s_idx}-O{o_idx}_quests.json"
                    dest_path = os.path.join(target_dir, new_name)
                    
                    shutil.copy2(target_file, dest_path)
                    print(f"Mapped: {o_dir} -> {new_name}")
                    copy_count += 1

    print(f"\nTask Complete. {copy_count} quest files localized to {target_dir}")

if __name__ == "__main__":
    sync_quests_by_depth()