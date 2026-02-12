# /3d_game_sim/3d_pawn_game.py
# Always add a comment one line one of any code files presented with the full Path for that file.

import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import random

# --- 1. PAWN CLASS (FINALIZED LOGIC) ---
class Pawn:
    """Implements the final, complex 3D pawn movement and backward variable rules."""
    
    CARDINAL_DIRECTIONS = {
        (0, 1, 0), (0, -1, 0), (1, 0, 0), 
        (-1, 0, 0), (0, 0, 1), (0, 0, -1)
    }
    
    def __init__(self, color, initial_position, initial_forward_vector):
        self.color = color
        self.current_position = initial_position
        self.forward_orientation_vector = initial_forward_vector 
        self.backwards = None         # Stores the coordinate of the last cube entered/passed.
        self.has_moved = False
        
        # PERMANENT: The 4 allowed 2D diagonal capture vectors.
        self.CAPTURE_VECTORS = self._calculate_capture_vectors()
        
    def _get_capture_axes(self):
        """Identifies the indices (0, 1, or 2) of the two axes that form the 2D capture plane."""
        return tuple(i for i, val in enumerate(self.forward_orientation_vector) if val == 0)

    def _calculate_capture_vectors(self):
        """Calculates the 4 2D diagonal capture vectors for this pawn's plane (e.g., (1, 1, 0))."""
        vectors = set()
        i, j = self._get_capture_axes()
        
        for step_i in [-1, 1]:
            for step_j in [-1, 1]:
                vector = list(self.forward_orientation_vector)
                vector[i] = step_i
                vector[j] = step_j
                vectors.add(tuple(vector))
        return vectors
        
    def _calculate_move_vector(self, current, new):
        return tuple(new[i] - current[i] for i in range(3))

    def _is_cardinal(self, move_vector):
        """Checks if the move is strictly along one axis (L1 norm == L2 norm squared)."""
        return sum(abs(c) for c in move_vector) == sum(c*c for c in move_vector)
    
    def _get_intermediate_cube(self, start_pos, end_pos):
        """Calculates the coordinate of the cube passed through during a 2-space move."""
        move_vector = self._calculate_move_vector(start_pos, end_pos)
        intermediate_vector = tuple(c // 2 for c in move_vector)
        return tuple(start_pos[i] + intermediate_vector[i] for i in range(3))
    
    def _get_straight_back_vector(self):
        """The permanent retreat vector opposite the pawn's orientation."""
        return tuple(-c for c in self.forward_orientation_vector)

    def move_to(self, new_position, is_capture=False):
        """Attempts the move based on the complex movement and backward rules."""
        
        move_vector = self._calculate_move_vector(self.current_position, new_position)
        magnitude = sum(abs(c) for c in move_vector) # L1 norm
        
        is_cardinal_move = self._is_cardinal(move_vector)
        is_diag_capture = move_vector in self.CAPTURE_VECTORS
        
        # 1. Check No Immediate U-Turn
        if self.backwards is not None and new_position == self.backwards:
            print(f"[{self.color} Pawn] Illegal: Cannot move back to the last cube just left/passed: {self.backwards}")
            return False

        # 2. Kinematics and Distance Checks
        if not is_cardinal_move and not is_diag_capture:
            print(f"[{self.color} Pawn] Illegal: Not a valid cardinal or diagonal capture move.")
            return False
        
        max_dist = 2 if not self.has_moved and is_cardinal_move else 1

        if is_cardinal_move:
            if magnitude > max_dist or magnitude == 0:
                print(f"[{self.color} Pawn] Illegal: Cardinal distance {magnitude} exceeds max {max_dist}.")
                return False
        
        elif is_diag_capture:
            if magnitude != 2 or not is_capture: # L1 norm for 1-step diagonal is 2
                print(f"[{self.color} Pawn] Illegal: Diagonal move must be a 1-step capture.")
                return False
        
        # 3. Capture Rule (Forward Diagonal Check)
        if is_capture and is_cardinal_move:
            # Check if the cardinal move is NOT the straight forward vector.
            # Captures must happen laterally/vertically on the capture plane.
            if move_vector == self.forward_orientation_vector:
                 print(f"[{self.color} Pawn] Illegal: Cannot capture straight forward.")
                 return False

        # 4. UPDATE the backwards variable
        if is_cardinal_move and magnitude == 2:
            self.backwards = self._get_intermediate_cube(self.current_position, new_position)
        else:
            self.backwards = self.current_position

        # 5. Execute Move
        self.current_position = new_position
        self.has_moved = True
        return True

# --- 2. GAME AND VISUALIZATION CLASS ---
class GameVisualizer:
    
    def __init__(self):
        # 8x8x8 board size (coordinates 0-7)
        self.SIZE = 8
        
        # Initialize the board with all red dots (unoccupied/neutral)
        self.board = {}
        for x in range(self.SIZE):
            for y in range(self.SIZE):
                for z in range(self.SIZE):
                    self.board[(x, y, z)] = 'r' # 'r' for red (neutral)
        
        # 1. Set White Pawn (GREEN) at center (3, 3, 3) and facing Y-Forward
        white_pawn_pos = (3, 3, 3)
        white_pawn_fwd = (0, 1, 0)
        self.pawn = Pawn('white', white_pawn_pos, white_pawn_fwd)
        self.board[white_pawn_pos] = 'g' # 'g' for green (White Pawn)

        # 2. Set Black Pawns (BLUE) for forward diagonal captures (4 face diagonals)
        # Assuming the white pawn will move forward diagonally from its start.
        # Target cubes for white pawn capture: (x±1, y+1, z) and (x, y+1, z±1)
        # Targets are: (4, 4, 3), (2, 4, 3), (3, 4, 4), (3, 4, 2)
        self.targets = [
            (4, 4, 3), (2, 4, 3), (3, 4, 4), (3, 4, 2) 
        ]
        
        # Place enemy pieces (blue) on these targets
        for target in self.targets:
            self.board[target] = 'b' # 'b' for blue (Black Pawn)
            
        self.fig = plt.figure(figsize=(10, 8))
        self.ax = self.fig.add_subplot(111, projection='3d')
        
    def plot_board(self, title):
        self.ax.clear()
        self.ax.set_title(title)
        
        x_data, y_data, z_data = [], [], []
        colors = []
        
        for (x, y, z), color_code in self.board.items():
            if color_code != 'r' or (x % 2 == 0 and y % 2 == 0 and z % 2 == 0): # Only plot occupied or corner cubes
                x_data.append(x)
                y_data.append(y)
                z_data.append(z)
                colors.append(color_code)

        # Set plot limits and labels
        self.ax.set_xlim([-0.5, self.SIZE - 0.5])
        self.ax.set_ylim([-0.5, self.SIZE - 0.5])
        self.ax.set_zlim([-0.5, self.SIZE - 0.5])
        self.ax.set_xlabel('X (Depth)')
        self.ax.set_ylabel('Y (Forward)')
        self.ax.set_zlabel('Z (Up)')
        self.ax.set_xticks(range(self.SIZE))
        self.ax.set_yticks(range(self.SIZE))
        self.ax.set_zticks(range(self.SIZE))
        
        # Plot the pieces
        self.ax.scatter(x_data, y_data, z_data, c=colors, s=200, marker='o')
        
        plt.draw()
        plt.pause(1.5) # Pause for 1.5 seconds for animation effect

    def run_capture_sequence(self):
        
        # 0. Initial Plot
        self.plot_board(f"Start: White Pawn at {self.pawn.current_position}")
        
        # Capture all 4 diagonal targets sequentially
        moves = [
            (4, 4, 3), # Forward-Right-Plane
            (3, 4, 4), # Forward-Up-Plane
            (2, 4, 3), # Forward-Left-Plane
            (3, 4, 2)  # Forward-Down-Plane
        ]
        
        # To simulate a continuous capture sequence, we'll reset the board state 
        # for each capture and ensure the pawn is placed one cube away from the target 
        # so the move vector is always a valid 1-step diagonal capture.
        
        print("\n--- Starting Capture Simulation ---")
        
        for i, target_pos in enumerate(self.targets):
            
            # --- Setup: Move pawn to one step behind the target for the move ---
            # Pawn's permanent forward is (0, 1, 0). Its starting position allows all 4 diagonal moves to y=4.
            start_pos = (3, 3, 3) 
            
            # Reset the pawn to its initial state for a fresh capture run.
            self.pawn = Pawn('white', start_pos, (0, 1, 0))
            self.board = {pos: 'r' for pos in self.board}
            self.board[start_pos] = 'g'
            self.board[target_pos] = 'b'

            self.plot_board(f"Setup for Capture {i+1}: White (G) at {start_pos}, Target (B) at {target_pos}")
            
            # --- Execute the Capture Move ---
            move_successful = self.pawn.move_to(target_pos, is_capture=True)
            
            if move_successful:
                # Update the board state after capture
                old_pos = start_pos
                
                # Vacate the old position (now the forbidden cube)
                self.board[old_pos] = 'r' 
                
                # Move pawn to the new position and change the enemy color to white (green)
                self.board[target_pos] = 'g' 
                
                self.plot_board(f"Capture {i+1} Successful! New Pos: {self.pawn.current_position}")
            else:
                print(f"Capture {i+1} FAILED.")
                
        plt.show()

# --- 3. RUN THE SIMULATION ---
if __name__ == "__main__":
    game = GameVisualizer()
    game.run_capture_sequence()