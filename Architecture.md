                Camera
                  |
              YOLOv8
                  |
        -------------------
        |                 |
     Count คน          Count โต๊ะ
        |                 |
        -------- JSON -----
                  |
             Qwen 3B LLM
                  |
        Dashboard / Report


Camera
  |
  v
FastAPI (main.py)
  |
  +--> YOLOv8n Detect
  |       |
  |       +-- คน
  |       +-- โต๊ะ
  |       +-- อาหาร
  |
  +--> Draw Bounding Box
  |
  +--> Stream ภาพไป Web
  |
  +--> ส่งข้อมูลเข้า LLM
          |
          Qwen2.5-3B
          |
          คำแนะนำ