from llama_cpp import Llama


llm = Llama.from_pretrained(
	repo_id="Qwen/Qwen2.5-3B-Instruct-GGUF",
	filename="qwen2.5-3b-instruct-q4_k_m.gguf",
    n_ctx=1024,
    n_threads=4,
    verbose=False,
    cache_dir="./model_cache"
    
)

def analyze_canteen(data):


    prompt = f"""

คุณคือ AI Smart Canteen Analyst


ข้อมูลจาก Vision AI

เวลา:
{data['time']}


จำนวนคน:
{data['people']} คน


จำนวนโต๊ะ:
{data['tables']} โต๊ะ


จำนวนอาหาร:
{data['food']} รายการ


ความหนาแน่น:
{data['occupancy']} %



วิเคราะห์:

1. สถานการณ์ปัจจุบันของโรงอาหาร

2. ปัญหาที่อาจเกิดขึ้น

3. คำแนะนำสำหรับผู้บริหาร


ตอบเป็นภาษาไทย
กระชับและเข้าใจง่าย


"""


    response = llm(

        prompt,

        max_tokens=300,

        temperature=0.7

    )


    text = response["choices"][0]["text"]


    return text.strip()