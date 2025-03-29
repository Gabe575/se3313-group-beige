import os

# Define the path to your folder containing the Uno card images
folder_path = "./"

# Define the colors and special cards
colors = ['red', 'yellow', 'green', 'blue']
special_cards = ['skip', 'reverse', 'plus2']

# Function to map the index to card name based on color
def get_card_name(index, color):
    if index == 0:
        return f"{color}_0"  # red0, yellow0, green0, blue0
    elif index <= 9:
        return f"{color}_{index}"  # red1, red2, ..., red9
    elif index == 10:
        return f"{color}_skip"
    elif index == 11:
        return f"{color}_reverse"
    elif index == 12:
        return f"{color}_plus2"

# Function to rename the Uno cards
def rename_uno_cards():
    files = os.listdir(folder_path)
    files.sort()  # Sorting to ensure files are processed in order
    
    # Initialize index counters for colors
    card_index = 0
    color_index = 0

    for file_name in files:
        # Skip the Python script itself (rename.py)
        if file_name == 'rename.py':
            continue

        # Make sure we have only image files
        if not file_name.lower().endswith('.png'):
            continue

        # Get the current color
        color = colors[color_index]

        # Get the card name for the current index
        new_card_name = get_card_name(card_index, color)

        # Construct the new file name
        new_file_name = f"{new_card_name}.png"
        old_file_path = os.path.join(folder_path, file_name)
        new_file_path = os.path.join(folder_path, new_file_name)

        # Rename the file
        os.rename(old_file_path, new_file_path)
        print(f"Renamed '{file_name}' to '{new_file_name}'")

        # Move to the next card in the current color set
        card_index += 1

        # After processing 14 cards, move to the next color
        if card_index == 13:
            card_index = 0
            color_index += 1
            if color_index == len(colors):  # If we've renamed all 4 colors, stop
                break

# Run the renaming function
rename_uno_cards()
