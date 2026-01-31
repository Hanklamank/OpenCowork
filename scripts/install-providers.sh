#!/bin/bash

# OpenCowork Provider Installation Script
# Automatically installs LLM CLI providers

set -e

echo "🚀 OpenCowork Provider Installation Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Ollama (recommended for local LLMs)
install_ollama() {
    print_status "Installing Ollama..."
    
    if command_exists ollama; then
        print_warning "Ollama already installed"
        ollama --version
        return 0
    fi
    
    # Download and install Ollama
    curl -fsSL https://ollama.com/install.sh | sh
    
    if command_exists ollama; then
        print_success "Ollama installed successfully"
        
        # Start Ollama service
        print_status "Starting Ollama service..."
        ollama serve &
        sleep 3
        
        # Download a lightweight model
        print_status "Downloading lightweight model (llama3.2:1b)..."
        ollama pull llama3.2:1b
        
        print_success "Ollama setup complete!"
    else
        print_error "Failed to install Ollama"
        return 1
    fi
}

# Install Claude Code CLI
install_claude_code() {
    print_status "Installing Claude Code CLI..."
    
    if command_exists claude-code; then
        print_warning "Claude Code already installed"
        return 0
    fi
    
    # Check if npm is available
    if ! command_exists npm; then
        print_error "npm not found. Please install Node.js first:"
        echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "  sudo apt-get install -y nodejs"
        return 1
    fi
    
    # Install Claude Code globally
    npm install -g @anthropic-ai/claude-code
    
    if command_exists claude-code; then
        print_success "Claude Code installed successfully"
        print_warning "You'll need to configure your Anthropic API key:"
        echo "  export ANTHROPIC_API_KEY='your-api-key-here'"
    else
        print_error "Failed to install Claude Code"
        return 1
    fi
}

# Install OpenAI CLI
install_openai_cli() {
    print_status "Installing OpenAI CLI..."
    
    if command_exists openai; then
        print_warning "OpenAI CLI already installed"
        return 0
    fi
    
    # Check if pip is available
    if ! command_exists pip3 && ! command_exists pip; then
        print_error "pip not found. Please install Python and pip first"
        return 1
    fi
    
    # Install OpenAI CLI
    pip3 install openai-cli 2>/dev/null || pip install openai-cli
    
    if command_exists openai; then
        print_success "OpenAI CLI installed successfully"
        print_warning "You'll need to configure your OpenAI API key:"
        echo "  export OPENAI_API_KEY='your-api-key-here'"
    else
        print_error "Failed to install OpenAI CLI"
        return 1
    fi
}

# Main installation menu
show_menu() {
    echo ""
    echo "Which LLM providers would you like to install?"
    echo ""
    echo "1) Ollama (Recommended - Local LLMs, no API key needed)"
    echo "2) Claude Code (Anthropic API key required)"  
    echo "3) OpenAI CLI (OpenAI API key required)"
    echo "4) Install All"
    echo "5) Exit"
    echo ""
}

# Check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check OS
    if [[ "$OSTYPE" != "linux-gnu"* ]] && [[ "$OSTYPE" != "darwin"* ]]; then
        print_warning "Unsupported OS: $OSTYPE"
        print_warning "This script is tested on Linux and macOS"
    fi
    
    # Check architecture
    ARCH=$(uname -m)
    if [[ "$ARCH" != "x86_64" ]] && [[ "$ARCH" != "arm64" ]]; then
        print_warning "Unsupported architecture: $ARCH"
    fi
    
    # Check available disk space (need at least 4GB for models)
    AVAILABLE=$(df . | tail -1 | awk '{print $4}')
    if [[ $AVAILABLE -lt 4000000 ]]; then
        print_warning "Low disk space. LLM models require several GB of storage."
    fi
    
    print_success "System check complete"
}

# Test installed providers
test_providers() {
    print_status "Testing installed providers..."
    echo ""
    
    if command_exists ollama; then
        echo "✅ Ollama: $(ollama --version)"
    else
        echo "❌ Ollama: Not installed"
    fi
    
    if command_exists claude-code; then
        echo "✅ Claude Code: Installed"
    else
        echo "❌ Claude Code: Not installed"
    fi
    
    if command_exists openai; then
        echo "✅ OpenAI CLI: Installed"
    else
        echo "❌ OpenAI CLI: Not installed"
    fi
    
    echo ""
    print_status "Test OpenCowork with: opencowork providers"
}

# Main execution
main() {
    echo ""
    check_requirements
    
    while true; do
        show_menu
        read -p "Enter your choice [1-5]: " choice
        
        case $choice in
            1)
                install_ollama
                ;;
            2)
                install_claude_code
                ;;
            3)
                install_openai_cli
                ;;
            4)
                install_ollama
                install_claude_code
                install_openai_cli
                ;;
            5)
                print_status "Installation complete!"
                test_providers
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-5."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main