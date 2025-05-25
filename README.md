```
          .         .      .        .      .         .      .        .      .
      .         .      .        .         .      .        .         .      .
            * .        .         .      * .        .         .      * .
       .                  .         .           .                  .         .
    
               VV   VV   AAAAA   PPPPP    OOOO   RRRRR
               VV   VV  AA   AA  PP  PP  OO  OO  RR  RR
               VV   VV  AAAAAAA  PPPPP   OO  OO  RRRRR
                VV VV   AA   AA  PP      OO  OO  RR RR
                 VVV    AA   AA  PP       OOOO   RR  RR
    
         .        .       * .        .         .       * .        .         .
      .         .      .        .         .      .        .         .     *
          .      .   Vulnerable AI Penetration & Operations Research   .     .
     .        .      .        .         .      .        .         .      .
```   

* * *

VAPOR Lab
=========

### Vulnerable AI Penetration & Operations Research

_A hands-on environment for exploring and understanding AI & Machine Learning security._

 [![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat-square)](https://github.com/YOUR_USERNAME/VAPOR_Lab/issues)[![License MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/YOUR_USERNAME/VAPOR_Lab/blob/main/LICENSE)

* * *

🌫️ Overview
------------

Welcome to **VAPOR Lab (Vulnerable AI Penetration & Operations Research)**!

This repository is designed as a comprehensive, hands-on learning environment for security enthusiasts, researchers, and aspiring AI Application Security Engineers. The goal is to dive deep into the principles of securing Artificial Intelligence (AI) and Machine Learning (ML) systems. VAPOR Lab provides a modular, locally-focused, and ethically sound platform to explore common vulnerabilities in both traditional ML models and modern Large Language Models (LLMs).  

Setting Up Your VAPOR Lab Environment (on Kali Linux or similar Debian-based system)
---------------------------------------------------------------------------------------

These instructions will help you set up the core components needed to run the experiments in this lab.

### 1\. System Update & Essential Tools

Ensure your system is up-to-date and install Git.

    sudo apt update && sudo apt full-upgrade -y
    sudo apt install git -y

If you plan to use a non-root user (recommended):

    # Replace 'your_lab_user' with your desired username
    sudo adduser your_lab_user
    sudo usermod -aG sudo your_lab_user
    # Then log out and log back in as 'your_lab_user'

### 2\. Install Miniconda (for Python Environment Management)

Miniconda provides isolated Python environments.

    mkdir -p ~/miniconda3
    wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh
    bash ~/miniconda3/miniconda.sh -b -u -p $HOME/miniconda3
    rm ~/miniconda3/miniconda.sh # Clean up installer
    $HOME/miniconda3/bin/conda init bash # Or your preferred shell (e.g., zsh)

**Close and reopen your terminal** for Conda changes to take effect.

### 3\. Create and Activate Conda Environment

This lab uses a dedicated environment named `vapor_lab_env`.

    conda create --name vapor_lab_env python=3.10 -y
    conda activate vapor_lab_env

(Optional but recommended: `conda config --set auto_activate_base false`)

### 4\. Install Python Libraries

Install necessary Python packages into the `vapor_lab_env`.

    pip install pandas numpy scikit-learn matplotlib seaborn jupyterlab notebook
    pip install flask uvicorn "flask[async]" # For the API in later phases
    pip install pyarrow # For Parquet file format
    pip install xgboost # For the XGBoost model
    pip install ollama # Python client for Ollama (optional, can also use curl)
    # Add any other specific libraries as you progress through the lab phases
    

### 5\. Install Ollama (for Local LLMs)

Follow the official Ollama installation instructions from [ollama.com](https://ollama.com/). Typically:

    curl -fsSL https://ollama.com/install.sh | sh

After installation, pull the models you intend to use for the LLM Attack Lab:

    ollama pull llama3
    ollama pull mistral
    # Add other models as needed
    

Ensure the Ollama service is running before executing LLM tests.

### 6\. Install `jq` (for JSON pretty-printing in shell scripts)

    sudo apt install jq -y

### 7\. (Optional) Install VS Code

Download the `.deb` package from the [official VS Code website](https://code.visualstudio.com/) and install it:

    # Example, replace with actual downloaded filename
    # sudo apt install ./code_downloaded_file.deb

Install recommended extensions within VS Code: Python (Microsoft), Pylance, Jupyter, Docker, Kubernetes.

🚀 Running the Experiments
--------------------------

### A. LLM Prompt Injection Tests

1.  Navigate to the `Phase-2-Core-AI-Security/LLM-Attack-Lab/prompt_injection_tests/` directory (or your equivalent).
2.  Make the test scripts executable:
    
        chmod +x *.sh
    
3.  Ensure your Ollama service is running and has the required model (e.g., `llama3`) pulled.
4.  Run a specific test script:
    
        ./test1_goal_ignoring.sh
    
5.  Review the output in your terminal. Each script will display the Ollama version, model info, the prompt being used, expected outcomes, and the actual LLM response.

### B. Traditional ML Model Training & Analysis (Jupyter Notebooks)

1.  Activate the Conda environment: `conda activate vapor_lab_env`.
2.  Navigate to the `Phase-2-Core-AI-Security/Traditional-ML-Security/` directory (or your equivalent).
3.  Start JupyterLab:
    
        jupyter lab
    
4.  Open the relevant `.ipynb` notebook file in your browser.
5.  **Loading Pre-trained Models (Example):** If you want to load one of the pre-trained models (e.g., from the `trained_models` directory):
    *   Ensure the model file (e.g., `xgb_loan_model_2018_tuned.v1.2.0.json`) and its corresponding features file (e.g., `xgb_loan_model_2018_tuned_features.v1.2.0.txt`) are in the correct path.
    *   The notebooks should contain example code for loading these models, similar to:
        
            
            # Example for loading an XGBoost model
            # import xgboost as xgb
            # import pandas as pd
            
            # model_filepath = 'path/to/your/trained_models/xgb_loan_model_2018_tuned.v1.2.0.json'
            # features_filepath = 'path/to/your/trained_models/xgb_loan_model_2018_tuned_features.v1.2.0.txt'
            
            # loaded_model = xgb.XGBClassifier()
            # loaded_model.load_model(model_filepath)
            
            # loaded_feature_names = []
            # with open(features_filepath, 'r') as f:
            #     for line in f:
            #         loaded_feature_names.append(line.strip())
            
            # print("Model and feature names loaded.")
            # # Ensure your new data for prediction has these features in the same order.
            
        
    *   **Data:** To run predictions or further analysis, you'll also need the corresponding processed data (e.g., `X_processed_2018.v1.0.0.parquet`). The notebooks should guide you on loading this.

🤝 Contributing
---------------

Contributions, feedback, and suggestions are highly encouraged to make VAPOR Lab a more robust and valuable resource! Please feel free to:

1.  Fork the repository.
2.  Create a new branch for your feature or fix (`git checkout -b feature/YourAmazingFeature`).
3.  Make your changes and commit them (`git commit -m 'Add some YourAmazingFeature'`).
4.  Push to the branch (`git push origin feature/YourAmazingFeature`).
5.  Open a Pull Request.

Please ensure your contributions align with the lab's educational goals and ethical principles.

⚠️ Disclaimer
-------------

VAPOR Lab is intended for **educational and research purposes only**. All activities and experiments should be conducted within this lab environment, on your own systems, or on platforms where you have explicit permission to test. The knowledge and tools gained here should be applied responsibly and ethically. Do not use any techniques learned to target systems without authorization.

📄 License
----------

This project is licensed under the MIT License - see the `LICENSE` file for details. (You'll need to create this file).

* * *