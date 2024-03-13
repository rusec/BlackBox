#!/bin/bash

# Create the build directory if it doesn't exist
mkdir -p build

# Loop through each directory in the current directory
for dir in */; do
    # Remove trailing slash to get directory name
    dir_name="${dir%/}"
    
    # Skip the build directory
    if [ "$dir_name" == "build" ]; then
        continue
    fi
    
    # Check if it's a directory
    if [ -d "$dir_name" ]; then
        # Zip the directory
        echo "Zipping $dir_name..."
        zip -r "build/$dir_name.zip" "$dir_name"
        
        echo "Tarring $dir_name..."
        tar -czf "build/$dir_name.tar.gz" "$dir_name"
    fi
done

echo "All folders zipped successfully."
