import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
VAULT_FILE = os.path.join(BASE_DIR, "vault.json")
SECRET_KEY = os.environ.get("FORTIKEY_SECRET", "change_this_to_random_string")
