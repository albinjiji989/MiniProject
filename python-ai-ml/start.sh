#!/bin/bash

echo "========================================"
echo "Pet Care AI/ML Service"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to create virtual environment"
        exit 1
    fi
    echo "Virtual environment created successfully!"
    echo ""
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Check if requirements are installed
python -c "import tensorflow" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing dependencies (this may take a few minutes)..."
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
    echo "Dependencies installed successfully!"
    echo ""
fi

echo ""
echo "Starting AI/ML Service..."
echo ""
python app.py
