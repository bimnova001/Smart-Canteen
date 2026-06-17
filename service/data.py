import csv
import os
import schedule
import time
from datetime import datetime


FILE = "canteen_data.csv"



# เก็บข้อมูลระหว่างชั่วโมง

buffer = []



def collect_data(data):
    buffer.append({
        "people": data["people"],
        "occupancy": data["occupancy"]
    })





def save_hourly():

    if len(buffer)==0:
        return

    avg_people = sum(
        x["people"] 
        for x in buffer
    ) / len(buffer)

    max_people = max(
        x["people"]
        for x in buffer
    )

    avg_occupancy = sum(
        x["occupancy"]
        for x in buffer
    ) / len(buffer)

    exists = os.path.isfile(FILE)
    with open(
        FILE,
        "a",
        newline="",
        encoding="utf-8"
    ) as f:
        writer = csv.writer(f)
        if not exists:
            writer.writerow([
                "date",
                "time",
                "avg_people",
                "max_people",
                "avg_occupancy"
            ])
        writer.writerow([
            datetime.now().strftime(
                "%Y-%m-%d"
            ),
            datetime.now().strftime(
                "%H:%M"
            ),
            round(avg_people,2),
            max_people,
            round(avg_occupancy,2)
        ])
    buffer.clear()



# ทุก 1 ชั่วโมง

schedule.every().hour.do(
    save_hourly
)




def scheduler():
    while True:
        schedule.run_pending()
        time.sleep(60)