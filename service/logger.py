import logging
from datetime import datetime
import os

log_folder = "logs"
os.makedirs(log_folder, exist_ok=True) 


current_date = datetime.now().strftime("%Y-%m-%d")  
log_filename = os.path.join(log_folder, f"smart_canteen_{current_date}.log")


logging.basicConfig(
    filename=log_filename, 
    level=logging.INFO,  
    format="%(asctime)s - %(levelname)s - %(message)s",  
    datefmt="%Y-%m-%d %H:%M:%S",  
    encoding="utf-8"  
)


logger = logging.getLogger("SmartCanteenLogger")