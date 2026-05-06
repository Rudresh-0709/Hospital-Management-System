import mysql.connector
import os
import yaml
from functools import lru_cache


@lru_cache(maxsize=1)
def get_config() -> dict:
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    config_path = os.path.join(base_dir, "patient_ai", "config.yaml")
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def get_connection():
    cfg = get_config()["database"]
    return mysql.connector.connect(
        host=cfg["host"],
        user=cfg["user"],
        password=os.getenv(cfg["password"]),
        database=cfg["database"]
    )

