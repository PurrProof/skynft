"""
This script processes a given list of constellations with their associated star pairs.
Each line in the input represents a constellation, starting with its code, followed by the number
of star pairs, and then the pairs themselves. Each pair consists of two star IDs.

The script performs two main tasks:

1. It generates a file listing all unique star IDs for each constellation, sorted in ascending order.
   Each constellation's data is presented in a single line, starting with the constellation code,
   followed by the sorted list of star IDs.

2. It creates a second file where the original star IDs in each pair are replaced by their
   respective indices from the sorted list of star IDs. The format of this file is similar to
   the input, but with indices instead of actual star IDs.

The script ensures that each star ID is unique within its constellation and handles the data
efficiently to provide the required outputs in the specified format.

P.S. Stars with ids 677, 31685, 39429, 25428 belong to more than 1 constellation figure.
Figures are created historically, so yes, in rare cases they may overlape.


"""


def process_constellations(input_data):
    constellations = {}
    for line in input_data.splitlines():
        parts = line.split()
        const_code = parts[0]
        pairs = [(parts[i], parts[i + 1]) for i in range(2, len(parts), 2)]
        if const_code not in constellations:
            constellations[const_code] = {"stars": set(), "pairs": []}
        for start_star, end_star in pairs:
            constellations[const_code]["stars"].update([start_star, end_star])
            constellations[const_code]["pairs"].append((start_star, end_star))

    # Preparing data for the first output
    constellation_stars_output = ""
    for const_code, data in constellations.items():
        sorted_stars = sorted(data["stars"], key=lambda x: int(x))
        constellation_stars_output += (
            f"{const_code} "
            + str(len(sorted_stars))
            + " "
            + ",".join(sorted_stars)
            + "\n"
        )

    # Preparing data for the second output
    constellation_pairs_output = ""
    for const_code, data in constellations.items():
        star_indices = {
            star: idx
            for idx, star in enumerate(sorted(data["stars"], key=lambda x: int(x)))
        }
        constellation_pairs_output += f"{const_code} {len(data['pairs'])} "
        for start_star, end_star in data["pairs"]:
            constellation_pairs_output += (
                f"{star_indices[start_star]} {star_indices[end_star]} "
            )
        constellation_pairs_output += "\n"

    return constellation_stars_output, constellation_pairs_output


# Read the input data from the file
with open("downloads/constellationship.fab", "r") as file:
    input_data = file.read()

# Process the input data
stars_output, pairs_output = process_constellations(input_data)

# Write the outputs to files
with open("downloads/generated_const_stars_ids.txt", "w") as file:
    file.write(stars_output)

with open("downloads/generated_const_star_indexes.txt", "w") as file:
    file.write(pairs_output)

print(
    "Files created: downloads/generated_const_stars_ids.txt, downloads/generated_const_star_indexes",
)
