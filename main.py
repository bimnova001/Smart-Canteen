from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from ultralytics import YOLO
import cv2
import time
import random
import csv
import threading
import subprocess
from service.llm import analyze_canteen
from service.data import collect_data, scheduler, save_hourly
from service.logger import logger

USE_CAMERA = False


app = FastAPI()
try :
    model = YOLO("./model_cache/yolov8n.pt")
except Exception as e:
    logger.error(f"Error loading YOLO model: {e}")


if USE_CAMERA:
    camera = cv2.VideoCapture(3)
    logger.info("Using camera for video stream.")
else:
    sim_image = cv2.imread(
        "./SIM_IMG/1.jpg"
    )
    logger.info("Using simulated image for video stream.")

data = {
    "people":0,
    "tables":20,
    "food":50,
    "occupancy":0,
    "time":""
}




def camera_stream():


    while True:
        if USE_CAMERA:
            ret, frame = camera.read()
            if not ret:
                break
        else:
            frame = sim_image.copy()
        results = model(frame)
        people = 0
        for result in results:
            boxes = result.boxes
            for box in boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                name = model.names[cls]
                # detect person only
                if name == "person":
                    people += 1
                    x1,y1,x2,y2 = map(
                        int,
                        box.xyxy[0]
                    )
                    cv2.rectangle(
                        frame,
                        (x1,y1),
                        (x2,y2),
                        (0,255,0),
                        2
                    )
                    cv2.putText(
                        frame,
                        f"Person {conf:.2f}",
                        (x1,y1-10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (0,255,0),
                        2
                    )
        # simulation
        tables = 20
        food = random.randint(
            30,
            80
        )

        occupancy = min(
            (people / tables)*100,
            100
        )



        data.update({
            "people":people,
            "tables":tables,
            "food":food,
            "occupancy":round(
                occupancy,
                2
            ),
            "time":time.strftime(
                "%H:%M"
            )
        })

        collect_data(data)
        _, buffer = cv2.imencode(
            ".jpg",
            frame
        )
        frame_bytes = buffer.tobytes()
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n"
            + frame_bytes +
            b"\r\n"
        )


@app.get("/history")
def history():
    rows=[]
    try:
        with open(
            "canteen_data.csv",
            encoding="utf-8"
        ) as f:
            reader=csv.DictReader(f)
            for r in reader:
                rows.append(r)
    except:
        pass
    return rows

@app.on_event("startup")
def startup_event():
    
    logger.info("Starting the Smart Canteen application...")
    threading.Thread(
        target=scheduler,
        daemon=True
    ).start()

@app.get("/video")
def video():
    return StreamingResponse(
        camera_stream(),
        media_type=
        "multipart/x-mixed-replace; boundary=frame"
    )


@app.get("/data")
def get_data():
    return data

@app.get("/analyze")
def ai_analyze():
    result = analyze_canteen(data)
    return {
        "input":data,
        "analysis":result
    }
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)