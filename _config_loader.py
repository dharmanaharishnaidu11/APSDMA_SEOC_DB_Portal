"""Shared config loader for SEOC repo Python scripts.

Loads config.json from the repo root. All scripts that need DB or ArcGIS
credentials should `from _config_loader import load_config` and use the
returned dict.
"""
import json
import os
import sys


def load_config():
    """Load config.json from repo root, walking up from the caller's directory."""
    # Walk up from this file's directory looking for config.json
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(here, 'config.json'),
        os.path.join(here, '..', 'config.json'),
        os.path.join(os.getcwd(), 'config.json'),
    ]
    for path in candidates:
        path = os.path.abspath(path)
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
    print('ERROR: config.json not found. Copy config.example.json to config.json and set credentials.')
    sys.exit(1)
